<?php
declare(strict_types=1);

/** Identify only accounts explicitly created as demo members. */
function demo_withdrawal_history_is_demo_member(PDO $db, array $actor): bool {
    $userId=(int)($actor['id']??0);
    if($userId<=0)return false;
    if(strtolower((string)($actor['login']??''))==='user')return true;
    $fixture=query_one($db,'SELECT value FROM app_settings WHERE name="demo_marcelo_seed"');
    $metadata=json_decode($fixture['value']??'{}',true);
    if(is_array($metadata)&&(int)($metadata['userId']??0)===$userId)return true;
    return query_one($db,'SELECT id FROM admin_audit WHERE target_user_id=?
        AND action IN ("demo.member.seed","demo.member.random.seed") LIMIT 1',[$userId])!==null;
}

/** Presentation-only schedule. Call only for the member account whose history is demonstrative. */
function demo_withdrawal_timeline(array $requests, int $anchor): array {
    $indices=array_keys($requests);
    usort($indices,static fn($a,$b)=>
        [(int)$requests[$a]['created_at'],(string)$requests[$a]['id']] <=>
        [(int)$requests[$b]['created_at'],(string)$requests[$b]['id']]);
    $count=count($indices);
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
    $current=(new DateTimeImmutable('@'.$anchor))->setTimezone($zone);
    $anchorMonth=$current->modify('first day of this month')->setTime(0,0);
    // Stable throughout each day, with a changing offset of 46–58 days.
    // The generated time of day keeps the final age inside roughly 45–60 days.
    $eligible=[];
    $latestSize=end($sizes);
    for($candidate=46;$candidate<=58;$candidate++) {
        $date=$current->setTime(0,0)->modify('-'.$candidate.' days');
        if((int)$date->format('j')>=1+4*($latestSize-1))$eligible[]=$candidate;
    }
    $offset=$eligible[(int)(hexdec(substr(hash('sha256',$current->format('Y-m-d')),0,4))%count($eligible))];
    $cutoff=$current->setTime(0,0)->modify('-'.$offset.' days');
    $latestMonth=$cutoff->modify('first day of this month')->setTime(0,0);
    $month=$latestMonth->modify('-'.($months-1).' months');
    $usedTimes=[];$usedMinuteSeconds=[];$cursor=0;$slots=[];
    foreach($sizes as $size) {
        $monthKey=$month->format('Y-m');
        // Pseudorandom but stable: no new dates/times on refresh or pagination.
        $hash=hash('sha256',$anchorMonth->getTimestamp().':'.$monthKey);
        $jitter=static fn(int $i):int=>(int)(hexdec(substr($hash,$i*2,2))%3);
        $days=$size===4?[2+$jitter(0),9+$jitter(1),17+$jitter(2),24+$jitter(3)]:
            [3+$jitter(0),14+$jitter(1),24+$jitter(2)];
        if($month->format('Y-m')===$latestMonth->format('Y-m')) {
            $days=[];
            for($i=0;$i<$size;$i++)$days[]=$size===1?(int)$cutoff->format('j'):
                1+(int)floor($i*((int)$cutoff->format('j')-1)/($size-1));
        }
        foreach(array_slice($days,0,$size) as $position=>$day) {
            $index=$indices[$cursor++];
            $seed=hash('sha256',$anchorMonth->getTimestamp().':'.(string)$requests[$index]['id'].':'.$monthKey);
            $time=(int)(hexdec(substr($seed,0,8))%86400);
            while(isset($usedTimes[$time])||isset($usedMinuteSeconds[$time%3600]))$time=($time+1)%86400;
            $usedTimes[$time]=true;$usedMinuteSeconds[$time%3600]=true;
            $date=$month->setDate((int)$month->format('Y'),(int)$month->format('m'),$day);
            $slots[]=$date->setTime(intdiv($time,3600),intdiv($time%3600,60),$time%60)->getTimestamp();
        }
        $month=$month->modify('+1 month');
    }
    sort($slots,SORT_NUMERIC);
    foreach($indices as $i=>$index)$requests[$index]['created_at']=$slots[$i];
    usort($requests,static fn($a,$b)=>(int)$b['created_at']<=>(int)$a['created_at']);
    return $requests;
}
