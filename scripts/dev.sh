#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Keep PHP source and private data out of the public document root.
php -S 127.0.0.1:8000 -t public scripts/php-router.php &
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
