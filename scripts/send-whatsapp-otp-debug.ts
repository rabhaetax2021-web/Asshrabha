import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^#\n]*))\s*$/);
    if (match) {
      const key = match[1];
      const value = match[2] ?? match[3] ?? match[4] ?? '';
      process.env[key] = value.trim();
    }
  }
}

function normalizePhoneToE164(mobile: string) {
  let cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '20' + cleaned.slice(1);
  else if (!cleaned.startsWith('20') && !cleaned.startsWith('+')) {
    if (cleaned.length === 10) cleaned = '20' + cleaned;
  }
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

async function main() {
  loadEnv();
  const mobileArg = process.argv[2] || '01094056919';
  const mobile = mobileArg.trim();

  const token = process.env.WHATSAPP_META_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.error('Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const userRes = await client.query('SELECT id, mobile FROM "User" WHERE mobile = $1 LIMIT 1', [mobile]);
    if (!userRes.rowCount) {
      console.error('User not found for mobile', mobile);
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    const otpRes = await client.query(
      'SELECT code, "expiresAt", verified FROM "OTPCode" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [userId]
    );
    if (!otpRes.rowCount) {
      console.error('No OTP found for user', userId);
      process.exit(1);
    }
    const otp = otpRes.rows[0];
    const recipient = normalizePhoneToE164(mobile);
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Asshrabha';
    const supportNumber = process.env.SUPPORT_PHONE || '123-456-7890';
    const body = `رمز التحقق الخاص بك هو ${otp.code}. لا تشارك هذا الرمز مع أي شخص. صالح لمدة ${process.env.OTP_EXPIRY_MINUTES || '5'} دقائق.`;

    console.log('Sending WhatsApp OTP directly via Meta Graph API');
    console.log('Recipient:', recipient);
    console.log('Phone ID:', phoneId);
    console.log('OTP code:', otp.code);

    const payload = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'text',
      text: { body },
    };

    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);

    if (!response.ok) {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Send failed:', err);
  process.exit(1);
});
