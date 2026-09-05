const fs = require('fs');
let envFile = '';
if (fs.existsSync('.env.live.audit')) {
  envFile = '.env.live.audit';
} else if (fs.existsSync('.env.vercel.prod.live')) {
  envFile = '.env.vercel.prod.live';
} else if (fs.existsSync('.env.current.prod')) {
  envFile = '.env.current.prod';
}
const envText = fs.readFileSync(envFile, 'utf8');
let dbUrl = '';
for (const line of envText.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    break;
  }
}
const { Pool } = require('pg');
const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });

async function run() {
  const client = await pool.connect();
  const publicIds = ['CF-4801XKB9PR', 'CF-61964A76JY', 'CF-17204O9QA8', 'CF-7200UNFNXP'];
  const ordersRes = await client.query('SELECT id, public_id, status, customer_email, offer_id, canonical_offer_id, created_at FROM orders WHERE public_id = ANY($1)', [publicIds]);
  console.log('ORDERS:', JSON.stringify(ordersRes.rows, null, 2));

  const emails = ordersRes.rows.map(r => r.customer_email).filter(Boolean);
  console.log('EMAILS:', emails);

  if (emails.length > 0) {
    const eventsRes = await client.query('SELECT * FROM lifecycle_events WHERE customer_email = ANY($1)', [emails]);
    console.log('LIFECYCLE EVENTS:', JSON.stringify(eventsRes.rows, null, 2));

    const emailLogsRes = await client.query('SELECT * FROM email_logs WHERE customer_email = ANY($1)', [emails]);
    console.log('EMAIL LOGS:', JSON.stringify(emailLogsRes.rows, null, 2));

    const autoRes = await client.query('SELECT * FROM lifecycle_automations WHERE customer_email = ANY($1)', [emails]);
    console.log('LIFECYCLE AUTOMATIONS:', JSON.stringify(autoRes.rows, null, 2));

    const leadsRes = await client.query('SELECT * FROM leads WHERE customer_email = ANY($1)', [emails]);
    console.log('LEADS:', JSON.stringify(leadsRes.rows, null, 2));
  }

  // Also check total row counts in communication tables
  const tables = ['lifecycle_events', 'email_logs', 'lifecycle_automations', 'email_suppressions', 'leads', 'email_messages', 'email_threads'];
  for (const t of tables) {
    try {
      const cnt = await client.query('SELECT count(*) FROM ' + t);
      console.log('COUNT ' + t + ':', cnt.rows[0].count);
    } catch (e) {
      console.log('COUNT ' + t + ' ERROR:', e.message);
    }
  }

  client.release();
  await pool.end();
}
run().catch(e => { console.error(e); process.exit(1); });
