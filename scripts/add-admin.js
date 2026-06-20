const { Client } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

async function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
      if (m) return m[1] || m[2] || m[3]
    }
  }
  return undefined
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: node scripts/add-admin.js <mobile> <password>')
    process.exit(1)
  }
  const [mobile, password] = args
  const databaseUrl = await loadEnv()
  if (!databaseUrl) {
    console.error('DATABASE_URL not found')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto")
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

    const hash = await bcrypt.hash(password, 10)
    const res = await client.query(
      `INSERT INTO "User" (id, mobile, "passwordHash", "nameEN", "nameAR", role, status, locale, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ROOT_ADMIN', 'APPROVED', 'en', now(), now()) ON CONFLICT (mobile) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role, status = EXCLUDED.status RETURNING id`,
      [mobile, hash, 'AutoAdmin', 'AutoAdmin']
    )
    const adminId = res.rows[0].id

    // update .e2e/seed.json preserving provider if present
    const seedPath = path.resolve(process.cwd(), '.e2e', 'seed.json')
    let seed = { admin: { mobile, password }, provider: null }
    if (fs.existsSync(seedPath)) {
      try {
        const cur = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
        seed.provider = cur.provider || null
      } catch (e) {}
    }
    fs.mkdirSync(path.dirname(seedPath), { recursive: true })
    fs.writeFileSync(seedPath, JSON.stringify(seed))

    console.log(JSON.stringify({ admin: { mobile, password, id: adminId } }))
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
