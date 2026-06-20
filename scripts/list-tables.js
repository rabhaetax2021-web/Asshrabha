const { Client } = require('pg')
const fs = require('fs')
function loadEnv() {
  const p = require('path')
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
  const res = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name`)
  console.log(res.rows.slice(0,200))
  await client.end()
}

main().catch(e=>{ console.error(e); process.exit(1) })
