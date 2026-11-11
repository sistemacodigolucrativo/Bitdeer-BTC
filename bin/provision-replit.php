<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/server/schema.php';

try {
    if (getenv('BITDEER_ALLOW_CLI_PROVISION') !== '1') {
        throw new RuntimeException('Provisioning is disabled without BITDEER_ALLOW_CLI_PROVISION=1');
    }
    if (is_file(data_file())) {
        throw new RuntimeException('Database already exists; provisioning refused.');
    }

    $values = [];
    foreach (['BITDEER_ADMIN_LOGIN', 'BITDEER_ADMIN_PASSWORD', 'BITDEER_SUPPORT_EMAIL'] as $key) {
        $value = getenv($key);
        if ($value === false || $value === '') {
            throw new RuntimeException('Missing setup secret: ' . $key);
        }
        $values[] = $value;
    }

    provision($values[0], $values[1], $values[2]);
    fwrite(STDOUT, "Private SQLite database provisioned; credentials were not logged.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Setup failed: " . $error->getMessage() . "\n");
    exit(1);
}
