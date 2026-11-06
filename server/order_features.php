<?php
declare(strict_types=1);

/** Add order payment metadata and an auditable admin notification inbox. */
function ensure_order_features(PDO $db): void {
    $columns=array_column(query_all($db,'PRAGMA table_info(orders)'),'name');
    if(!in_array('expired_at',$columns,true))
        $db->exec('ALTER TABLE orders ADD COLUMN expired_at INTEGER');
    if(!in_array('proof_url',$columns,true))
        $db->exec('ALTER TABLE orders ADD COLUMN proof_url TEXT');
    if(!in_array('proof_submitted_at',$columns,true))
        $db->exec('ALTER TABLE orders ADD COLUMN proof_submitted_at INTEGER');

    $db->exec("CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL CHECK(event_type IN
        ('activation_requested','proof_submitted','proof_updated','payment_confirmed')),
      order_id INTEGER NOT NULL REFERENCES orders(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL,
      simulation INTEGER NOT NULL DEFAULT 0 CHECK(simulation IN (0,1))
    )");
    $db->exec('CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
      ON admin_notifications(created_at DESC,id DESC)');
    $db->exec("CREATE TABLE IF NOT EXISTS admin_notification_reads (
      notification_id INTEGER NOT NULL REFERENCES admin_notifications(id),
      admin_id INTEGER NOT NULL REFERENCES users(id),
      read_at INTEGER NOT NULL,
      PRIMARY KEY(notification_id,admin_id)
    )");

    // Expire old 15-minute orders before migrating still-valid pending records
    // to the new 30-minute limit. The old expiry is preserved on elapsed orders.
    $time=now();
    execute_sql($db,'UPDATE orders SET status="expired",expired_at=expires_at
      WHERE status="pending" AND expires_at<=?',[$time]);
    execute_sql($db,'UPDATE orders SET expires_at=created_at+1800
      WHERE status="pending" AND expires_at<created_at+1800');
    // Older installations recorded expiry without a separate audit timestamp.
    execute_sql($db,'UPDATE orders SET expired_at=expires_at
      WHERE status="expired" AND expired_at IS NULL');
}

/** Persist expiration on API activity; the member UI also polls while Store is open. */
function expire_pending_orders(PDO $db, ?int $at=null): int {
    $time=$at??now();
    return execute_sql($db,'UPDATE orders SET status="expired",expired_at=expires_at
      WHERE status="pending" AND expires_at<=?',[$time]);
}

function add_admin_order_notification(
    PDO $db,int $orderId,int $userId,string $eventType,bool $simulation=false,?int $at=null
): void {
    if(!in_array($eventType,
      ['activation_requested','proof_submitted','proof_updated','payment_confirmed'],true))
        throw new InvalidArgumentException('Unsupported order notification');
    execute_sql($db,'INSERT INTO admin_notifications
      (event_type,order_id,user_id,created_at,simulation) VALUES (?,?,?,?,?)',
      [$eventType,$orderId,$userId,$at??now(),$simulation?1:0]);
}
