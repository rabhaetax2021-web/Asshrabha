const fs = require('fs')
const { Pool } = require('pg')

async function main() {
  const txt = fs.existsSync('data/hero-slides.json') ? fs.readFileSync('data/hero-slides.json', 'utf8') : '[]'
  const slides = JSON.parse(txt || '[]')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Please set DATABASE_URL env var')
    process.exit(1)
  }
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]
      const id = s.id || null
      await client.query(
        `INSERT INTO "Slider"(id, image, type, "targetId", caption, position, visible, amount, "createdAt", "updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,$8,now(),now()) ON CONFLICT (id) DO UPDATE SET image=EXCLUDED.image, type=EXCLUDED.type, "targetId"=EXCLUDED."targetId", caption=EXCLUDED.caption, position=EXCLUDED.position, visible=EXCLUDED.visible, amount=EXCLUDED.amount, "updatedAt"=now()`,
        [id, s.image || null, s.type || 'custom', s.targetId || null, s.caption || null, typeof s.position === 'number' ? s.position : i, typeof s.visible === 'boolean' ? s.visible : true, typeof s.amount === 'number' ? s.amount : null]
      )
    }
    await client.query('COMMIT')
    console.log('Imported', slides.length, 'slides')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
