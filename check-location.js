const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: 'postgresql://postgres:24636243@localhost:2463/asshrabha?schema=public' });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT pp.id, pp."userId", pp."locationId", pp."locationUrl", pp."locationLat", pp."locationLng"
      FROM "ProviderProfile" pp
      WHERE pp."userId" = 'cmqsae6rz000a2gims0tthqxt'
    `);
    console.log('Provider Profile Location Fields:');
    res.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
