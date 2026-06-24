const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: 'postgresql://postgres:24636243@localhost:2463/asshrabha?schema=public' });
  try {
    await client.connect();
    const userId = 'cmqsae6rz000a2gims0tthqxt';
    const res = await client.query('SELECT id, mobile, status, role, "createdAt" FROM "User" WHERE id = $1', [userId]);
    console.log('User:');
    res.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
    
    const pp = await client.query('SELECT id, "userId", "isVisible" FROM "ProviderProfile" WHERE "userId" = $1', [userId]);
    console.log('\nProvider Profile:');
    pp.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
