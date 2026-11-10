<?php
declare(strict_types=1);

/** Presentation-only schedule. Never reschedule real receipts, even overridden ones. */
function demo_withdrawal_timeline(array $requests, int $anchor): array {
    $fictional=[];
    foreach($requests as $index=>$row) {
        $historyId=(string)($row['historyId']??'');
        if(str_starts_with($historyId,'manual:') ||
           (($row['simulation']??false)===true && str_starts_with((string)$row['id'],'D-')))
            $fictional[]=$index;
    }
    usort($fictional,static fn($a,$b)=>
        [(int)$requests[$a]['created_at'],(string)$requests[$a]['id']] <=>
        [(int)$requests[$b]['created_at'],(string)$requests[$b]['id']]);
    $count=count($fictional);
    if(!$count)return $requests;
    // Preserve every fixture and the existing ten-record pagination. A 66-row
    // history therefore spans 19 months, rather than crowding six months.
    $months=(int)ceil($count/4);
    $sizes=array_fill(0,$months,4);
    for($left=$months*4-$count,$i=0;$left>0;$left--,$i++)$sizes[$i%$months]--;
    // Use more three-record months when possible, without a short final month.
    if($count>=6) {
        $months=(int)ceil($count/3.5);
        if($months*3>$count)$months--;
        $sizes=array_fill(0,$months,3);
        for($i=0;$i<$count-$months*3;$i++)$sizes[$i]++;
    }
    $zone=new DateTimeZone('America/Sao_Paulo');
    // Normalize to the current month so dates stay stable within each month.
    $anchorMonth=(new DateTimeImmutable('@'.$anchor))->setTimezone($zone)
        ->modify('first day of this month')->setTime(0,0);
    // The newest demo month is exactly two full calendar months before the anchor.
    $month=$anchorMonth->modify('-'.($months+1).' months');
    $usedTimes=[];$usedMinuteSeconds=[];$cursor=0;
    foreach($sizes as $size) {
        $monthKey=$month->format('Y-m');
        // Pseudorandom but stable: no new dates/times on refresh or pagination.
        $hash=hash('sha256',$anchorMonth->getTimestamp().':'.$monthKey);
        $jitter=static fn(int $i):int=>(int)(hexdec(substr($hash,$i*2,2))%3);
        $days=$size===4?[2+$jitter(0),9+$jitter(1),17+$jitter(2),24+$jitter(3)]:
            [3+$jitter(0),14+$jitter(1),24+$jitter(2)];
        foreach(array_slice($days,0,$size) as $day) {
            $index=$fictional[$cursor++];
            $seed=hash('sha256',$anchorMonth->getTimestamp().':'.(string)$requests[$index]['id'].':'.$monthKey);
            $time=(int)(hexdec(substr($seed,0,8))%86400);
            while(isset($usedTimes[$time])||isset($usedMinuteSeconds[$time%3600]))$time=($time+1)%86400;
            $usedTimes[$time]=true;$usedMinuteSeconds[$time%3600]=true;
            $requests[$index]['created_at']=$month->setDate((int)$month->format('Y'),(int)$month->format('m'),$day)
                ->setTime(intdiv($time,3600),intdiv($time%3600,60),$time%60)->getTimestamp();
        }
        $month=$month->modify('+1 month');
    }
    usort($requests,static fn($a,$b)=>(int)$b['created_at']<=>(int)$a['created_at']);
    return $requests;
}
