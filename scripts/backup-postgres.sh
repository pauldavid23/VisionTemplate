#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%F_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vision_template_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

pg_dump \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER:-postgres}" \
  -d "${POSTGRES_DB:-vision_template}" \
  -Fc \
  > "$BACKUP_FILE"

find "$BACKUP_DIR" -type f -name 'vision_template_*.dump' -mtime +7 -delete

echo "Created backup: $BACKUP_FILE"
