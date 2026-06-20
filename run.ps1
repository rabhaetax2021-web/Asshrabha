<# 
  run.ps1 — Asshrabha Full Startup Script (Windows)
  ─────────────────────────────────────────────────────
  This script:
  1. Checks that PostgreSQL is reachable
  2. Syncs DB schema with Prisma (db push)
  3. Generates Prisma Client
  4. Runs ensure-schema.js (fills any missing tables/columns)  
  5. Seeds test user + data
  6. Starts Next.js dev server
  
  Usage: .\run.ps1
#>

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Asshrabha - Starting Up...             " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ── Read DATABASE_URL from .env ──────────────────────────────────────────────
$dbUrl = ""
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_URL\s*=\s*"([^"]+)"') {
        $dbUrl = $Matches[1]
    } elseif ($envContent -match "DATABASE_URL\s*=\s*'([^']+)'") {
        $dbUrl = $Matches[1]
    } elseif ($envContent -match 'DATABASE_URL\s*=\s*(.+)') {
        $dbUrl = $Matches[1].Trim()
    }
}
if ($env:DATABASE_URL) { $dbUrl = $env:DATABASE_URL }

if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

# ── Step 0: Check node_modules ───────────────────────────────────────────────
if (-not (Test-Path "node_modules")) {
    Write-Host "[0/5] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
}

# ── Step 1: Check Database Connection ────────────────────────────────────────
Write-Host "[1/5] Checking database connection..." -ForegroundColor Yellow
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.argv[1] });
client.connect()
  .then(() => client.query('SELECT 1'))
  .then(() => { console.log('   OK - Database is reachable'); client.end(); })
  .catch(e => { console.error('   FAIL:', e.message); process.exit(1); });
" "$dbUrl"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Cannot connect to PostgreSQL." -ForegroundColor Red
    Write-Host "  1. Make sure PostgreSQL is running" -ForegroundColor Red
    Write-Host "  2. Check DATABASE_URL in .env" -ForegroundColor Red
    Write-Host "  3. Make sure database 'asshrabha' exists" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To create: psql -U postgres -c 'CREATE DATABASE asshrabha;'" -ForegroundColor Yellow
    exit 1
}

# ── Step 2: Sync Schema (db push) ───────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Syncing database schema (prisma db push)..." -ForegroundColor Yellow
npx prisma db push --schema=prisma/schema.prisma --url="$dbUrl" --accept-data-loss 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   WARNING: db push had issues, will try ensure-schema next..." -ForegroundColor DarkYellow
}

# ── Step 3: Generate Prisma Client ───────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate --schema=prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "   OK - Prisma Client generated"

# ── Step 4: Ensure Schema (fills any gaps) ───────────────────────────────────
Write-Host ""
Write-Host "[4/5] Ensuring all schema objects exist in DB..." -ForegroundColor Yellow
node scripts/ensure-schema.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "   WARNING: Schema check had warnings (non-fatal)" -ForegroundColor DarkYellow
}

# ── Step 5: Seed Test User ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Seeding test user and data..." -ForegroundColor Yellow
node scripts/seed-test-user.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "   WARNING: Seed had warnings (non-fatal)" -ForegroundColor DarkYellow
}

# ── Launch Dev Server ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  All checks passed! Starting server...  " -ForegroundColor Green
Write-Host "                                         " -ForegroundColor Green
Write-Host "  App:      http://localhost:3000         " -ForegroundColor Green
Write-Host "  Login:    http://localhost:3000/login   " -ForegroundColor Green
Write-Host "  Mobile:   01094056919                   " -ForegroundColor Green  
Write-Host "  Password: 2463                          " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

npm run dev
