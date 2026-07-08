#!/bin/sh
set -eu

IMAGE_TAG="${1:?usage: deploy.sh IMAGE_TAG}"
APP_DIR="${APP_DIR:-$HOME/visiontemplate}"

cd "$APP_DIR"

export APP_IMAGE="$IMAGE_TAG"

# Use sudo only when the current user can't reach the Docker socket.
NEED_SUDO=""
if command -v sudo >/dev/null 2>&1 && [ ! -w /var/run/docker.sock ]; then
  NEED_SUDO="sudo"
fi

docker_compose() {
  # Pass APP_IMAGE through explicitly: `sudo` resets the environment, so an
  # exported APP_IMAGE would otherwise be dropped and compose would fall back
  # to its default image tag.
  $NEED_SUDO env APP_IMAGE="$APP_IMAGE" docker compose "$@"
}

# Authenticate to GHCR if a token was supplied (the package is private).
# Runs in the same privilege context as compose so the credentials are visible
# to the process that actually pulls the image.
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
  exit 1
fi

if ! docker_compose up -d --force-recreate app; then
  if [ -n "$PREVIOUS_IMAGE" ]; then
    echo "Deployment failed. Rolling back to $PREVIOUS_IMAGE"
    export APP_IMAGE="$PREVIOUS_IMAGE"
    docker_compose up -d --force-recreate app || true
  fi
  exit 1
fi

if ! curl -fsS http://127.0.0.1:3000/api/ping >/dev/null 2>&1; then
  if [ -n "$PREVIOUS_IMAGE" ]; then
    echo "Health check failed. Rolling back to $PREVIOUS_IMAGE"
    export APP_IMAGE="$PREVIOUS_IMAGE"
    docker_compose up -d --force-recreate app || true
  fi
  exit 1
fi

echo "$APP_IMAGE" > .last-known-good
