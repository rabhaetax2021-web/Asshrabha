const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:24636243@localhost:2463/asshrabha?schema=public' });
  await client.connect();
  const res = await client.query('SELECT id, mobile, role, status, "customerType", "forcePasswordReset" FROM "User" ORDER BY "createdAt" DESC LIMIT 20');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
