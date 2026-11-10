#!/usr/bin/env bash
set -euo pipefail
test -f dist/index.html || { echo "Execute npm run build primeiro." >&2; exit 1; }
test -f server/schema.php
test -f seed/bitdeer.sqlite || { echo "Execute php scripts/build-default-seed.php primeiro." >&2; exit 1; }
mkdir -p release-build
workspace="$(mktemp -d)"
trap 'rm -rf "$workspace"' EXIT
mkdir -p "$workspace/bitdeer/public_html/api" "$workspace/bitdeer/public_html/install"
mkdir -p "$workspace/bitdeer/private/server" "$workspace/bitdeer/private/data" "$workspace/bitdeer/private/seed"
cp -R dist/. "$workspace/bitdeer/public_html/"
cp api/index.php "$workspace/bitdeer/public_html/api/index.php"
cp install/index.php install/ownership.php "$workspace/bitdeer/public_html/install/"
cp server/*.php "$workspace/bitdeer/private/server/"
cp seed/bitdeer.sqlite "$workspace/bitdeer/private/seed/bitdeer.sqlite"
cp deploy/apache.htaccess "$workspace/bitdeer/public_html/.htaccess"
cp docs/DEPLOYMENT.md "$workspace/bitdeer/INSTRUCOES_DE_INSTALACAO.md"
(cd "$workspace" && zip -qr "$OLDPWD/release-build/bitdeer-php-sqlite.zip" bitdeer)
echo "ZIP gerado: release-build/bitdeer-php-sqlite.zip"
