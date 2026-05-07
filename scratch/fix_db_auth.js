const { Client } = require('pg');

async function fixDb() {
  // Try to connect as postgres superuser to fix things
  const superuserConfigs = [
    { user: 'postgres', host: 'localhost', database: 'postgres', port: 5432 },
    { user: 'postgres', host: 'localhost', database: 'postgres', port: 5432, password: 'password' },
    { user: 'postgres', host: 'localhost', database: 'postgres', port: 5432, password: 'admin' },
    { user: 'postgres', host: 'localhost', database: 'postgres', port: 5432, password: 'postgres' }
  ];

  let client;
  for (const config of superuserConfigs) {
    try {
      console.log(`Trying to connect as superuser: ${config.user} (password: ${config.password || 'none'})...`);
      client = new Client(config);
      await client.connect();
      console.log("✅ Connected as superuser!");
      break;
    } catch (err) {
      console.log("❌ Failed:", err.message);
      client = null;
    }
  }

  if (!client) {
    console.log("\nCould not connect as superuser. Please ensure PostgreSQL is running and you know the 'postgres' password.");
    return;
  }

  try {
    console.log("Setting up notebook_user and notebook_db...");
    
    // Check if notebook_db exists
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'notebook_db'");
    if (dbCheck.rows.length === 0) {
      await client.query("CREATE DATABASE notebook_db");
      console.log("✓ Created database notebook_db");
    }

    // Check if notebook_user exists
    const userCheck = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'notebook_user'");
    if (userCheck.rows.length === 0) {
      await client.query("CREATE USER notebook_user WITH PASSWORD 'notebook_password'");
      console.log("✓ Created user notebook_user");
    } else {
      await client.query("ALTER USER notebook_user WITH PASSWORD 'notebook_password'");
      console.log("✓ Updated password for notebook_user");
    }

    await client.query("GRANT ALL PRIVILEGES ON DATABASE notebook_db TO notebook_user");
    console.log("✓ Granted privileges");

    console.log("\nDatabase setup complete! You should now be able to run the app.");
  } catch (err) {
    console.error("Error during setup:", err.message);
  } finally {
    await client.end();
  }
}

fixDb();
