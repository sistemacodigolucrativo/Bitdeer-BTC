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
    if (is_file(data_file()) && !default_seed_pending()) {
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

    initialize_default_seed();
    $created = provision($values[0], $values[1], $values[2]);
    if (!empty($created['fromDefaultSeed'])) {
        $credentialFile = save_default_member_credentials($created);
        if ($credentialFile !== null) {
            fwrite(STDOUT, "Private SQLite database provisioned; default member credentials were saved in the private data directory.\n");
        } else {
            fwrite(STDERR, "Warning: member credentials could not be saved; reset the user password through the admin panel.\n");
        }
    } else {
        fwrite(STDOUT, "Private SQLite database provisioned; credentials were not logged.\n");
    }
} catch (Throwable $error) {
    fwrite(STDERR, "Setup failed: " . $error->getMessage() . "\n");
    exit(1);
}
