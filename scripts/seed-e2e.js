const { Client } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const { buildAdminOnlySeed } = require('../src/lib/adminSeedData')

function loadEnv() {
  const p = require('path')
  const fs = require('fs')
  const envPath = p.resolve(process.cwd(), '.env')
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
      if (m) return m[1] || m[2] || m[3]
    }
  }
  return undefined
}

async function main(){
  const databaseUrl = loadEnv()
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  // Create minimal tables if they don't exist (for e2e test seeding)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      mobile text UNIQUE,
      "passwordHash" text,
      "nameEN" text,
      "nameAR" text,
      role text,
      status text,
      locale text,
      "createdAt" timestamptz DEFAULT now(),
      "updatedAt" timestamptz DEFAULT now()
    )
  `)
  const ts = Date.now().toString().slice(-6)
  const adminMobile = `900${ts}`
  const adminPass = 'adminpass'

  const adminHash = await bcrypt.hash(adminPass, 10)

  const adminRes = await client.query(
    `INSERT INTO "User" (id, mobile, "passwordHash", "nameEN", "nameAR", role, status, locale, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ROOT_ADMIN', 'APPROVED', 'en', now(), now()) RETURNING id`,
    [adminMobile, adminHash, 'UIAdmin', 'Admin']
  )
  const adminId = adminRes.rows[0].id

  const out = buildAdminOnlySeed({ mobile: adminMobile, password: adminPass, id: adminId })
  fs.mkdirSync('.e2e', { recursive: true })
  fs.writeFileSync('.e2e/seed.json', JSON.stringify(out))
  console.log(JSON.stringify(out))
  await client.end()
}

main().catch(e=>{ console.error(e); process.exit(1) })
