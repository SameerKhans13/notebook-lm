const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres'
});
pool.query('SELECT 1', (err, res) => {
  if (err) console.error('❌ Connection failed:', err.message);
  else console.log('✅ Connection successful:', res.rows);
  pool.end();
});
