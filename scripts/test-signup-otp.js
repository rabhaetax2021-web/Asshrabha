/**
 * Test script for signup OTP flow
 * Usage: node scripts/test-signup-otp.js <mobile> <password>
 */
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (process.env.DATABASE_URL) return

  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      // Load all env variables
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/)
      if (m) {
        const key = m[1]
        const value = m[2] || m[3] || m[4]
        if (value && !process.env[key]) {
          process.env[key] = value.trim()
        }
      }
    }
  }
}

loadEnv()

async function main() {
  const mobile = process.argv[2]
  const password = process.argv[3]

  if (!mobile || !password) {
    console.error('Usage: node scripts/test-signup-otp.js <mobile> <password>')
    console.error('Example: node scripts/test-signup-otp.js +201091201789 password123')
    process.exit(1)
  }

  console.log('📱 Testing Signup OTP Flow')
  console.log('─'.repeat(50))
  console.log('Mobile:', mobile)
  console.log('')

  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()
    console.log('✓ Connected to database')
    console.log('')

    // Check if user already exists
    const existing = await client.query('SELECT id, mobile FROM "User" WHERE mobile = $1', [mobile])
    if (existing.rowCount > 0) {
      console.log('⚠️  User already exists with mobile:', mobile)
      const userId = existing.rows[0].id
      console.log('UserId:', userId)
      
      // Get their latest OTP
      const otpRes = await client.query(
        'SELECT code, "expiresAt", verified FROM "OTPCode" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        [userId]
      )
      if (otpRes.rowCount > 0) {
        const otp = otpRes.rows[0]
        console.log('')
        console.log('Latest OTP:')
        console.log('  Code:', otp.code)
        console.log('  Expires:', new Date(otp.expiresAt).toISOString())
        console.log('  Verified:', otp.verified)
      }
      return
    }

    // Test WhatsApp configuration
    console.log('WhatsApp Configuration:')
    console.log('  Provider:', process.env.WHATSAPP_PROVIDER || 'NOT SET')
    console.log('  Token:', process.env.WHATSAPP_META_TOKEN ? '✓ SET' : '✗ NOT SET')
    console.log('  Phone ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || '✗ NOT SET')
    console.log('')

    // Test phone number format
    console.log('Phone Number Analysis:')
    const rawMobile = mobile
    const hasPlus = rawMobile.startsWith('+')
    const cleaned = rawMobile.replace(/\D/g, '')
    console.log('  Original:', rawMobile)
    console.log('  Has +:', hasPlus ? 'Yes' : 'No (WhatsApp may require +)')
    console.log('  Cleaned:', cleaned)
    console.log('  Length:', cleaned.length)
    console.log('')

    // Show what would be sent to WhatsApp
    console.log('WhatsApp Send Preview:')
    console.log('  Endpoint: https://graph.facebook.com/v17.0/' + (process.env.WHATSAPP_PHONE_NUMBER_ID || '{PHONE_ID}') + '/messages')
    console.log('  To (recipient):', rawMobile)
    console.log('  Message Type: text')
    console.log('')

    console.log('To complete signup OTP test:')
    console.log('1. In your browser, go to: http://localhost:3000/register')
    console.log('2. Choose account type (Customer or Provider)')
    console.log('3. Enter mobile:', mobile)
    console.log('4. Enter password:', password)
    console.log('5. Fill in required fields')
    console.log('6. Submit to register')
    console.log('')
    console.log('Then run to check OTP:')
    console.log('  node scripts/get-otp-by-mobile.js', mobile)
    console.log('')

  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
