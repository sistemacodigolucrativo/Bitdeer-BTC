<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/server/demo_withdrawal_timeline.php';
function check(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
$zone=new DateTimeZone('America/Sao_Paulo');$offsets=[];
for($day=0;$day<365;$day++) {
    $date=(new DateTimeImmutable('2026-01-01 12:00:00',$zone))->modify('+'.$day.' days');
    $anchor=$date->getTimestamp();$rows=[];
    for($i=0;$i<66;$i++)$rows[]=['id'=>'M-'.$i,'historyId'=>'manual:'.$i,'simulation'=>true,
      'created_at'=>$anchor-(180-$i*2)*86400,'usd_cents'=>1000+$i*50,
      'btc_satoshis'=>12000+$i*500,'status'=>$i%11===0?'failed':'approved'];
    $out=demo_withdrawal_timeline($rows,$anchor);
    check($out===demo_withdrawal_timeline($rows,$anchor+3600),'Refresh changed same-day dates');
    check(count($out)===66 && (int)ceil(count($out)/10)===7,'Pagination or record count changed');
    $age=($anchor-(int)$out[0]['created_at'])/86400;
    check($age>=45 && $age<=60,'Latest fixture must be 45–60 days old; got '.$age);
    $offsets[(int)floor($age)]=true;
    $original=[];foreach($rows as $row)$original[$row['id']]=$row;
    $monthCounts=[];$days=[];$times=[];
    foreach($out as $i=>$row) {
        $stamp=(new DateTimeImmutable('@'.$row['created_at']))->setTimezone($zone);
        $monthCounts[$stamp->format('Y-m')]=($monthCounts[$stamp->format('Y-m')]??0)+1;
        $dayKey=$stamp->format('Y-m-d');$timeKey=$stamp->format('H:i:s');
        check(!isset($days[$dayKey]),'More than one record on a day');$days[$dayKey]=true;
        check(!isset($times[$timeKey]),'Repeated time');$times[$timeKey]=true;
        $old=$original[$row['id']];unset($row['created_at'],$old['created_at']);
        check($row===$old,'Amounts or statuses changed');
        if($i>0)check($out[$i-1]['created_at'] >= $out[$i]['created_at'],'Chronological order changed');
    }
    foreach($monthCounts as $n)check($n>=3&&$n<=4,'Expected three or four records per month');
}
check(count($offsets)>1,'Offset never varies');
check(demo_withdrawal_timeline([],time())===[],'Empty history');
echo "PASS: 365 dates; latest fixture 45–60 days old; stable within day; values and order preserved\n";
