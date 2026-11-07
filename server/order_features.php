<?php
declare(strict_types=1);

/** Add order payment metadata and an auditable admin notification inbox. */
function ensure_order_features(PDO $db): void {
    $columns=array_column(query_all($db,'PRAGMA table_info(orders)'),'name');
    $newColumns=[
      'quote_expires_at'=>'INTEGER NOT NULL DEFAULT 0',
      'expired_at'=>'INTEGER',
      'proof_url'=>'TEXT',
      'proof_submitted_at'=>'INTEGER',
      'payment_proof_url'=>"TEXT NOT NULL DEFAULT ''",
      'payment_proof_submitted_at'=>'INTEGER',
    ];
    foreach($newColumns as $column=>$definition) {
        if(!in_array($column,$columns,true))
            $db->exec("ALTER TABLE orders ADD COLUMN {$column} {$definition}");
    }

    $db->exec("CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL CHECK(event_type IN
        ('activation_requested','vip_request','proof_submitted','proof_updated',
         'payment_confirmed','simulation_approved')),
      order_id INTEGER NOT NULL REFERENCES orders(id),
      user_id INTEGER REFERENCES users(id),
      created_at INTEGER NOT NULL,
      simulation INTEGER NOT NULL DEFAULT 0 CHECK(simulation IN (0,1))
    )");
    $notificationColumns=array_column(query_all($db,'PRAGMA table_info(admin_notifications)'),'name');
    if(!in_array('user_id',$notificationColumns,true))
        $db->exec('ALTER TABLE admin_notifications ADD COLUMN user_id INTEGER REFERENCES users(id)');
    execute_sql($db,'UPDATE admin_notifications SET user_id=(
      SELECT user_id FROM orders WHERE orders.id=admin_notifications.order_id
      ) WHERE user_id IS NULL');
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
    execute_sql($db,"UPDATE orders SET proof_url=payment_proof_url
      WHERE (proof_url IS NULL OR proof_url='') AND payment_proof_url<>''");
    execute_sql($db,"UPDATE orders SET payment_proof_url=proof_url
      WHERE payment_proof_url='' AND proof_url IS NOT NULL AND proof_url<>''");
    execute_sql($db,'UPDATE orders SET proof_submitted_at=payment_proof_submitted_at
      WHERE proof_submitted_at IS NULL AND payment_proof_submitted_at IS NOT NULL');
    execute_sql($db,'UPDATE orders SET payment_proof_submitted_at=proof_submitted_at
      WHERE payment_proof_submitted_at IS NULL AND proof_submitted_at IS NOT NULL');
    execute_sql($db,'UPDATE orders SET quote_expires_at=expires_at WHERE quote_expires_at=0');
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
    $definition=query_one($db,"SELECT sql FROM sqlite_master
      WHERE type='table' AND name='admin_notifications'");
    $schema=(string)($definition['sql']??'');
    $storedEvent=$eventType;
    if(!str_contains($schema,"'{$storedEvent}'")) {
        if($eventType==='activation_requested' && str_contains($schema,"'vip_request'"))
            $storedEvent='vip_request';
        elseif($eventType==='proof_updated' && str_contains($schema,"'proof_submitted'"))
            $storedEvent='proof_submitted';
        else
            throw new RuntimeException('The notification schema does not support this event');
    }
    execute_sql($db,'INSERT INTO admin_notifications
      (event_type,order_id,user_id,created_at,simulation) VALUES (?,?,?,?,?)',
      [$storedEvent,$orderId,$userId,$at??now(),$simulation?1:0]);
}
