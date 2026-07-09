#!/bin/sh
# $NEED_SUDO and $DB_PSQL are intentionally left unquoted so they word-split
# into separate arguments (POSIX sh has no arrays). Suppress SC2086 file-wide.
# shellcheck disable=SC2086
set -eu

IMAGE_TAG="${1:?usage: deploy.sh IMAGE_TAG}"
APP_DIR="${APP_DIR:-$HOME/visiontemplate}"

cd "$APP_DIR"

export APP_IMAGE="$IMAGE_TAG"

NEED_SUDO=""
if command -v sudo >/dev/null 2>&1 && [ ! -w /var/run/docker.sock ]; then
  NEED_SUDO="sudo"
fi

docker_compose() {
  $NEED_SUDO env APP_IMAGE="$APP_IMAGE" docker compose "$@"
}

set_status() {
  echo "$1" > .deploy-status
}
set_status in-progress

DB_PSQL="exec -T postgres psql -U postgres -d vision_template -v ON_ERROR_STOP=1"

health_ok() {
  i=0
  while [ "$i" -lt 30 ]; do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 2
  done
  return 1
}

run_migrations() {
  [ -d db/migrations ] || return 0
  docker_compose $DB_PSQL -c \
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());"
  for f in db/migrations/*.sql; do
    [ -e "$f" ] || continue
    version=$(basename "$f")
    applied=$(docker_compose $DB_PSQL -tAc \
      "SELECT 1 FROM schema_migrations WHERE version = '$version'" | tr -d '[:space:]')
    if [ "$applied" = "1" ]; then
      continue
    fi
    echo "Applying migration $version"
    if ! docker_compose $DB_PSQL < "$f"; then
      echo "!!! Migration $version FAILED. Aborting deploy; existing app left running."
      set_status migration-aborted
      exit 1
    fi
    docker_compose $DB_PSQL -c \
      "INSERT INTO schema_migrations (version) VALUES ('$version');"
  done
}


rollback() {
  if [ -z "$PREVIOUS_IMAGE" ]; then
    echo "!!! No previous known-good image to roll back to. Manual intervention required."
    set_status no-previous
    return
  fi
  echo "Rolling back to $PREVIOUS_IMAGE"
  export APP_IMAGE="$PREVIOUS_IMAGE"
  docker_compose up -d --force-recreate app || true
  if health_ok; then
    echo "Rollback to $PREVIOUS_IMAGE succeeded; service healthy again."
    set_status rolled-back
  else
    echo "!!! ROLLBACK ALSO UNHEALTHY — service is DOWN. Manual intervention required."
    docker_compose ps || true
    docker_compose logs --tail=100 app || true
    set_status down
  fi
}

if [ -n "${GHCR_PAT:-}" ]; then
  echo "$GHCR_PAT" | $NEED_SUDO docker login ghcr.io -u "${GHCR_ACTOR:-}" --password-stdin
fi

if [ -f .last-known-good ]; then
  PREVIOUS_IMAGE=$(cat .last-known-good)
else
  PREVIOUS_IMAGE=""
fi

if ! docker_compose pull app; then
  echo "Image pull failed."
  set_status pull-failed
  exit 1
fi

if ! docker_compose up -d --wait postgres; then
  echo "Database failed to become healthy."
  set_status db-unhealthy
  exit 1
fi

run_migrations

if ! docker_compose up -d --force-recreate app; then
  echo "Deployment failed to start."
  docker_compose ps || true
  docker_compose logs --tail=100 app || true
  rollback
  exit 1
fi

if ! health_ok; then
  echo "Health check failed; container status and recent app logs:"
  docker_compose ps || true
  docker_compose logs --tail=100 app || true
  rollback
  exit 1
fi

echo "$APP_IMAGE" > .last-known-good
set_status success
