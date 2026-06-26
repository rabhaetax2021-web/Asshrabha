const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
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
  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    
    const templateValue = 'OTP Code: {{1}}. This is your OTP for {{2}}. The OTP is valid for {{3}} minutes. Call {{4}} if you did not perform this request. For your security, do not share this code.\nExpires in {{3}} minutes.'
    
    await client.query(`
      INSERT INTO "SystemSetting" (key, value, description, "updatedAt")
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()
    `, ['otp_en', templateValue, 'WhatsApp OTP template EN (placeholders: {{1}}=code, {{2}}=app_name, {{3}}=expiry_minutes, {{4}}=support_number)'])
    
    console.log('✅ otp_en template seeded successfully!')
    
    const res = await client.query(`SELECT key, value FROM "SystemSetting" ORDER BY key`)
    console.log('\n=== Updated SystemSetting Records ===\n')
    for (const row of res.rows) {
      console.log(`Key: ${row.key}`)
      console.log(`Value: ${row.value?.substring(0, 100)}${row.value?.length > 100 ? '...' : ''}`)
      console.log(`---`)
    }
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
