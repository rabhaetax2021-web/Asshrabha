const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

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
    console.error('Usage: node scripts/check-login.js <mobile> <password>')
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
    const res = await client.query('SELECT id, mobile, "passwordHash" FROM "User" WHERE mobile = $1', [mobile])
    if (!res.rowCount) {
      console.log('NO_USER')
      return
    }
    const user = res.rows[0]
    console.log('FOUND', user.id, user.mobile)
    console.log('HASH:', user.passwordhash || user.passwordHash || '<none>')
    const ok = await bcrypt.compare(password, user.passwordhash || user.passwordHash)
    console.log('BCRYPT_OK:', ok)
  } catch (e) {
    console.error(e)
  } finally {
    await client.end()
  }
}

main()
