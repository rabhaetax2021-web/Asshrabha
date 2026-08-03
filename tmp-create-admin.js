const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
let databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl && fs.existsSync(envPath)) {
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/);
    if (m) {
      databaseUrl = m[1] || m[2] || m[3];
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile text UNIQUE,
        "passwordHash" text,
        "nameEN" text,
        "nameAR" text,
        role text,
        status text,
        locale text,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now(),
        "forcePasswordReset" boolean DEFAULT false,
        "customerType" text
      )
    `);

    const hash = await bcrypt.hash('2463', 10);
    const res = await client.query(
      `INSERT INTO "User" (id, mobile, "passwordHash", "nameEN", "nameAR", role, status, locale, "createdAt", "updatedAt", "forcePasswordReset", "customerType")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ROOT_ADMIN', 'APPROVED', 'en', now(), now(), false, 'CUSTOMER')
       ON CONFLICT (mobile) DO UPDATE SET
         "passwordHash" = EXCLUDED."passwordHash",
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         "forcePasswordReset" = EXCLUDED."forcePasswordReset"
       RETURNING id, mobile, role, status`,
      ['01094056919', hash, 'System Admin', 'مدير النظام']
    );

    console.log(JSON.stringify(res.rows[0]));
  } finally {
    await client.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
