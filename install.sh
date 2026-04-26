#!/usr/bin/env bash
set -euo pipefail

read -rp "Domain: " DOMAIN
read -rp "Email for Let's Encrypt: " SSL_EMAIL
read -rp "First admin email: " FIRST_ADMIN_EMAIL
read -rsp "First admin password: " FIRST_ADMIN_PASSWORD
echo
read -rp "Service name [ZEROVPN]: " SEED_SITE_NAME
SEED_SITE_NAME=${SEED_SITE_NAME:-ZEROVPN}
read -rp "Payment phone: " SEED_PAYMENT_PHONE
read -rp "Enable T-Bank? [Y/n]: " BANK_TINKOFF
read -rp "Enable Sberbank? [Y/n]: " BANK_SBER
read -rp "Enable Ozon Bank? [Y/n]: " BANK_OZON
read -rp "PasarGuard URL (empty for mock): " PASARGUARD_URL
read -rp "PasarGuard admin username/token (optional): " PASARGUARD_LOGIN
read -rsp "PasarGuard password/token secret (optional): " PASARGUARD_SECRET
echo
read -rp "SMTP host (empty to skip): " SMTP_HOST
read -rp "Support Telegram URL: " SUPPORT_TELEGRAM
read -rp "Trial days [3]: " TRIAL_DAYS
TRIAL_DAYS=${TRIAL_DAYS:-3}

POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
APP_SECRET=$(openssl rand -base64 48 | tr -d '\n')
AUTH_SECRET=$(openssl rand -base64 48 | tr -d '\n')
ENCRYPTION_KEY=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -base64 32 | tr -d '\n')

cat > .env <<ENV
DOMAIN=${DOMAIN}
SSL_EMAIL=${SSL_EMAIL}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
DATABASE_URL=postgresql://zerovpn:${POSTGRES_PASSWORD}@db:5432/zerovpn?schema=public
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
APP_SECRET=${APP_SECRET}
AUTH_SECRET=${AUTH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CRON_SECRET=${CRON_SECRET}
FIRST_ADMIN_EMAIL=${FIRST_ADMIN_EMAIL}
FIRST_ADMIN_PASSWORD=${FIRST_ADMIN_PASSWORD}
SEED_SITE_NAME=${SEED_SITE_NAME}
SEED_PAYMENT_PHONE=${SEED_PAYMENT_PHONE}
ENV

docker compose up -d --build
docker compose exec -T app npx prisma migrate deploy
docker compose exec -T app npm run seed
docker compose exec -T -e FIRST_ADMIN_EMAIL="${FIRST_ADMIN_EMAIL}" -e FIRST_ADMIN_PASSWORD="${FIRST_ADMIN_PASSWORD}" app npm run setup:admin

cat <<INFO

ZEROVPN installed.
Site: https://${DOMAIN}
Admin: https://${DOMAIN}/admin

Open /admin/settings equivalents in /admin to set PasarGuard template id, SMTP and push.
INFO
