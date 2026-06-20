/**
 * seeds provider products for the first provider profile found
 * Usage: node scripts/seed-provider-products.js
 * Requires DATABASE_URL in env or .env
 */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  return content.split('\n').reduce((acc, line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))$/)
    if (m) acc[m[1]] = m[2] ?? m[3] ?? m[4]
    return acc
  }, {})
}

async function main() {
  const env = loadEnv()
  const connectionString = process.env.DATABASE_URL || env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()
  try {
    // find first provider profile
    const provRes = await client.query('SELECT id FROM "ProviderProfile" LIMIT 1')
    if (!provRes.rows.length) {
      console.error('❌ No provider profile found. Create one first or run debug seed API.')
      process.exit(1)
    }
    const providerId = provRes.rows[0].id
    console.log('✅ Found provider:', providerId)

    // get active catalog products
    const catRes = await client.query('SELECT id, "nameEN", "nameAR", "minimumPrice", "maximumPrice" FROM "CatalogProduct" WHERE status=$1 ORDER BY "createdAt" DESC LIMIT 8', ['ACTIVE'])
    if (!catRes.rows.length) {
      console.error('❌ No active catalog products found to seed provider listings')
      process.exit(1)
    }

    for (const item of catRes.rows) {
      const exists = await client.query('SELECT id FROM "ProviderProduct" WHERE "providerId"=$1 AND "catalogProductId"=$2 LIMIT 1', [providerId, item.id])
      if (exists.rows.length) {
        console.log('   ↺ exists:', item.nameEN || item.nameAR)
        continue
      }

      const minP = item.minimumPrice || 10
      const maxP = item.maximumPrice || (minP * 1.2)
      const price = Math.round(((minP + maxP) / 2) * 100) / 100
      const stock = Math.floor(Math.random() * 50) + 5

      await client.query('INSERT INTO "ProviderProduct" (id, "providerId", "catalogProductId", "sellingPrice", "stockQuantity", status, "priceApproved", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now(), now())', [providerId, item.id, price, stock, 'APPROVED', true])
      console.log('   ➕ created listing for', item.nameEN || item.nameAR)
    }

    console.log('\n🎉 Provider products seeded successfully')
  } catch (e) {
    console.error('❌ Seed provider products failed:', e)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
