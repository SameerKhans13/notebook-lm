const { Pool } = require('pg');

const credentials = [
  "postgresql://notebook_user:notebook_password@localhost:5432/notebook_db",
  "postgresql://postgres:postgres@localhost:5432/postgres",
  "postgresql://postgres:password@localhost:5432/postgres",
  "postgresql://postgres@localhost:5432/postgres" // No password
];

async function checkDb() {
  for (const connectionString of credentials) {
    const pool = new Pool({ connectionString });
    console.log(`Trying: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);
    
    try {
      const client = await pool.connect();
      console.log("✅ Connected successfully!");
      
      const dbRes = await client.query("SELECT current_database()");
      console.log("Current DB:", dbRes.rows[0].current_database);
      
      client.release();
      await pool.end();
      return connectionString;
    } catch (err) {
      console.log("❌ Failed:", err.message);
      await pool.end();
    }
  }
}

checkDb().then(workingConn => {
  if (workingConn) {
    console.log("\nWORKING_CONNECTION=" + workingConn);
  } else {
    console.log("\nNo working connection found.");
  }
});
