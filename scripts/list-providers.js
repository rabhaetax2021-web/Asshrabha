const fs = require('fs')
const { Client } = require('pg')
function loadEnv() {
  const envPath = require('path').resolve(process.cwd(), '.env')
  if (process.env.DATABASE_URL) return
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
      if (m) { process.env.DATABASE_URL = m[1] || m[2] || m[3]; break }
    }
  }
}

async function main() {
  loadEnv()
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const res = await client.query(`SELECT u.id, u.mobile, u."nameEN" as nameEN, u.status, p.id as "providerId", p."shopNameEN" as shopNameEN, p."createdAt" FROM "User" u JOIN "ProviderProfile" p ON p."userId" = u.id ORDER BY p."createdAt" DESC LIMIT 20`)
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (e) {
    console.error('DB error', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
