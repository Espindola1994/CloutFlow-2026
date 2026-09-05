const fs = require('fs');
const { Pool } = require('pg');

const envFile = fs.readFileSync('.env.current.pull.check', 'utf-8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const k = trimmed.substring(0, idx).trim();
    let v = trimmed.substring(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.substring(1, v.length - 1);
    }
    envVars[k] = v;
  }
}

const pool = new Pool({
  connectionString: envVars.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const ctx = await pool.query('SELECT * FROM checkout_contexts WHERE id = $1', ['CFCTX_94510b0aaa3205cbfbd9ac55']);
  console.log('CHECKOUT_CONTEXT:');
  console.log(ctx.rows[0]);

  const events = await pool.query('SELECT id, customer_email, event_type, idempotency_key, payload, created_at FROM lifecycle_events WHERE customer_email = $1 ORDER BY created_at DESC LIMIT 5', ['instaplussoftware@gmail.com']);
  console.log('\nLIFECYCLE_EVENTS:');
  for (const ev of events.rows) {
    console.log(ev.id, ev.event_type, ev.idempotency_key, ev.created_at);
    console.log('  Payload:', JSON.stringify(ev.payload));
  }
  await pool.end();
}
check().catch(e => { console.error(e); process.exit(1); });
