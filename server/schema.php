<?php
declare(strict_types=1);

/** Initial clean-install schema. No data is imported from localStorage. */
function bitdeer_initialize(PDO $db, string $adminLogin, string $adminPassword, string $supportEmail): void
{
    if (!preg_match('/^[a-zA-Z0-9_.-]{3,40}$/', $adminLogin)) {
        throw new InvalidArgumentException('Nome de administrador inválido.');
    }
    if (strlen($adminPassword) < 12) {
        throw new InvalidArgumentException('Senha administrativa deve ter no mínimo 12 caracteres.');
    }
    if (!filter_var($supportEmail, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('E-mail de suporte inválido.');
    }
    $db->exec('PRAGMA foreign_keys = ON');
    $db->exec('BEGIN IMMEDIATE');
    try {
        $db->exec(<<<'SQL'
CREATE TABLE users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 login TEXT NOT NULL COLLATE NOCASE UNIQUE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','archived')),
 name TEXT NOT NULL DEFAULT '',
 email TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 wallet_address TEXT NOT NULL DEFAULT '',
 gender TEXT NOT NULL DEFAULT '',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 revoked_at INTEGER
);
CREATE INDEX sessions_by_user ON sessions(user_id);
CREATE TABLE plans (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
 daily_cents INTEGER NOT NULL CHECK(daily_cents >= 0),
 bonus_cents INTEGER NOT NULL CHECK(bonus_cents >= 0),
 bonus_satoshis INTEGER NOT NULL CHECK(bonus_satoshis >= 0),
 duration_days INTEGER NOT NULL CHECK(duration_days >= 0),
 free_session_seconds INTEGER NOT NULL CHECK(free_session_seconds >= 0),
 hashrate_display TEXT NOT NULL,
 server_model TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL
);
CREATE TABLE orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id),
 plan_id TEXT NOT NULL REFERENCES plans(id),
 plan_snapshot TEXT NOT NULL,
 price_cents INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','expired')),
 payment_reference TEXT,
 confirmed_by INTEGER REFERENCES users(id),
 created_at INTEGER NOT NULL,
 confirmed_at INTEGER
);
CREATE TABLE subscriptions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id),
 plan_id TEXT NOT NULL REFERENCES plans(id),
 snapshot TEXT NOT NULL,
 plan_revision INTEGER NOT NULL,
 order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
 started_at INTEGER NOT NULL,
 ends_at INTEGER NOT NULL,
 activated_by INTEGER NOT NULL REFERENCES users(id)
);
CREATE INDEX subscriptions_by_user ON subscriptions(user_id,started_at,ends_at);
CREATE TABLE mining (
 user_id INTEGER PRIMARY KEY REFERENCES users(id),
 is_mining INTEGER NOT NULL DEFAULT 0,
 last_settled_at INTEGER NOT NULL,
 session_ends_at INTEGER,
 balance_units INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL
);
CREATE TABLE ledger (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id),
 kind TEXT NOT NULL,
 amount_units INTEGER NOT NULL,
 from_at INTEGER NOT NULL,
 until_at INTEGER NOT NULL,
 plan_id TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 CHECK(until_at >= from_at)
);
CREATE INDEX ledger_by_user ON ledger(user_id,id);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_id INTEGER REFERENCES users(id),
 action TEXT NOT NULL,
 target_type TEXT NOT NULL,
 target_id TEXT NOT NULL,
 metadata TEXT NOT NULL DEFAULT '{}',
 created_at INTEGER NOT NULL
);
CREATE TABLE login_attempts (
 key TEXT PRIMARY KEY,
 failures INTEGER NOT NULL DEFAULT 0,
 last_failure_at INTEGER NOT NULL
);
SQL);
        $now = time();
        $seed = [
            ['free','FREE',0,100,50,10000,0,1800,'5.30 Gh/s','Antminer S19 (Plano Gratuito)'],
            ['vip01','VIP 01',2000,300,100,20000,30,0,'+ 275 Gh/s','Antminer S19 Pro (VIP 01)'],
            ['vip02','VIP 02',4000,600,150,20000,30,0,'+ 575 Gh/s','Antminer S19 XP (VIP 02)'],
            ['vip03','VIP 03',6000,1200,200,20000,30,0,'+ 975 Gh/s','WhatsMiner M50S+ (VIP 03)'],
            ['vip04','VIP 04',8000,2800,250,20000,30,0,'+ 5.4 Th/s','Bitmain Hydro Cluster (VIP 04 • 5.4 Th/s)'],
        ];
        $put = $db->prepare('INSERT INTO plans(id,name,price_cents,daily_cents,bonus_cents,bonus_satoshis,duration_days,free_session_seconds,hashrate_display,server_model,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
        foreach ($seed as $p) { $put->execute([...$p,$now]); }
        $insert = $db->prepare("INSERT INTO users(login,password_hash,role,status,name,created_at,updated_at) VALUES(?,?,'admin','active',?,?,?)");
        $insert->execute([$adminLogin,password_hash($adminPassword,PASSWORD_DEFAULT),$adminLogin,$now,$now]);
        $db->prepare("INSERT INTO settings(key,value) VALUES('support_email',?)")->execute([$supportEmail]);
        $db->exec('COMMIT');
    } catch (Throwable $e) {
        $db->exec('ROLLBACK');
        throw $e;
    }
}
