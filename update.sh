#!/usr/bin/env bash
set -euo pipefail

docker compose build app
docker compose up -d
docker compose exec -T app npx prisma migrate deploy
docker compose exec -T app npm run seed
docker compose restart app
echo "ZEROVPN updated."
