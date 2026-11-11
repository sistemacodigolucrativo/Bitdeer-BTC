#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo 'Execute como root.' >&2; exit 1; fi
release_path=${1:-/srv/bitdeer-btc/current}
[[ -f "$release_path/deploy/bitdeer-sqlite-backup.service" ]] || { echo 'Release Bitdeer incompleto.' >&2; exit 1; }
php -r 'exit(extension_loaded("pdo_sqlite") && extension_loaded("sodium") ? 0 : 1);' || { echo 'PDO SQLite e libsodium são necessários.' >&2; exit 1; }

install -d -o root -g www-data -m 0750 /etc/bitdeer-btc
if [[ ! -e /etc/bitdeer-btc/kyc.key ]]; then
  umask 0077
  head -c 32 /dev/urandom > /etc/bitdeer-btc/kyc.key
fi
[[ $(stat -c '%s' /etc/bitdeer-btc/kyc.key) -eq 32 ]] || { echo 'A chave KYC existente tem tamanho inválido; interrompido sem substituí-la.' >&2; exit 1; }
chown root:www-data /etc/bitdeer-btc/kyc.key
chmod 0640 /etc/bitdeer-btc/kyc.key
install -d -o root -g root -m 0700 /var/backups/bitdeer-btc
install -o root -g root -m 0644 "$release_path/deploy/bitdeer-sqlite-backup.service" /etc/systemd/system/bitdeer-sqlite-backup.service
install -o root -g root -m 0644 "$release_path/deploy/bitdeer-sqlite-backup.timer" /etc/systemd/system/bitdeer-sqlite-backup.timer
systemctl daemon-reload
systemctl enable --now bitdeer-sqlite-backup.timer
systemctl start bitdeer-sqlite-backup.service
systemctl --no-pager --full status bitdeer-sqlite-backup.timer
