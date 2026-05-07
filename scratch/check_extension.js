const { Client } = require('pg');

async function checkVector() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@localhost:5432/postgres", // Update with your actual superuser password
  });

  try {
    await client.connect();
    const res = await client.query("SELECT * FROM pg_available_extensions WHERE name = 'vector'");
    if (res.rows.length > 0) {
      console.log("✅ pgvector extension is AVAILABLE to be installed.");
      console.log("Status:", res.rows[0].installed_version ? `Installed (${res.rows[0].installed_version})` : "Not installed yet");
    } else {
      console.log("❌ pgvector extension is NOT FOUND in your PostgreSQL installation.");
    }
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}

checkVector();
