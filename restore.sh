#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: ./restore.sh backups/zerovpn-YYYYmmdd-HHMMSS.sql"
  exit 1
fi

docker compose up -d db
docker compose exec -T db psql -U zerovpn -d zerovpn -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T db psql -U zerovpn -d zerovpn < "$1"
docker compose up -d
echo "Restore completed."
