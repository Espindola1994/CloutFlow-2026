import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireAdmin } from '@/lib/auth/session';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ success: false, error: 'DATABASE_URL is missing' }, { status: 500 });
    }

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    const report: Record<string, any> = {};

    // Probe 1: current_database
    try {
      const res = await pool.query('SELECT current_database() as db');
      report.current_database = res.rows[0]?.db;
    } catch (e: any) {
      report.current_database_error = { code: e.code, message: e.message };
    }

    // Probe 2: current_schema
    try {
      const res = await pool.query('SELECT current_schema() as schema');
      report.current_schema = res.rows[0]?.schema;
    } catch (e: any) {
      report.current_schema_error = { code: e.code, message: e.message };
    }

    // Probe 3: to_regclass('public.settings')
    try {
      const res = await pool.query("SELECT to_regclass('public.settings') AS settings_table");
      report.settings_regclass = res.rows[0]?.settings_table;
    } catch (e: any) {
      report.settings_regclass_error = { code: e.code, message: e.message };
    }

    // Probe 4: information_schema.tables for 'settings'
    try {
      const res = await pool.query(`
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_name = 'settings'
      `);
      report.information_schema_tables = res.rows;
    } catch (e: any) {
      report.information_schema_tables_error = { code: e.code, message: e.message };
    }

    // Probe 5: information_schema.columns for public.settings
    try {
      const res = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'settings'
        ORDER BY ordinal_position
      `);
      report.columns = res.rows;
    } catch (e: any) {
      report.columns_error = { code: e.code, message: e.message };
    }

    // Probe 6: count(*) FROM public.settings
    try {
      const res = await pool.query('SELECT count(*) AS row_count FROM public.settings');
      report.row_count = res.rows[0]?.row_count;
    } catch (e: any) {
      report.row_count_error = { 
        code: e.code, 
        message: e.message,
        detail: e.detail,
        hint: e.hint,
        schema: e.schema,
        table: e.table,
        column: e.column,
        constraint: e.constraint,
        severity: e.severity
      };
    }

    // Probe 7: SELECT value FROM public.settings WHERE key = 'inbox_sync_lock'
    try {
      const res = await pool.query("SELECT value FROM public.settings WHERE key = 'inbox_sync_lock' LIMIT 1");
      report.inbox_sync_lock = res.rows;
    } catch (e: any) {
      report.inbox_sync_lock_error = { 
        code: e.code, 
        message: e.message,
        detail: e.detail,
        hint: e.hint,
        schema: e.schema,
        table: e.table,
        column: e.column,
        constraint: e.constraint,
        severity: e.severity
      };
    }

    // Probe 8: SELECT value FROM public.settings WHERE key = 'inbox_sync_cursor'
    try {
      const res = await pool.query("SELECT value FROM public.settings WHERE key = 'inbox_sync_cursor' LIMIT 1");
      report.inbox_sync_cursor = res.rows;
    } catch (e: any) {
      report.inbox_sync_cursor_error = { 
        code: e.code, 
        message: e.message,
        detail: e.detail,
        hint: e.hint,
        schema: e.schema,
        table: e.table,
        column: e.column,
        constraint: e.constraint,
        severity: e.severity
      };
    }

    // Probes for email_inbox_sync_state
    try {
      const res = await pool.query("SELECT to_regclass('public.email_inbox_sync_state') AS sync_state_table");
      report.email_inbox_sync_state_regclass = res.rows[0]?.sync_state_table;
    } catch (e: any) {
      report.email_inbox_sync_state_error = { code: e.code, message: e.message };
    }

    // Auto-create email_inbox_sync_state if needed (non-destructive additive migration)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "email_inbox_sync_state" (
          "id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
          "mailbox_key" varchar(255) NOT NULL UNIQUE,
          "uid_validity" text,
          "last_processed_uid" bigint,
          "last_successful_sync_at" timestamp with time zone,
          "last_attempt_at" timestamp with time zone,
          "lock_token" text,
          "lock_expires_at" timestamp with time zone,
          "last_error" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);
      report.sync_state_table_creation = 'SUCCESS';
    } catch (e: any) {
      report.sync_state_table_creation_error = { code: e.code, message: e.message };
    }

    await pool.end();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}