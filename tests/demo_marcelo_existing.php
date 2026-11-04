<?php
declare(strict_types=1);
/** Isolated legacy-DB migration regression; never touches a deployed database. */
require_once dirname(__DIR__).'/server/schema.php';
$tmp=sys_get_temp_dir().'/bitdeer-marcelo-'.bin2hex(random_bytes(8)).'.sqlite';
putenv('BITDEER_DB_PATH='.$tmp);
try {
    provision('legacyadmin','StrongLegacyAdminPass2026!','support@example.org');
    $db=database();
    $fixture=query_one($db,'SELECT id FROM users WHERE login="marcelo"');
    $founderId=(int)$fixture['id'];
    $admin=(int)query_one($db,'SELECT id FROM users WHERE login="legacyadmin"')['id'];
    // Model an existing installation which has never had a demo account.
    atomic($db,static function()use($db,$founderId):void {
        execute_sql($db,'DELETE FROM member_history_edits WHERE user_id=?',[$founderId]);
        execute_sql($db,'DELETE FROM referral_codes WHERE user_id=?',[$founderId]);
        execute_sql($db,'DELETE FROM admin_audit WHERE target_user_id=?',[$founderId]);
        execute_sql($db,'DELETE FROM mining_state WHERE user_id=?',[$founderId]);
        execute_sql($db,'DELETE FROM users WHERE id=?',[$founderId]);
        execute_sql($db,'DELETE FROM app_settings WHERE name="demo_marcelo_seed"');
        execute_sql($db,'INSERT INTO users(login,password_hash,role,status,display_name,created_at,updated_at)
            VALUES ("network",?,"member","active","Legacy member",?,?)',
            [secure_password('LegacyMemberPassword2026!'),now()-350*86400,now()]);
        $legacyId=(int)$db->lastInsertId();
        execute_sql($db,'INSERT INTO mining_state(user_id,balance_units,updated_at) VALUES (?,?,?)',
            [$legacyId,123456789,now()]);
    });
    $preserved=query_one($db,'SELECT u.id,u.login,m.balance_units FROM users u JOIN mining_state m ON m.user_id=u.id WHERE u.login="network"');
    $seed=atomic($db,static fn():array=>seed_marcelo_demo($db,$admin));
    assert($seed['login']==='marcelo' && $seed['displayName']==='Marcelo');
    $newUser=query_one($db,'SELECT * FROM users WHERE id=?',[$seed['userId']]);
    assert(password_verify($seed['initialPassword'],$newUser['password_hash']));
    assert(query_one($db,'SELECT COUNT(*) AS n FROM member_history_edits WHERE user_id=?',
        [$seed['userId']])['n']>300);
    $after=query_one($db,'SELECT u.id,u.login,m.balance_units FROM users u JOIN mining_state m ON m.user_id=u.id WHERE u.login="network"');
    assert($after===$preserved);
    $count=(int)query_one($db,'SELECT COUNT(*) AS n FROM member_history_edits')['n'];
    try {
        atomic($db,static fn():array=>seed_marcelo_demo($db,$admin));
        throw new RuntimeException('Second seed unexpectedly succeeded');
    } catch (RuntimeException $e) {
        if($e->getMessage()==='Second seed unexpectedly succeeded')throw $e;
    }
    assert((int)query_one($db,'SELECT COUNT(*) AS n FROM member_history_edits')['n']===$count);
    assert((int)query_one($db,'SELECT COUNT(*) AS n FROM users WHERE role="member"')['n']===2);
    fwrite(STDOUT,"PASS: existing member untouched; Marcelo seeded once; password random and verified\n");
} finally {
    @unlink($tmp);
    @unlink($tmp.'-wal');
    @unlink($tmp.'-shm');
}
