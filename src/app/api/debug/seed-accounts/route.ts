import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { buildAdminOnlySeed } from '@/lib/adminSeedData'

export const runtime = 'nodejs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  // Prefer local seed file if present (useful during dev/test)
  try {
    const fs = await import('fs')
    const p = await import('path')
    const seedPath = p.resolve(process.cwd(), '.e2e', 'seed.json')
    if (fs.existsSync(seedPath)) {
      const txt = fs.readFileSync(seedPath, 'utf8')
      return NextResponse.json(JSON.parse(txt))
    }
  } catch (e) {
    // ignore and fall back to DB seeding
  }

  const ts = Date.now().toString().slice(-6)
  const adminMobile = `900${ts}`
  const adminPass = 'adminpass'

  const adminHash = await bcrypt.hash(adminPass, 10)
  // Try using Prisma first, but if Prisma isn't available (dev/Turbopack issues),
  // fall back to direct PG queries that create minimal tables and seed the admin/provider.
  try {
    const { prisma } = await import('@/lib/prisma')
    const admin = await prisma.user.create({ data: { mobile: adminMobile, passwordHash: adminHash, nameEN: 'UIAdmin', nameAR: 'Admin', role: 'ROOT_ADMIN', status: 'APPROVED', locale: 'en' } })

    const out = buildAdminOnlySeed({ mobile: adminMobile, password: adminPass, id: admin.id })
    // persist seed file for faster subsequent runs
    try {
      const fs = await import('fs')
      const p = await import('path')
      const seedPath = p.resolve(process.cwd(), '.e2e')
      fs.mkdirSync(seedPath, { recursive: true })
      fs.writeFileSync(p.resolve(seedPath, 'seed.json'), JSON.stringify(out))
    } catch (e) {
      // ignore file write errors
    }

    return NextResponse.json(out)
  } catch (prismaErr) {
    // Prisma failed — fall back to direct PG seeding
    try {
      const { Client } = await import('pg')
      const path = (await import('path')).resolve(process.cwd(), '.env')
      // simple env loader — prefer DATABASE_URL from env
      let databaseUrl = process.env.DATABASE_URL
      try {
        const fs = await import('fs')
        if (!databaseUrl && fs.existsSync(path)) {
          const txt = fs.readFileSync(path, 'utf8')
          for (const line of txt.split(/\r?\n/)) {
            const m = line.match(/^DATABASE_URL\s*=\s*(?:"([^"]+)"|'([^']+)'|(.*))$/)
            if (m) { databaseUrl = m[1] || m[2] || m[3]; break }
          }
        }
      } catch (e) {}

      if (!databaseUrl) return NextResponse.json({ error: 'No DATABASE_URL' }, { status: 500 })

      const client = new Client({ connectionString: databaseUrl })
      await client.connect()

      // Ensure pgcrypto for gen_random_uuid()
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
      } catch (e) {}

      // Create minimal tables if they don't exist (safe for E2E)
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
          "updatedAt" timestamptz DEFAULT now()
        )
      `)

      await client.query(`
        CREATE TABLE IF NOT EXISTS "ProviderProfile" (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" uuid UNIQUE,
          "shopNameEN" text,
          "shopNameAR" text,
          "isVisible" boolean DEFAULT false,
          "createdAt" timestamptz DEFAULT now(),
          "updatedAt" timestamptz DEFAULT now()
        )
      `)

      const adminRes = await client.query(
        `INSERT INTO "User" (id, mobile, "passwordHash", "nameEN", "nameAR", role, status, locale, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ROOT_ADMIN', 'APPROVED', 'en', now(), now()) ON CONFLICT (mobile) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash" RETURNING id`,
        [adminMobile, adminHash, 'UIAdmin', 'Admin']
      )
      const adminId = adminRes.rows[0].id

      const out = buildAdminOnlySeed({ mobile: adminMobile, password: adminPass, id: adminId })
      try {
        const fs = await import('fs')
        const p = await import('path')
        const seedDir = p.resolve(process.cwd(), '.e2e')
        fs.mkdirSync(seedDir, { recursive: true })
        fs.writeFileSync(p.resolve(seedDir, 'seed.json'), JSON.stringify(out))
      } catch (e) {}

      await client.end()
      return NextResponse.json(out)
    } catch (pgErr) {
      console.error('Seed error', prismaErr, pgErr)
      return NextResponse.json({ error: 'SEED_FAILED' }, { status: 500 })
    }
  }
}
