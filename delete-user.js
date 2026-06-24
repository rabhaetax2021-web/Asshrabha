const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT id FROM "User" WHERE mobile = $1', ['01094056919']);
    if (res.rowCount === 0) {
      console.log('User not found');
      return;
    }
    const userId = res.rows[0].id;
    console.log('Found user:', userId);
    
    await client.query('DELETE FROM "ProviderProfile" WHERE "userId" = $1', [userId]);
    await client.query('DELETE FROM "OTPCode" WHERE "userId" = $1', [userId]);
    await client.query('DELETE FROM "Wallet" WHERE "userId" = $1', [userId]);
    await client.query('DELETE FROM "User" WHERE id = $1', [userId]);
    
    console.log('User deleted successfully');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
})();
