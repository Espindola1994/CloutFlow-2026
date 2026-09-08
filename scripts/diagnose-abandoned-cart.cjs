const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1
});

(async () => {
  try {
    const email = "terraguilherme26@gmail.com";

    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name ILIKE '%lifecycle%'
      ORDER BY table_name;
    `);

    console.log("\n=== LIFECYCLE TABLES ===");
    console.table(tables.rows);

    for (const row of tables.rows) {
      const table = row.table_name;

      const cols = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      console.log("\nTABLE:", table);
      console.log(cols.rows.map(x => x.column_name).join(", "));
    }

    console.log("\nTarget email:", email);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
