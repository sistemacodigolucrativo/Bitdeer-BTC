#!/usr/bin/env bash
set -euo pipefail
test -f dist/index.html || { echo "Execute npm run build primeiro." >&2; exit 1; }
test -f server/schema.php
mkdir -p release-build
workspace="$(mktemp -d)"
trap 'rm -rf "$workspace"' EXIT
mkdir -p "$workspace/bitdeer/public_html/api" "$workspace/bitdeer/public_html/install"
mkdir -p "$workspace/bitdeer/private/server" "$workspace/bitdeer/private/data"
cp -R dist/. "$workspace/bitdeer/public_html/"
cp api/index.php "$workspace/bitdeer/public_html/api/index.php"
cp install/index.php "$workspace/bitdeer/public_html/install/index.php"
cp server/*.php "$workspace/bitdeer/private/server/"
cp deploy/apache.htaccess "$workspace/bitdeer/public_html/.htaccess"
cp docs/DEPLOYMENT.md "$workspace/bitdeer/INSTRUCOES_DE_INSTALACAO.md"
(cd "$workspace" && zip -qr "$OLDPWD/release-build/bitdeer-php-sqlite.zip" bitdeer)
echo "ZIP gerado: release-build/bitdeer-php-sqlite.zip"
