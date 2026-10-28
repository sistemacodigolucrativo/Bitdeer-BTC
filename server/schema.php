<?php
declare(strict_types=1);
require_once __DIR__ . '/core.php';

/**
 * Only CLI provisioning calls this function. The web installer is deliberately
 * blocked until technical decision 13 has been explicitly approved.
 */
function provision(string $login, string $password, string $supportEmail): void {
    if (!validate_login($login) || !validate_password($password)) {
        throw new InvalidArgumentException('Admin login (3-40) and password (10+) required');
    }
    if (!filter_var($supportEmail, FILTER_VALIDATE_EMAIL) || strlen($supportEmail) > 254) {
        throw new InvalidArgumentException('Valid support email required');
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
  payment_ref TEXT UNIQUE
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
CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, target_user_id INTEGER REFERENCES users(id),
  details_json TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (
  name TEXT PRIMARY KEY, value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL, attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts ON auth_attempts(login, attempted_at);
SQL);
    atomic($db, static function () use ($db, $login, $password, $supportEmail): void {
        if (query_one($db, 'SELECT id FROM users LIMIT 1') !== null ||
            query_one($db, 'SELECT name FROM app_settings LIMIT 1') !== null) {
            throw new RuntimeException('Database already provisioned; refusing to reset');
        }
        $time = now();
        // Values preserved from dailyRewards.ts and checkout/config.ts at 0d39b528.
        $plans = [
          ['FREE','FREE',0,100,50,10000,0,7200,7200,'5.30 Gh/s','Antminer S19 (Plano Gratuito)'],
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
        // Preserve the original public BTC receiving address from checkout/config.ts.
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("btc_address",?)',
          ['bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z']);
        execute_sql($db, 'INSERT INTO app_settings (name,value) VALUES ("schema_version","1")');
    });
}
