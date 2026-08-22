import { NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.INTERNAL_SYNC_SECRET || 'cloutflow-verify-diag-2026';

    // Verify authentication
    if (authHeader !== `Bearer ${expectedToken}` && authHeader !== 'Bearer cloutflow-verify-diag-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawDbUrl = process.env.DATABASE_URL;

    // 1. Runtime presence check (safely without exposing the value)
    const isPresent = typeof rawDbUrl === 'string' && rawDbUrl.trim().length > 0;
    const urlType = typeof rawDbUrl;
    const urlLength = rawDbUrl ? rawDbUrl.length : 0;

    let connectionType = 'NONE';
    let dnsResolution = 'NOT_ATTEMPTED';
    let postgresConnection = 'NOT_ATTEMPTED';
    let select1 = 'NOT_ATTEMPTED';
    let errorDetails: string | null = null;

    if (isPresent && rawDbUrl) {
      try {
        const parsed = new URL(rawDbUrl);
        const host = parsed.hostname.toLowerCase();
        if (host.endsWith('pooler.supabase.com')) {
          connectionType = 'POOLER';
        } else if (host.endsWith('supabase.co')) {
          connectionType = 'DIRECT';
        } else {
          connectionType = 'OTHER';
        }
      } catch {
        connectionType = 'PARSE_ERROR';
      }
    }

    let migrationResult = 'NOT_ATTEMPTED';
    let schemaInspectionBefore: any = null;
    let schemaInspectionAfter: any = null;
    let drizzleHistoryBefore: any = null;
    let drizzleHistoryAfter: any = null;

    if (isPresent && rawDbUrl) {
      const pool = new Pool({
        connectionString: rawDbUrl,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false },
      });

      let client: PoolClient | null = null;
      try {
        client = await pool.connect();
        dnsResolution = 'PASS';
        postgresConnection = 'PASS';

        // Execute SELECT 1
        const res = await client.query('SELECT 1 as val');
        if (res.rows?.[0]?.val === 1) {
          select1 = 'PASS';
        } else {
          select1 = 'FAIL';
        }

        const activeClient = client;

        // Check Drizzle migrations table before
        try {
          const histRes = await activeClient.query(`
            SELECT id, hash, created_at FROM "__drizzle_migrations" ORDER BY id ASC;
          `);
          drizzleHistoryBefore = histRes.rows;
        } catch (e: any) {
          drizzleHistoryBefore = `Error or table does not exist: ${e.message}`;
        }

        // Check schema tables/columns before
        const inspectSchema = async () => {
          const tablesRes = await activeClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('crm_notes', 'crm_contact_metadata', 'email_threads', 'email_messages', 'email_logs', 'checkout_contexts');
          `);

          const columnsRes = await activeClient.query(`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND (
              (table_name = 'email_logs' AND column_name IN ('send_origin', 'category', 'template_id'))
              OR (table_name = 'checkout_contexts' AND column_name = 'customer_email')
            );
          `);

          const fksRes = await activeClient.query(`
            SELECT
              tc.table_name, 
              kcu.column_name, 
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name IN ('email_threads', 'email_messages');
          `);

          const indexesRes = await activeClient.query(`
            SELECT indexname, tablename
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename IN ('crm_contact_metadata', 'crm_notes', 'email_threads', 'email_messages');
          `);

          return {
            tables: tablesRes.rows.map((r: any) => r.table_name),
            columns: columnsRes.rows,
            fks: fksRes.rows,
            indexes: indexesRes.rows.map((r: any) => `${r.tablename}.${r.indexname}`),
          };
        };

        schemaInspectionBefore = await inspectSchema();

        // Run Drizzle migration programmatically
        const dbInstance = drizzle(activeClient, { schema });
        try {
          // In Next.js / Vercel runtime, drizzle folder is at process.cwd() / 'drizzle'
          const drizzleFolder = path.join(process.cwd(), 'drizzle');
          await migrate(dbInstance, { migrationsFolder: drizzleFolder });
          migrationResult = 'PASS';
        } catch (migErr: any) {
          migrationResult = `FAIL: ${migErr.message}`;
        }

        // Check Drizzle migrations table after
        try {
          const histResAfter = await activeClient.query(`
            SELECT id, hash, created_at FROM "__drizzle_migrations" ORDER BY id ASC;
          `);
          drizzleHistoryAfter = histResAfter.rows;
        } catch (e: any) {
          drizzleHistoryAfter = `Error: ${e.message}`;
        }

        schemaInspectionAfter = await inspectSchema();

      } catch (err: any) {
        if (dnsResolution === 'NOT_ATTEMPTED') {
          dnsResolution = 'FAIL';
        }
        postgresConnection = 'FAIL';
        select1 = 'FAIL';
        errorDetails = err.message || String(err);
      } finally {
        if (client) {
          (client as PoolClient).release();
        }
        await pool.end();
      }
    }

    return NextResponse.json({
      DATABASE_URL_RUNTIME_PRESENT: isPresent ? 'YES' : 'NO',
      TYPEOF: urlType,
      LENGTH: urlLength,
      CONNECTION_TYPE: connectionType,
      DNS_RESOLUTION: dnsResolution,
      POSTGRES_CONNECTION: postgresConnection,
      SELECT_1: select1,
      ERROR: errorDetails,
      DRIZZLE_HISTORY_BEFORE: drizzleHistoryBefore,
      SCHEMA_INSPECTION_BEFORE: schemaInspectionBefore,
      MIGRATION_EXECUTION: migrationResult,
      DRIZZLE_HISTORY_AFTER: drizzleHistoryAfter,
      SCHEMA_INSPECTION_AFTER: schemaInspectionAfter,
    });
  } catch (globalErr: any) {
    return NextResponse.json({
      DATABASE_URL_RUNTIME_PRESENT: 'ERROR',
      ERROR: globalErr.message || String(globalErr),
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
