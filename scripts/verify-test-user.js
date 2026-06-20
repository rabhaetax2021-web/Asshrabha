const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function test() {
  const client = new Client({ connectionString: 'postgresql://postgres:24636243@localhost:2463/asshrabha?schema=public' });
  await client.connect();
  
  // 1. Check user exists
  const userRes = await client.query(`SELECT id, mobile, "passwordHash", role, status, "forcePasswordReset" FROM "User" WHERE mobile = $1`, ['01094056919']);
  if (!userRes.rows.length) {
    console.log('FAIL: User not found');
    await client.end();
    process.exit(1);
  }
  
  const user = userRes.rows[0];
  console.log('User found:', user.id);
  console.log('Role:', user.role);
  console.log('Status:', user.status);
  console.log('Force password reset:', user.forcePasswordReset);
  
  // 2. Check password
  const isValid = await bcrypt.compare('2463', user.passwordHash);
  console.log('Password valid:', isValid);
  if (!isValid) { console.log('FAIL: Password mismatch'); process.exit(1); }
  
  // 3. Check permissions
  const permRes = await client.query(`SELECT permission FROM "AdminPermission" WHERE "userId" = $1`, [user.id]);
  console.log('Permissions:', permRes.rows.length);
  
  // 4. Check wallet
  const walletRes = await client.query(`SELECT id FROM "Wallet" WHERE "userId" = $1`, [user.id]);
  console.log('Has wallet:', walletRes.rows.length > 0);
  
  // 5. Check categories
  const catRes = await client.query(`SELECT COUNT(*) as cnt FROM "Category"`);
  console.log('Categories:', catRes.rows[0].cnt);
  
  // 6. Check settings
  const settRes = await client.query(`SELECT COUNT(*) as cnt FROM "SystemSetting"`);
  console.log('System settings:', settRes.rows[0].cnt);

  // Final verdict
  const allOk = isValid && user.role === 'ROOT_ADMIN' && user.status === 'APPROVED' && !user.forcePasswordReset && permRes.rows.length >= 11 && walletRes.rows.length > 0;
  
  console.log('');
  if (allOk) {
    console.log('=== ALL CHECKS PASSED ===');
    console.log('  Mobile:   01094056919');
    console.log('  Password: 2463');
    console.log('  Role:     ROOT_ADMIN');
    console.log('  Redirect: /admin');
  } else {
    console.log('=== SOME CHECKS FAILED ===');
    process.exitCode = 1;
  }
  
  await client.end();
}
test().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
