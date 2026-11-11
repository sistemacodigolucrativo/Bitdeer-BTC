<?php
declare(strict_types=1);

/** Same 200 fictional profiles used by the Top Miners showcase. */
function demo_new_investor_profiles(): array {
    static $profiles = null;
    if ($profiles !== null) return $profiles;
    $path = __DIR__ . '/top_miners_seed.json';
    $json = file_get_contents($path);
    if ($json === false) throw new RuntimeException('Top Miners profile seed is unavailable');
    $seed = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    $profiles = [];
    $add = static function(string $name, string $country, string $flag, string $location) use (&$profiles): void {
        $space = strpos($name, ' ');
        if ($space === false) throw new RuntimeException('Top Miners profile name is invalid');
        $profiles[] = [
            'firstName' => substr($name, 0, $space),
            'lastName' => substr($name, $space + 1),
            'name' => $name,
            'country' => $country,
            'flag' => $flag,
            'location' => $location,
        ];
    };
    foreach ($seed['originals'] as $profile) {
        $add($profile['name'], $profile['country'], $profile['flag'], $profile['location']);
    }
    $brazilianIndex = 0;
    $internationalIndex = 0;
    for ($position = 0; $position < 190; $position++) {
        $isBrazilian = intdiv(($position + 1) * 60, 190) > intdiv($position * 60, 190);
        if ($isBrazilian) {
            $index = $brazilianIndex++;
            $first = $seed['brazil']['firstNames'][$index % count($seed['brazil']['firstNames'])];
            $previous = $profiles[count($profiles) - 1]['firstName'];
            if ($first === $previous) {
                $first = $seed['brazil']['firstNames'][($index + 1) % count($seed['brazil']['firstNames'])];
            }
            $last = $seed['brazil']['lastNames'][$index];
            $city = $seed['brazil']['cities'][$index % count($seed['brazil']['cities'])];
            $add($first . ' ' . $last, 'Brazil', '🇧🇷', $city . ', Brasil');
            continue;
        }
        $index = $internationalIndex++;
        $region = $seed['regions'][$index % count($seed['regions'])];
        $positionInRegion = intdiv($index, count($seed['regions']));
        $first = $region['firstNames'][$positionInRegion % count($region['firstNames'])];
        $lastIndex = ($positionInRegion % count($region['firstNames']) +
            intdiv($positionInRegion, count($region['firstNames']))) % count($region['lastNames']);
        $last = $region['lastNames'][$lastIndex];
        $places = array_merge([$region['capital']], $region['cities']);
        $location = $places[$positionInRegion % count($places)] . ', ' . $region['country'];
        $add($first . ' ' . $last, $region['country'], $region['flag'], $location);
    }
    if (count($profiles) !== 200 || $brazilianIndex !== 60 || $internationalIndex !== 130 ||
        count(array_unique(array_column($profiles, 'name'))) !== 200) {
        throw new RuntimeException('Top Miners must provide exactly 200 unique profiles');
    }
    return $profiles;
}

/** Randomly draw a profile never previously shown to this member. */
function claim_demo_new_investor(PDO $db, int $userId): ?array {
    if($userId<=0)return null;
    $profiles=demo_new_investor_profiles();
    return atomic($db,static function()use($db,$userId,$profiles):?array {
        $latest=query_one($db,'SELECT MAX(cycle_index) AS cycle_index
            FROM demo_new_investor_cycle_impressions WHERE user_id=?',[$userId]);
        $cycle=max(1,(int)($latest['cycle_index']??0));
        $seen=query_all($db,'SELECT profile_index,first_name,last_name FROM demo_new_investor_cycle_impressions
            WHERE user_id=?',[$userId]);
        $older=query_all($db,'SELECT first_name,last_name FROM demo_new_investor_impressions WHERE user_id=?',[$userId]);
        $used=[];
        foreach($seen as $row) $used[(int)$row['profile_index']]=true;
        $usedNames=[];
        foreach(array_merge($seen,$older) as $row) $usedNames[mb_strtolower($row['first_name'].' '.$row['last_name'],'UTF-8')]=true;
        $available=[];
        foreach($profiles as $index=>$candidate)
            if(!isset($used[$index])&&!isset($usedNames[mb_strtolower($candidate['firstName'].' '.$candidate['lastName'],'UTF-8')])) $available[$index]=$candidate;
        if(!$available)return null;
        $indices=array_keys($available);
        $profileIndex=$indices[random_int(0,count($indices)-1)];
        $profile=$available[$profileIndex];
        execute_sql($db,'INSERT INTO demo_new_investor_cycle_impressions
            (user_id,cycle_index,profile_index,first_name,last_name,shown_at) VALUES (?,?,?,?,?,?)',
            [$userId,$cycle,$profileIndex,$profile['firstName'],$profile['lastName'],now()]);
        return [
          'flag'=>$profile['flag'],
          'name'=>$profile['name'],
          'location'=>$profile['location'],
        ];
    });
}
