import { db } from '@/db';
import { sql } from 'drizzle-orm';

let tableEnsured = false;

/**
 * Ensures visitor_presence table, indexes, and checkout_contexts columns exist in production database.
 * Pure idempotent DDL matching ensureSecurityTables pattern.
 * Fail-open: Never throws, logs error if DB is unreachable.
 */
export async function ensurePresenceTable(): Promise<void> {
  if (tableEnsured) return;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS visitor_presence (
        id text PRIMARY KEY NOT NULL,
        session_id text NOT NULL UNIQUE,
        visitor_id text,
        platform varchar(50),
        service varchar(100),
        plan_id varchar(100),
        country varchar(10),
        country_code varchar(10),
        region varchar(100),
        city varchar(100),
        latitude numeric(10, 6),
        longitude numeric(10, 6),
        device_type varchar(50),
        os varchar(50),
        browser varchar(50),
        last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_visitor_presence_last_seen_at ON visitor_presence (last_seen_at);
      CREATE INDEX IF NOT EXISTS idx_visitor_presence_expires_at ON visitor_presence (expires_at);

      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS session_id text;
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS visitor_id text;
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS country varchar(10);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS country_code varchar(10);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS region varchar(100);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS city varchar(100);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS latitude numeric(10, 6);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS longitude numeric(10, 6);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS device_type varchar(50);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS os varchar(50);
      ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS browser varchar(50);
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn('[PresenceInit] Table ensure warning:', (err as Error).message);
  }
}
