const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1', (err, res) => {
  if (err) console.error('? Connection failed:', err.message);
  else console.log('? Connection successful:', res.rows);
  pool.end();
});
