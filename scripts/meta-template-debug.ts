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

async function main() {
  const env = loadEnv();
  const token = env.WHATSAPP_META_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.error('Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    process.exit(1);
  }

  const endpoints = [
    '/me?fields=id,name',
    '/me?fields=businesses{id,name,owned_whatsapp_business_accounts{ id, name, whatsapp_business_accounts{id, name} }}',
    `/${phoneId}?fields=id,name,display_phone_number`,
    `/${phoneId}?fields=id,name,whatsapp_business_account`,
    `/${phoneId}/message_templates?fields=name,status,language,components&limit=50`,
  ];

  for (const ep of endpoints) {
    try {
      const url = `https://graph.facebook.com/v17.0${ep}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      console.log('---', ep, '---');
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Fetch error for', ep, error);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});