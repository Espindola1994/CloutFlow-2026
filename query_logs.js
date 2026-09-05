const fs = require('fs');
const lines = fs.readFileSync('.env.vercel.prod.current', 'utf8').split(/\r?\n/);
const dbLine = lines.find(l => l.startsWith('DATABASE_URL='));
let dbUrl = dbLine.substring('DATABASE_URL='.length).trim();
if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
  dbUrl = dbUrl.slice(1, -1);
}

const { Client } = require('pg');
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  const res = await client.query(
    `SELECT id, customer_email, template_id, status, provider_message_id, metadata, created_at 
     FROM email_logs 
     WHERE customer_email = 'guilhermesps21@gmail.com' 
     ORDER BY created_at ASC`
  );
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
