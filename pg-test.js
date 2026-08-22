const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const db = await pool.query('SELECT current_database() as db');
    console.log('Database:', db.rows[0].db);

    const schema = await pool.query('SELECT current_schema() as schema');
    console.log('Schema:', schema.rows[0].schema);

    const tblCheck = await pool.query("SELECT to_regclass('public.settings') AS settings_table");
    console.log('Table exists (regclass):', tblCheck.rows[0].settings_table);

    const info = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'settings'
    `);
    console.log('Information schema check:', info.rows);

    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'settings'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', cols.rows);

    const count = await pool.query('SELECT count(*) AS row_count FROM public.settings');
    console.log('Count:', count.rows[0].row_count);

    const lock = await pool.query("SELECT value FROM public.settings WHERE key = 'inbox_sync_lock' LIMIT 1");
    console.log('Lock read:', lock.rows.length ? lock.rows[0].value : 'Not found');

    const cursor = await pool.query("SELECT value FROM public.settings WHERE key = 'inbox_sync_cursor' LIMIT 1");
    console.log('Cursor read:', cursor.rows.length ? cursor.rows[0].value : 'Not found');

  } catch (err) {
    console.log('ERROR:', {
      code: err.code,
      message: err.message,
      detail: err.detail,
      hint: err.hint,
      schema: err.schema,
      table: err.table,
      column: err.column,
      constraint: err.constraint,
      severity: err.severity,
    });
  } finally {
    await pool.end();
  }
}

main();