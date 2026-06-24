const { Client } = require('pg')
const p = require('path')
const fs = require('fs')
;(async () => {
  let databaseUrl = process.env.DATABASE_URL
  const envPath = p.resolve(process.cwd(), '.env')
  if (!databaseUrl && fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
      if (m) { databaseUrl = m[1] || m[2] || m[3]; break }
    }
  }
  if (!databaseUrl) { console.error('No DATABASE_URL'); process.exit(1) }
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const res = await client.query('SELECT id, "shopNameEN", "userId", "createdAt" FROM "ProviderProfile" ORDER BY "createdAt" DESC LIMIT 10')
    console.log('rows:', JSON.stringify(res.rows, null, 2))
  } catch (e) {
    console.error('query error', e)
  }
  try {
    const t = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%provider%';")
    console.log('tables:', JSON.stringify(t.rows, null, 2))
  } catch (e) {
    console.error('tables query error', e)
  }
  await client.end()
})()
