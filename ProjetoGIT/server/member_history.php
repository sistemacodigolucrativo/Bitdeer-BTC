<?php
declare(strict_types=1);
/**
 * Scoped, audited admin changes to mockup history views.
 * Original receipts, rewards and contract records remain unmodified.
 * A displayed history is NOT proof of BTC payment, nor an accounting ledger.
 */
function ensure_member_history_tables(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS member_history_edits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL CHECK(kind IN ('accrual','bonus','purchase','withdrawal','subscription')),
      source_id INTEGER,
      payload_json TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN (0,1)),
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      UNIQUE(user_id,kind,source_id)
    )");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_member_history_edits
      ON member_history_edits(user_id,kind,created_at)");
}
function history_kinds(): array {
    return ['accrual','bonus','purchase','withdrawal','subscription'];
}
function history_columns(string $kind): array {
    return match ($kind) {
      'accrual'=>['plan_id','start_ts','end_ts','earned_units'],
      'bonus'=>['plan_id','claimed_at','bonus_usd_units','bonus_satoshis'],
      'purchase'=>['plan_id','status','created_at','btc_sats'],
      'withdrawal'=>['plan_id','status','created_at','usd_cents','btc_satoshis'],
      'subscription'=>['plan_id','started_at','expires_at'],
      default=>[]
    };
}
function history_base_table(string $kind): string {
    return match($kind) {
      'accrual'=>'reward_ledger','bonus'=>'bonus_claims',
      'purchase'=>'orders','withdrawal'=>'withdraw_requests',
      'subscription'=>'contracts',default=>''
    };
}
function history_rows(PDO $db,int $userId,string $kind): array {
    if(!in_array($kind,history_kinds(),true)) throw new InvalidArgumentException('History kind');
    $sql=match($kind) {
      'accrual'=>'SELECT id,plan_id,start_ts,end_ts,earned_units FROM reward_ledger
        WHERE user_id=? ORDER BY id DESC LIMIT 100',
      'bonus'=>'SELECT id,plan_id,claimed_at,bonus_usd_units,bonus_satoshis FROM bonus_claims
        WHERE user_id=? ORDER BY id DESC LIMIT 100',
      'purchase'=>'SELECT id,plan_id,status,created_at,expires_at,btc_sats,quote_usd_cents,
          payment_ref FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 100',
      'withdrawal'=>'SELECT id,plan_id,btc_address,usd_cents,btc_satoshis,quote_usd_cents,
          quote_source,vip_state,created_at,processed_at,
          CASE WHEN status="pending" AND NOT EXISTS(
            SELECT 1 FROM contracts c WHERE c.user_id=withdraw_requests.user_id
            AND c.started_at<=strftime("%s","now") AND c.expires_at>strftime("%s","now")
            AND c.plan_id IN ("VIP_01","VIP_02","VIP_03","VIP_04"))
            THEN "awaiting_vip" ELSE status END AS status
          FROM withdraw_requests WHERE user_id=? ORDER BY id DESC LIMIT 100',
      'subscription'=>'SELECT id,plan_id,started_at,expires_at,created_by,order_id
          FROM contracts WHERE user_id=? ORDER BY id DESC LIMIT 100'
    };
    $original=query_all($db,$sql,[$userId]);
    $edits=query_all($db,'SELECT id,source_id,payload_json,deleted
      FROM member_history_edits WHERE user_id=? AND kind=? ORDER BY id DESC LIMIT 1000',
      [$userId,$kind]);
    $overrides=[];$manual=[];
    foreach($edits as $edit) {
        if($edit['source_id']!==null) $overrides[(int)$edit['source_id']]=$edit;
        elseif(!(int)$edit['deleted'])$manual[]=$edit;
    }
    $rows=[];
    foreach($original as $row) {
        $sid=(int)$row['id'];
        $override=$overrides[$sid]??null;
        if($override && (int)$override['deleted']) continue;
        if($override) {
            $data=json_decode($override['payload_json'],true);
            if(is_array($data)) $row=array_merge($row,$data);
        }
        $row['historyId']='real:'.$sid;
        $row['adminEdited']=(bool)$override;
        $row['simulation']=(bool)$override;
        $rows[]=$row;
    }
    foreach($manual as $edit) {
        $fields=json_decode($edit['payload_json'],true);
        if(!is_array($fields))continue;
        $fields['id']='M-'.$edit['id'];
        $fields['historyId']='manual:'.$edit['id'];
        $fields['adminEdited']=true;
        $fields['simulation']=true;
        $rows[]=$fields;
    }
    return $rows;
}
function history_validate_fields(PDO $db,string $kind,mixed $raw): array {
    if(!is_array($raw))fail(422,'Campos do histórico inválidos');
    $allowed=history_columns($kind);
    if(count($raw)!==count($allowed) || array_diff(array_keys($raw),$allowed))
        fail(422,'Informe todos os campos do histórico sem campos adicionais');
    $output=[];
    foreach($allowed as $key) {
        $value=$raw[$key]??null;
        if($key==='plan_id') {
            if(!is_string($value)||!preg_match('/^[A-Z][A-Z0-9_]{1,59}$/D',$value) ||
               !query_one($db,'SELECT id FROM plans WHERE id=?',[$value]))
                fail(422,'Plano do histórico inválido');
            $output[$key]=$value;
        } elseif($key==='status') {
            $options=$kind==='purchase'?['pending','approved','rejected','expired']:
                ['pending','approved','rejected','awaiting_vip'];
            if(!is_string($value)||!in_array($value,$options,true))fail(422,'Estado do histórico inválido');
            $output[$key]=$value;
        } else {
            if((!is_int($value)&&(!is_string($value)||!preg_match('/^[0-9]{1,13}$/D',$value))) ||
                !is_numeric($value) || (float)$value>1000000000000)
                fail(422,'Valor numérico inválido no histórico');
            $num=(int)$value;
            if($num<0 || (str_ends_with($key,'_ts') || str_ends_with($key,'_at')) && $num<1)
                fail(422,'Data ou valor inválido');
            $output[$key]=$num;
        }
    }
    if(($kind==='accrual'&&$output['end_ts']<=$output['start_ts']) ||
       ($kind==='subscription'&&$output['expires_at']<=$output['started_at']))
        fail(422,'A data de término deve ser posterior ao início');
    return $output;
}
function mock_history_write_allowed(PDO $db): void {
    $mode=query_one($db,'SELECT value FROM app_settings WHERE name="payment_mode"');
    if(($mode['value']??'')!=='simulation')
        fail(403,'Edição demonstrativa indisponível em modo de pagamentos reais');
}
function save_history_edit(PDO $db,int $actorId,int $memberId,string $kind,string $operation,
    string $historyId,array $fields): void {
    if(!in_array($kind,history_kinds(),true)||!in_array($operation,['create','update','delete'],true))
        fail(422,'Operação de histórico inválida');
    mock_history_write_allowed($db);
    $member=query_one($db,'SELECT id FROM users WHERE id=? AND role="member" AND status!="archived"',[$memberId]);
    if(!$member)fail(404,'Membro indisponível');
    if($operation==='create') {
        $payload=history_validate_fields($db,$kind,$fields);
        execute_sql($db,'INSERT INTO member_history_edits(user_id,kind,source_id,payload_json,created_at,updated_at)
          VALUES (?,?,NULL,?,?,?)',[$memberId,$kind,json_encode($payload,JSON_THROW_ON_ERROR),now(),now()]);
        $historyId='manual:'.$db->lastInsertId();
    } else {
        if(!preg_match('/^(real|manual):([1-9][0-9]*)$/D',$historyId,$match))
            fail(422,'Registro inválido');
        $id=(int)$match[2];
        $manual=$match[1]==='manual';
        if($manual) {
            $record=query_one($db,'SELECT id FROM member_history_edits
                WHERE id=? AND user_id=? AND kind=? AND source_id IS NULL AND deleted=0',
                [$id,$memberId,$kind]);
        } else {
            $table=history_base_table($kind);
            $record=query_one($db,'SELECT id FROM '.$table.' WHERE id=? AND user_id=?',[$id,$memberId]);
        }
        if(!$record)fail(404,'Registro não pertence ao membro ou já foi excluído');
        $payload=$operation==='delete'?[]:history_validate_fields($db,$kind,$fields);
        if($manual) {
            execute_sql($db,'UPDATE member_history_edits SET payload_json=?,deleted=?,updated_at=?
              WHERE id=? AND user_id=?',[$operation==='delete'?'{}':json_encode($payload,JSON_THROW_ON_ERROR),
              $operation==='delete'?1:0,now(),$id,$memberId]);
        } else {
            execute_sql($db,'INSERT INTO member_history_edits
              (user_id,kind,source_id,payload_json,deleted,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?)
              ON CONFLICT(user_id,kind,source_id) DO UPDATE
              SET payload_json=excluded.payload_json,deleted=excluded.deleted,updated_at=excluded.updated_at',
              [$memberId,$kind,$id,json_encode($payload,JSON_THROW_ON_ERROR),
               $operation==='delete'?1:0,now(),now()]);
        }
    }
    audit($db,$actorId,'member.history.'.$operation,$memberId,
      ['kind'=>$kind,'historyId'=>$historyId,'fields'=>$operation==='delete'?null:$payload,
       'displayOnly'=>true,'simulation'=>true]);
}
