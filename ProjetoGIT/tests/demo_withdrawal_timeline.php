<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/server/demo_withdrawal_timeline.php';
function check(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
$zone=new DateTimeZone('America/Sao_Paulo');
foreach(['2026-11-04','2024-03-01','2025-01-01'] as $date) {
    $anchor=(new DateTimeImmutable($date,$zone))->getTimestamp();
    $rows=[];
    for($i=0;$i<66;$i++)$rows[]=['id'=>$i<60?'M-'.$i:'D-'.$i,
      'historyId'=>$i<60?'manual:'.$i:null,'simulation'=>true,
      'created_at'=>$anchor-(180-$i*2)*86400,'usd_cents'=>1000+$i*50,
      'btc_satoshis'=>12000+$i*500,'status'=>$i%11===0?'failed':'approved'];
    $real=['id'=>901,'historyId'=>'real:901','created_at'=>$anchor-100,
      'usd_cents'=>900,'status'=>'pending','simulation'=>false];
    $override=['id'=>902,'historyId'=>'real:902','created_at'=>$anchor-200,
      'usd_cents'=>800,'status'=>'approved','simulation'=>true];
    $input=array_merge($rows,[$real,$override]);
    $out=demo_withdrawal_timeline($input,$anchor);
    check($out===demo_withdrawal_timeline($input,$anchor),'Unstable on reload');
    check(count($out)===68 && (int)ceil(count($out)/10)===7,'Pagination/records changed');
    check(in_array($real,$out,true)&&in_array($override,$out,true),'Real receipt changed');
    $fictional=array_values(array_filter($out,fn($r)=>!str_starts_with((string)($r['historyId']??''),'real:')));
    $months=[];$times=[];$minuteSeconds=[];$days=[];
    foreach($fictional as $row) {
        $stamp=(new DateTimeImmutable('@'.$row['created_at']))->setTimezone($zone);
        $key=$stamp->format('Y-m');$months[$key]=($months[$key]??0)+1;
        $times[]=$stamp->format('H:i:s');$minuteSeconds[]=$stamp->format('i:s');
        $days[]=$stamp->setTime(0,0)->getTimestamp();
        check($row['created_at']<$anchor,'Future record');
        $original=$rows[array_search($row['id'],array_column($rows,'id'),true)];
        unset($row['created_at'],$original['created_at']);
        check($row===$original,'Changed amount, status or identity');
    }
    check(count($months)===19,'Expected 19 months for 66 records');
    foreach($months as $n)check($n===3||$n===4,'Monthly quota');
    check(count(array_unique($times))===66,'Repeated time');
    check(count(array_unique($minuteSeconds))===66,'Repeated minutes/seconds');
    sort($days);$gaps=[];
    for($i=1;$i<count($days);$i++){$gap=($days[$i]-$days[$i-1])/86400;$gaps[]=$gap;check($gap>=4,'Days too close');}
    check(count(array_unique($gaps))>=4,'Uniform intervals');
    for($i=1;$i<count($out);$i++)check($out[$i-1]['created_at']>=$out[$i]['created_at'],'Timeline order');
}
check(demo_withdrawal_timeline([],time())===[],'Empty history');
echo "PASS: 3/4 per month, 19 months, seven pages, varied unique times, stable dates, real receipts unchanged\n";
