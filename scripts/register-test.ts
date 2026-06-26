import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

type Env = Record<string, string>;

function loadEnv(): Env {
  const envPath = path.resolve(process.cwd(), '.env');
  const env: Env = {};
  if (!fs.existsSync(envPath)) {
    console.error('.env not found');
    return env;
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(?:"([^"\\]*)"|'([^'\\]*)'|(.*))\s*$/);
    if (match) {
      env[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
    }
  }
  Object.assign(process.env, env);
  return env;
}

async function findLocationId() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL missing');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const res = await client.query('SELECT id FROM "Location" LIMIT 1');
    if (res.rowCount === 0) throw new Error('No Location rows found in database');
    return res.rows[0].id;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    loadEnv();
    const locationId = await findLocationId();
    const { registerAction } = await import('../src/lib/actions/auth.actions');
    const mobileArg = process.argv[2] || '01094056919'
    const result = await registerAction({
      mobile: mobileArg,
      password: '2463',
      nameAR: 'Test User',
      nameEN: 'Test User',
      role: 'CUSTOMER',
      locationAddress: 'Test Address',
      locationId,
    });
    console.log('registerAction result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('register-test error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && (error as any).stack) console.error((error as any).stack);
  }
}

main();
