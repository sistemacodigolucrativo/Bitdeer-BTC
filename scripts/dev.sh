#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# The preview database is the repository's authoritative SQLite file.
# If it is absent in a fresh local setup, provision a new private database;
# the provisioning script refuses to overwrite an existing database.
if ! php -r 'require "server/core.php"; exit(is_file(data_file()) ? 0 : 1);'; then
  BITDEER_ALLOW_CLI_PROVISION=1 php bin/provision-replit.php
fi

# Keep PHP source and private data out of the public document root.
BITDEER_TRUST_LOCAL_PROXY=1 php -S 127.0.0.1:8000 -t public scripts/php-router.php &
backend=$!
bun run --bun vite --host 0.0.0.0 --port 5000 &
frontend=$!

cleanup() {
  kill "$backend" "$frontend" 2>/dev/null || true
  wait "$backend" "$frontend" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 0' INT TERM
wait -n "$backend" "$frontend"
