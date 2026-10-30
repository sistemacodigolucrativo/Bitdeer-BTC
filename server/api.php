<?php
declare(strict_types=1);
require_once __DIR__ . '/core.php';
require_once __DIR__ . '/quote.php';
require_once __DIR__ . '/bitcoin.php';
require_once __DIR__ . '/member_history.php';

/* The reward unit exactly matches dailyRewards.ts:
 * one USD = 864,000,000 units; USD/day (in cents) yields cents * 100 units/s.
 * SQLite transactions serialize changes across devices and API calls.
 */
function plan_at(PDO $db, int $userId, int $at): array {
    $contract = query_one($db, 'SELECT * FROM contracts
        WHERE user_id=? AND started_at<=? AND expires_at>?
        ORDER BY started_at DESC,id DESC LIMIT 1', [$userId,$at,$at]);
    if ($contract !== null) {
        $snapshot = json_decode($contract['plan_snapshot_json'], true, 512, JSON_THROW_ON_ERROR);
        return ['id'=>$contract['plan_id'], 'daily_cents'=>(int)$snapshot['daily_cents'],
            'snapshot'=>$snapshot, 'expires'=>(int)$contract['expires_at']];
    }
    $free = query_one($db, 'SELECT * FROM plans WHERE id="FREE"');
    if ($free === null) throw new RuntimeException('FREE plan missing');
    return ['id'=>'FREE', 'daily_cents'=>(int)$free['daily_cents'],
        'snapshot'=>$free, 'expires'=>null];
}

/**
 * Call only inside BEGIN IMMEDIATE. This routine does not trust client elapsed
 * time, user plan fields or browser display state.
 */
function settle(PDO $db, int $userId, int $at): void {
    $state = query_one($db, 'SELECT * FROM mining_state WHERE user_id=?', [$userId]);
    if ($state === null || (int)$state['running'] !== 1) return;
    $user = query_one($db, 'SELECT status FROM users WHERE id=?', [$userId]);
    if ($user === null || $user['status'] !== 'active') return;
    $start = (int) ($state['last_accrual_at'] ?? $at);
    // NULL means continuous mining, used for VIP. A finite session is server-limited.
    $finiteEnd = $state['session_ends_at'] === null ? null : (int)$state['session_ends_at'];
    $limit = $finiteEnd === null ? $at : min($at, $finiteEnd);
    $startPlan = plan_at($db, $userId, $start);
    // A continuous VIP session must not turn into unlimited FREE mining after expiration.
    $contractEnd = $startPlan['expires'] === null ? null : (int)$startPlan['expires'];
    if ($contractEnd !== null) $limit = min($limit, $contractEnd);
    $limit = max($start, $limit);
    $earnedTotal = 0;
    $cursor = $start;
    while ($cursor < $limit) {
        $plan = plan_at($db, $userId, $cursor);
        $end = $limit;
        if ($plan['expires'] !== null) $end = min($end, $plan['expires']);
        // A future contract never begins before a prior activation is settled,
        // but cap at its first start for defensive period segmentation.
        $next = query_one($db, 'SELECT MIN(started_at) AS boundary FROM contracts
            WHERE user_id=? AND started_at>? AND started_at<?',
            [$userId,$cursor,$end]);
        if ($next !== null && $next['boundary'] !== null) $end = min($end, (int)$next['boundary']);
        if ($end <= $cursor) throw new RuntimeException('Invalid accrual boundary');
        $units = ($end-$cursor) * $plan['daily_cents'] * 100;
        $inserted=execute_sql($db, 'INSERT OR IGNORE INTO reward_ledger
           (user_id,plan_id,start_ts,end_ts,rate_daily_cents,earned_units,created_at)
           VALUES (?,?,?,?,?,?,?)',
           [$userId,$plan['id'],$cursor,$end,$plan['daily_cents'],$units,$at]);
        $earnedTotal += $inserted * $units;
        $cursor = $end;
    }
    // Since last_accrual_at advances in the same transaction, duplicate requests
    // cannot credit the same interval. INSERT OR IGNORE is an extra safety net.
    execute_sql($db, 'UPDATE mining_state SET last_accrual_at=?, balance_units=balance_units+?,
        updated_at=? WHERE user_id=?', [$limit,$earnedTotal,$at,$userId]);
    if (($finiteEnd !== null && $at >= $finiteEnd) ||
        ($contractEnd !== null && $at >= $contractEnd)) {
        $ended = $finiteEnd !== null && ($contractEnd === null || $finiteEnd <= $contractEnd);
        // A completed session is immediately restartable (no cooldown),
        // including users whose SQLite state previously held a wait deadline.
        execute_sql($db, 'UPDATE mining_state SET running=0,
             cooldown_until=NULL, updated_at=? WHERE user_id=?', [$at,$userId]);
    }
}

function member_snapshot(PDO $db, int $userId): array {
    $user = query_one($db, 'SELECT * FROM users WHERE id=?', [$userId]);
    $mining = query_one($db, 'SELECT * FROM mining_state WHERE user_id=?', [$userId]);
    if ($user === null || $mining === null) throw new RuntimeException('Member data missing');
    $plan = plan_at($db, $userId, now());
    return [
       'asOf'=>now(),
       'user'=>public_user($user),
       'profile'=>['displayName'=>$user['display_name'], 'email'=>$user['email'],
         'phone'=>$user['phone'],'walletAddress'=>$user['wallet_address']],
       'mining'=>['running'=>(bool)$mining['running'],
         'balanceUnits'=>(int)$mining['balance_units'],
         'balanceUsd'=>units_usd((int)$mining['balance_units']),
         'sessionEndsAt'=>$mining['session_ends_at'] === null ? null : (int)$mining['session_ends_at'],
         'cooldownUntil'=>$mining['cooldown_until'] === null ? null : (int)$mining['cooldown_until'],
         'bonusSatoshisBalance'=>(int)$mining['bonus_satoshis_balance'],
         'lastBonusAt'=>$mining['last_bonus_at'] === null ? null : (int)$mining['last_bonus_at']],
       'plan'=>['id'=>$plan['id'],'revision'=>(int)$plan['snapshot']['revision'],
         'dailyUsd'=>number_format($plan['daily_cents']/100,2,'.',''),
         'bonusUsd'=>number_format((int)$plan['snapshot']['bonus_usd_cents']/100,2,'.',''),
         'bonusSatoshis'=>(int)$plan['snapshot']['bonus_satoshis'],
         'hashrate'=>$plan['snapshot']['hashrate'] ?? '',
         'sessionSeconds'=>(int)($plan['snapshot']['session_seconds'] ?? 0),
         'restartCooldownSeconds'=>0, // Legacy field: restart is immediate, always.
         'expiresAt'=>$plan['expires'],
         'withdrawMinUsd'=>number_format((int)($plan['snapshot']['withdraw_min_cents']??0)/100,2,'.',''),
         'withdrawAfterDays'=>(int)($plan['snapshot']['withdraw_after_days']??0)],
    ];
}

function canonical_plan(array $p): array {
    return [
      'id'=>$p['id'],'name'=>$p['name'],'revision'=>(int)$p['revision'],
      'priceUsd'=>number_format((int)$p['price_cents']/100,2,'.',''),
      'dailyUsd'=>number_format((int)$p['daily_cents']/100,2,'.',''),
      'bonusUsd'=>number_format((int)$p['bonus_usd_cents']/100,2,'.',''),
      'bonusSatoshis'=>(int)$p['bonus_satoshis'],
      'durationDays'=>(int)$p['duration_days'],
      'sessionSeconds'=>(int)$p['session_seconds'],
      'restartCooldownSeconds'=>0, // Legacy field, no enforced waiting interval.
      'hashrate'=>$p['hashrate'],'serverModel'=>$p['server_model'],
      'available'=>(bool)$p['available'],
      'withdrawMinUsd'=>number_format((int)($p['withdraw_min_cents']??0)/100,2,'.',''),
      'withdrawAfterDays'=>(int)($p['withdraw_after_days']??0),
    ];
}
function param_id(array $body, string $key): int {
    $val = $body[$key] ?? null;
    if (!is_int($val) || $val <= 0) fail(422, 'Identificador inválido');
    return $val;
}
function require_post_csrf(PDO $db, bool $admin = false): array {
    $actor = auth_user($db, $admin);
    check_csrf($actor);
    return $actor;
}
function is_email_or_empty(string $email): bool {
    return $email === '' || (strlen($email)<=254 && (bool)filter_var($email,FILTER_VALIDATE_EMAIL));
}

function send_ticket_notification(PDO $db, int $ticketId): string {
    $ticket=query_one($db,'SELECT t.*,u.login FROM support_tickets t JOIN users u ON u.id=t.user_id
      WHERE t.id=?',[$ticketId]);
    if (!$ticket) return 'failed';
    $status='pending';
    // Delivery is explicitly opt-in. If mail() accepts a message, this means
    // handed to the local mail transport, NOT delivered to its recipient.
    if (getenv('BITDEER_ENABLE_MAIL') === '1') {
        $setting=query_one($db,'SELECT value FROM app_settings WHERE name="support_email"');
        $to=(string)($setting['value'] ?? '');
        $from=(string)(getenv('BITDEER_MAIL_FROM') ?: '');
        if (filter_var($to,FILTER_VALIDATE_EMAIL) && filter_var($from,FILTER_VALIDATE_EMAIL)) {
            $subject='[Bitdeer BTC] Ticket #'.$ticketId;
            $body="Atendimento Bitdeer BTC\nTicket #".$ticketId."\nLogin: ".$ticket['login'].
                "\nAssunto: ".$ticket['subject']."\n\n".$ticket['message'];
            $safeFrom=str_replace(["\r","\n"],'',$from);
            $accepted=@mail($to,$subject,$body,"From: ".$safeFrom."\r\nContent-Type: text/plain; charset=UTF-8");
            $status=$accepted?'accepted':'failed';
        } else {
            $status='failed';
        }
    }
    execute_sql($db,'UPDATE support_tickets SET notification_status=?,notification_at=?,updated_at=? WHERE id=?',
      [$status,now(),now(),$ticketId]);
    return $status;
}

/** Upgrade older SQLite installations without importing browser mock records. */
function ensure_referral_tables(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS referral_codes (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        code TEXT NOT NULL UNIQUE COLLATE NOCASE, created_at INTEGER NOT NULL
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS referral_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inviter_id INTEGER NOT NULL REFERENCES users(id),
        invitee_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        invite_code TEXT NOT NULL,
        reward_usd_units INTEGER NOT NULL,created_at INTEGER NOT NULL
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referral_events(inviter_id,created_at)');
}
function own_referral_code(PDO $db, int $owner): string {
    return atomic($db,static function() use ($db,$owner): string {
        $found=query_one($db,'SELECT code FROM referral_codes WHERE user_id=?',[$owner]);
        if ($found) return (string)$found['code'];
        $code=strtoupper(bin2hex(random_bytes(5)));
        execute_sql($db,'INSERT INTO referral_codes (user_id,code,created_at) VALUES (?,?,?)',
            [$owner,$code,now()]);
        return $code;
    });
}
/** Add fields to preexisting SQLite databases without erasing members or balances. */
function ensure_member_features(PDO $db): void {
    ensure_member_history_tables($db);
    $cols=array_column(query_all($db,'PRAGMA table_info(plans)'),'name');
    if (!in_array('withdraw_min_cents',$cols,true))
        $db->exec('ALTER TABLE plans ADD COLUMN withdraw_min_cents INTEGER NOT NULL DEFAULT 0');
    if (!in_array('withdraw_after_days',$cols,true))
        $db->exec('ALTER TABLE plans ADD COLUMN withdraw_after_days INTEGER NOT NULL DEFAULT 0');
    $db->exec("CREATE TABLE IF NOT EXISTS language_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      language TEXT NOT NULL DEFAULT 'pt' CHECK(language IN ('pt','en','es'))
    )");
    $db->exec("CREATE TABLE IF NOT EXISTS withdraw_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan_id TEXT NOT NULL, btc_address TEXT NOT NULL,
      usd_cents INTEGER NOT NULL CHECK(usd_cents>0),
      btc_satoshis INTEGER NOT NULL CHECK(btc_satoshis>0),
      quote_usd_cents INTEGER NOT NULL, quote_source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','approved','rejected')),
      vip_state TEXT NOT NULL DEFAULT 'eligible'
        CHECK(vip_state IN ('eligible','awaiting_vip')),
      created_at INTEGER NOT NULL, processed_at INTEGER,
      processed_by INTEGER REFERENCES users(id),reference TEXT NOT NULL DEFAULT ''
    )");
    $wcols=array_column(query_all($db,'PRAGMA table_info(withdraw_requests)'),'name');
    if(!in_array('vip_state',$wcols,true))
        $db->exec("ALTER TABLE withdraw_requests ADD COLUMN vip_state TEXT NOT NULL DEFAULT 'eligible'
            CHECK(vip_state IN ('eligible','awaiting_vip'))");
    $db->exec('CREATE INDEX IF NOT EXISTS idx_withdraw_user ON withdraw_requests(user_id,created_at)');
    $ticketCols=array_column(query_all($db,'PRAGMA table_info(support_tickets)'),'name');
    if(!in_array('workflow_state',$ticketCols,true)) {
        $db->exec("ALTER TABLE support_tickets ADD COLUMN workflow_state TEXT NOT NULL DEFAULT 'open'
          CHECK(workflow_state IN ('open','replied','closed','deleted'))");
        $db->exec('UPDATE support_tickets SET workflow_state="closed" WHERE status="resolved"');
    }
    $db->exec("CREATE TABLE IF NOT EXISTS support_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
      admin_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL, created_at INTEGER NOT NULL
    )");
    $db->exec('CREATE INDEX IF NOT EXISTS idx_ticket_replies ON support_replies(ticket_id,created_at)');
    $db->exec("CREATE TABLE IF NOT EXISTS mock_payment_feed (
      user_id INTEGER NOT NULL REFERENCES users(id),ordinal INTEGER NOT NULL
        CHECK(ordinal BETWEEN 0 AND 199),
      fake_hash TEXT NOT NULL, display_name TEXT NOT NULL,
      usd_cents INTEGER NOT NULL, btc_sats INTEGER NOT NULL,
      occurred_at INTEGER NOT NULL,PRIMARY KEY(user_id,ordinal)
    )");
    $db->exec("CREATE TABLE IF NOT EXISTS mock_payment_cursor (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      next_ordinal INTEGER NOT NULL DEFAULT 0
    )");
    $db->exec('INSERT OR IGNORE INTO app_settings(name,value) VALUES ("payment_mode","simulation")');

}
/** Only the original four VIP tiers unlock review of an internal payout request. */
function vip_eligible_at(PDO $db,int $memberId,int $at): bool {
    $contract=query_one($db,'SELECT id FROM contracts WHERE user_id=?
      AND started_at<=? AND expires_at>? AND plan_id IN ("VIP_01","VIP_02","VIP_03","VIP_04")
      ORDER BY id DESC LIMIT 1',[$memberId,$at,$at]);
    return $contract!==null;
}
function is_valid_member_phone(string $value): bool {
    if ($value==='') return true;
    if (!preg_match('/^\\+?[0-9 ()-]{10,25}$/D',$value)) return false;
    $digits=preg_replace('/\\D/','',$value);
    if (!is_string($digits)) return false;
    if (str_starts_with($digits,'55') && in_array(strlen($digits),[12,13],true))
        $digits=substr($digits,2);
    return in_array(strlen($digits),[10,11],true) &&
        preg_match('/^[1-9][0-9]/D',$digits)===1;
}
function api_dispatch(PDO $db, string $action, string $method): never {
    ensure_member_features($db);
    if ($action === 'health' && $method === 'GET') json_out(['ok'=>true,'version'=>'php-sqlite-1']);
    if ($action === 'support' && $method === 'GET') {
        $setting = query_one($db,'SELECT value FROM app_settings WHERE name="support_email"');
        json_out(['email'=>$setting['value'] ?? '']);
    }
    if ($action === 'support.ticket.create' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Apenas membros podem abrir tickets');
        $body=request_body();
        $subject=string_field($body,'subject',120);
        $message=string_field($body,'message',2500);
        if (mb_strlen($subject)<3 || mb_strlen($message)<10 ||
            preg_match('/[\x00-\x1F\x7F]/',$subject)) {
            fail(422,'Preencha o assunto e a descrição do atendimento');
        }
        $id=atomic($db, static function() use($db,$actor,$subject,$message): int {
            $recent=query_one($db,'SELECT COUNT(*) AS n FROM support_tickets WHERE user_id=? AND created_at>?',
                [$actor['id'],now()-3600]);
            if ((int)$recent['n']>=5) fail(429,'Limite de cinco tickets por hora');
            $at=now();
            execute_sql($db,'INSERT INTO support_tickets(user_id,subject,message,created_at,updated_at)
                VALUES (?,?,?,?,?)',[$actor['id'],$subject,$message,$at,$at]);
            return (int)$db->lastInsertId();
        });
        // Persist before attempting transport. Never claim an email was delivered.
        send_ticket_notification($db,$id);
        $ticket=query_one($db,'SELECT id,status,notification_status,created_at FROM support_tickets WHERE id=?',[$id]);
        json_out(['ticket'=>$ticket],201);
    }
    if ($action === 'support.tickets.mine' && $method === 'GET') {
        $actor=auth_user($db);
        if ($actor['role'] !== 'member') fail(403,'Apenas membros');
        json_out(['tickets'=>query_all($db,'SELECT t.id,t.subject,t.message,t.status,t.notification_status,t.created_at,
          t.workflow_state AS ticket_state,
          (SELECT r.message FROM support_replies r WHERE r.ticket_id=t.id
            ORDER BY r.id DESC LIMIT 1) AS admin_reply
          FROM support_tickets t WHERE t.user_id=? AND t.workflow_state!="deleted"
          ORDER BY t.id DESC LIMIT 100',[$actor['id']])]);
    }
    if ($action === 'admin.support.tickets' && $method === 'GET') {
        auth_user($db,true);
        json_out(['tickets'=>query_all($db,'SELECT t.id,t.user_id,u.login,t.subject,t.message,
           t.status,t.workflow_state AS ticket_state,t.notification_status,t.created_at,t.notification_at,
           (SELECT r.message FROM support_replies r WHERE r.ticket_id=t.id
            ORDER BY r.id DESC LIMIT 1) AS admin_reply
           FROM support_tickets t JOIN users u ON u.id=t.user_id
           WHERE t.workflow_state!="deleted" ORDER BY t.id DESC LIMIT 100')]);
    }
    if ($action === 'admin.support.status' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $body=request_body();
        $id=param_id($body,'ticketId');
        $status=string_field($body,'status',16);
        if (!in_array($status,['open','resolved'],true)) fail(422,'Estado inválido');
        atomic($db,static function() use($db,$actor,$id,$status):void {
            if (!query_one($db,'SELECT id FROM support_tickets WHERE id=?',[$id]))
                fail(404,'Ticket não encontrado');
            execute_sql($db,'UPDATE support_tickets SET status=?,workflow_state=?,updated_at=? WHERE id=? AND workflow_state!="deleted"',
                [$status,$status==='resolved'?'closed':'open',now(),$id]);
            audit($db,(int)$actor['id'],'ticket.status',null,['ticketId'=>$id,'status'=>$status]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.support.reply' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $id=param_id($body,'ticketId');$message=string_field($body,'message',2500);
        if(mb_strlen($message)<2) fail(422,'Digite uma resposta de pelo menos dois caracteres');
        atomic($db,static function() use($db,$actor,$id,$message):void {
            $ticket=query_one($db,'SELECT id,workflow_state FROM support_tickets WHERE id=?',[$id]);
            if(!$ticket) fail(404,'Ticket não encontrado');
            if(!in_array($ticket['workflow_state'],['open','replied'],true))
                fail(409,'Ticket fechado ou excluído. Reabra para responder');
            $time=now();
            execute_sql($db,'INSERT INTO support_replies(ticket_id,admin_id,message,created_at)
                VALUES (?,?,?,?)',[$id,$actor['id'],$message,$time]);
            execute_sql($db,'UPDATE support_tickets SET workflow_state="replied",status="open",
                updated_at=? WHERE id=?',[$time,$id]);
            audit($db,(int)$actor['id'],'ticket.reply',null,['ticketId'=>$id]);
        });
        json_out(['ok'=>true,'ticketState'=>'replied']);
    }
    if ($action === 'admin.support.manage' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $id=param_id($body,'ticketId');$operation=string_field($body,'operation',10);
        if(!in_array($operation,['close','reopen','delete'],true))fail(422,'Operação inválida');
        atomic($db,static function() use($db,$actor,$id,$operation):void {
            $ticket=query_one($db,'SELECT id,workflow_state FROM support_tickets WHERE id=?',[$id]);
            if(!$ticket || $ticket['workflow_state']==='deleted')fail(404,'Ticket indisponível');
            $target=$operation==='close'?'closed':($operation==='delete'?'deleted':'open');
            $legacy=$target==='closed'?'resolved':'open';
            execute_sql($db,'UPDATE support_tickets SET workflow_state=?,status=?,updated_at=? WHERE id=?',
                [$target,$legacy,now(),$id]);
            audit($db,(int)$actor['id'],'ticket.'.$operation,null,['ticketId'=>$id]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.support.notify' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $id=param_id(request_body(),'ticketId');
        $ticket=query_one($db,'SELECT id FROM support_tickets WHERE id=?',[$id]);
        if (!$ticket) fail(404,'Ticket não encontrado');
        $notification=send_ticket_notification($db,$id);
        audit($db,(int)$actor['id'],'ticket.notify',null,['ticketId'=>$id,'status'=>$notification]);
        json_out(['notificationStatus'=>$notification]);
    }
    if ($action === 'plans' && $method === 'GET') {
        $plans = query_all($db,'SELECT * FROM plans WHERE available=1 ORDER BY price_cents,id');
        json_out(['plans'=>array_map('canonical_plan',$plans)]);
    }
    if ($action === 'referrals.mine' && $method === 'GET') {
        $actor=auth_user($db);
        if ($actor['role']!=='member') fail(403,'Acesso restrito ao membro');
        ensure_referral_tables($db);
        $owner=(int)$actor['id'];
        $code=own_referral_code($db,$owner);
        $items=query_all($db,'SELECT e.id,e.created_at,e.reward_usd_units,u.login
          FROM referral_events e JOIN users u ON u.id=e.invitee_id
          WHERE e.inviter_id=? ORDER BY e.id DESC LIMIT 100',[$owner]);
        $history=[];
        foreach ($items as $row) {
            $user=(string)$row['login'];
            $history[]=['id'=>(int)$row['id'],
                'referredAlias'=>substr($user,0,2).'***',
                'createdAt'=>(int)$row['created_at'],
                'rewardUsd'=>units_usd((int)$row['reward_usd_units'])];
        }
        $total=query_one($db,'SELECT COALESCE(SUM(reward_usd_units),0) AS units,
          COUNT(*) AS count FROM referral_events WHERE inviter_id=?',[$owner]);
        json_out(['code'=>$code,'history'=>$history,
          'totalUsd'=>units_usd((int)$total['units']),'count'=>(int)$total['count'],
          'source'=>'sqlite','unit'=>'internal_usd']);
    }
    if ($action === 'register' && $method === 'POST') {
        $body=request_body();
        $login=string_field($body,'login',40);
        $password=$body['password'] ?? '';
        $name=string_field($body,'displayName',120);
        $invite=strtoupper(string_field($body,'inviteCode',20));
        if (!validate_login($login) || !is_string($password) || !validate_password($password)) {
            fail(422,'Usuário ou senha inválidos (mínimo 10 caracteres para senha)');
        }
        if ($invite!=='' && !preg_match('/^[A-F0-9]{10}$/D',$invite)) {
            fail(422,'Código de indicação inválido');
        }
        ensure_referral_tables($db);
        $id=atomic($db,static function() use ($db,$login,$password,$name,$invite): int {
            if (query_one($db,'SELECT id FROM users WHERE login=?',[$login])!==null) fail(409,'Usuário já cadastrado');
            $inviter=null;
            if ($invite!=='') {
                $inviter=query_one($db,'SELECT c.user_id FROM referral_codes c JOIN users u ON u.id=c.user_id
                    WHERE c.code=? AND u.role="member" AND u.status="active"',[$invite]);
                if (!$inviter) fail(422,'Código de indicação inexistente ou inativo');
            }
            $time=now();
            execute_sql($db,'INSERT INTO users (login,password_hash,role,status,display_name,created_at,updated_at)
              VALUES (?,?,"member","active",?,?,?)',
              [$login,secure_password($password),$name,$time,$time]);
            $id=(int)$db->lastInsertId();
            execute_sql($db,'INSERT INTO mining_state(user_id,updated_at) VALUES (?,?)',[$id,$time]);
            if ($inviter) {
                // Existing US$1/signup rule: internal ledger only, never external BTC.
                $units=864000000;
                execute_sql($db,'INSERT INTO referral_events(inviter_id,invitee_id,invite_code,reward_usd_units,created_at)
                  VALUES (?,?,?,?,?)',[(int)$inviter['user_id'],$id,$invite,$units,$time]);
                execute_sql($db,'UPDATE mining_state SET balance_units=balance_units+?,updated_at=? WHERE user_id=?',
                  [$units,$time,(int)$inviter['user_id']]);
            }
            return $id;
        });
        json_out(['id'=>$id,'role'=>'member'],201);
    }
    if ($action === 'login' && $method === 'POST') {
        $body = request_body();
        $login = string_field($body,'login',40);
        $password = $body['password'] ?? '';
        if (!is_string($password) || strlen($password) > 256) fail(401,'Credenciais inválidas');
        $result = atomic($db, static function () use ($db,$login,$password): ?array {
            $recent = query_one($db,'SELECT COUNT(*) AS n FROM auth_attempts WHERE login=? AND attempted_at>?',
              [$login,now()-900]);
            if ((int)($recent['n'] ?? 0) >= 10) fail(429,'Muitas tentativas. Tente mais tarde.');
            $user = query_one($db,'SELECT * FROM users WHERE login=?',[$login]);
            if (!$user || !password_verify($password,$user['password_hash']) || $user['status'] !== 'active') {
                execute_sql($db,'INSERT INTO auth_attempts(login,attempted_at) VALUES (?,?)',[$login,now()]);
                return null;
            }
            execute_sql($db,'DELETE FROM auth_attempts WHERE login=?',[$login]);
            $token=bin2hex(random_bytes(32));$csrf=bin2hex(random_bytes(32));$expires=now()+604800;
            execute_sql($db,'INSERT INTO sessions(user_id,token_hash,csrf_token,issued_at,expires_at) VALUES (?,?,?,?,?)',
              [$user['id'],hash('sha256',$token),$csrf,now(),$expires]);
            return ['user'=>public_user($user),'token'=>$token,'csrf'=>$csrf,'expires'=>$expires];
        });
        if ($result === null) fail(401,'Credenciais inválidas');
        cookie_session($result['token'],$result['expires']);
        json_out(['user'=>$result['user'],'csrfToken'=>$result['csrf']]);
    }
    if ($action === 'session' && $method === 'GET') {
        $actor = auth_user($db);
        json_out(['user'=>public_user($actor),'csrfToken'=>$actor['csrf_token']]);
    }
    if ($action === 'logout' && $method === 'POST') {
        $actor = require_post_csrf($db);
        execute_sql($db,'UPDATE sessions SET revoked_at=? WHERE id=?',[now(),$actor['session_id']]);
        cookie_session('',now()-3600);
        json_out(['ok'=>true]);
    }
    if ($action === 'language.preference' && $method === 'GET') {
        $actor=auth_user($db);
        $row=query_one($db,'SELECT language FROM language_preferences WHERE user_id=?',[$actor['id']]);
        json_out(['language'=>$row['language']??null]);
    }
    if ($action === 'language.preference' && $method === 'POST') {
        $actor=require_post_csrf($db);
        $language=string_field(request_body(),'language',2);
        if (!in_array($language,['pt','en','es'],true)) fail(422,'Idioma inválido');
        execute_sql($db,'INSERT INTO language_preferences(user_id,language) VALUES (?,?)
          ON CONFLICT(user_id) DO UPDATE SET language=excluded.language',[$actor['id'],$language]);
        json_out(['ok'=>true,'language'=>$language]);
    }
    if ($action === 'profile' && $method === 'GET') {
        $actor=auth_user($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $result=atomic($db, static function () use ($db,$actor): array {
            settle($db,(int)$actor['id'],now());
            return member_snapshot($db,(int)$actor['id']);
        });
        json_out($result);
    }
    if ($action === 'profile.update' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $body=request_body();
        $name=string_field($body,'displayName',120);$email=string_field($body,'email',254);
        $phone=string_field($body,'phone',30);$wallet=string_field($body,'walletAddress',150);
        if ($name === '' || !is_email_or_empty($email) || !is_valid_member_phone($phone)) fail(422,'Nome, e-mail ou telefone inválido');
        if ($wallet!=='' && !btc_receive_address_valid($wallet)) fail(422,'Carteira Bitcoin inválida');
        execute_sql($db,'UPDATE users SET display_name=?,email=?,phone=?,wallet_address=?,updated_at=? WHERE id=?',
          [$name,$email,$phone,$wallet,now(),$actor['id']]);
        json_out(['ok'=>true]);
    }
    if ($action === 'mining.start' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $result=atomic($db, static function () use ($db,$actor): array {
            $userId=(int)$actor['id'];$time=now();settle($db,$userId,$time);
            $row=query_one($db,'SELECT * FROM mining_state WHERE user_id=?',[$userId]);
            if ((int)$row['running']===1) fail(409,'Mineração já iniciada');
            $plan = plan_at($db,$userId,$time);
            $seconds = (int)($plan['snapshot']['session_seconds'] ?? 0);
            // If VIP expires first, stop at that boundary even for continuous plans.
            $expires = $plan['expires'];
            $sessionEnd = $seconds > 0 ? $time + $seconds : null;
            if ($expires !== null) $sessionEnd = $sessionEnd === null
                ? $expires : min($sessionEnd, $expires);
            execute_sql($db,'UPDATE mining_state SET running=1,last_accrual_at=?,session_ends_at=?,cooldown_until=NULL,updated_at=? WHERE user_id=?',
              [$time,$sessionEnd,$time,$userId]);
            return member_snapshot($db,$userId);
        });
        json_out($result);
    }
    if ($action === 'mining.stop' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $result=atomic($db, static function () use ($db,$actor): array {
            $userId=(int)$actor['id'];$time=now();settle($db,$userId,$time);
            $plan = plan_at($db,$userId,$time);
            // Explicit pause also allows immediate restart, without creating
            // an artificial waiting interval or overwriting historic rewards.
            execute_sql($db,'UPDATE mining_state SET running=0,last_accrual_at=NULL,
                  session_ends_at=NULL,cooldown_until=NULL,updated_at=? WHERE user_id=?',
              [$time,$userId]);
            return member_snapshot($db,$userId);
        });
        json_out($result);
    }
    if ($action === 'rewards.claim' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $result=atomic($db, static function () use ($db,$actor): array {
            $userId=(int)$actor['id'];$time=now();
            settle($db,$userId,$time);
            $state=query_one($db,'SELECT last_bonus_at FROM mining_state WHERE user_id=?',[$userId]);
            if ($state === null) fail(404,'Estado de mineração não encontrado');
            if ($state['last_bonus_at'] !== null && $time-(int)$state['last_bonus_at']<86400) {
                fail(409,'Bônus diário disponível apenas 24 horas após o último resgate');
            }
            $plan=plan_at($db,$userId,$time);
            $cents=(int)$plan['snapshot']['bonus_usd_cents'];
            $sats=(int)$plan['snapshot']['bonus_satoshis'];
            $units=$cents*8640000;
            execute_sql($db,'UPDATE mining_state
              SET balance_units=balance_units+?,
                bonus_satoshis_balance=bonus_satoshis_balance+?,
                last_bonus_at=?,updated_at=? WHERE user_id=?',
              [$units,$sats,$time,$time,$userId]);
            execute_sql($db,'INSERT INTO bonus_claims(user_id,plan_id,claimed_at,bonus_usd_units,bonus_satoshis)
              VALUES (?,?,?,?,?)',[$userId,$plan['id'],$time,$units,$sats]);
            return member_snapshot($db,$userId);
        });
        json_out($result);
    }
    if ($action === 'leaderboard' && $method === 'GET') {
        $actor=auth_user($db);
        if ($actor['role'] !== 'member') fail(403,'Apenas membros');
        // No invented BTC amounts or member names; internal reward ledger only.
        $ranked=query_all($db,'SELECT SUM(earned_units) AS units,COUNT(*) AS intervals
            FROM reward_ledger JOIN users u ON u.id=reward_ledger.user_id
            WHERE u.role="member" AND u.status="active"
            GROUP BY reward_ledger.user_id HAVING SUM(earned_units)>0
            ORDER BY units DESC, reward_ledger.user_id ASC LIMIT 20');
        $results=[];
        foreach ($ranked as $idx=>$record) {
            $results[]=['rank'=>$idx+1,'alias'=>'Minerador '.str_pad((string)($idx+1),2,'0',STR_PAD_LEFT),
                'balanceUsd'=>units_usd((int)$record['units']),
                'intervals'=>(int)$record['intervals']];
        }
        json_out(['miners'=>$results,'unit'=>'internal_usd','source'=>'reward_ledger']);
    }
    if ($action === 'contracts.mine' && $method === 'GET') {
        $actor=auth_user($db);
        if($actor['role']!=='member')fail(403,'Apenas membros');
        json_out(['contracts'=>history_rows($db,(int)$actor['id'],'subscription')]);
    }
    if ($action === 'ledger' && $method === 'GET') {
        $actor=auth_user($db);
        if($actor['role']!=='member')fail(403,'Conta de membro necessária');
        json_out(['accruals'=>history_rows($db,(int)$actor['id'],'accrual'),
                  'bonuses'=>history_rows($db,(int)$actor['id'],'bonus')]);
    }
    if ($action === 'orders.create' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role'] !== 'member') fail(403,'Conta de membro necessária');
        $body=request_body();$id=string_field($body,'planId',60);
        $plan=query_one($db,'SELECT * FROM plans WHERE id=? AND available=1 AND id!="FREE"',[$id]);
        if (!$plan) fail(422,'Plano não disponível');
        // Never expose payable QR codes until the receiving wallet has
        // been confirmed by an administrator who controls the wallet.
        $confirmed=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address_confirmed"');
        if (($confirmed['value'] ?? '')!=='1') {
            fail(409,'Recebimento BTC desativado. O administrador precisa confirmar o endereço de recebimento.');
        }
        // Do not trust a browser exchange rate or payment address.
        $quote=verified_btc_quote($db);
        $sats=satoshi_payment((int)$plan['price_cents'], $quote['usd']);
        $addressRow=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address"');
        $address=(string)($addressRow['value'] ?? '');
        if (!btc_receive_address_valid($address)) {
            fail(503,'Endereço de recebimento BTC não configurado');
        }
        $order=atomic($db, static function () use ($db,$actor,$plan,$quote,$sats,$address): int {
            $time=now();
            // Recheck active plan and pricing inside the write transaction.
            // Re-check wallet confirmation inside the payment write transaction.
            $flag=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address_confirmed"');
            $wallet=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address"');
            if (($flag['value']??'0')!=='1' || ($wallet['value']??'')!==$address) {
                fail(409,'Carteira alterada. Solicite uma nova cotação.');
            }
            $current=query_one($db,'SELECT * FROM plans WHERE id=? AND available=1',[$plan['id']]);
            if (!$current || (int)$current['revision']!==(int)$plan['revision']) fail(409,'Plano alterado; tente novamente');
            $active=query_one($db,'SELECT id FROM contracts WHERE user_id=? AND started_at<=? AND expires_at>?',
                [$actor['id'],$time,$time]);
            if ($active) fail(409,'Já existe contratação VIP ativa');
            execute_sql($db,'INSERT INTO orders(user_id,plan_id,snapshot_json,status,created_at,expires_at,
                 btc_address,btc_sats,quote_usd_cents,quote_source)
                 VALUES (?,?,?,"pending",?,?,?,?,?,?)',
                [$actor['id'],$plan['id'],json_encode($plan,JSON_THROW_ON_ERROR),$time,$time+900,
                    $address,$sats,(int)round($quote['usd']*100),$quote['source']]);
            return (int)$db->lastInsertId();
        });
        json_out(['orderId'=>$order,'status'=>'pending','activation'=>'manual',
          'priceUsd'=>number_format($plan['price_cents']/100,2,'.',''),
          'quoteRateUsd'=>number_format($quote['usd'],2,'.',''),
          'quoteSource'=>$quote['source'],
          'btcAddress'=>$address,'btcSatoshis'=>$sats,
          'btcAmount'=>number_format($sats/100000000,8,'.',''),
          'expiresAt'=>$quote['quoted_at']+900],201);
    }
    if ($action === 'mock.payments.latest' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if($actor['role']!=='member') fail(403,'Apenas membros');
        $body=request_body();
        $timezoneName=$body['timezone']??'UTC';
        // The viewer's IANA timezone determines today/yesterday, including DST.
        if(!is_string($timezoneName) ||
            !in_array($timezoneName,DateTimeZone::listIdentifiers(DateTimeZone::ALL_WITH_BC),true))
            fail(422,'Fuso horário inválido');
        $timezone=new DateTimeZone($timezoneName);
        $today=(new DateTimeImmutable('now',$timezone))->setTime(0,0,0);
        $todayStart=$today->getTimestamp();
        $yesterdayStart=$today->modify('-1 day')->getTimestamp();
        $currentTime=now();
        // Never use a fixed illustrative BTC/USD rate or an expired quote.
        $quote=verified_btc_quote($db);
        $given=['Ana','Bruno','Carla','Daniel','Eduarda','Felipe','Gabriela',
            'Henrique','Isabela','João','Larissa','Marcos','Natália','Pedro',
            'Renata','Rafael','Camila','Tiago','Luana','Sofia'];
        $family=['Azevedo','Barros','Costa','Dias','Esteves','Farias',
            'Gomes','Lopes','Mendes','Nogueira'];
        $records=[];
        for($i=0;$i<10;$i++) {
            $usdCents=random_int(500,150000);
            $btcSatoshis=satoshi_payment($usdCents,(float)$quote['usd']);
            $start=$i<5?$todayStart:$yesterdayStart;
            $end=$i<5?$currentTime:$todayStart-1;
            $records[]=[
                'hash'=>'SIM-'.bin2hex(random_bytes(16)),
                'name'=>$given[random_int(0,count($given)-1)].' '.
                        $family[random_int(0,count($family)-1)],
                'valueUsd'=>number_format($usdCents/100,2,'.',''),
                'btc'=>number_format($btcSatoshis/100000000,8,'.',''),
                'createdAt'=>random_int($start,max($start,$end))
            ];
        }
        usort($records,static fn($a,$b)=>$b['createdAt']<=>$a['createdAt']);
        // Purely fictional samples, generated afresh; no ledger, cursor or BTC transfer.
        json_out(['records'=>$records,'total'=>10,'simulation'=>true,
            'quoteUsd'=>number_format($quote['usd'],2,'.',''),
            'quoteSource'=>$quote['source'],'quotedAt'=>$quote['quoted_at']]);
    }
    if ($action === 'withdraw.quote' && $method === 'GET') {
        $actor=auth_user($db);
        if ($actor['role']!=='member') fail(403,'Acesso restrito ao membro');
        $quote=verified_btc_quote($db);
        json_out(['btcUsd'=>number_format($quote['usd'],2,'.',''),
          'source'=>$quote['source'],'quotedAt'=>$quote['quoted_at'],
          'validForSeconds'=>max(0,60-(time()-$quote['quoted_at'])),
          'simulation'=>true]);
    }
    if ($action === 'withdraw.mine' && $method === 'GET') {
        $actor=auth_user($db);
        if($actor['role']!=='member')fail(403,'Acesso restrito ao membro');
        json_out(['requests'=>history_rows($db,(int)$actor['id'],'withdrawal'),
                  'simulation'=>true]);
    }
    if ($action === 'withdraw.request' && $method === 'POST') {
        $actor=require_post_csrf($db);
        if ($actor['role']!=='member') fail(403,'Acesso restrito ao membro');
        $body=request_body();
        $mode=string_field($body,'mode',4);
        $amount=string_field($body,'amount',35);
        if (!in_array($mode,['USD','BTC'],true)) fail(422,'Escolha USD ou BTC');
        if ($mode==='USD' && !preg_match('/^(?:[0-9]{1,10})(?:\\.[0-9]{1,2})?$/D',$amount))
            fail(422,'Valor USD inválido, use até duas casas decimais');
        if ($mode==='BTC' && !preg_match('/^(?:0|[1-9][0-9]{0,3})(?:\\.[0-9]{1,8})?$/D',$amount))
            fail(422,'Valor BTC inválido, use até oito casas decimais');
        $quote=verified_btc_quote($db);
        if ($mode==='USD') {
            $parts=explode('.',$amount);
            $cents=((int)$parts[0])*100 + (int)str_pad($parts[1]??'0',2,'0');
            if ($cents<1 || $cents>100000000) fail(422,'Valor fora dos limites');
            $sats=satoshi_payment($cents,$quote['usd']);
        } else {
            $parts=explode('.',$amount);
            $sats=((int)$parts[0])*100000000 + (int)str_pad($parts[1]??'0',8,'0');
            $cents=btc_satoshis_to_usd_cents($sats,$quote['usd']);
            if ($sats<1 || $cents<1 || $cents>100000000) fail(422,'Valor fora dos limites');
        }
        $request=atomic($db,static function() use($db,$actor,$quote,$cents,$sats): array {
            $uid=(int)$actor['id'];
            $at=now();
            settle($db,$uid,$at);
            $u=query_one($db,'SELECT created_at,wallet_address,status FROM users WHERE id=?',[$uid]);
            if (!$u || $u['status']!=='active') fail(403,'Membro inativo');
            $wallet=(string)$u['wallet_address'];
            if (!btc_receive_address_valid($wallet))
                fail(409,'Cadastre sua carteira Bitcoin antes de solicitar um saque');
            $plan=plan_at($db,$uid,$at);
            $snapshot=$plan['snapshot'];
            $min=(int)($snapshot['withdraw_min_cents']??0);
            $days=(int)($snapshot['withdraw_after_days']??0);
            $start=(int)$u['created_at'];
            if ($plan['id']!=='FREE') {
                $contract=query_one($db,'SELECT started_at FROM contracts
                  WHERE user_id=? AND started_at<=? AND expires_at>? ORDER BY id DESC LIMIT 1',
                  [$uid,$at,$at]);
                $start=(int)($contract['started_at']??$start);
            }
            if ($at<$start+$days*86400)
                fail(409,'O plano exige aguardar o prazo mínimo antes do saque');
            if ($cents<$min) fail(409,'Valor abaixo do mínimo de saque do plano');
            $units=$cents*8640000;
            $state=query_one($db,'SELECT balance_units FROM mining_state WHERE user_id=?',[$uid]);
            if (!$state || (int)$state['balance_units']<$units)
                fail(409,'Saldo interno insuficiente');
            execute_sql($db,'UPDATE mining_state SET balance_units=balance_units-?,updated_at=? WHERE user_id=?',
                [$units,$at,$uid]);
            $vip=vip_eligible_at($db,$uid,$at);
            $vipState=$vip?'eligible':'awaiting_vip';
            execute_sql($db,'INSERT INTO withdraw_requests
              (user_id,plan_id,btc_address,usd_cents,btc_satoshis,quote_usd_cents,quote_source,status,vip_state,created_at)
              VALUES (?,?,?,?,?,?,?,"pending",?,?)',
              [$uid,$plan['id'],$wallet,$cents,$sats,
                (int)round($quote['usd']*100),$quote['source'],$vipState,$at]);
            return ['id'=>(int)$db->lastInsertId(),'status'=>$vip?'pending':'awaiting_vip'];
        });
        json_out(['id'=>$request['id'],'status'=>$request['status'],
          'usdAmount'=>number_format($cents/100,2,'.',''),
          'btcAmount'=>number_format($sats/100000000,8,'.',''),
          'simulation'=>true,
          'message'=>$request['status']==='awaiting_vip'
            ? 'Solicitação registrada: aguardando assinatura VIP ativa. São créditos internos; nenhum BTC foi enviado.'
            : 'Solicitação interna registrada para conferência administrativa. Nenhum BTC foi enviado.'],201);
    }
    if ($action === 'orders.mine' && $method === 'GET') {
        $actor=auth_user($db);
        if($actor['role']!=='member')fail(403,'Conta de membro necessária');
        $rows=history_rows($db,(int)$actor['id'],'purchase');
        foreach($rows as &$entry) {
            if($entry['status']==='pending' &&
                isset($entry['expires_at']) && (int)$entry['expires_at']<now())
                $entry['status']='expired';
        }
        unset($entry);
        json_out(['orders'=>$rows]);
    }
    if ($action === 'admin.overview' && $method === 'GET') {
        auth_user($db,true);
        $stats=query_one($db,'SELECT
            SUM(CASE WHEN role="member" THEN 1 ELSE 0 END) AS members,
            SUM(CASE WHEN role="member" AND status="active" THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN role="member" AND status="suspended" THEN 1 ELSE 0 END) AS suspended,
            SUM(CASE WHEN role="member" AND status="archived" THEN 1 ELSE 0 END) AS archived
            FROM users');
        $vip=query_one($db,'SELECT COUNT(*) AS n FROM contracts WHERE started_at<=? AND expires_at>?',[now(),now()]);
        $pending=query_one($db,'SELECT COUNT(*) AS n FROM orders WHERE status="pending" AND expires_at>?',[now()]);
        $approved=query_one($db,'SELECT COUNT(*) AS n FROM orders WHERE status="approved"');
        json_out(['members'=>(int)($stats['members']??0),'active'=>(int)($stats['active']??0),
          'suspended'=>(int)($stats['suspended']??0),'archived'=>(int)($stats['archived']??0),
          'activeVip'=>(int)($vip['n']??0),'pendingOrders'=>(int)($pending['n']??0),
          'approvedOrders'=>(int)($approved['n']??0)]);
    }
    if ($action === 'admin.members' && $method === 'GET') {
        auth_user($db,true);
        $q=trim(substr((string)($_GET['q'] ?? ''),0,80));
        $offset=max(0,min(100000,(int)($_GET['offset'] ?? 0)));
        $status=(string)($_GET['status'] ?? '');
        if ($status!=='' && !in_array($status,['active','suspended','archived'],true)) fail(422,'Filtro inválido');
        $escape=static fn(string $v):string => str_replace(['!','%','_'],['!!','!%','!_'],$v);
        $like='%'.$escape($q).'%';
        $where=' WHERE u.role="member" AND (u.login LIKE ? ESCAPE "!" OR u.display_name LIKE ? ESCAPE "!" OR u.email LIKE ? ESCAPE "!")';
        $params=[$like,$like,$like];
        if ($status!=='') { $where.=' AND u.status=?'; $params[]=$status; }
        $total=query_one($db,'SELECT COUNT(*) AS n FROM users u'.$where,$params);
        $list=query_all($db,'SELECT u.id,u.login,u.display_name,u.email,u.status,u.role,
            COALESCE(m.balance_units,0) AS balance_units,
            COALESCE((SELECT c.plan_id FROM contracts c WHERE c.user_id=u.id AND c.started_at<=? AND c.expires_at>?
             ORDER BY c.id DESC LIMIT 1),"FREE") AS plan_id FROM users u
            LEFT JOIN mining_state m ON m.user_id=u.id'.$where.'
            ORDER BY u.id DESC LIMIT 50 OFFSET ?',
            [now(),now(),...$params,$offset]);
        json_out(['members'=>$list,'total'=>(int)$total['n'],'offset'=>$offset,'pageSize'=>50]);
    }
    if ($action === 'admin.member.details' && $method === 'GET') {
        auth_user($db,true);
        $id=filter_var($_GET['id'] ?? null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if($id===false||$id===null)fail(422,'Identificador inválido');
        $user=query_one($db,'SELECT id,login,role,status,display_name,email,phone,wallet_address,
            created_at,updated_at FROM users WHERE id=? AND role="member"',[$id]);
        if(!$user)fail(404,'Membro não encontrado');
        $balance=query_one($db,'SELECT balance_units,bonus_satoshis_balance FROM mining_state WHERE user_id=?',[$id]);
        json_out(['member'=>$user,
            'contracts'=>history_rows($db,(int)$id,'subscription'),
            'orders'=>history_rows($db,(int)$id,'purchase'),
            'balanceUsd'=>units_usd((int)($balance['balance_units']??0)),
            'bonusSatoshis'=>(int)($balance['bonus_satoshis_balance']??0)]);
    }
    if ($action === 'admin.member.history' && $method === 'GET') {
        auth_user($db,true);
        $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
        if(!$id)fail(422,'Membro inválido');
        $member=query_one($db,'SELECT id FROM users WHERE id=? AND role="member"',[$id]);
        if(!$member)fail(404,'Membro não encontrado');
        $histories=[];
        foreach(history_kinds() as $kind)$histories[$kind]=history_rows($db,(int)$id,$kind);
        $balance=query_one($db,'SELECT balance_units FROM mining_state WHERE user_id=?',[$id]);
        $plan=plan_at($db,(int)$id,now());
        $quote=null;
        try{$quote=verified_btc_quote($db);}catch(Throwable $e){/* quotation is optional for viewing histories */}
        $usd=units_usd((int)($balance['balance_units']??0));
        json_out(['histories'=>$histories,'balanceUsd'=>$usd,
           'balanceBtc'=>$quote?number_format((float)$usd/$quote['usd'],8,'.',''):null,
           'btcUsd'=>$quote?number_format($quote['usd'],2,'.',''):null,
           'quoteSource'=>$quote['source']??null,
           'planId'=>$plan['id'],'simulation'=>true]);
    }
    if ($action === 'admin.member.history.save' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $memberId=param_id($body,'userId');
        $kind=string_field($body,'kind',16);
        $operation=string_field($body,'operation',8);
        $entryId=string_field($body,'historyId',50);
        $fields=$body['fields']??[];
        atomic($db,static function()use($db,$actor,$memberId,$kind,$operation,$entryId,$fields):void {
            save_history_edit($db,(int)$actor['id'],$memberId,$kind,$operation,$entryId,$fields);
        });
        json_out(['ok'=>true,'simulation'=>true]);
    }
    if ($action === 'admin.member.plan.assign' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $memberId=param_id($body,'userId');$planId=string_field($body,'planId',60);
        $result=atomic($db,static function()use($db,$actor,$memberId,$planId):array {
            mock_history_write_allowed($db);
            $member=query_one($db,'SELECT id,status FROM users WHERE id=? AND role="member"',[$memberId]);
            if(!$member || $member['status']!=='active')fail(404,'Membro não está ativo');
            $plan=query_one($db,'SELECT * FROM plans WHERE id=?',[$planId]);
            if(!$plan)fail(422,'Plano inexistente');
            $time=now();
            settle($db,$memberId,$time);
            $prior=plan_at($db,$memberId,$time);
            if($prior['id']===$planId)fail(409,'Membro já utiliza este plano');
            $recent=query_one($db,'SELECT id FROM contracts WHERE user_id=? AND started_at>=? AND expires_at>?',
                [$memberId,$time,$time]);
            if($recent)fail(409,'Alteração de plano já registrada neste segundo; tente novamente');
            execute_sql($db,'UPDATE contracts SET expires_at=? WHERE user_id=?
                AND started_at<? AND expires_at>?',[$time,$memberId,$time,$time]);
            // Start a new mining session explicitly after any plan assignment.
            execute_sql($db,'UPDATE mining_state SET running=0,session_ends_at=NULL,
                cooldown_until=NULL,last_accrual_at=NULL,updated_at=? WHERE user_id=?',
                [$time,$memberId]);
            if($planId!=='FREE') {
                $days=(int)$plan['duration_days'];
                if($days<1||$days>3650)fail(422,'Duração VIP inválida');
                execute_sql($db,'INSERT INTO contracts
                    (user_id,plan_id,plan_snapshot_json,order_id,started_at,expires_at,created_by)
                    VALUES (?,?,?,NULL,?,?,?)',
                    [$memberId,$planId,json_encode($plan,JSON_THROW_ON_ERROR),$time,
                     $time+$days*86400,(int)$actor['id']]);
                if(in_array($planId,['VIP_01','VIP_02','VIP_03','VIP_04'],true))
                    execute_sql($db,'UPDATE withdraw_requests SET vip_state="eligible"
                        WHERE user_id=? AND status="pending"',[$memberId]);
            }
            audit($db,(int)$actor['id'],'member.plan.assign',$memberId,
              ['from'=>$prior['id'],'to'=>$planId,'simulation'=>true]);
            return ['planId'=>$planId];
        });
        json_out(['ok'=>true]+$result);
    }
    if ($action === 'admin.member.balance.adjust' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $memberId=param_id($body,'userId');
        $currency=string_field($body,'currency',3);
        $mode=string_field($body,'mode',10);
        $amount=string_field($body,'amount',35);
        if(!in_array($currency,['USD','BTC'],true) ||
           !in_array($mode,['set','add','subtract','clear'],true))fail(422,'Tipo de ajuste inválido');
        if($mode==='clear')$amount='0';
        if($currency==='USD') {
            if(!preg_match('/^[0-9]{1,7}(?:\\.[0-9]{1,2})?$/D',$amount))
                fail(422,'Valor USD inválido');
            $parts=explode('.',$amount);
            $cents=(int)$parts[0]*100+(int)str_pad($parts[1]??'0',2,'0');
        } else {
            if(!preg_match('/^(?:0|[1-9][0-9]{0,3})(?:\\.[0-9]{1,8})?$/D',$amount))
                fail(422,'Valor BTC inválido');
            $parts=explode('.',$amount);
            $sats=(int)$parts[0]*100000000+(int)str_pad($parts[1]??'0',8,'0');
        }
        $quote=verified_btc_quote($db);
        if($currency==='BTC')$cents=$sats===0?0:btc_satoshis_to_usd_cents($sats,$quote['usd']);
        if($mode!=='clear' && $cents<1)fail(422,'Ajuste deve representar pelo menos US$ 0,01');
        $delta=$cents*8640000;
        $result=atomic($db,static function()use($db,$actor,$memberId,$currency,$mode,
            $amount,$delta,$quote):array {
            mock_history_write_allowed($db);
            $member=query_one($db,'SELECT id,status FROM users WHERE id=? AND role="member"',[$memberId]);
            if(!$member || $member['status']==='archived')fail(404,'Membro indisponível');
            settle($db,$memberId,now());
            $state=query_one($db,'SELECT balance_units FROM mining_state WHERE user_id=?',[$memberId]);
            if(!$state)fail(404,'Saldo não encontrado');
            $before=(int)$state['balance_units'];
            $after=match($mode) {'clear'=>0,'set'=>$delta,'add'=>$before+$delta,
                default=>$before-$delta};
            if($after<0 || $after>8640000000000000)fail(409,'Saldo insuficiente ou limite ultrapassado');
            execute_sql($db,'UPDATE mining_state SET balance_units=?,updated_at=? WHERE user_id=?',
                [$after,now(),$memberId]);
            audit($db,(int)$actor['id'],'member.balance.'.$mode,$memberId,
              ['beforeUnits'=>$before,'afterUnits'=>$after,'currency'=>$currency,
               'enteredAmount'=>$amount,'btcUsd'=>$quote['usd'],'quoteSource'=>$quote['source'],
               'simulation'=>true]);
            return ['balanceUsd'=>units_usd($after),
               'balanceBtc'=>number_format(((float)units_usd($after))/$quote['usd'],8,'.',''),
               'btcUsd'=>number_format($quote['usd'],2,'.','')];
        });
        json_out(['ok'=>true]+$result);
    }
    if ($action === 'admin.plans' && $method === 'GET') {
        auth_user($db,true);
        $plans=query_all($db,'SELECT * FROM plans ORDER BY price_cents,id');
        $out=[];
        foreach ($plans as $p) {
            $mapped=canonical_plan($p);
            $count=query_one($db,'SELECT COUNT(*) AS n FROM contracts WHERE plan_id=?
                AND started_at<=? AND expires_at>?',[$p['id'],now(),now()]);
            $mapped['activeContracts']=(int)($count['n'] ?? 0);
            $out[]=$mapped;
        }
        json_out(['plans'=>$out]);
    }
    if ($action === 'admin.audit' && $method === 'GET') {
        auth_user($db,true);
        json_out(['actions'=>query_all($db,'SELECT id,admin_id,action,target_user_id,details_json,created_at
            FROM admin_audit ORDER BY id DESC LIMIT 100')]);
    }
    if ($action === 'admin.orders' && $method === 'GET') {
        auth_user($db,true);
        $list=query_all($db,'SELECT o.id,o.user_id,u.login,o.plan_id,
            CASE WHEN o.status="pending" AND o.expires_at<? THEN "expired" ELSE o.status END AS status,
            o.created_at,o.expires_at,o.btc_sats,o.btc_address,o.quote_usd_cents,o.quote_source,o.payment_ref
            FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 100',[now()]);
        json_out(['orders'=>$list]);
    }
    if ($action === 'admin.member.edit' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $id=param_id($body,'userId');
        $name=string_field($body,'displayName',120);
        $email=string_field($body,'email',254);
        $login=string_field($body,'login',40);
        $phone=array_key_exists('phone',$body) ? string_field($body,'phone',30) : null;
        $wallet=array_key_exists('walletAddress',$body) ? string_field($body,'walletAddress',150) : null;
        if ($name==='' || !validate_login($login) || !is_email_or_empty($email) ||
            ($phone!==null && !is_valid_member_phone($phone)) ||
            ($wallet!==null && $wallet!=='' && !btc_receive_address_valid($wallet)))
            fail(422,'Nome de usuário, e-mail, telefone ou carteira inválidos');
        atomic($db, static function() use ($db,$actor,$id,$login,$name,$email,$phone,$wallet): void {
            $row=query_one($db,'SELECT id FROM users WHERE id=? AND role="member"',[$id]);
            if (!$row) fail(404,'Membro inexistente');
            if (query_one($db,'SELECT id FROM users WHERE login=? AND id!=?',[$login,$id]))
                fail(409,'Nome de usuário já utilizado');
            execute_sql($db,'UPDATE users SET login=?,display_name=?,email=?,phone=COALESCE(?,phone),wallet_address=COALESCE(?,wallet_address),updated_at=? WHERE id=?',
              [$login,$name,$email,$phone,$wallet,now(),$id]);
            audit($db,(int)$actor['id'],'member.edit',$id,['fields'=>['login','display_name','email','phone','wallet_address']]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.status' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $id=param_id($body,'userId');$status=string_field($body,'status',16);
        if (!in_array($status,['active','suspended','archived'],true)) fail(422,'Status inválido');
        atomic($db, static function () use ($db,$actor,$id,$status): void {
            $target=query_one($db,'SELECT role,status FROM users WHERE id=?',[$id]);
            if (!$target || $target['role']!=='member') fail(404,'Membro não encontrado');
            if ($target['status']==='archived' && $status==='suspended') fail(409,'Restaure primeiro a conta');
            $time=now();if ($target['status']==='active') settle($db,$id,$time);
            execute_sql($db,'UPDATE users SET status=?,updated_at=? WHERE id=?',[$status,$time,$id]);
            if ($status!=='active') {
                execute_sql($db,'UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL',[$time,$id]);
                execute_sql($db,'UPDATE mining_state SET running=0,last_accrual_at=?,updated_at=? WHERE user_id=?',
                  [$time,$time,$id]);
            } else {
                execute_sql($db,'UPDATE mining_state SET running=0,last_accrual_at=NULL,updated_at=? WHERE user_id=?',[$time,$id]);
            }
            audit($db,(int)$actor['id'],'member.status',$id,['from'=>$target['status'],'to'=>$status]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.plan.save' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $id=string_field($body,'id',60);$name=string_field($body,'name',120);
        if (!preg_match('/^[A-Z][A-Z0-9_]{2,59}$/D',$id) || $name==='') fail(422,'Identificador/nome inválido');
        $fields=['priceCents','dailyCents','bonusUsdCents','bonusSatoshis','durationDays','sessionSeconds','restartCooldownSeconds','withdrawMinCents','withdrawAfterDays'];
        foreach ($fields as $f) {
            if (!isset($body[$f]) || !is_int($body[$f]) || $body[$f]<0 || $body[$f]>100000000) fail(422,'Campo numérico inválido: '.$f);
        }
        $hashrate=string_field($body,'hashrate',100);$serverModel=string_field($body,'serverModel',150);
        $available=($body['available'] ?? true) === true ? 1 : 0;
        if ($id==='FREE' && ($body['priceCents']!==0 || $body['durationDays']!==0 || $available!==1 || $body['sessionSeconds']===0)) fail(422,'Plano gratuito deve permanecer gratuito e ativo');
        $exists=query_one($db,'SELECT id FROM plans WHERE id=?',[$id]);
        atomic($db, static function () use ($db,$actor,$body,$id,$name,$hashrate,$serverModel,$available,$exists): void {
            if ($exists) {
                execute_sql($db,'UPDATE plans SET name=?,price_cents=?,daily_cents=?,bonus_usd_cents=?,bonus_satoshis=?,duration_days=?,session_seconds=?,restart_cooldown_seconds=?,withdraw_min_cents=?,withdraw_after_days=?,hashrate=?,server_model=?,available=?,revision=revision+1,updated_at=? WHERE id=?',
                  [$name,$body['priceCents'],$body['dailyCents'],$body['bonusUsdCents'],$body['bonusSatoshis'],$body['durationDays'],$body['sessionSeconds'],0,$body['withdrawMinCents'],$body['withdrawAfterDays'],$hashrate,$serverModel,$available,now(),$id]);
            } else {
                execute_sql($db,'INSERT INTO plans (id,name,price_cents,daily_cents,bonus_usd_cents,bonus_satoshis,duration_days,session_seconds,restart_cooldown_seconds,withdraw_min_cents,withdraw_after_days,hashrate,server_model,available,updated_at)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                  [$id,$name,$body['priceCents'],$body['dailyCents'],$body['bonusUsdCents'],$body['bonusSatoshis'],$body['durationDays'],$body['sessionSeconds'],0,$body['withdrawMinCents'],$body['withdrawAfterDays'],$hashrate,$serverModel,$available,now()]);
            }
            audit($db,(int)$actor['id'],'plan.save',null,['planId'=>$id,'revisionChange'=>true]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.order.approve' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();$id=param_id($body,'orderId');
        $simulation=($body['simulationConfirmed'] ?? false)===true;
        $paymentRef=strtolower(string_field($body,'paymentReference',100));
        $mode=query_one($db,'SELECT value FROM app_settings WHERE name="payment_mode"');
        if($simulation && ($mode['value']??'')!=='simulation')
            fail(403,'Aprovação simulada indisponível no modo de pagamentos reais');
        if(!$simulation && !preg_match('/^[a-fA-F0-9]{64}$/D',$paymentRef))
            fail(422,'Informe o TXID BTC válido antes de confirmar pagamento real');
        if (($body['paymentConfirmed'] ?? false)!==true) fail(422,'Confirmação administrativa obrigatória');
        atomic($db, static function () use ($db,$actor,$id,$paymentRef,$simulation): void {
            $order=query_one($db,'SELECT * FROM orders WHERE id=?',[$id]);
            if (!$order || $order['status']!=='pending') fail(409,'Pedido inexistente ou não pendente');
            $time=now();
            if(!$simulation) {
                $reused=query_one($db,'SELECT id FROM orders WHERE lower(payment_ref)=? AND id!=?',[$paymentRef,$id]);
                if ($reused) fail(409,'TXID já associado a outro pagamento');
            }
            if ((int)$order['expires_at']<$time) {
                execute_sql($db,'UPDATE orders SET status="expired" WHERE id=?',[$id]);
                fail(409,'Pedido expirado; nova contratação necessária');
            }
            $member=query_one($db,'SELECT status FROM users WHERE id=?',[$order['user_id']]);
            if (!$member || $member['status']!=='active') fail(409,'Conta inativa');
            $active=query_one($db,'SELECT id FROM contracts WHERE user_id=? AND expires_at>? ORDER BY id DESC LIMIT 1',[$order['user_id'],$time]);
            if ($active) fail(409,'Já existe contrato VIP vigente');
            settle($db,(int)$order['user_id'],$time);
            $snapshot=json_decode($order['snapshot_json'],true,512,JSON_THROW_ON_ERROR);
            $days=(int)$snapshot['duration_days'];
            if ($days<=0) fail(422,'Duração inválida');
            execute_sql($db,'INSERT INTO contracts(user_id,plan_id,plan_snapshot_json,order_id,started_at,expires_at,created_by) VALUES (?,?,?,?,?,?,?)',
              [$order['user_id'],$order['plan_id'],$order['snapshot_json'],$id,$time,$time+$days*86400,$actor['id']]);
            execute_sql($db,'UPDATE orders SET status="approved",approved_by=?,approved_at=?,payment_ref=? WHERE id=?',
              [$actor['id'],$time,$simulation?null:$paymentRef,$id]);
            if(in_array($order['plan_id'],['VIP_01','VIP_02','VIP_03','VIP_04'],true)) {
                execute_sql($db,'UPDATE withdraw_requests SET vip_state="eligible"
                   WHERE user_id=? AND status="pending" AND vip_state="awaiting_vip"',
                   [$order['user_id']]);
            }
            audit($db,(int)$actor['id'],$simulation?'order.approve.simulation':'order.approve',
                (int)$order['user_id'],
                ['orderId'=>$id,'planId'=>$order['plan_id'],'paymentTxid'=>$simulation?null:$paymentRef,
                 'simulation'=>$simulation,'realPaymentVerified'=>!$simulation]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.withdrawals' && $method === 'GET') {
        auth_user($db,true);
        $at=now();
        json_out(['requests'=>query_all($db,'SELECT r.id,r.user_id,u.login,r.plan_id,
           r.btc_address,r.usd_cents,r.btc_satoshis,r.quote_usd_cents,r.vip_state,
           CASE WHEN r.status="pending" AND NOT EXISTS(
             SELECT 1 FROM contracts c WHERE c.user_id=r.user_id
               AND c.started_at<=? AND c.expires_at>?
               AND c.plan_id IN ("VIP_01","VIP_02","VIP_03","VIP_04"))
             THEN "awaiting_vip" ELSE r.status END AS status,
           r.created_at,r.processed_at,r.reference
           FROM withdraw_requests r JOIN users u ON u.id=r.user_id
           ORDER BY r.id DESC LIMIT 100',[$at,$at])]);
    }
    if ($action === 'admin.withdraw.process' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $body=request_body();
        $id=param_id($body,'requestId');
        $status=string_field($body,'status',20);
        $reference=string_field($body,'reference',160);
        if (!in_array($status,['approved','rejected'],true) || strlen($reference)<6)
            fail(422,'Indique uma decisão e uma referência de conferência');
        if ($status==='approved' && ($body['manualReviewConfirmed']??false)!==true)
            fail(422,'Aprovação exige confirmação da conferência externa manual');
        atomic($db,static function() use($db,$actor,$id,$status,$reference): void {
            $request=query_one($db,'SELECT * FROM withdraw_requests WHERE id=?',[$id]);
            if (!$request || $request['status']!=='pending')
                fail(409,'Solicitação inexistente ou já processada');
            if ($status==='approved') {
                $u=query_one($db,'SELECT status FROM users WHERE id=?',[$request['user_id']]);
                if(!$u || $u['status']!=='active' ||
                   !vip_eligible_at($db,(int)$request['user_id'],now())) {
                    fail(409,'Aguardando assinatura VIP 01, 02, 03 ou 04 ativa');
                }
                $currentPlan=plan_at($db,(int)$request['user_id'],now());
                $min=(int)($currentPlan['snapshot']['withdraw_min_cents']??0);
                $waiting=(int)($currentPlan['snapshot']['withdraw_after_days']??0);
                $contract=query_one($db,'SELECT started_at FROM contracts WHERE user_id=?
                  AND started_at<=? AND expires_at>? ORDER BY id DESC LIMIT 1',
                  [$request['user_id'],now(),now()]);
                if((int)$request['usd_cents']<$min ||
                   ($contract && now()<(int)$contract['started_at']+$waiting*86400)) {
                    fail(409,'Saque não atende às condições do plano VIP vigente');
                }
            }
            if ($status==='rejected') {
                execute_sql($db,'UPDATE mining_state SET balance_units=balance_units+?,updated_at=? WHERE user_id=?',
                  [(int)$request['usd_cents']*8640000,now(),$request['user_id']]);
            }
            execute_sql($db,'UPDATE withdraw_requests SET status=?,processed_by=?,processed_at=?,reference=? WHERE id=?',
              [$status,$actor['id'],now(),$reference,$id]);
            audit($db,(int)$actor['id'],'withdraw.process',(int)$request['user_id'],
              ['requestId'=>$id,'status'=>$status,'reference'=>$reference,'internalSimulation'=>true]);
        });
        json_out(['ok'=>true,'status'=>$status,'simulation'=>true]);
    }
    if ($action === 'admin.order.reject' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $body=request_body();
        $id=param_id($body,'orderId');
        $reason=string_field($body,'reason',250);
        if (strlen($reason)<6) fail(422,'Motivo da rejeição obrigatório (mínimo seis caracteres)');
        atomic($db,static function() use($db,$actor,$id,$reason): void {
            $order=query_one($db,'SELECT id,user_id,status FROM orders WHERE id=?',[$id]);
            if (!$order || $order['status']!=='pending') fail(409,'Somente pedidos pendentes podem ser rejeitados');
            execute_sql($db,'UPDATE orders SET status="rejected",approved_by=?,approved_at=? WHERE id=?',
                [$actor['id'],now(),$id]);
            audit($db,(int)$actor['id'],'order.reject',(int)$order['user_id'],
                ['orderId'=>$id,'reason'=>$reason]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.diagnostics' && $method === 'GET') {
        auth_user($db,true);
        $btc=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address_confirmed"');
        $enabled=getenv('BITDEER_ENABLE_MAIL')==='1';
        $sender=(string)(getenv('BITDEER_MAIL_FROM') ?: '');
        $mailReady=$enabled && function_exists('mail') &&
            (bool)filter_var($sender,FILTER_VALIDATE_EMAIL);
        $https=(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off');
        json_out(['phpVersion'=>PHP_VERSION,'pdoSqlite'=>extension_loaded('pdo_sqlite'),
            'dbWritable'=>is_writable(data_file()),
            'https'=>$https,'mailConfigured'=>$mailReady,
            'btcAddressConfirmed'=>($btc['value'] ?? '0')==='1',
            'quoteProviders'=>'Coinbase / Kraken / CoinGecko Demo opcional (validar rede no domínio)']);
    }
    if ($action === 'admin.payment.settings' && $method === 'GET') {
        auth_user($db,true);
        $addr=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address"');
        $confirmed=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address_confirmed"');
        json_out(['btcAddress'=>$addr['value']??'', 'confirmed'=>($confirmed['value']??'0')==='1']);
    }
    if ($action === 'admin.payment.settings' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();
        $address=string_field($body,'btcAddress',90);
        $password=$body['adminPassword'] ?? null;
        $confirm=$body['confirmedOwner'] ?? false;
        if (!btc_receive_address_valid($address)) {
            fail(422,'Endereço BTC inválido ou formato não suportado');
        }
        if (!is_string($password) || strlen($password)>256) fail(422,'Senha administrativa obrigatória');
        $admin=query_one($db,'SELECT password_hash FROM users WHERE id=?',[$actor['id']]);
        if (!$admin || !password_verify($password,$admin['password_hash'])) {
            fail(403,'Senha administrativa incorreta');
        }
        if (!is_bool($confirm)) fail(422,'Confirmação inválida');
        atomic($db,static function()use($db,$actor,$address,$confirm):void{
            $old=query_one($db,'SELECT value FROM app_settings WHERE name="btc_address"');
            execute_sql($db,'INSERT INTO app_settings(name,value) VALUES ("btc_address",?)
                ON CONFLICT(name) DO UPDATE SET value=excluded.value',[$address]);
            execute_sql($db,'INSERT INTO app_settings(name,value) VALUES ("btc_address_confirmed",?)
                ON CONFLICT(name) DO UPDATE SET value=excluded.value',[$confirm?'1':'0']);
            audit($db,(int)$actor['id'],'settings.payment',null,
                ['addressChanged'=>($old['value']??'')!==$address,'confirmed'=>$confirm]);
        });
        json_out(['ok'=>true, 'confirmed'=>$confirm]);
    }
    if ($action === 'admin.settings' && $method === 'POST') {
        $actor=require_post_csrf($db,true);$body=request_body();$email=string_field($body,'supportEmail',254);
        if ($email==='' || !filter_var($email,FILTER_VALIDATE_EMAIL)) fail(422,'E-mail inválido');
        atomic($db, static function () use ($db,$actor,$email): void {
            execute_sql($db,'UPDATE app_settings SET value=? WHERE name="support_email"',[$email]);
            audit($db,(int)$actor['id'],'settings.support_email',null,['changed'=>true]);
        });
        json_out(['ok'=>true]);
    }
    if ($action === 'admin.identity.verify' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $body=request_body();
        $memberId=param_id($body,'userId');
        $method=string_field($body,'verificationMethod',40);
        $reference=string_field($body,'verificationReference',150);
        if (!in_array($method,['approved','in_person','known_contact','other_offline'],true) ||
            mb_strlen($reference)<6) {
            fail(422,'Informe uma referência de atendimento com seis caracteres ou mais');
        }
        // Admin session and CSRF authorize; verification is an administrator attestation.

        $checkId=atomic($db, static function () use ($db,$actor,$memberId,$method,$reference): int {
            $member=query_one($db,'SELECT id FROM users WHERE id=? AND role="member" AND status!="archived"',[$memberId]);
            if (!$member) fail(404,'Membro indisponível');
            $time=now();
            execute_sql($db,'INSERT INTO identity_checks(member_id,admin_id,verified_method,verification_reference,verified_at,expires_at)
                VALUES (?,?,?,?,?,?)',[$memberId,$actor['id'],$method,$reference,$time,$time+600]);
            $id=(int)$db->lastInsertId();
            audit($db,(int)$actor['id'],'identity.verification',$memberId,['method'=>$method,'checkId'=>$id]);
            return $id;
        });
        json_out(['verificationId'=>$checkId,'validForSeconds'=>600]);
    }
    if ($action === 'admin.password.reset' && $method === 'POST') {
        $actor=require_post_csrf($db,true);
        $body=request_body();
        $memberId=param_id($body,'userId');
        $checkId=param_id($body,'verificationId');
        $newPassword=$body['newPassword'] ?? null;
        if (!is_string($newPassword) || !validate_password($newPassword)) {
            fail(422,'Nova senha deve ter de 10 a 256 caracteres');
        }
        $hashed=secure_password($newPassword);
        atomic($db, static function() use ($db,$actor,$memberId,$checkId,$hashed): void {
            $check=query_one($db,'SELECT id FROM identity_checks WHERE id=? AND member_id=? AND admin_id=?
                  AND consumed_at IS NULL AND expires_at>=?',[$checkId,$memberId,$actor['id'],now()]);
            if (!$check) fail(403,'Verificação de identidade ausente, expirada ou já utilizada');
            $member=query_one($db,'SELECT id FROM users WHERE id=? AND role="member" AND status!="archived"',[$memberId]);
            if (!$member) fail(404,'Membro indisponível');
            execute_sql($db,'UPDATE users SET password_hash=?,updated_at=? WHERE id=?',[$hashed,now(),$memberId]);
            execute_sql($db,'UPDATE sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL',[now(),$memberId]);
            execute_sql($db,'UPDATE identity_checks SET consumed_at=? WHERE id=?',[now(),$checkId]);
            audit($db,(int)$actor['id'],'member.password.reset',$memberId,['verificationId'=>$checkId,'sessionsRevoked'=>true]);
        });
        json_out(['ok'=>true]);
    }
    fail(404,'Operação não encontrada');
}

try {
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method,['GET','POST'],true)) fail(405,'Método não permitido');
    if ($method === 'POST') {
        $origin=$_SERVER['HTTP_ORIGIN'] ?? '';
        $host=$_SERVER['HTTP_HOST'] ?? '';
        if ($origin !== '' && strtolower((string)parse_url($origin,PHP_URL_HOST)) !== strtolower(explode(':',$host)[0])) {
            fail(403,'Origem cruzada não permitida');
        }
    }
    $db=database();
    $action=isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : '';
    api_dispatch($db,$action,$method);
} catch (Throwable $e) {
    error_log('Bitdeer API error: '.$e->getMessage());
    fail(503,'Serviço temporariamente indisponível');
}
