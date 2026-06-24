const { loadEnvFile } = require('process');
loadEnvFile('.env.local');
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const userId = 'cmqsae6rz000a2gims0tthqxt';
    const res = await client.query('SELECT id, code, verified, "expiresAt" FROM "OTPCode" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 3', [userId]);
    console.log('OTPs for user:', userId);
    res.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
