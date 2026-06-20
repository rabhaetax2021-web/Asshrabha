const { Client } = require('pg')
const fs = require('fs')

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
  if (!fs.existsSync('.e2e/seed.json')) {
    console.log('no seed file')
    return
  }
  const data = JSON.parse(fs.readFileSync('.e2e/seed.json','utf8'))
  const { admin, provider } = data
  if (provider && provider.id) {
    const prov = await client.query(`SELECT * FROM "ProviderProfile" WHERE id = $1`, [provider.id])
    if (prov.rowCount) {
      const provRow = prov.rows[0]
      await client.query(`DELETE FROM "Notification" WHERE "userId" = $1`, [provRow.userId]).catch(()=>{})
      await client.query(`DELETE FROM "AuditLog" WHERE "entityId" = $1`, [provider.id]).catch(()=>{})
      await client.query(`DELETE FROM "ProviderProfile" WHERE id = $1`, [provider.id]).catch(()=>{})
      await client.query(`DELETE FROM "User" WHERE id = $1`, [provRow.userId]).catch(()=>{})
    }
  }
  if (provider?.mobile) await client.query(`DELETE FROM "User" WHERE mobile = $1`, [provider.mobile]).catch(()=>{})
  if (admin?.mobile) await client.query(`DELETE FROM "User" WHERE mobile = $1`, [admin.mobile]).catch(()=>{})
  fs.rmSync('.e2e/seed.json', { force: true })
  await client.end()
}

main().catch(e=>{ console.error(e); process.exit(1) })
