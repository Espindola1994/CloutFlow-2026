const fs = require('fs');
const { Pool } = require('pg');

const envFile = fs.readFileSync('.env.current.pull', 'utf-8');
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

async function main() {
  console.log('--- PRECHECK 1: ENV FLAGS ---');
  console.log('LIFECYCLE_EMAILS_ENABLED:', envVars.LIFECYCLE_EMAILS_ENABLED);
  console.log('LIFECYCLE_EMAIL_ALLOWLIST:', envVars.LIFECYCLE_EMAIL_ALLOWLIST);
  console.log('SAFE_MODE:', envVars.SAFE_MODE);
  console.log('FULFILLMENT_ENABLED:', envVars.FULFILLMENT_ENABLED);
  console.log('PEAKERR_AUTO_DISPATCH_ENABLED:', envVars.PEAKERR_AUTO_DISPATCH_ENABLED);
  console.log('PEAKERR_LIVE_FULFILLMENT:', envVars.PEAKERR_LIVE_FULFILLMENT);

  const recipientInAllowlist = (envVars.LIFECYCLE_EMAIL_ALLOWLIST || '').split(',').map(s => s.trim().toLowerCase()).includes('instaplussoftware@gmail.com');
  console.log('recipient in allowlist:', recipientInAllowlist);

  console.log('\n--- PRECHECK 2: ORDER STATUS ---');
  const orderRes = await pool.query('SELECT id, public_id, customer_email, payment_status, fulfillment_status FROM orders WHERE id = $1', ['2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0']);
  console.log('Order found:', orderRes.rows[0]);

  console.log('\n--- PRECHECK 3: ORIGINAL EMAIL LOG ---');
  const logRes = await pool.query('SELECT id, template_id, status, provider_message_id, metadata, created_at FROM email_logs WHERE id = $1', ['41dfaa72-6248-410d-8018-11ce16c45933']);
  console.log('Original email log:', logRes.rows[0]);

  console.log('\n--- PRECHECK 4: ANY SENT LOG FOR PAYMENT_RECEIVED AND THIS ORDER ---');
  const sentRes = await pool.query(`
    SELECT id, template_id, status, provider_message_id, metadata, created_at 
    FROM email_logs 
    WHERE template_id = 'PAYMENT_RECEIVED' 
      AND (metadata->>'orderId' = $1 OR metadata->>'idempotencyKey' = $2)
      AND status = 'SENT'
  `, ['2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0', 'AUTO_TX:PAYMENT_APPROVED:2a12d168-f5b5-46ac-a6a8-c5fbdf6bedc0']);
  console.log('Existing SENT logs count:', sentRes.rows.length);
  if (sentRes.rows.length > 0) {
    console.log('SENT logs found:', sentRes.rows);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Error running check:', err);
  process.exit(1);
});
