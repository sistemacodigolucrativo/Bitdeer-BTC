<?php
declare(strict_types=1);

/**
 * Bitdeer BTC server primitives. Authentication, authorization, money and
 * timestamps are authoritative on PHP/SQLite, never in React/localStorage.
 */
date_default_timezone_set('UTC');

function data_file(): string {
    $custom = getenv('BITDEER_DB_PATH');
    $packaged=dirname(__DIR__).'/data';
    $default=is_dir($packaged) ? $packaged.'/bitdeer.sqlite'
      : dirname(__DIR__, 2).'/bitdeer-private-data/bitdeer.sqlite';
    $path=($custom !== false && $custom !== '') ? $custom : $default;
    if (!str_starts_with($path, '/')) {
        throw new RuntimeException('BITDEER_DB_PATH must be an absolute path');
    }
    // Resolve the existing ancestor even when the SQLite directory does not exist yet.
    // Otherwise a first-time install could place a readable database under public/.
    $publicRoot = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
    $public = $publicRoot === '' ? false : realpath($publicRoot);
    $folder = dirname($path);
    $missing = [];
    while (!is_dir($folder)) {
        $parent = dirname($folder);
        if ($parent === $folder) throw new RuntimeException('Invalid database parent directory');
        array_unshift($missing, basename($folder));
        $folder = $parent;
    }
    $canonical = realpath($folder);
    if ($canonical === false) throw new RuntimeException('Cannot resolve database directory');
    foreach ($missing as $segment) {
        if ($segment === '.' || $segment === '..' || $segment === '') {
            throw new RuntimeException('Unsafe SQLite directory path');
        }
        $canonical .= DIRECTORY_SEPARATOR . $segment;
    }
    if ($public !== false && ($canonical === $public ||
        str_starts_with($canonical, $public . DIRECTORY_SEPARATOR))) {
        throw new RuntimeException('SQLite database must be outside the web document root');
    }
    return $path;
}

function database(bool $allowCreate = false): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    if (!extension_loaded('pdo_sqlite')) throw new RuntimeException('PHP pdo_sqlite extension required');
    $path = data_file();
    if (!$allowCreate && !is_file($path)) {
        throw new RuntimeException('Application is not installed');
    }
    if ($allowCreate) {
        if (!is_dir(dirname($path)) && !mkdir(dirname($path), 0700, true) && !is_dir(dirname($path))) {
            throw new RuntimeException('Cannot create private SQLite directory');
        }
        chmod(dirname($path), 0700);
    }
    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 10000');
    $pdo->exec('PRAGMA journal_mode = WAL');
    if ($allowCreate && is_file($path)) chmod($path, 0600);
    return $pdo;
}

function query_one(PDO $db, string $sql, array $args = []): ?array {
    $stmt = $db->prepare($sql);
    $stmt->execute($args);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function query_all(PDO $db, string $sql, array $args = []): array {
    $stmt = $db->prepare($sql);
    $stmt->execute($args);
    return $stmt->fetchAll();
}

function execute_sql(PDO $db, string $sql, array $args = []): int {
    $stmt = $db->prepare($sql);
    $stmt->execute($args);
    return $stmt->rowCount();
}

function atomic(PDO $db, callable $work): mixed {
    $db->exec('BEGIN IMMEDIATE');
    try {
        $value = $work();
        $db->exec('COMMIT');
        return $value;
    } catch (Throwable $e) {
        $db->exec('ROLLBACK');
        throw $e;
    }
}

function now(): int { return time(); }

function fail(int $code, string $message): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function json_out(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function request_body(): array {
    if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
        fail(415, 'JSON obrigatório');
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 32768) fail(413, 'Conteúdo muito grande');
    $object = json_decode($raw);
    if (!$object instanceof stdClass) fail(400, 'JSON inválido');
    return (array) json_decode($raw, true);
}

function string_field(array $input, string $name, int $max = 255): string {
    $value = $input[$name] ?? '';
    if (!is_string($value) || strlen($value) > $max * 4) fail(422, 'Campo inválido: ' . $name);
    $value = trim($value);
    if ((function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value)) > $max) fail(422, 'Campo excessivo: ' . $name);
    return $value;
}

function validate_login(string $login): bool {
    return (bool) preg_match('/^[a-zA-Z0-9_.-]{3,40}$/D', $login);
}
function validate_password(string $password): bool {
    return strlen($password) >= 10 && strlen($password) <= 256;
}
function secure_password(string $password): string {
    return password_hash($password, PASSWORD_DEFAULT);
}
function session_user(PDO $db): ?array {
    $raw = $_COOKIE['bitdeer_session'] ?? '';
    if (!is_string($raw) || !preg_match('/^[a-f0-9]{64}$/D', $raw)) return null;
    return query_one($db, 'SELECT u.id, u.login, u.role, u.status, u.display_name, s.id AS session_id,
        s.csrf_token FROM sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at > ? AND u.status="active"',
        [hash('sha256', $raw), now()]);
}
function auth_user(PDO $db, bool $admin = false): array {
    $user = session_user($db);
    if ($user === null) fail(401, 'Sessão inválida ou conta suspensa');
    if ($admin && $user['role'] !== 'admin') fail(403, 'Acesso administrativo negado');
    return $user;
}
function check_csrf(array $user): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($user['csrf_token'], $token)) {
        fail(403, 'Token CSRF inválido');
    }
}
function audit(PDO $db, int $adminId, string $action, ?int $target, array $details = []): void {
    execute_sql($db, 'INSERT INTO admin_audit (admin_id, action, target_user_id, details_json, created_at)
       VALUES (?, ?, ?, ?, ?)',
       [$adminId, $action, $target, json_encode($details, JSON_THROW_ON_ERROR), now()]);
}
function public_user(array $row): array {
    return [
        'id' => (int) $row['id'], 'login' => $row['login'],
        'role' => $row['role'], 'status' => $row['status'],
        'displayName' => $row['display_name'],
    ];
}
function cookie_session(string $token, int $expires): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    setcookie('bitdeer_session', $token, [
        'expires' => $expires, 'path' => '/', 'secure' => $secure,
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}
function units_usd(int $units): string {
    return number_format($units / 864000000, 8, '.', '');
}
