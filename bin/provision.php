<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/server/schema.php';
if (getenv('BITDEER_ALLOW_CLI_PROVISION') !== '1') {
    fwrite(STDERR, "Provisioning is disabled (set BITDEER_ALLOW_CLI_PROVISION=1 for an isolated development environment).\n");
    exit(2);
}
if ($argc !== 4) {
    fwrite(STDERR, "Usage: php bin/provision.php <admin-login> <admin-password> <support-email>\n");
    exit(2);
}
try {
    provision($argv[1], $argv[2], $argv[3]);
    fwrite(STDOUT, "SQLite schema and administrator created; no browser installer enabled.\n");
} catch (Throwable $e) {
    fwrite(STDERR, "Provision failed: " . $e->getMessage() . "\n");
    exit(1);
}
