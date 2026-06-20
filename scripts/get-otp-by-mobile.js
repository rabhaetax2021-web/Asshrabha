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
  const mobile = process.argv[2]
  if (!mobile) {
    console.error('Usage: node scripts/get-otp-by-mobile.js <mobile>')
    process.exit(1)
  }

  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const resUser = await client.query('SELECT id FROM "User" WHERE mobile = $1 LIMIT 1', [mobile])
    if (!resUser.rowCount) {
      console.log('No user found for mobile', mobile)
      return
    }
    const userId = resUser.rows[0].id

    const resOtp = await client.query('SELECT code, "expiresAt", verified, "createdAt" FROM "OTPCode" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1', [userId])
    if (!resOtp.rowCount) {
      console.log('No OTP records found for user', userId)
    } else {
      const otp = resOtp.rows[0]
      console.log('Latest OTP for', mobile, '=>', otp.code)
      console.log('expiresAt:', otp.expiresAt)
      console.log('verified:', otp.verified)
      console.log('createdAt:', otp.createdAt)
    }
  } catch (e) {
    console.error('Error querying OTP:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
