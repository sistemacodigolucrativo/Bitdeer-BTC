<?php
declare(strict_types=1);

/** Delete one member while retaining other members and their referral events. */
function delete_member_preserving_affiliates(PDO $db, int $memberId, int $adminId): void {
    $member=query_one($db,'SELECT id,login,role FROM users WHERE id=?',[$memberId]);
    if(!$member || $member['role']!=='member')throw new DomainException('Membro não encontrado');

    // Older databases require both parties to exist. Allow an erased party to
    // become NULL so the other party's referral event remains intact.
    $columns=query_all($db,'PRAGMA table_info(referral_events)');
    $required=[];
    foreach($columns as $column) $required[$column['name']]=(int)$column['notnull'];
    if(($required['inviter_id']??0) || ($required['invitee_id']??0)) {
        $db->exec('ALTER TABLE referral_events RENAME TO referral_events_before_member_delete');
        $db->exec('CREATE TABLE referral_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inviter_id INTEGER REFERENCES users(id),
          invitee_id INTEGER UNIQUE REFERENCES users(id),
          invite_code TEXT NOT NULL, reward_usd_units INTEGER NOT NULL,
          created_at INTEGER NOT NULL)');
        $db->exec('INSERT INTO referral_events SELECT id,inviter_id,invitee_id,invite_code,reward_usd_units,created_at FROM referral_events_before_member_delete');
        $db->exec('DROP TABLE referral_events_before_member_delete');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referral_events(inviter_id,created_at)');
    }
    execute_sql($db,'UPDATE referral_events SET inviter_id=NULL WHERE inviter_id=?',[$memberId]);
    execute_sql($db,'UPDATE referral_events SET invitee_id=NULL WHERE invitee_id=?',[$memberId]);
    execute_sql($db,'DELETE FROM admin_notification_reads WHERE notification_id IN (SELECT id FROM admin_notifications WHERE order_id IN (SELECT id FROM orders WHERE user_id=?) OR user_id=?)',[$memberId,$memberId]);
    execute_sql($db,'DELETE FROM admin_notifications WHERE order_id IN (SELECT id FROM orders WHERE user_id=?) OR user_id=?',[$memberId,$memberId]);
    execute_sql($db,'DELETE FROM support_replies WHERE ticket_id IN (SELECT id FROM support_tickets WHERE user_id=?)',[$memberId]);
    foreach(['sessions','mining_state','reward_ledger','bonus_claims','member_history_edits','support_tickets','mock_payment_feed','mock_payment_cursor','demo_new_investor_impressions','demo_new_investor_cycle_impressions','language_preferences','withdraw_requests','contracts','orders','referral_codes'] as $table)
        execute_sql($db,'DELETE FROM "'.$table.'" WHERE user_id=?',[$memberId]);
    execute_sql($db,'DELETE FROM identity_checks WHERE member_id=?',[$memberId]);
    execute_sql($db,'DELETE FROM auth_attempts WHERE login=?',[$member['login']]);
    execute_sql($db,'DELETE FROM admin_audit WHERE target_user_id=?',[$memberId]);
    $marker=query_one($db,'SELECT value FROM app_settings WHERE name="demo_marcelo_seed"');
    $metadata=json_decode($marker['value']??'{}',true);
    if(is_array($metadata) && (int)($metadata['userId']??0)===$memberId)
        execute_sql($db,'DELETE FROM app_settings WHERE name="demo_marcelo_seed"');
    execute_sql($db,'DELETE FROM users WHERE id=? AND role="member"',[$memberId]);
    audit($db,$adminId,'member.delete',null,['deletedMemberId'=>$memberId]);
}
