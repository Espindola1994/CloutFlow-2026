import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Singleton strategy for Next.js hot reload
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

// Next.js build step executes files. Don't crash the build if DATABASE_URL is missing.
// It will crash at runtime naturally if it's still missing.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dummy';

// Supabase Transaction Pooler (port 6543, PgBouncer) does not support prepared statements
// which breaks many parametric queries in postgres/drizzle.
export const pool = globalForDb.pool ?? new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '5', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '10000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '10000', 10),
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

// Set prepare: false to disable prepared statements which are incompatible with PgBouncer transaction mode
export const db = drizzle(pool, { schema });
