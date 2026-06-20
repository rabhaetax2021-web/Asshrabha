// Dev-only helper: when a provider logs in, ensure each provider has sample listings
// This should only run in non-production environments.
import { env } from 'process'

async function loadEnv() {
  const p = await import('path')
  const fs = await import('fs')
  const envPath = p.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  return content.split('\n').reduce((acc: any, line: string) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/)
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4]
    return acc
  }, {})
}

export async function seedListingsForProviderUser(userId: string) {
  if (process.env.NODE_ENV === 'production') return
  if (!userId) return
  try {
    const { Client } = await import('pg')
    const fs = await import('fs')
    const path = await import('path')
    const e = await loadEnv()
    const connectionString = process.env.DATABASE_URL || e.DATABASE_URL
    if (!connectionString) return
    const client = new Client({ connectionString })
    await client.connect()

    // find provider profile for this user
    const provRes = await client.query('SELECT id FROM "ProviderProfile" WHERE "userId"=$1 LIMIT 1', [userId])
    if (!provRes.rows.length) { await client.end(); return }
    const providerId = provRes.rows[0].id

    // only use catalog products that are ACTIVE (approved)
    const catRes = await client.query('SELECT id, "minimumPrice", "maximumPrice", "nameEN", "nameAR" FROM "CatalogProduct" WHERE status=$1', ['ACTIVE'])
    if (!catRes.rows.length) { await client.end(); return }

    for (const item of catRes.rows) {
      const exists = await client.query('SELECT id FROM "ProviderProduct" WHERE "providerId"=$1 AND "catalogProductId"=$2 LIMIT 1', [providerId, item.id])
      if (exists.rows.length) continue
      const minP = item.minimumPrice || 10
      const maxP = item.maximumPrice || (minP * 1.2)
      const price = Math.round(((minP + maxP) / 2) * 100) / 100
      const stock = Math.floor(Math.random() * 50) + 5
      await client.query('INSERT INTO "ProviderProduct" (id, "providerId", "catalogProductId", "sellingPrice", "stockQuantity", status, "priceApproved", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())', [providerId, item.id, price, stock, 'APPROVED', true])
    }

    await client.end()
  } catch (e) {
    // swallow errors in dev helper
    console.error('[seedOnProviderLogin] error', (e as any)?.message ?? e)
  }
}

export default seedListingsForProviderUser
