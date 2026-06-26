import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^=]+)\s*=\s*(?:"([^"\\]*)"|'([^'\\]*)'|(.*))\s*$/);
    if (match) env[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return env;
}

function normalizePhone(mobile: string) {
  let cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '20' + cleaned.slice(1);
  else if (!cleaned.startsWith('20') && !cleaned.startsWith('+')) {
    if (cleaned.length === 10) cleaned = '20' + cleaned;
  }
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

async function main() {
  const env = loadEnv();
  const token = env.WHATSAPP_META_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = env.WHATSAPP_TEMPLATE_NAME || 'OTP';
  const templateLanguage = env.WHATSAPP_TEMPLATE_LANGUAGE || 'ar_EG';

  const mobile = process.argv[2] || '01094056919';
  const code = process.argv[3] || '123456';

  if (!token || !phoneId) {
    console.error('Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    process.exit(1);
  }

  const recipient = normalizePhone(mobile);
  console.log('Sending template message to', recipient);
  console.log('Template:', templateName);
  console.log('Language:', templateLanguage);

  const payload = {
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
            { type: 'text', text: code },
            { type: 'text', text: env.NEXT_PUBLIC_APP_NAME || 'Asshrabha' },
            { type: 'text', text: env.OTP_EXPIRY_MINUTES || '5 MINUTES' },
            { type: 'text', text: env.SUPPORT_PHONE || '123-456-7890' },
          ],
        },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: code,
                },
              ],
            },
      ],
    },
  };

  const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});