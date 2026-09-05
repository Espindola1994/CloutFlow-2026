// Manual parse of DATABASE_URL
const fs = require('fs');
const envText = fs.readFileSync('.env.current.prod', 'utf8');
let dbUrl = '';
for (const line of envText.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
    break;
  }
}
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 10000,
});

async function main() {
  const client = await pool.connect();
  const res = await client.query("SELECT id, public_id, platform, service, quantity, status, fulfillment_status, target_url, profile_url, social_username, offer_id, canonical_offer_id FROM orders WHERE public_id = 'CF-4710NFSUCE' OR id = '351fa552-1724-4ef4-aa9c-d33ac8b05e22'");
  console.log('ORDER ROWS:', JSON.stringify(res.rows, null, 2));

  // Also query checkout context associated
  const ctxRes = await client.query("SELECT * FROM checkout_contexts WHERE target_url LIKE '%MrBeast%' OR social_username LIKE '%MrBeast%' ORDER BY created_at DESC LIMIT 5");
  console.log('CONTEXT ROWS:', JSON.stringify(ctxRes.rows, null, 2));

  client.release();
  await pool.end();
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
