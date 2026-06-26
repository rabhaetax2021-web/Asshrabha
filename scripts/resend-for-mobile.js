const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([^=]+)=(?:"([^"]*)"|'([^']*)'|(.*))$/)
      if (m) process.env[m[1]] = m[2] ?? m[3] ?? m[4] ?? ''
    }
  }
}

function generateOTP(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

function normalizePhone(mobile) {
  let cleaned = String(mobile).replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = '20' + cleaned.slice(1)
  else if (!cleaned.startsWith('20') && !cleaned.startsWith('+')) {
    if (cleaned.length === 10) cleaned = '20' + cleaned
  }
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned
  return cleaned
}

async function main() {
  loadEnv()
  const mobile = process.argv[2]
  if (!mobile) {
    console.error('Usage: node scripts/resend-for-mobile.js <mobile>')
    process.exit(1)
  }

  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  try {
    const resUser = await db.query('SELECT id FROM "User" WHERE mobile = $1 LIMIT 1', [mobile])
    if (!resUser.rowCount) {
      console.error('No user found for mobile', mobile)
      process.exit(1)
    }
    const userId = resUser.rows[0].id

    // Invalidate old
    await db.query('UPDATE "OTPCode" SET "expiresAt" = $1 WHERE "userId" = $2 AND verified = false', [new Date(), userId])

    const otpLen = parseInt(process.env.OTP_LENGTH || '6', 10)
    const otp = generateOTP(otpLen)
    const id = require('crypto').randomUUID()
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10)
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    await db.query('INSERT INTO "OTPCode"(id, "userId", code, "expiresAt", verified, "createdAt") VALUES($1,$2,$3,$4,false,now())', [id, userId, otp, expiresAt])

    // Send via Meta Graph API using same payload as registration
    const token = process.env.WHATSAPP_META_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'

    if (!token || !phoneId) {
      console.error('Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env')
      process.exit(1)
    }

    const recipient = normalizePhone(mobile)

    const body = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: otp },
              { type: 'text', text: process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha' },
              { type: 'text', text: String(expiryMinutes) },
              { type: 'text', text: process.env.SUPPORT_PHONE || '' },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [ { type: 'text', text: otp } ],
          },
        ],
      },
    }

    console.log('Sending template to', recipient)
    const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const txt = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', txt)
    if (!res.ok) process.exit(1)
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await db.end()
  }
}

main()
