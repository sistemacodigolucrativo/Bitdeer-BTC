<?php
declare(strict_types=1);

/**
 * Build the installable database seed from the active workspace SQLite file.
 * The source database is opened read-only and is never modified.
 */

function fail_seed(string $message): never {
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

function quote_identifier(string $value): string {
    return '"' . str_replace('"', '""', $value) . '"';
}

function sqlite_rows(SQLite3 $db, string $sql): array {
    $result = $db->query($sql);
    if (!$result instanceof SQLite3Result) {
        throw new RuntimeException('SQLite query failed');
    }
    $rows = [];
    while (($row = $result->fetchArray(SQLITE3_ASSOC)) !== false) {
        $rows[] = $row;
    }
    $result->finalize();
    return $rows;
}

function has_table(SQLite3 $db, string $table): bool {
    $statement = $db->prepare('SELECT 1 FROM sqlite_master WHERE type="table" AND name=:name');
    $statement->bindValue(':name', $table, SQLITE3_TEXT);
    $result = $statement->execute();
    $found = $result !== false && $result->fetchArray(SQLITE3_NUM) !== false;
    $result?->finalize();
    $statement->close();
    return $found;
}

function delete_rows_for_table(SQLite3 $db, string $table): void {
    $statement = $db->prepare(
        'DELETE FROM ' . quote_identifier($table) .
        ' WHERE rowid IN (SELECT rowid FROM temp.__seed_doomed_rows WHERE table_name=:table)'
    );
    $statement->bindValue(':table', $table, SQLITE3_TEXT);
    $result = $statement->execute();
    if ($result === false) {
        throw new RuntimeException('Could not sanitize a dependent table');
    }
    $result->finalize();
    $statement->close();
}

$workspace = dirname(__DIR__);
$source = getenv('BITDEER_DB_PATH') ?: $workspace . '/.local/private/bitdeer.sqlite';
$target = $workspace . '/seed/bitdeer.sqlite';

if (!class_exists(SQLite3::class)) {
    fail('PHP SQLite3 extension is required to build the default database seed.');
}
if (!is_file($source)) {
    fail('The active workspace SQLite database was not found.');
}

$sourceReal = realpath($source);
$targetDirectory = dirname($target);
if ($sourceReal === false || $sourceReal === realpath($target)) {
    fail('The source and seed database paths must be different.');
}
if (!is_dir($targetDirectory) && !mkdir($targetDirectory, 0750, true) && !is_dir($targetDirectory)) {
    fail('Could not create the seed directory.');
}

$oldUmask = umask(0077);
$temporary = tempnam(sys_get_temp_dir(), 'bitdeer-seed-');
if ($temporary === false) {
    umask($oldUmask);
    fail('Could not create a temporary seed file.');
}
chmod($temporary, 0600);

$removedUsers = 0;
try {
    $sourceDb = new SQLite3($sourceReal, SQLITE3_OPEN_READONLY);
    $sourceDb->enableExceptions(true);
    $sourceDb->busyTimeout(10000);
    $targetDb = new SQLite3($temporary, SQLITE3_OPEN_READWRITE);
    $targetDb->enableExceptions(true);
    $targetDb->busyTimeout(10000);

    if (!$sourceDb->backup($targetDb)) {
        throw new RuntimeException('Could not snapshot the active workspace database.');
    }
    $sourceDb->close();

    $targetDb->exec('PRAGMA foreign_keys=OFF');
    $targetDb->exec('PRAGMA secure_delete=ON');
    $targetDb->exec('BEGIN IMMEDIATE');

    if (!has_table($targetDb, 'users')) {
        throw new RuntimeException('The source database does not contain a users table.');
    }

    $admins = sqlite_rows($targetDb, 'SELECT id FROM users WHERE role="admin" ORDER BY id');
    $defaultUsers = sqlite_rows($targetDb,
        'SELECT id FROM users WHERE role="member" AND lower(login)="user" ORDER BY id');
    if (count($admins) !== 1 || count($defaultUsers) !== 1) {
        throw new RuntimeException('The source must contain exactly one admin and one member named user.');
    }

    $keepIds = [(int)$admins[0]['id'], (int)$defaultUsers[0]['id']];
    $keepCsv = implode(',', array_map('intval', $keepIds));
    $userCount = (int)($targetDb->querySingle('SELECT COUNT(*) FROM users') ?: 0);
    $removedUsers = max(0, $userCount - count($keepIds));

    foreach (sqlite_rows($targetDb, 'PRAGMA table_list') as $tableInfo) {
        if (($tableInfo['type'] ?? '') === 'table' && (int)($tableInfo['wr'] ?? 0) === 1) {
            throw new RuntimeException('Seed cleanup does not support WITHOUT ROWID tables.');
        }
    }

    $tables = array_column(sqlite_rows(
        $targetDb,
        'SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" ORDER BY name'
    ), 'name');

    $targetDb->exec(
        'CREATE TEMP TABLE __seed_doomed_rows (' .
        'table_name TEXT NOT NULL, rowid INTEGER NOT NULL, ' .
        'PRIMARY KEY(table_name,rowid)) WITHOUT ROWID'
    );
    $targetDb->exec(
        'INSERT INTO temp.__seed_doomed_rows(table_name,rowid) ' .
        'SELECT "users",rowid FROM users WHERE id NOT IN (' . $keepCsv . ')'
    );

    $foreignKeys = [];
    foreach ($tables as $table) {
        $rows = sqlite_rows($targetDb, 'PRAGMA foreign_key_list(' . quote_identifier($table) . ')');
        foreach ($rows as $row) {
            $foreignKeys[$table][(int)$row['id']][] = $row;
        }
    }

    do {
        $added = 0;
        foreach ($foreignKeys as $childTable => $groups) {
            foreach ($groups as $group) {
                usort($group, static fn(array $a, array $b): int => (int)$a['seq'] <=> (int)$b['seq']);
                $parentTable = (string)$group[0]['table'];
                $parentColumns = array_map(static fn(array $row): string => (string)($row['to'] ?? ''), $group);
                if (in_array('', $parentColumns, true)) {
                    $primary = [];
                    foreach (sqlite_rows($targetDb, 'PRAGMA table_info(' . quote_identifier($parentTable) . ')') as $column) {
                        if ((int)$column['pk'] > 0) {
                            $primary[(int)$column['pk']] = (string)$column['name'];
                        }
                    }
                    ksort($primary);
                    $parentColumns = array_values($primary);
                }
                if (count($parentColumns) !== count($group)) {
                    throw new RuntimeException('Could not resolve a database relationship.');
                }

                $joins = [];
                foreach ($group as $index => $row) {
                    $joins[] = 'c.' . quote_identifier((string)$row['from']) .
                        '=p.' . quote_identifier($parentColumns[$index]);
                }
                $sql = 'INSERT OR IGNORE INTO temp.__seed_doomed_rows(table_name,rowid) ' .
                    'SELECT :child,c.rowid FROM ' . quote_identifier($childTable) . ' c ' .
                    'JOIN ' . quote_identifier($parentTable) . ' p ON ' . implode(' AND ', $joins) . ' ' .
                    'JOIN temp.__seed_doomed_rows d ON d.table_name=:parent AND d.rowid=p.rowid';
                $statement = $targetDb->prepare($sql);
                $statement->bindValue(':child', $childTable, SQLITE3_TEXT);
                $statement->bindValue(':parent', $parentTable, SQLITE3_TEXT);
                $result = $statement->execute();
                if ($result === false) {
                    throw new RuntimeException('Could not find dependent records to sanitize.');
                }
                $result->finalize();
                $statement->close();
                $added += $targetDb->changes();
            }
        }
    } while ($added > 0);

    foreach ($tables as $table) {
        delete_rows_for_table($targetDb, $table);
    }

    // Clear account credentials and transient/private records from the seed.
    foreach ([
        'sessions',
        'auth_attempts',
        'admin_audit',
        'admin_notifications',
        'admin_notification_reads',
        'identity_checks',
        'support_tickets',
        'support_replies',
        'referral_codes',
        'referral_events',
        'mock_payment_feed',
        'mock_payment_cursor',
    ] as $table) {
        if (has_table($targetDb, $table)) {
            $targetDb->exec('DELETE FROM ' . quote_identifier($table));
        }
    }

    $targetDb->exec(
        'UPDATE users SET ' .
        'login=CASE WHEN role="admin" THEN "seed-admin" ELSE "user" END,' .
        'password_hash="!seed-pending!", status="active",' .
        'display_name=CASE WHEN role="admin" THEN "Administrador" ELSE "Usuário padrão" END,' .
        'email="", phone="", avatar_url="", avatar_locked=0, wallet_address="", ' .
        'updated_at=' . time()
    );

    if (has_table($targetDb, 'mining_state')) {
        $targetDb->exec(
            'UPDATE mining_state SET running=0,last_accrual_at=NULL,session_ends_at=NULL,' .
            'cooldown_until=NULL,updated_at=' . time()
        );
    }
    if (has_table($targetDb, 'orders')) {
        $targetDb->exec(
            'UPDATE orders SET btc_address="",payment_ref=NULL,proof_url=NULL,proof_submitted_at=NULL,' .
            'payment_proof_url="",payment_proof_submitted_at=NULL'
        );
    }
    if (has_table($targetDb, 'withdraw_requests')) {
        $targetDb->exec('UPDATE withdraw_requests SET btc_address="",reference=""');
    }
    if (has_table($targetDb, 'app_settings')) {
        $targetDb->exec('DELETE FROM app_settings');
        $settings = [
            ['install_seed_state', 'pending'],
            ['support_email', ''],
            ['site_url', ''],
            ['environment_type', 'auto'],
            ['btc_address', ''],
            ['btc_address_confirmed', '0'],
            ['payment_mode', 'simulation'],
            ['schema_version', '1'],
            ['demo_new_investors_enabled', '0'],
        ];
        $statement = $targetDb->prepare('INSERT INTO app_settings(name,value) VALUES(:name,:value)');
        foreach ($settings as [$name, $value]) {
            $statement->bindValue(':name', $name, SQLITE3_TEXT);
            $statement->bindValue(':value', $value, SQLITE3_TEXT);
            $result = $statement->execute();
            if ($result === false) {
                throw new RuntimeException('Could not reset private application settings.');
            }
            $result->finalize();
        }
        $statement->close();
    }

    $targetDb->exec('COMMIT');
    $targetDb->exec('PRAGMA foreign_keys=ON');
    $fkErrors = sqlite_rows($targetDb, 'PRAGMA foreign_key_check');
    if ($fkErrors) {
        throw new RuntimeException('The sanitized database contains invalid relationships.');
    }
    $integrity = $targetDb->querySingle('PRAGMA integrity_check');
    if ($integrity !== 'ok') {
        throw new RuntimeException('The sanitized database failed its integrity check.');
    }
    $finalUsers = (int)$targetDb->querySingle('SELECT COUNT(*) FROM users');
    $finalSessions = has_table($targetDb, 'sessions')
        ? (int)$targetDb->querySingle('SELECT COUNT(*) FROM sessions') : 0;
    if ($finalUsers !== 2 || $finalSessions !== 0) {
        throw new RuntimeException('Sanitized database verification failed.');
    }
    $targetDb->exec('PRAGMA journal_mode=DELETE');
    $targetDb->exec('VACUUM');
    $targetDb->close();

    if (file_exists($target) && !unlink($target)) {
        throw new RuntimeException('Could not replace the existing default seed.');
    }
    if (!rename($temporary, $target)) {
        throw new RuntimeException('Could not publish the sanitized seed inside the workspace.');
    }
    chmod($target, 0600);
} catch (Throwable $error) {
    throw $error;
} finally {
    if (isset($sourceDb) && $sourceDb instanceof SQLite3) {
        @$sourceDb->close();
    }
    if (isset($targetDb) && $targetDb instanceof SQLite3) {
        @$targetDb->close();
    }
    @unlink($temporary);
    umask($oldUmask);
}

fwrite(STDOUT, "Default seed built from the active SQLite database; removed {$removedUsers} other member accounts.\n");
