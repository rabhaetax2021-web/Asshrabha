# 🚀 Asshrabha — VPS Deployment Guide

Complete guide to deploy **Asshrabha** on a Linux VPS (Ubuntu/Debian).

---

## Prerequisites

| Requirement     | Minimum Version |
|-----------------|-----------------|
| Ubuntu/Debian   | 20.04+          |
| Node.js         | 18.x or 20.x   |
| PostgreSQL      | 14+             |
| RAM             | 1 GB+           |
| Disk            | 10 GB+          |

---

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx
```

### Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # should show v20.x
npm -v
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Create Database & User

```bash
sudo -u postgres psql << 'EOF'
CREATE USER asshrabha_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE asshrabha OWNER asshrabha_user;
GRANT ALL PRIVILEGES ON DATABASE asshrabha TO asshrabha_user;
\c asshrabha
GRANT ALL ON SCHEMA public TO asshrabha_user;
EOF
```

> ⚠️ **Replace** `YOUR_STRONG_PASSWORD_HERE` with a strong password!

---

## Step 2: Deploy Application

### Clone / Upload Code

```bash
# Option A: Clone from git
cd /var/www
sudo mkdir -p asshrabha
sudo chown $USER:$USER asshrabha
git clone YOUR_REPO_URL asshrabha
cd asshrabha

# Option B: Upload via SCP from your local machine
# scp -r ./Asshrabha/* user@your-vps-ip:/var/www/asshrabha/
```

### Configure Environment

```bash
cp .env.example .env
nano .env
```

Update `.env` with your VPS values:

```env
# Database — use the user/password you created above
DATABASE_URL="postgresql://asshrabha_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/asshrabha?schema=public"

# NextAuth — generate a real secret!
NEXTAUTH_SECRET="PASTE_OUTPUT_OF_openssl_rand_-base64_32"
NEXTAUTH_URL="https://yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="Asshrabha"
NEXT_PUBLIC_DEFAULT_LOCALE="ar"

# Upload - MinIO Configuration
MINIO_ENDPOINT="files.marymatelier.com"
MINIO_PORT="443"
MINIO_USE_SSL="true"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_REGION="us-east-1"
MINIO_BUCKET="ashrabha"
MINIO_PUBLIC_URL="http://files.marymatelier.com"

# Legacy Upload (deprecated)
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB="5"
```

> 💡 Generate a proper secret: `openssl rand -base64 32`

### Install Dependencies

```bash
npm install
```

### Run the Startup Script (First Time)

```bash
chmod +x run.sh
./run.sh          # Production mode: builds + starts
# OR
./run.sh --dev    # Development mode
```

The `run.sh` script automatically handles everything:

| Step | What it does |
|------|-------------|
| 1 | ✅ Checks PostgreSQL connection |
| 2 | ✅ Syncs schema via `prisma db push` |
| 3 | ✅ Generates Prisma Client |
| 4 | ✅ Ensures all tables/enums/columns exist |
| 5 | ✅ Seeds test user + categories + settings |
| 6 | ✅ Builds & starts the production server |

---

## Step 3: Setup Process Manager (PM2)

Keep the app running after you disconnect:

```bash
# Install PM2
sudo npm install -g pm2

# Build first (if not already built)
npm run build

# Start with PM2
pm2 start npm --name "asshrabha" -- start

# Save PM2 process list & enable startup on boot
pm2 save
pm2 startup
# (Copy and run the command PM2 outputs)
```

### Useful PM2 Commands

```bash
pm2 status              # Check status
pm2 logs asshrabha      # View logs
pm2 restart asshrabha   # Restart app
pm2 stop asshrabha      # Stop app
pm2 delete asshrabha    # Remove from PM2
```

---

## Step 4: Configure Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/asshrabha
```

Paste:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Note: /uploads/ are now served by MinIO at files.marymatelier.com
    # No local upload directory needed

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/asshrabha /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Step 6: Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Quick Redeploy Script

Create `/var/www/asshrabha/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /var/www/asshrabha

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Syncing schema..."
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss

echo "Generating Prisma Client..."
npx prisma generate --schema=prisma/schema.prisma

echo "Checking schema..."
node scripts/ensure-schema.js

echo "Seeding..."
node scripts/seed-test-user.js

echo "Building..."
npm run build

echo "Restarting..."
pm2 restart asshrabha

echo "Done!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Troubleshooting

### Database connection failed
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l | grep asshrabha
psql "postgresql://asshrabha_user:YOUR_PASSWORD@localhost:5432/asshrabha"
```

### App won't start
```bash
pm2 logs asshrabha --lines 50
sudo lsof -i :3000
```

### Nginx returns 502
```bash
pm2 status
sudo tail -f /var/log/nginx/error.log
```

---

## Test Credentials

| Field    | Value        |
|----------|--------------|
| Mobile   | 01094056919  |
| Password | 2463         |
| Role     | ROOT_ADMIN   |
| URL      | /login       |

> ⚠️ **Important**: Change the test user password in production!
