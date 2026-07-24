const { Client } = require('pg');
const bcrypt = require('bcryptjs');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:24636243@localhost:2463/asshrabha?schema=public' });
  await client.connect();
  const res = await client.query('SELECT "passwordHash" FROM "User" WHERE mobile = $1', ['01094056917']);
  console.log('rowCount', res.rowCount);
  if (res.rowCount) {
    const hash = res.rows[0].passwordHash;
    console.log('hash', hash);
    console.log('matches', await bcrypt.compare('2463', hash));
  }
  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
