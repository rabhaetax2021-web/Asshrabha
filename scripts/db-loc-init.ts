import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(?:"([^"\\]*)"|'([^'\\]*)'|(.*))\s*$/);
    if (match) env[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return env;
}

async function main() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    const locRes = await client.query('SELECT id, "nameEN", "nameAR" FROM "Location" LIMIT 1');
    let locationId: string;

    if (locRes.rowCount === 0) {
      const insertRes = await client.query(
        'INSERT INTO "Location" (id, "nameAR", "nameEN", "createdAt", "updatedAt") VALUES (md5(random()::text || clock_timestamp()::text), $1, $2, now(), now()) RETURNING id',
        ['اختبار', 'Test Location']
      );
      locationId = insertRes.rows[0].id;
      console.log('Inserted Location:', locationId);
    } else {
      locationId = locRes.rows[0].id;
      console.log('Existing Location:', locRes.rows[0]);
    }

    const settingsRes = await client.query('SELECT key, value FROM "SystemSetting" WHERE key IN ($1, $2)', [
      'allowProviderRegistration',
      'allowCustomerRegistration',
    ]);
    const settings = Object.fromEntries(settingsRes.rows.map((row: any) => [row.key, row.value]));
    console.log('Registration settings:', settings);

    if (settings.allowCustomerRegistration !== 'true') {
      await client.query(
        'INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ($1, $2, $3, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()',
        ['allowCustomerRegistration', 'true', 'Allow new customers to register on the platform']
      );
      console.log('Enabled allowCustomerRegistration');
    }

    console.log('Use this locationId for registration:', locationId);
  } catch (error) {
    console.error('DB loc init error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
