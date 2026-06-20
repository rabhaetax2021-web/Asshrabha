const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  return content.split('\n').reduce((acc, line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/)
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4]
    return acc
  }, {})
}

async function main() {
  const env = loadEnv()
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment or .env')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query('BEGIN')

    console.log('👤 Creating/updating root admin user...')
    const passwordHash = await bcrypt.hash('2463', 12)
    const mobile = '01094056919'
    const userRes = await client.query(
      'SELECT id FROM "User" WHERE mobile=$1 LIMIT 1',
      [mobile]
    )
    let userId
    const makeId = () => `seed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`
    if (userRes.rows.length) {
      userId = userRes.rows[0].id
      await client.query(
        'UPDATE "User" SET "passwordHash"=$1, "nameAR"=$2, "nameEN"=$3, role=$4, status=$5, "forcePasswordReset"=$6, locale=$7 WHERE id=$8',
        [passwordHash, 'مدير النظام', 'System Admin', 'ROOT_ADMIN', 'APPROVED', false, 'ar', userId]
      )
      console.log('   ✅ Admin user updated')
    } else {
      const newid = makeId()
        const now = new Date().toISOString()
      const insert = await client.query(
          'INSERT INTO "User" (id, mobile, "passwordHash", "nameAR", "nameEN", role, status, "forcePasswordReset", locale, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
          [newid, mobile, passwordHash, 'مدير النظام', 'System Admin', 'ROOT_ADMIN', 'APPROVED', false, 'ar', now, now]
      )
      userId = insert.rows[0].id
      console.log('   ✅ Admin user created:', userId)
    }

    console.log('💰 Ensuring admin wallet exists...')
    const walletRes = await client.query('SELECT id FROM "Wallet" WHERE "userId"=$1 LIMIT 1', [userId])
    if (!walletRes.rows.length) {
      const wid = makeId()
      const now = new Date().toISOString()
      await client.query('INSERT INTO "Wallet" (id, "userId", "pendingBalance", "availableBalance", "totalPaid", "isFrozen", "createdAt", "updatedAt") VALUES ($1,$2,0,0,0,false,$3,$4)', [wid, userId, now, now])
      console.log('   ✅ Admin wallet created')
    } else {
      console.log('   ✅ Admin wallet exists')
    }

    console.log('🔑 Creating admin permissions...')
    const permissions = [
      'MANAGE_PROVIDERS','MANAGE_CUSTOMERS','MANAGE_CATALOG','MANAGE_CATEGORIES','MANAGE_ORDERS','MANAGE_WALLETS','MANAGE_SETTINGS','MANAGE_SUPPORT','VIEW_ANALYTICS','MANAGE_APPROVALS','VIEW_LOGS'
    ]
    for (const p of permissions) {
      const r = await client.query('SELECT id FROM "AdminPermission" WHERE "userId"=$1 AND permission=$2 LIMIT 1', [userId, p])
      if (!r.rows.length) {
        await client.query('INSERT INTO "AdminPermission" (id, "userId", permission) VALUES ($1,$2,$3)', [makeId(), userId, p])
      }
    }
    console.log(`   ✅ ${permissions.length} permissions ensured`)

    console.log('📂 Creating categories...')
    const categories = [
      { nameAR: 'إلكترونيات', nameEN: 'Electronics', slug: 'electronics', icon: 'smartphone', sortOrder: 1 },
      { nameAR: 'أزياء', nameEN: 'Fashion', slug: 'fashion', icon: 'shirt', sortOrder: 2 },
      { nameAR: 'جمال', nameEN: 'Beauty', slug: 'beauty', icon: 'sparkles', sortOrder: 3 },
      { nameAR: 'منزل', nameEN: 'Home', slug: 'home', icon: 'home', sortOrder: 4 },
      { nameAR: 'رياضة', nameEN: 'Sports', slug: 'sports', icon: 'dumbbell', sortOrder: 5 },
      { nameAR: 'طعام', nameEN: 'Food', slug: 'food', icon: 'utensils', sortOrder: 6 },
    ]
    for (const cat of categories) {
      const r = await client.query('SELECT id FROM "Category" WHERE slug=$1 LIMIT 1', [cat.slug])
      if (!r.rows.length) {
        const cid = makeId()
        const now = new Date().toISOString()
        await client.query('INSERT INTO "Category" (id, "nameAR","nameEN",slug,icon,"sortOrder", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8)', [cid, cat.nameAR, cat.nameEN, cat.slug, cat.icon, cat.sortOrder, now, now])
      } else {
        const now = new Date().toISOString()
        await client.query('UPDATE "Category" SET "nameAR"=$1, "nameEN"=$2, icon=$3, "sortOrder"=$4, "isActive"=true, "updatedAt"=$5 WHERE slug=$6', [cat.nameAR, cat.nameEN, cat.icon, cat.sortOrder, now, cat.slug])
      }
    }
    console.log('   ✅ Categories ensured')

    console.log('⚙️  Creating system settings...')
    const settings = [
      { key: 'requireProviderApproval', value: 'true', description: 'Require admin approval before a provider account becomes active' },
      { key: 'requireCustomerApproval', value: 'true', description: 'Require admin approval before a customer account becomes active' },
      { key: 'allowProviderRegistration', value: 'true', description: 'Allow new providers to register on the platform' },
      { key: 'allowCustomerRegistration', value: 'true', description: 'Allow new customers to register on the platform' },
      { key: 'defaultLocale', value: 'ar', description: 'Default locale for new users' },
      { key: 'supportedLocales', value: 'ar,en', description: 'Comma-separated list of supported locales' },
      { key: 'platformCommission', value: '0', description: 'Platform commission percentage on each order (0-100)' },
      { key: 'requirePriceApproval', value: 'true', description: 'Require admin approval when a provider sets or changes a product price' },
    ]
    for (const s of settings) {
      const r = await client.query('SELECT key FROM "SystemSetting" WHERE key=$1 LIMIT 1', [s.key])
      const now = new Date().toISOString()
      if (!r.rows.length) {
        await client.query('INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ($1,$2,$3,$4)', [s.key, s.value, s.description, now])
      } else {
        await client.query('UPDATE "SystemSetting" SET value=$1, description=$2, "updatedAt"=$3 WHERE key=$4', [s.value, s.description, now, s.key])
      }
    }
    console.log('   ✅ System settings ensured')

    await client.query('COMMIT')
    console.log('\n🎉 Seed (pg) completed successfully!')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', e)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
