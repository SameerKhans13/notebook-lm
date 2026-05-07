const { Pool } = require('pg');

async function checkDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://notebook_user:notebook_password@localhost:5432/notebook_db"
  });

  try {
    const client = await pool.connect();
    console.log("Connected to database successfully");
    
    const tableRes = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents')");
    console.log("Documents table exists:", tableRes.rows[0].exists);
    
    if (tableRes.rows[0].exists) {
      const countRes = await client.query("SELECT COUNT(*) FROM documents");
      console.log("Documents count:", countRes.rows[0].count);
    }
    
    client.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
  } finally {
    await pool.end();
  }
}

checkDb();
