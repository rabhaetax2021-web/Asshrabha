import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) {
    console.log('.env file not found');
    return env;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(?:"([^"\\]*)"|'([^'\\]*)'|(.*))\s*$/);
    if (match) {
      env[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  console.log('Loaded env keys:', Object.keys(env).filter((k) => k.startsWith('DATABASE_') || k.startsWith('WHATSAPP_') || k === 'NEXTAUTH_URL' || k === 'DATABASE_URL'));
  console.log('DATABASE_URL:', env.DATABASE_URL ? env.DATABASE_URL.replace(/(postgresql:\/\/[^:]+:)[^@]+@/, '$1****@') : 'MISSING');

  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL missing from .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: env.DATABASE_URL });
  try {
    await client.connect();
    console.log('DB CONNECTED');
    const res = await client.query('SELECT 1 AS ok');
    console.log('Query result:', res.rows);
  } catch (error) {
    console.error('DB CONNECT ERROR:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
