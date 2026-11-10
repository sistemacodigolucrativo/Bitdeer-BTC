<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/server/demo_withdrawal_timeline.php';
function check(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
function two_month_cutoff(int $anchor,DateTimeZone $zone):int {
    $current=(new DateTimeImmutable('@'.$anchor))->setTimezone($zone);
    $month=$current->modify('first day of this month')->modify('-2 months');
    $day=min((int)$current->format('j'),(int)$month->format('t'));
    return $month->setDate((int)$month->format('Y'),(int)$month->format('m'),$day)
        ->setTime((int)$current->format('H'),(int)$current->format('i'),(int)$current->format('s'))
        ->getTimestamp();
}
$zone=new DateTimeZone('America/Sao_Paulo');
foreach(['2026-11-01','2026-11-04','2026-11-05','2026-11-10','2024-03-01','2025-01-01','2026-05-31'] as $date) {
    $anchor=(new DateTimeImmutable($date,$zone))->getTimestamp();
    $rows=[];
    for($i=0;$i<66;$i++)$rows[]=['id'=>$i<60?'M-'.$i:'D-'.$i,
      'historyId'=>$i<60?'manual:'.$i:null,'simulation'=>true,
      'created_at'=>$anchor-(180-$i*2)*86400,'usd_cents'=>1000+$i*50,
      'btc_satoshis'=>12000+$i*500,'status'=>$i%11===0?'failed':'approved'];
    $storedDemo=['id'=>901,'historyId'=>'real:901','created_at'=>$anchor-100,
      'usd_cents'=>900,'status'=>'pending','simulation'=>false];
    $editedDemo=['id'=>902,'historyId'=>'real:902','created_at'=>$anchor-200,
      'usd_cents'=>800,'status'=>'approved','simulation'=>true];
    $input=array_merge($rows,[$storedDemo,$editedDemo]);
    $out=demo_withdrawal_timeline($input,$anchor);
    check($out===demo_withdrawal_timeline($input,$anchor+3600),'Unstable during the same day');
    check(count($out)===68 && (int)ceil(count($out)/10)===7,'Pagination/records changed');
    $originals=[];
    foreach($input as $row)$originals[(string)$row['id']]=$row;
    $cutoff=two_month_cutoff($anchor,$zone);
    $months=[];$times=[];$minuteSeconds=[];$days=[];
    foreach($out as $row) {
        check((int)$row['created_at']<=$cutoff,'Demo request is newer than the two-month cutoff');
        $original=$originals[(string)$row['id']];
        unset($row['created_at'],$original['created_at']);
        check($row===$original,'Changed amount, status or other request information');
    }
    foreach($out as $row) {
        $stamp=(new DateTimeImmutable('@'.$row['created_at']))->setTimezone($zone);
        $key=$stamp->format('Y-m');$months[$key]=($months[$key]??0)+1;
        $times[]=$stamp->format('H:i:s');$minuteSeconds[]=$stamp->format('i:s');
        $days[]=$stamp->setTime(0,0)->getTimestamp();
    }
    check(count($months)===20,'Expected 20 months for 68 demo requests');
    foreach($months as $n)check($n===3||$n===4,'Monthly quota');
    check(count(array_unique($times))===68,'Repeated time');
    check(count(array_unique($minuteSeconds))===68,'Repeated minutes/seconds');
    sort($days);$gaps=[];
    for($i=1;$i<count($days);$i++){$gap=($days[$i]-$days[$i-1])/86400;$gaps[]=$gap;check($gap>=4,'Days too close');}
    check(count(array_unique($gaps))>=4,'Uniform intervals');
    for($i=1;$i<count($out);$i++)check($out[$i-1]['created_at']>=$out[$i]['created_at'],'Timeline order');
}
$dayFive=(new DateTimeImmutable('2026-11-05',$zone))->getTimestamp();
$dayTen=$dayFive+5*86400;
$dayFiveRows=demo_withdrawal_timeline($input,$dayFive);
$dayTenRows=demo_withdrawal_timeline($input,$dayTen);
$latestAtDayFive=max(array_map(fn($row)=>(int)$row['created_at'],$dayFiveRows));
$latestAtDayTen=max(array_map(fn($row)=>(int)$row['created_at'],$dayTenRows));
check($latestAtDayTen>$latestAtDayFive,'Timeline did not follow the advancing daily cutoff');
check($latestAtDayTen<=two_month_cutoff($dayTen,$zone),'Daily cutoff was exceeded');
$november=(new DateTimeImmutable('2026-11-10',$zone))->getTimestamp();
$december=(new DateTimeImmutable('2026-12-10',$zone))->getTimestamp();
$novemberLatest=max(array_map(fn($row)=>(int)$row['created_at'],demo_withdrawal_timeline($input,$november)));
$decemberLatest=max(array_map(fn($row)=>(int)$row['created_at'],demo_withdrawal_timeline($input,$december)));
check($decemberLatest>$novemberLatest,'Timeline did not advance with the calendar month');
check((new DateTimeImmutable('@'.$novemberLatest))->setTimezone($zone)->format('Y-m')==='2026-09',
    'November should place the latest demo withdrawal in September');
check((new DateTimeImmutable('@'.$decemberLatest))->setTimezone($zone)->format('Y-m')==='2026-10',
    'December should place the latest demo withdrawal in October');
check(demo_withdrawal_timeline([],time())===[],'Empty history');
echo "PASS: 68 demo requests, 20 months, seven pages, cutoff enforced, values preserved, dates advance automatically\n";
