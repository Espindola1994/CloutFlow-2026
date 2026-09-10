import { db } from '@/db';
import { sql } from 'drizzle-orm';

let tableEnsured = false;

/**
 * Ensures funnel_events table and indexes exist in production (idempotent DDL).
 * Follows the exact pattern established by ensureSecurityTables in totp-service.ts.
 * Fail-open: Never throws, logs warning if DB unavailable.
 */
export async function ensureFunnelEventsTable(): Promise<void> {
  if (tableEnsured) return;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS funnel_events (
        id text PRIMARY KEY NOT NULL,
        session_id text,
        event varchar(100) NOT NULL,
        platform_id text,
        service_id text,
        plan_id text,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events (created_at);
      CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events (session_id);
      CREATE INDEX IF NOT EXISTS idx_funnel_events_event ON funnel_events (event);
      CREATE INDEX IF NOT EXISTS idx_funnel_events_plan_id ON funnel_events (plan_id);
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn('[FunnelEvents] Table ensure warning:', (err as Error).message);
  }
}
