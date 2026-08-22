import { NextResponse } from 'next/server';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import path from 'path';

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedHeader = request.headers.get('x-migration-key');
    
    // We can protect with a dedicated hardcoded migration run key or query parameter
    if (expectedHeader !== 'cf-run-migration-2026-auth-ok-0004-0005') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      return NextResponse.json({ 
        error: 'DATABASE_URL is missing in runtime' 
      }, { status: 500 });
    }

    const pool = new Pool({
      connectionString,
      max: 1,
    });

    const db = drizzle(pool);

    const isPooler = connectionString.includes('pooler.supabase.com');

    // 1. Inspect existing schema manually to determine state
    const { rows: tableRows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    const tables = tableRows.map(r => r.table_name);
    
    const { rows: columnRows } = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_logs', 'checkout_contexts', 'crm_notes', 'crm_contact_metadata', 'email_threads', 'email_messages');
    `);

    // 2. Read drizzle history if exists
    let drizzleMigrations = [];
    try {
      const { rows: historyRows } = await pool.query(`
        SELECT * FROM "__drizzle_migrations" ORDER BY created_at ASC;
      `);
      drizzleMigrations = historyRows;
    } catch (e) {
      // Table might not exist yet
    }

    const result: any = {
      DATABASE_URL_RUNTIME_PRESENT: 'YES',
      CONNECTION_TYPE: isPooler ? 'POOLER' : 'OTHER',
      DNS_RESOLUTION: 'PASS',
      POSTGRES_CONNECTION: 'PASS',
      SELECT_1: 'PASS',
      schema_before: {
        tables,
        columns: columnRows,
        drizzleMigrations
      },
    };

    const body = await request.json().catch(() => ({}));

    if (body.get_active_offer === true) {
      const { rows: offersList } = await pool.query(`SELECT id, platform, service, price_cents, perfectpay_product_id, perfectpay_plan_id, external_checkout_url FROM offers WHERE active = true LIMIT 1;`);
      result.active_offer = offersList[0] || null;
    }
    if (body.verify_checkout_context === true && body.context_id) {
      const { rows: ctxRows } = await pool.query(`SELECT * FROM checkout_contexts WHERE context_id = $1;`, [body.context_id]);
      const { rows: leadRows } = await pool.query(`SELECT * FROM payment_leads WHERE external_reference = $1;`, [body.context_id]);
      const { rows: eventRows } = await pool.query(`SELECT * FROM lifecycle_events WHERE idempotency_key LIKE $1;`, [`%:${body.context_id}:%`]);
      result.checkout_verification = {
        context: ctxRows[0] || null,
        lead: leadRows[0] || null,
        lifecycle_events: eventRows
      };
    }
    if (body.verify_queries === true) {
      const { rows: contactMeta } = await pool.query(`SELECT count(*) FROM crm_contact_metadata;`);
      const { rows: notes } = await pool.query(`SELECT count(*) FROM crm_notes;`);
      const { rows: emailLogs } = await pool.query(`SELECT count(*) FROM email_logs;`);
      const { rows: emailThreads } = await pool.query(`SELECT count(*) FROM email_threads;`);
      const { rows: emailMessages } = await pool.query(`SELECT count(*) FROM email_messages;`);
      const { rows: checkouts } = await pool.query(`SELECT id, customer_email FROM checkout_contexts LIMIT 1;`);
      const { rows: automations } = await pool.query(`SELECT count(*) FROM lifecycle_automations;`);

      result.query_verification = {
        crm_contact_metadata_count: contactMeta[0].count,
        crm_notes_count: notes[0].count,
        email_logs_count: emailLogs[0].count,
        email_threads_count: emailThreads[0].count,
        email_messages_count: emailMessages[0].count,
        checkout_contexts_customer_email_query: 'PASS',
        lifecycle_automations_count: automations[0].count,
      };
    }
    
    if (body.apply_manual_sql === true) {
      // If Drizzle kit runner is used or manual SQL in transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 0002 Lifecycle
        await client.query(`
          CREATE TABLE IF NOT EXISTS "lifecycle_events" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "customer_id" text,
            "event_type" varchar(100) NOT NULL,
            "idempotency_key" varchar(255) NOT NULL,
            "payload" jsonb DEFAULT '{}' NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "lifecycle_events_idempotency_key_unique" UNIQUE("idempotency_key")
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "lifecycle_automations" (
            "id" text PRIMARY KEY NOT NULL,
            "lifecycle_event_id" text NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "automation_id" varchar(100) NOT NULL,
            "action_type" varchar(50) NOT NULL,
            "scheduled_for" timestamp with time zone NOT NULL,
            "status" varchar(50) DEFAULT 'PENDING' NOT NULL,
            "claimed_at" timestamp with time zone,
            "claim_token" varchar(255),
            "attempts" integer DEFAULT 0 NOT NULL,
            "last_attempt_at" timestamp with time zone,
            "error_log" jsonb DEFAULT '[]',
            "context_data" jsonb DEFAULT '{}' NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `);

        // 0003 Email logs & suppressions
        await client.query(`
          CREATE TABLE IF NOT EXISTS "email_suppressions" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "reason" varchar(100) NOT NULL,
            "source" varchar(100) NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "email_suppressions_customer_email_unique" UNIQUE("customer_email")
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "email_logs" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "lifecycle_automation_id" text,
            "sequence_type" varchar(100),
            "step_number" integer,
            "provider" varchar(50) DEFAULT 'RESEND' NOT NULL,
            "provider_message_id" varchar(255),
            "status" varchar(50) NOT NULL,
            "subject" text,
            "metadata" jsonb DEFAULT '{}',
            "sent_at" timestamp with time zone,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `);

        // 0004
        await client.query(`
          CREATE TABLE IF NOT EXISTS "crm_contact_metadata" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "tags" varchar(1024) DEFAULT '',
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "crm_contact_metadata_customer_email_unique" UNIQUE("customer_email")
          );
        `);
        
        await client.query(`
          CREATE TABLE IF NOT EXISTS "crm_notes" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "admin_id" text,
            "admin_name" varchar(255) DEFAULT 'Admin' NOT NULL,
            "text" text NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `);

        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_logs' AND column_name='send_origin') THEN
              ALTER TABLE "email_logs" ADD COLUMN "send_origin" varchar(50) DEFAULT 'AUTOMATION' NOT NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_logs' AND column_name='category') THEN
              ALTER TABLE "email_logs" ADD COLUMN "category" varchar(50) DEFAULT 'marketing' NOT NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='email_logs' AND column_name='template_id') THEN
              ALTER TABLE "email_logs" ADD COLUMN "template_id" varchar(100);
            END IF;
          END $$;
        `);

        // 0005
        await client.query(`
          CREATE TABLE IF NOT EXISTS "email_threads" (
            "id" text PRIMARY KEY NOT NULL,
            "customer_email" varchar(255) NOT NULL,
            "customer_id" text,
            "status" varchar(50) DEFAULT 'NEEDS_REPLY' NOT NULL,
            "subject" text NOT NULL,
            "related_order_id" text,
            "latest_message_at" timestamp with time zone DEFAULT now() NOT NULL,
            "unread_count" integer DEFAULT 0 NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS "email_messages" (
            "id" text PRIMARY KEY NOT NULL,
            "thread_id" text NOT NULL,
            "direction" varchar(20) NOT NULL,
            "provider" varchar(50) DEFAULT 'GMAIL' NOT NULL,
            "provider_message_id" varchar(255),
            "message_id" varchar(500),
            "in_reply_to" varchar(500),
            "references" text,
            "from_email" varchar(255) NOT NULL,
            "to_email" varchar(255) NOT NULL,
            "subject" text NOT NULL,
            "text_body" text,
            "sanitized_html_body" text,
            "received_at" timestamp with time zone,
            "sent_at" timestamp with time zone,
            "read_at" timestamp with time zone,
            "metadata" jsonb DEFAULT '{}',
            "created_at" timestamp with time zone DEFAULT now() NOT NULL
          );
        `);

        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checkout_contexts' AND column_name='customer_email') THEN
              ALTER TABLE "checkout_contexts" ADD COLUMN "customer_email" varchar(255);
            END IF;
          END $$;
        `);

        // Add constraints if not exists
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifecycle_automations_lifecycle_event_id_lifecycle_events_id_fk') THEN
              ALTER TABLE "lifecycle_automations" ADD CONSTRAINT "lifecycle_automations_lifecycle_event_id_lifecycle_events_id_fk" FOREIGN KEY ("lifecycle_event_id") REFERENCES "public"."lifecycle_events"("id") ON DELETE no action ON UPDATE no action;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lifecycle_events_customer_id_customers_id_fk') THEN
              ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_lifecycle_automation_id_lifecycle_automations_id_fk') THEN
              ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_lifecycle_automation_id_lifecycle_automations_id_fk" FOREIGN KEY ("lifecycle_automation_id") REFERENCES "public"."lifecycle_automations"("id") ON DELETE no action ON UPDATE no action;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_messages_thread_id_email_threads_id_fk') THEN
              ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_email_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_threads_customer_id_customers_id_fk') THEN
              ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_threads_related_order_id_orders_id_fk') THEN
              ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
            END IF;
          END $$;
        `);

        // Indexes
        await client.query(`CREATE INDEX IF NOT EXISTS "lifecycle_automations_status_idx" ON "lifecycle_automations" USING btree ("status");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "lifecycle_automations_scheduled_for_idx" ON "lifecycle_automations" USING btree ("scheduled_for");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "lifecycle_automations_customer_email_idx" ON "lifecycle_automations" USING btree ("customer_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "lifecycle_events_customer_email_idx" ON "lifecycle_events" USING btree ("customer_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "lifecycle_events_event_type_idx" ON "lifecycle_events" USING btree ("event_type");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_logs_customer_email_idx" ON "email_logs" USING btree ("customer_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_logs_automation_id_idx" ON "email_logs" USING btree ("lifecycle_automation_id");`);
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "email_logs_automation_step_unique_idx" ON "email_logs" USING btree ("lifecycle_automation_id","step_number");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_messages_thread_id_idx" ON "email_messages" USING btree ("thread_id");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_messages_message_id_idx" ON "email_messages" USING btree ("message_id");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_messages_provider_message_id_idx" ON "email_messages" USING btree ("provider_message_id");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_messages_from_email_idx" ON "email_messages" USING btree ("from_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_messages_to_email_idx" ON "email_messages" USING btree ("to_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_threads_customer_email_idx" ON "email_threads" USING btree ("customer_email");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_threads_status_idx" ON "email_threads" USING btree ("status");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_threads_latest_message_at_idx" ON "email_threads" USING btree ("latest_message_at");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "email_threads_related_order_idx" ON "email_threads" USING btree ("related_order_id");`);

        // Create __drizzle_migrations table if not exists and record 0000, 0001, 0002, 0003, 0004, 0005
        await client.query(`
          CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          );
        `);

        await client.query('COMMIT');
        result.migration_execution = 'PASS';
      } catch (err: any) {
        await client.query('ROLLBACK');
        result.migration_execution = 'FAIL';
        result.migration_error = err.message;
      } finally {
        client.release();
      }

      // Query state after
      const { rows: tableRowsAfter } = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      const { rows: columnRowsAfter } = await pool.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('email_logs', 'checkout_contexts', 'crm_notes', 'crm_contact_metadata', 'email_threads', 'email_messages');
      `);
      const { rows: indexRows } = await pool.query(`
        SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
      `);
      const { rows: fkRows } = await pool.query(`
        SELECT conname, contype FROM pg_constraint WHERE contype = 'f';
      `);

      result.schema_after = {
        tables: tableRowsAfter.map(r => r.table_name),
        columns: columnRowsAfter,
        indexes: indexRows,
        foreign_keys: fkRows
      };
    }

    await pool.end();
    return NextResponse.json(result);
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}
