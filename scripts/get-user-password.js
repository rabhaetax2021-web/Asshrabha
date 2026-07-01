#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return

  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/)
      if (m) {
        const key = m[1]
        const value = m[2] || m[3] || m[4]
        if (value && !process.env[key]) {
          process.env[key] = value.trim()
        }
      }
    }
  }
}

loadEnv()

async function main() {
  const mobile = process.argv[2] || '01091201789'
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!conn) {
    console.error('No DATABASE_URL or POSTGRES_URL found in environment.')
    process.exit(1)
  }

  const client = new Client({ connectionString: conn })

  try {
    await client.connect()
    const res = await client.query(
      'SELECT id, mobile, "passwordHash", role, status FROM "User" WHERE mobile = $1',
      [mobile]
    )

    if (res.rows.length === 0) {
      console.log(JSON.stringify({ mobile, found: false }, null, 2))
      return
    }

    console.log(JSON.stringify(res.rows[0], null, 2))
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
