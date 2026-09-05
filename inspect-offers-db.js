const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

let dbUrl = process.env.DATABASE_URL;
if (fs.existsSync('.env.tmp.pull')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.tmp.pull'));
  if (envConfig.DATABASE_URL) dbUrl = envConfig.DATABASE_URL;
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  const fks = await client.query(`
    SELECT
      tc.table_schema, 
      tc.constraint_name, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE ccu.table_name = 'offers' OR kcu.column_name LIKE '%offer%';
  `);
  console.log('FKs related to offers or columns like %offer%:', JSON.stringify(fks.rows, null, 2));

  const cols = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE column_name LIKE '%offer%'
    ORDER BY table_name, column_name;
  `);
  console.log('Columns like %offer% across DB:', JSON.stringify(cols.rows, null, 2));

  const countOffers = await client.query('SELECT count(*) FROM offers;');
  console.log('Offers count in DB:', countOffers.rows[0].count);

  const offersRows = await client.query('SELECT id, platform, service, name, slug, active, perfectpay_product_id, perfectpay_plan_id FROM offers;');
  console.log('Existing physical offers in DB:', JSON.stringify(offersRows.rows, null, 2));

  const ctxColumns = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'checkout_contexts' 
    ORDER BY ordinal_position;
  `);
  console.log('checkout_contexts columns:', JSON.stringify(ctxColumns.rows, null, 2));

  const orderColumns = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    ORDER BY ordinal_position;
  `);
  console.log('orders columns:', JSON.stringify(orderColumns.rows, null, 2));

  await client.end();
}
run().catch(console.error);
