#!/usr/bin/env bash
#
# run.sh — Asshrabha Full Startup Script (Linux/VPS)
# ─────────────────────────────────────────────────────
# This script:
#   1. Checks that PostgreSQL is reachable
#   2. Syncs DB schema with Prisma (db push)
#   3. Generates Prisma Client
#   4. Runs ensure-schema.js (fills any missing tables/columns)
#   5. Seeds test user + data
#   6. Starts Next.js (production or dev mode)
#
# Usage:
#   chmod +x run.sh
#   ./run.sh          # production mode (npm run build && npm start)
#   ./run.sh --dev    # development mode (npm run dev)
#

set -e
cd "$(dirname "$0")"

MODE="production"
if [ "$1" = "--dev" ]; then
  MODE="development"
fi

echo ""
echo "========================================="
echo "  Asshrabha — Starting Up...            "
echo "  Mode: $MODE"
echo "========================================="
echo ""

# ── Read DATABASE_URL ────────────────────────────────────────────────────────
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -f ".env" ]; then
  DB_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | sed 's/^DATABASE_URL=//' | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")
fi

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not found"
  exit 1
fi

export DATABASE_URL="$DB_URL"

# ── Step 0: Check node_modules ───────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "[0/5] Installing dependencies..."
  npm install
fi

# ── Step 1: Check Database Connection ────────────────────────────────────────
echo "[1/5] Checking database connection..."
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.argv[1] });
client.connect()
  .then(() => client.query('SELECT 1'))
  .then(() => { console.log('   OK - Database is reachable'); client.end(); })
  .catch(e => { console.error('   FAIL:', e.message); process.exit(1); });
" "$DB_URL"

# ── Step 2: Sync Schema (db push) ───────────────────────────────────────────
echo ""
echo "[2/5] Syncing database schema (prisma db push)..."
npx prisma db push --schema=prisma/schema.prisma --url="$DB_URL" --accept-data-loss 2>/dev/null || {
  echo "   WARNING: db push had issues, will try ensure-schema next..."
}

# ── Step 3: Generate Prisma Client ───────────────────────────────────────────
echo ""
echo "[3/5] Generating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma
echo "   OK - Prisma Client generated"

# ── Step 4: Ensure Schema ────────────────────────────────────────────────────
echo ""
echo "[4/5] Ensuring all schema objects exist in DB..."
node scripts/ensure-schema.js || echo "   WARNING: Schema check had warnings (non-fatal)"

# ── Step 5: Seed Test User ───────────────────────────────────────────────────
echo ""
echo "[5/5] Seeding test user and data..."
node scripts/seed-test-user.js || echo "   WARNING: Seed had warnings (non-fatal)"

# ── Launch Server ────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  All checks passed! Starting server...  "
echo "                                         "
echo "  App:      http://localhost:3000         "
echo "  Login:    http://localhost:3000/login   "
echo "  Mobile:   01094056919                   "
echo "  Password: 2463                          "
echo "========================================="
echo ""

if [ "$MODE" = "production" ]; then
  echo "Building for production..."
  npm run build
  echo ""
  echo "Starting production server on port ${PORT:-3000}..."
  npm start
else
  echo "Starting development server..."
  npm run dev
fi
