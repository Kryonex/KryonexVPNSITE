#!/usr/bin/env bash
set -euo pipefail

mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T db pg_dump -U zerovpn zerovpn > "backups/zerovpn-${STAMP}.sql"
tar -czf "backups/zerovpn-files-${STAMP}.tar.gz" .env Caddyfile docker-compose.yml
echo "Backup written to backups/zerovpn-${STAMP}.sql"
