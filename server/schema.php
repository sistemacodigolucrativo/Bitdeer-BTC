<?php
declare(strict_types=1);
require_once __DIR__ . '/core.php';
require_once __DIR__ . '/demo_marcelo.php';

/** Copy the packaged, sanitized SQLite seed into this installation's private data directory. */
function initialize_default_seed(): bool {
    $target = data_file();
    if (is_file($target)) return false;
    $source = dirname(__DIR__) . '/seed/bitdeer.sqlite';
    if (!is_file($source)) return false;
    $sourceReal = realpath($source);
    if ($sourceReal === false || $sourceReal === realpath($target)) {
        throw new RuntimeException('Invalid default database seed path');
    }
    $directory = dirname($target);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Cannot create private SQLite directory');
    }
    chmod($directory, 0700);
    $input = fopen($sourceReal, 'rb');
    $output = fopen($target, 'xb');
    if ($input === false || $output === false) {
        if (is_resource($input)) fclose($input);
        if (is_resource($output)) fclose($output);
        @unlink($target);
        throw new RuntimeException('Cannot initialize the default SQLite database');
    }
    $copied = stream_copy_to_stream($input, $output);
    fclose($input);
    fclose($output);
    if ($copied === false || $copied === 0) {
        @unlink($target);
        throw new RuntimeException('Could not copy the default SQLite database');
    }
    chmod($target, 0600);
    return true;
}

/** True only while a copied seed still awaits one-time installation credentials. */
function default_seed_pending(): bool {
    $path = data_file();
    if (!is_file($path)) return false;
    try {
        $db = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $db->exec('PRAGMA query_only=ON');
        $setting = query_one($db, 'SELECT value FROM app_settings WHERE name=?', ['install_seed_state']);
        return ($setting['value'] ?? null) === 'pending';
    } catch (Throwable) {
        return false;
    }
}

function generated_install_password(): string {
    return rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
}

function generated_install_referral_code(PDO $db): string {
    do {
        $code = 'USR' . strtoupper(bin2hex(random_bytes(5)));
    } while (query_one($db, 'SELECT user_id FROM referral_codes WHERE code=?', [$code]) !== null);
    return $code;
}

/** Store one-time CLI-created member credentials in the private SQLite directory. */
function save_default_member_credentials(array $created): ?string {
    if (empty($created['fromDefaultSeed'])) return null;
    $directory = dirname(data_file());
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        return null;
    }
    chmod($directory, 0700);
    $path = $directory . '/default-user-credentials.txt';
    $contents = "login={$created['founderLogin']}\n" .
        "password={$created['founderPassword']}\n" .
        "referral_code={$created['founderCode']}\n";
    if (file_put_contents($path, $contents, LOCK_EX) === false) return null;
    chmod($path, 0600);
    return $path;
}

/** Finish installation using the sanitized workspace database seed. */
function provision_from_default_seed(
    PDO $db,
    string $login,
    string $password,
    string $supportEmail,
    string $siteUrl,
    string $environment
): array {
    if (strcasecmp($login, 'user') === 0) {
        throw new InvalidArgumentException('O login do administrador não pode ser "user" nesta base padrão');
    }
    return atomic($db, static function () use ($db, $login, $password, $supportEmail, $siteUrl, $environment): array {
        $state = query_one($db, 'SELECT value FROM app_settings WHERE name=?', ['install_seed_state']);
        $admin = query_one($db, 'SELECT id FROM users WHERE role="admin" ORDER BY id LIMIT 1');
        $member = query_one($db, 'SELECT id FROM users WHERE role="member" AND login="user" COLLATE NOCASE LIMIT 1');
        $count = query_one($db, 'SELECT COUNT(*) AS n FROM users');
        if (($state['value'] ?? null) !== 'pending' || !$admin || !$member || (int)($count['n'] ?? 0) !== 2) {
            throw new RuntimeException('Sanitized default database is invalid; refusing to provision it');
        }

        $time = now();
        $memberPassword = generated_install_password();
        $referralCode = generated_install_referral_code($db);
        execute_sql($db, 'UPDATE users SET login=?,password_hash=?,role="admin",status="active",
            display_name="Administrador",email="",phone="",avatar_url="",avatar_locked=0,wallet_address="",updated_at=?
            WHERE id=?', [$login, secure_password($password), $time, (int)$admin['id']]);
        execute_sql($db, 'UPDATE users SET password_hash=?,status="active",display_name="Usuário padrão",
            email="",phone="",avatar_url="",avatar_locked=0,wallet_address="",updated_at=?
            WHERE id=?', [secure_password($memberPassword), $time, (int)$member['id']]);
        execute_sql($db, 'DELETE FROM sessions');
        execute_sql($db, 'DELETE FROM auth_attempts');
        execute_sql($db, 'DELETE FROM admin_notifications');
        execute_sql($db, 'DELETE FROM admin_notification_reads');

        execute_sql($db, 'INSERT INTO referral_codes(user_id,code,created_at) VALUES (?,?,?)
            ON CONFLICT(user_id) DO UPDATE SET code=excluded.code,created_at=excluded.created_at',
            [(int)$member['id'], $referralCode, $time]);

        $settings = [
            'support_email' => $supportEmail,
            'site_url' => $siteUrl,
            'environment_type' => $environment,
            'btc_address' => '',
            'btc_address_confirmed' => '0',
            'payment_mode' => 'simulation',
            'schema_version' => '1',
            'demo_new_investors_enabled' => '0',
        ];
        foreach ($settings as $name => $value) {
            execute_sql($db, 'INSERT INTO app_settings(name,value) VALUES (?,?)
                ON CONFLICT(name) DO UPDATE SET value=excluded.value', [$name, $value]);
        }
        execute_sql($db, 'DELETE FROM app_settings WHERE name="install_seed_state"');

        return [
            'founderLogin' => 'user',
            'founderPassword' => $memberPassword,
            'founderCode' => $referralCode,
            'fromDefaultSeed' => true,
        ];
    });
}

/** Provision one clean database, with a random-password founding member. */
function provision(string $login, string $password, string $supportEmail, string $siteUrl = '', string $environment = 'auto'): array {
    if (!validate_login($login) || !validate_password($password)) {
        throw new InvalidArgumentException('Admin login (3-40) and password (12-256) required');
    }
    if (!filter_var($supportEmail, FILTER_VALIDATE_EMAIL) || strlen($supportEmail) > 254) {
        throw new InvalidArgumentException('Valid support email required');
    }
    if ($siteUrl!=='' && (!filter_var($siteUrl,FILTER_VALIDATE_URL) ||
        !in_array((string)parse_url($siteUrl,PHP_URL_SCHEME),['http','https'],true) ||
        parse_url($siteUrl,PHP_URL_USER)!==null || parse_url($siteUrl,PHP_URL_PASS)!==null ||
        parse_url($siteUrl,PHP_URL_PATH)!==null || parse_url($siteUrl,PHP_URL_QUERY)!==null ||
        parse_url($siteUrl,PHP_URL_FRAGMENT)!==null)) {
        throw new InvalidArgumentException('URL pública inválida');
    }
    if (!in_array($environment,['auto','vps','shared'],true)) {
        throw new InvalidArgumentException('Tipo de hospedagem inválido');
    }
    $db = database(true);
    $db->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','archived')),
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  avatar_locked INTEGER NOT NULL DEFAULT 0 CHECK(avatar_locked IN (0,1)),
  wallet_address TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE, csrf_token TEXT NOT NULL,
  issued_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, revoked_at);
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents>=0),
  daily_cents INTEGER NOT NULL CHECK(daily_cents>=0),
  bonus_usd_cents INTEGER NOT NULL CHECK(bonus_usd_cents>=0),
  bonus_satoshis INTEGER NOT NULL CHECK(bonus_satoshis>=0),
  duration_days INTEGER NOT NULL CHECK(duration_days>=0),
  session_seconds INTEGER NOT NULL DEFAULT 0 CHECK(session_seconds>=0),
  restart_cooldown_seconds INTEGER NOT NULL DEFAULT 0 CHECK(restart_cooldown_seconds>=0),
  withdraw_min_cents INTEGER NOT NULL DEFAULT 0 CHECK(withdraw_min_cents>=0),
  withdraw_after_days INTEGER NOT NULL DEFAULT 0 CHECK(withdraw_after_days>=0),
  hashrate TEXT NOT NULL, server_model TEXT NOT NULL,
  available INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL REFERENCES plans(id),
  plan_snapshot_json TEXT NOT NULL,
  order_id INTEGER UNIQUE,
  started_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id, expires_at);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL REFERENCES plans(id), snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')),
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  approved_by INTEGER REFERENCES users(id), approved_at INTEGER,
  btc_address TEXT NOT NULL DEFAULT '', btc_sats INTEGER NOT NULL DEFAULT 0,
  quote_usd_cents INTEGER NOT NULL DEFAULT 0, quote_source TEXT NOT NULL DEFAULT '',
  quote_expires_at INTEGER NOT NULL DEFAULT 0,
  payment_ref TEXT UNIQUE,
  expired_at INTEGER,
  proof_url TEXT,
  proof_submitted_at INTEGER,
  payment_proof_url TEXT NOT NULL DEFAULT '',
  payment_proof_submitted_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_orders_expiry ON orders(status,expires_at);
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK(event_type IN
    ('activation_requested','vip_request','proof_submitted','proof_updated',
     'payment_confirmed','simulation_approved')),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  user_id INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL,
  simulation INTEGER NOT NULL DEFAULT 0 CHECK(simulation IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
  ON admin_notifications(created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS admin_notification_reads (
  notification_id INTEGER NOT NULL REFERENCES admin_notifications(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  read_at INTEGER NOT NULL,
  PRIMARY KEY(notification_id,admin_id)
);
CREATE TABLE IF NOT EXISTS mining_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  running INTEGER NOT NULL DEFAULT 0, last_accrual_at INTEGER,
  session_ends_at INTEGER, cooldown_until INTEGER,
  balance_units INTEGER NOT NULL DEFAULT 0,
  bonus_satoshis_balance INTEGER NOT NULL DEFAULT 0,
  last_bonus_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reward_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL, start_ts INTEGER NOT NULL, end_ts INTEGER NOT NULL,
  rate_daily_cents INTEGER NOT NULL, earned_units INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, start_ts, end_ts, plan_id)
);
CREATE TABLE IF NOT EXISTS bonus_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL, claimed_at INTEGER NOT NULL,
  bonus_usd_units INTEGER NOT NULL, bonus_satoshis INTEGER NOT NULL,
  UNIQUE(user_id, claimed_at)
);
CREATE INDEX IF NOT EXISTS idx_bonus_claims_user ON bonus_claims(user_id, claimed_at);
CREATE TABLE IF NOT EXISTS member_history_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK(kind IN ('accrual','bonus','purchase','withdrawal','subscription')),
  source_id INTEGER,
  payload_json TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN (0,1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id,kind,source_id)
);
CREATE INDEX IF NOT EXISTS idx_member_history_edits ON member_history_edits(user_id,kind,created_at);
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL, message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(notification_status IN ('pending','accepted','failed')),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  notification_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_tickets(user_id,created_at);
CREATE TABLE IF NOT EXISTS support_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ticket_replies ON support_replies(ticket_id,created_at);
CREATE TABLE IF NOT EXISTS mock_payment_feed (
  user_id INTEGER NOT NULL REFERENCES users(id),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 199),
  fake_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  usd_cents INTEGER NOT NULL,
  btc_sats INTEGER NOT NULL,
  occurred_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,ordinal)
);
CREATE TABLE IF NOT EXISTS mock_payment_cursor (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  next_ordinal INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS demo_new_investor_impressions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  shown_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,first_name),
  UNIQUE(user_id,last_name)
);
CREATE TABLE IF NOT EXISTS identity_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES users(id),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  verified_method TEXT NOT NULL, verification_reference TEXT NOT NULL,
  verified_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_identity_checks ON identity_checks(member_id,admin_id,expires_at);
CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, target_user_id INTEGER REFERENCES users(id),
  details_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS referral_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  invitee_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  invite_code TEXT NOT NULL,
  reward_usd_units INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referral_events(inviter_id,created_at);
CREATE TABLE IF NOT EXISTS language_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  language TEXT NOT NULL DEFAULT 'pt' CHECK(language IN ('pt','en','es'))
);
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  btc_address TEXT NOT NULL,
  usd_cents INTEGER NOT NULL CHECK(usd_cents>0),
  btc_satoshis INTEGER NOT NULL CHECK(btc_satoshis>0),
  quote_usd_cents INTEGER NOT NULL,
  quote_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  vip_state TEXT NOT NULL DEFAULT 'eligible'
    CHECK(vip_state IN ('eligible','awaiting_vip')),
  created_at INTEGER NOT NULL, processed_at INTEGER,
  processed_by INTEGER REFERENCES users(id), reference TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_withdraw_user ON withdraw_requests(user_id,created_at);
CREATE TABLE IF NOT EXISTS app_settings (
  name TEXT PRIMARY KEY, value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL, attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts ON auth_attempts(login, attempted_at);
SQL);
    $seedState = query_one($db, 'SELECT value FROM app_settings WHERE name=?', ['install_seed_state']);
    if (($seedState['value'] ?? null) === 'pending') {
        return provision_from_default_seed($db, $login, $password, $supportEmail, $siteUrl, $environment);
    }
    return atomic($db, static function () use ($db, $login, $password, $supportEmail, $siteUrl, $environment): array {
        if (query_one($db, 'SELECT id FROM users LIMIT 1') !== null ||
            query_one($db, 'SELECT name FROM app_settings LIMIT 1') !== null) {
            throw new RuntimeException('Database already provisioned; refusing to reset');
        }
        $time = now();
        // Values preserved from dailyRewards.ts and checkout/config.ts at 0d39b528.
        $plans = [
          ['FREE','FREE',0,100,50,10000,0,7200,0,'5.30 Gh/s','Antminer S19 (Plano Gratuito)'],
          ['VIP_01','VIP 01',2000,300,100,20000,30,0,0,'+ 275 Gh/s','Antminer S19 Pro (VIP 01)'],
          ['VIP_02','VIP 02',4000,600,150,20000,30,0,0,'+ 575 Gh/s','Antminer S19 XP (VIP 02)'],
          ['VIP_03','VIP 03',6000,1200,200,20000,30,0,0,'+ 975 Gh/s','WhatsMiner M50S+ (VIP 03)'],
          ['VIP_04','VIP 04',8000,2800,250,20000,30,0,0,'+ 5.4 Th/s','Bitmain Hydro Cluster (VIP 04 • 5.4 Th/s)'],
        ];
        foreach ($plans as $p) {
            execute_sql($db, 'INSERT INTO plans(id,name,price_cents,daily_cents,bonus_usd_cents,bonus_satoshis,duration_days,session_seconds,restart_cooldown_seconds,hashrate,server_model,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [...$p,$time]);
        }
        execute_sql($db, 'INSERT INTO users (login,password_hash,role,status,display_name,created_at,updated_at) VALUES (?,?,"admin","active",?,?,?)',
          [$login,secure_password($password),'Administrador',$time,$time]);
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("support_email",?)', [$supportEmail]);
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("site_url",?)',[$siteUrl]);
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("environment_type",?)',[$environment]);
        // The owner will configure the BTC receiving address later in Settings.
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("btc_address","")');
        // Owner must explicitly confirm control of the BTC address.
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("btc_address_confirmed","0")');
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("payment_mode","simulation")');
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("schema_version","1")');
        // The first member is Marcelo, with five months of clearly simulated
        // history. This fixture is created once, atomically with installation.
        $seed=seed_marcelo_demo($db,(int)query_one($db,
          'SELECT id FROM users WHERE login=?',[$login])['id']);
        return ['founderLogin'=>$seed['login'],'founderPassword'=>$seed['initialPassword'],
            'founderCode'=>$seed['referralCode']];
    });
}
