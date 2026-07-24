/**
 * seed-test-user.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates or updates the test user with:
 *   Mobile:   01094056919
 *   Password: 2463
 *   Role:     ROOT_ADMIN (APPROVED)
 *
 * Also seeds categories, system settings, and admin permissions.
 * Idempotent — safe to run multiple times.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { getDemoAccounts } = require('../src/lib/demo-accounts');

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  return content.split('\n').reduce((acc, line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/);
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4];
    return acc;
  }, {});
}

const makeId = () => `seed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

async function main() {
  const env = loadEnv();
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Demo users ────────────────────────────────────────────────────
    console.log('\n👤 Setting up demo users...');
    const demoUsers = getDemoAccounts();

    let adminUserId;

    for (const account of demoUsers) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      const userRes = await client.query(
        'SELECT id FROM "User" WHERE mobile=$1 LIMIT 1',
        [account.mobile]
      );

      let userId;
      if (userRes.rows.length) {
        userId = userRes.rows[0].id;
        await client.query(
          `UPDATE "User" SET 
            "passwordHash"=$1, "nameAR"=$2, "nameEN"=$3,
            role=$4, status=$5, "forcePasswordReset"=$6, locale=$7,
            "customerType"=$8, "updatedAt"=$9
          WHERE id=$10`,
          [passwordHash, account.nameAR, account.nameEN, account.role, account.status, false, 'ar', account.customerType, new Date().toISOString(), userId]
        );
        console.log(`   ✅ ${account.key} updated (id: ${userId})`);
      } else {
        userId = makeId();
        const now = new Date().toISOString();
        await client.query(
          `INSERT INTO "User" (id, mobile, "passwordHash", "nameAR", "nameEN", role, status, "forcePasswordReset", locale, "customerType", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [userId, account.mobile, passwordHash, account.nameAR, account.nameEN, account.role, account.status, false, 'ar', account.customerType, now, now]
        );
        console.log(`   ✅ ${account.key} created (id: ${userId})`);
      }

      if (account.key === 'admin') {
        adminUserId = userId;
      }

      console.log(`   📱 ${account.key}: ${account.mobile} / ${account.password}`);

      if (account.role === 'PROVIDER') {
        const profileRes = await client.query('SELECT id FROM "ProviderProfile" WHERE "userId"=$1 LIMIT 1', [userId]);
        if (!profileRes.rows.length) {
          const now = new Date().toISOString();
          await client.query(
            `INSERT INTO "ProviderProfile" (id, "userId", "shopNameAR", "shopNameEN", "locationAddress", "isVisible", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,true,$6,$7)`,
            [makeId(), userId, account.nameAR, account.nameEN, 'Demo provider location', now, now]
          );
        }
      }
    }

    // ── 2. Wallet ─────────────────────────────────────────────────────────
    console.log('\n💰 Ensuring wallet...');
    const walletRes = await client.query('SELECT id FROM "Wallet" WHERE "userId"=$1 LIMIT 1', [adminUserId]);
    if (!walletRes.rows.length) {
      const now = new Date().toISOString();
      await client.query(
        'INSERT INTO "Wallet" (id, "userId", "pendingBalance", "availableBalance", "totalPaid", "isFrozen", "createdAt", "updatedAt") VALUES ($1,$2,0,0,0,false,$3,$4)',
        [makeId(), adminUserId, now, now]
      );
      console.log('   ✅ Wallet created');
    } else {
      console.log('   ✅ Wallet exists');
    }

    // ── 3. Admin Permissions ──────────────────────────────────────────────
    console.log('\n🔑 Ensuring admin permissions...');
    const permissions = [
      'MANAGE_PROVIDERS', 'MANAGE_CUSTOMERS', 'MANAGE_CATALOG', 'MANAGE_CATEGORIES',
      'MANAGE_ORDERS', 'MANAGE_WALLETS', 'MANAGE_SETTINGS', 'MANAGE_SUPPORT',
      'VIEW_ANALYTICS', 'MANAGE_APPROVALS', 'VIEW_LOGS'
    ];
    for (const p of permissions) {
      const r = await client.query(
        'SELECT id FROM "AdminPermission" WHERE "userId"=$1 AND permission=$2 LIMIT 1',
        [adminUserId, p]
      );
      if (!r.rows.length) {
        await client.query(
          'INSERT INTO "AdminPermission" (id, "userId", permission) VALUES ($1,$2,$3)',
          [makeId(), adminUserId, p]
        );
      }
    }
    console.log(`   ✅ ${permissions.length} permissions ensured`);

    // ── 4. Categories ─────────────────────────────────────────────────────
    console.log('\n📂 Ensuring categories...');
    const categories = [
      { nameAR: 'إلكترونيات', nameEN: 'Electronics', slug: 'electronics', icon: 'smartphone', sortOrder: 1 },
      { nameAR: 'أزياء', nameEN: 'Fashion', slug: 'fashion', icon: 'shirt', sortOrder: 2 },
      { nameAR: 'جمال', nameEN: 'Beauty', slug: 'beauty', icon: 'sparkles', sortOrder: 3 },
      { nameAR: 'منزل', nameEN: 'Home', slug: 'home', icon: 'home', sortOrder: 4 },
      { nameAR: 'رياضة', nameEN: 'Sports', slug: 'sports', icon: 'dumbbell', sortOrder: 5 },
      { nameAR: 'طعام', nameEN: 'Food', slug: 'food', icon: 'utensils', sortOrder: 6 },
    ];
    for (const cat of categories) {
      const r = await client.query('SELECT id FROM "Category" WHERE slug=$1 LIMIT 1', [cat.slug]);
      const now = new Date().toISOString();
      if (!r.rows.length) {
        await client.query(
          'INSERT INTO "Category" (id, "nameAR","nameEN",slug,icon,"sortOrder","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8)',
          [makeId(), cat.nameAR, cat.nameEN, cat.slug, cat.icon, cat.sortOrder, now, now]
        );
      }
    }
    console.log('   ✅ Categories ensured');

    // ── 5. System Settings ────────────────────────────────────────────────
    console.log('\n⚙️  Ensuring system settings...');
    const settings = [
      { key: 'requireProviderApproval', value: 'true', description: 'Require admin approval for provider accounts' },
      { key: 'requireCustomerApproval', value: 'true', description: 'Require admin approval for customer accounts' },
      { key: 'allowProviderRegistration', value: 'true', description: 'Allow new providers to register' },
      { key: 'allowCustomerRegistration', value: 'true', description: 'Allow new customers to register' },
      { key: 'defaultLocale', value: 'ar', description: 'Default locale for new users' },
      { key: 'supportedLocales', value: 'ar,en', description: 'Supported locales' },
      { key: 'platformCommission', value: '0', description: 'Platform commission %' },
      { key: 'requirePriceApproval', value: 'true', description: 'Require admin approval for price changes' },
    ];
    for (const s of settings) {
      const r = await client.query('SELECT key FROM "SystemSetting" WHERE key=$1 LIMIT 1', [s.key]);
      const now = new Date().toISOString();
      if (!r.rows.length) {
        await client.query(
          'INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ($1,$2,$3,$4)',
          [s.key, s.value, s.description, now]
        );
      }
    }
    console.log('   ✅ System settings ensured');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('╔══════════════════════════════════════╗');
    console.log('║  DEMO ACCOUNT CREDENTIALS            ║');
    for (const account of demoUsers) {
      console.log(`║  ${account.key.padEnd(10)} ${account.mobile} / ${account.password}   ║`);
    }
    console.log('╚══════════════════════════════════════╝');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
