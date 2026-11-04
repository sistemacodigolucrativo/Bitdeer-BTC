<?php
declare(strict_types=1);
/** Isolated legacy-DB migration regression; never touches a deployed database. */
require_once dirname(__DIR__).'/server/schema.php';
$tmp=sys_get_temp_dir().'/bitdeer-marcelo-'.bin2hex(random_bytes(8)).'.sqlite';
putenv('BITDEER_DB_PATH='.$tmp);
try {
    assert(validate_password('elevenchars')===false);
    assert(validate_password('TwelveChars!')===true);
    assert(validate_password(str_repeat('x',257))===false);
    try {
        provision('weakadmin','short','support@example.org');
        throw new RuntimeException('A weak installer password was accepted');
    } catch (InvalidArgumentException $e) {
        // The initial installer must reject credentials shorter than 12.
    }
    provision('legacyadmin','StrongLegacyAdminPass2026!','support@example.org');
    $db=database();
    $fixture=query_one($db,'SELECT id FROM users WHERE login="user"');
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
            [secure_password('user'),now()-350*86400,now()]);
        $legacyId=(int)$db->lastInsertId();
        execute_sql($db,'INSERT INTO mining_state(user_id,balance_units,updated_at) VALUES (?,?,?)',
            [$legacyId,123456789,now()]);
    });
    $preserved=query_one($db,'SELECT u.id,u.login,m.balance_units FROM users u JOIN mining_state m ON m.user_id=u.id WHERE u.login="network"');
    $legacyAccount=query_one($db,'SELECT password_hash FROM users WHERE login="network"');
    assert(password_verify('user',$legacyAccount['password_hash']));
    assert(validate_password('user')===false); // New passwords are stricter, old logins remain valid.
    $seed=atomic($db,static fn():array=>seed_marcelo_demo($db,$admin));
    assert($seed['login']==='user' && $seed['displayName']==='Marcelo');
    $newUser=query_one($db,'SELECT * FROM users WHERE id=?',[$seed['userId']]);
    assert($seed['initialPassword']==='123456789123');
    assert(password_verify($seed['initialPassword'],$newUser['password_hash']));
    assert(query_one($db,'SELECT COUNT(*) AS n FROM member_history_edits WHERE user_id=?',
        [$seed['userId']])['n']>300);
    $random=atomic($db,static fn():array=>seed_random_member_demo($db,$admin));
    assert((bool)preg_match('/^[a-z0-9]{5,40}$/',$random['login']));
    assert($random['displayName']!=='' && strlen($random['initialPassword'])>=12);
    assert($random['initialPassword']!==$seed['initialPassword']);
    assert((bool)preg_match('/^[a-z0-9]+@(example\\.(com|org|net)|mail\\.test|demo\\.invalid)$/',$random['email']));
    $randomUser=query_one($db,'SELECT * FROM users WHERE id=?',[$random['userId']]);
    assert(password_verify($random['initialPassword'],$randomUser['password_hash']));
    assert(query_one($db,'SELECT COUNT(*) AS n FROM member_history_edits WHERE user_id=?',
        [$random['userId']])['n']>300);
    assert((int)query_one($db,'SELECT balance_units FROM mining_state WHERE user_id=?',[$random['userId']])['balance_units']===183742*8640000);
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
    assert((int)query_one($db,'SELECT COUNT(*) AS n FROM users WHERE role="member"')['n']===3);
    fwrite(STDOUT,"PASS: legacy short-password account preserved, new demo passwords strong and unique\n");
} finally {
    @unlink($tmp);
    @unlink($tmp.'-wal');
    @unlink($tmp.'-shm');
}
