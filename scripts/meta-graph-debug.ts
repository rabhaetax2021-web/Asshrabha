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

async function fetchJson(endpoint: string, token: string) {
  const res = await fetch(`https://graph.facebook.com/v17.0${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch { data = body; }
  return { status: res.status, data };
}

async function main() {
  const env = loadEnv();
  const token = env.WHATSAPP_META_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.error('Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    process.exit(1);
  }

  const endpoints = [
    '/me?fields=id,name',
    '/me?fields=accounts{access_token,id,name,category}',
    '/me?fields=businesses{id,name}',
    `/me?fields=businesses{id,name,owned_whatsapp_business_accounts{ id, name }}`,
    `/${phoneId}?fields=id,display_phone_number,phone_number,quality_rating`,
    `/${phoneId}?fields=id,display_phone_number,whatsapp_business_account`,
  ];

  for (const endpoint of endpoints) {
    const result = await fetchJson(endpoint, token);
    console.log('---', endpoint, '---');
    console.log('status:', result.status);
    console.log(JSON.stringify(result.data, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});