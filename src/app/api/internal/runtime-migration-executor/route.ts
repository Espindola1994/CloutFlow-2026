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
      AND table_name IN ('email_logs', 'checkout_contexts');
    `);

    // 2. Read drizzle history if exists
    let drizzleMigrations = [];
    try {
      const { rows: historyRows } = await pool.query(`
        SELECT * FROM "__drizzle_migrations" ORDER BY created_at ASC;
      `);
      drizzleMigrations = historyRows;
    } catch (e) {
      // Table might not exist yet if no migrations were ever run by drizzle
    }

    // Attempt migration
    // Determine the absolute path to the drizzle migrations folder
    // In Vercel Next.js output, we might need to rely on process.cwd()
    const migrationsFolder = path.join(process.cwd(), 'drizzle');

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
      migrationsFolder,
      migration_execution: 'PENDING'
    };

    // We will apply migrations only if explicitly instructed via body parameter
    const body = await request.json().catch(() => ({}));
    
    if (body.apply === true) {
      try {
        await migrate(db, { migrationsFolder });
        result.migration_execution = 'PASS';
        
        // Fetch new state
        const { rows: newHistoryRows } = await pool.query(`
          SELECT * FROM "__drizzle_migrations" ORDER BY created_at ASC;
        `);
        result.schema_after = {
          drizzleMigrations: newHistoryRows
        };
      } catch (migrationError: any) {
        result.migration_execution = 'FAIL';
        result.migration_error = migrationError.message || String(migrationError);
      }
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
