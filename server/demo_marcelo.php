<?php
declare(strict_types=1);

/**
 * Fictional founding-member fixture. History rows are stored ONLY in the
 * audited presentation overlay, never as mined BTC, paid orders or transfers.
 * Run inside the caller's BEGIN IMMEDIATE transaction, after schema setup.
 * A one-time random password is returned to the authorized installer/admin.
 */
function seed_marcelo_demo(PDO $db, int $adminId): array {
    // core.php uses BEGIN IMMEDIATE through SQL, so PDO::inTransaction() may remain false.
    $mode=query_one($db,'SELECT value FROM app_settings WHERE name="payment_mode"');
    if (($mode['value']??'')!=='simulation')
        throw new RuntimeException('A conta Marcelo somente pode ser criada em modo de simulação.');
    if (query_one($db,'SELECT value FROM app_settings WHERE name="demo_marcelo_seed"'))
        throw new RuntimeException('A conta demonstrativa Marcelo já foi criada; nenhum dado foi alterado.');

    $login='marcelo';
    // Preserve the administrator's chosen login; never take over an existing member.
    $conflict=query_one($db,'SELECT id,role FROM users WHERE login=?',[$login]);
    if($conflict && $conflict['role']==='admin')$login='marcelo-demo';
    if(query_one($db,'SELECT id FROM users WHERE login=?',[$login]))
        throw new RuntimeException('Já existe a conta Marcelo; nenhum dado foi alterado.');

    $now=now();
    $start=$now-165*86400; // 5.5 months of fictional historical activity
    $password=bin2hex(random_bytes(20));
    $invite=strtoupper(bin2hex(random_bytes(5)));
    execute_sql($db,'INSERT INTO users(login,password_hash,role,status,display_name,created_at,updated_at)
      VALUES (?,?,"member","active",?,?,?)',
      [$login,secure_password($password),'Marcelo',$start,$now]);
    $userId=(int)$db->lastInsertId();
    execute_sql($db,'INSERT INTO mining_state(user_id,updated_at) VALUES (?,?)',[$userId,$now]);
    execute_sql($db,'INSERT INTO referral_codes(user_id,code,created_at) VALUES (?,?,?)',
      [$userId,$invite,$start]);

    $segments=[
      ['plan'=>'FREE','from'=>0,'to'=>14],
      ['plan'=>'VIP_01','from'=>14,'to'=>44],
      ['plan'=>'FREE','from'=>44,'to'=>49],
      ['plan'=>'VIP_02','from'=>49,'to'=>79],
      ['plan'=>'FREE','from'=>79,'to'=>84],
      ['plan'=>'VIP_03','from'=>84,'to'=>114],
      ['plan'=>'VIP_03','from'=>114,'to'=>144],
      ['plan'=>'FREE','from'=>144,'to'=>165]
    ];
    $plans=[];
    foreach(['FREE','VIP_01','VIP_02','VIP_03'] as $id){
        $row=query_one($db,'SELECT * FROM plans WHERE id=?',[$id]);
        if(!$row)throw new RuntimeException('Plano necessário ausente: '.$id);
        $plans[$id]=$row;
    }

    $earnedUnits=0;
    $bonusUnits=0;
    $bonusSatoshis=0;
    $withdrawCents=0;
    $counts=array_fill_keys(['accrual','bonus','purchase','withdrawal','subscription'],0);
    $save=function(string $kind,array $payload) use($db,$userId,$now,&$counts):void {
        // All five categories use the existing admin-editable SQLite overlay.
        execute_sql($db,'INSERT INTO member_history_edits
          (user_id,kind,source_id,payload_json,deleted,created_at,updated_at)
          VALUES (?,?,NULL,?,0,?,?)',
          [$userId,$kind,json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$now,$now]);
        $counts[$kind]++;
    };
    $rateForDay=static fn(int $day):float=>
        (float)(76000+$day*73+($day%17)*117); // Explicitly illustrative historical quote.

    // For every historical VIP purchase, create a matching expired subscription.
    // The intervals do not overlap; none is active today, so plan_at() stays FREE.
    foreach($segments as $seg){
        $id=$seg['plan'];
        $from=$seg['from'];$to=$seg['to'];
        if($id!=='FREE'){
            $plan=$plans[$id];
            $activated=$start+$from*86400;
            $ends=$start+$to*86400;
            $btcSats=(int)round(($plan['price_cents']/100)*100000000/$rateForDay($from));
            $save('purchase',['plan_id'=>$id,'status'=>'approved',
              'created_at'=>$activated-3600,'btc_sats'=>$btcSats]);
            $save('subscription',['plan_id'=>$id,
              'started_at'=>$activated,'expires_at'=>$ends]);
        }
        // Two-day accrual intervals retain the actual plan daily rate and
        // exact internal unit scale (100 units per cent per second).
        for($day=$from;$day<$to;$day+=2){
            $finish=min($day+2,$to);
            $units=($finish-$day)*86400*(int)$plans[$id]['daily_cents']*100;
            $save('accrual',['plan_id'=>$id,
              'start_ts'=>$start+$day*86400,
              'end_ts'=>$start+$finish*86400,
              'earned_units'=>$units]);
            $earnedUnits+=$units;
        }
    }

    // 165 daily bonuses with the rates of the corresponding historical plan.
    // The final bonus is safely in the past, not a future scheduled claim.
    for($day=0;$day<165;$day++){
        $id='FREE';
        foreach($segments as $seg){
            if($day >= $seg['from'] && $day < $seg['to']){
                $id=$seg['plan'];break;
            }
        }
        $plan=$plans[$id];
        $units=(int)$plan['bonus_usd_cents']*8640000;
        $sats=(int)$plan['bonus_satoshis'];
        $save('bonus',['plan_id'=>$id,'claimed_at'=>$start+$day*86400+3600,
          'bonus_usd_units'=>$units,'bonus_satoshis'=>$sats]);
        $bonusUnits+=$units;
        $bonusSatoshis+=$sats;
    }

    // Sixty fictional withdrawal records, only inside historical VIP windows.
    // Values grow gradually and are much smaller in the first month.
    $index=0;
    foreach($segments as $seg){
        if($seg['plan']==='FREE')continue;
        for($day=$seg['from']+1;$day<$seg['to'];$day+=2){
            $cents=600+$day*24+$index*32+($index%5)*18;
            $sats=(int)round(($cents/100)*100000000/$rateForDay($day));
            $save('withdrawal',['plan_id'=>$seg['plan'],'status'=>'approved',
              'created_at'=>$start+$day*86400+7200,
              'usd_cents'=>$cents,'btc_satoshis'=>$sats]);
            $withdrawCents+=$cents;
            $index++;
        }
    }

    // Explicit fictional opening credit reconciles the timeline exactly:
    // opening + plan accruals + claimed bonuses - demo withdrawals = US$ 2,000.
    // No original financial ledger, on-chain transaction or payment status is changed.
    $targetUnits=200000*8640000;
    $withdrawUnits=$withdrawCents*8640000;
    $openingUnits=$targetUnits-$earnedUnits-$bonusUnits+$withdrawUnits;
    if($openingUnits<0)throw new RuntimeException('Histórico demonstrativo excede o saldo alvo');
    $openingCents=intdiv($openingUnits,8640000);
    execute_sql($db,'UPDATE mining_state SET balance_units=?,bonus_satoshis_balance=?,
      last_bonus_at=?,running=0,last_accrual_at=NULL,session_ends_at=NULL,
      cooldown_until=NULL,updated_at=? WHERE user_id=?',
      [$targetUnits,$bonusSatoshis,$start+164*86400+3600,$now,$userId]);

    $metadata=['userId'=>$userId,'login'=>$login,'simulation'=>true,
      'startAt'=>$start,'seededAt'=>$now,'openingUsdCents'=>$openingCents,
      'earnedUsdCents'=>intdiv($earnedUnits,8640000),
      'bonusUsdCents'=>intdiv($bonusUnits,8640000),
      'withdrawUsdCents'=>$withdrawCents,'balanceUsdCents'=>200000,
      'historicalQuote'=>'illustrative, not verified market history',
      'historyCounts'=>$counts];
    execute_sql($db,'INSERT INTO app_settings(name,value) VALUES ("demo_marcelo_seed",?)',
      [json_encode($metadata,JSON_THROW_ON_ERROR)]);
    audit($db,$adminId,'demo.member.seed',$userId,$metadata);
    return ['userId'=>$userId,'login'=>$login,'displayName'=>'Marcelo',
      'initialPassword'=>$password,'referralCode'=>$invite,'summary'=>$metadata];
}
