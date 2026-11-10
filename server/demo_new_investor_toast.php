<?php
declare(strict_types=1);

/** Fictional profiles shown only in the mockup-mode investor toast. */
function demo_new_investor_profiles(): array {
    return [
      ['firstName'=>'Mariana','lastName'=>'Azevedo','flag'=>'🇧🇷','city'=>'Belford Roxo','state'=>'RJ'],
      ['firstName'=>'Rafael','lastName'=>'Mendes','flag'=>'🇧🇷','city'=>'Contagem','state'=>'MG'],
      ['firstName'=>'Juliana','lastName'=>'Ribeiro','flag'=>'🇧🇷','city'=>'Campinas','state'=>'SP'],
      ['firstName'=>'Carlos','lastName'=>'Oliveira','flag'=>'🇧🇷','city'=>'Feira de Santana','state'=>'BA'],
      ['firstName'=>'Patrícia','lastName'=>'Nunes','flag'=>'🇧🇷','city'=>'Curitiba','state'=>'PR'],
      ['firstName'=>'Camila','lastName'=>'Fernández','flag'=>'🇦🇷','city'=>'Córdoba','state'=>'CB'],
      ['firstName'=>'Diego','lastName'=>'Rojas','flag'=>'🇨🇱','city'=>'Santiago','state'=>'RM'],
      ['firstName'=>'Valentina','lastName'=>'Gómez','flag'=>'🇨🇴','city'=>'Medellín','state'=>'ANT'],
      ['firstName'=>'Sofía','lastName'=>'Torres','flag'=>'🇵🇪','city'=>'Lima','state'=>'LMA'],
      ['firstName'=>'Luis','lastName'=>'Hernández','flag'=>'🇲🇽','city'=>'Guadalajara','state'=>'JAL'],
      ['firstName'=>'Inês','lastName'=>'Martins','flag'=>'🇵🇹','city'=>'Porto','state'=>'Porto'],
      ['firstName'=>'Lucía','lastName'=>'García','flag'=>'🇪🇸','city'=>'Sevilla','state'=>'AN'],
      ['firstName'=>'Olivia','lastName'=>'Parker','flag'=>'🇺🇸','city'=>'Austin','state'=>'TX'],
      ['firstName'=>'Emma','lastName'=>'Wilson','flag'=>'🇨🇦','city'=>'Toronto','state'=>'ON'],
      ['firstName'=>'Léa','lastName'=>'Bernard','flag'=>'🇫🇷','city'=>'Lyon','state'=>'ARA'],
      ['firstName'=>'Lukas','lastName'=>'Weber','flag'=>'🇩🇪','city'=>'München','state'=>'BY'],
      ['firstName'=>'Giulia','lastName'=>'Rossi','flag'=>'🇮🇹','city'=>'Milano','state'=>'MI'],
      ['firstName'=>'George','lastName'=>'Harris','flag'=>'🇬🇧','city'=>'Manchester','state'=>'ENG'],
      ['firstName'=>'Haruka','lastName'=>'Sato','flag'=>'🇯🇵','city'=>'Osaka','state'=>'Osaka'],
      ['firstName'=>'Mia','lastName'=>'Taylor','flag'=>'🇦🇺','city'=>'Sydney','state'=>'NSW'],
      ['firstName'=>'Martín','lastName'=>'Silva','flag'=>'🇺🇾','city'=>'Montevideo','state'=>'MO'],
      ['firstName'=>'Andrés','lastName'=>'Benítez','flag'=>'🇵🇾','city'=>'Asunción','state'=>'ASU'],
    ];
}

/** Reserve a never-before-shown first and last name for this member. */
function claim_demo_new_investor(PDO $db, int $userId): ?array {
    if($userId<=0)return null;
    $profiles=demo_new_investor_profiles();
    return atomic($db,static function()use($db,$userId,$profiles):?array {
        $seen=query_all($db,'SELECT first_name,last_name
            FROM demo_new_investor_impressions WHERE user_id=?',[$userId]);
        $usedFirst=[];$usedLast=[];
        foreach($seen as $row) {
            $usedFirst[(string)$row['first_name']]=true;
            $usedLast[(string)$row['last_name']]=true;
        }
        $available=array_values(array_filter($profiles,static fn(array $profile):bool=>
            !isset($usedFirst[$profile['firstName']])&&!isset($usedLast[$profile['lastName']])));
        if(!$available)return null;
        $profile=$available[random_int(0,count($available)-1)];
        execute_sql($db,'INSERT INTO demo_new_investor_impressions
            (user_id,first_name,last_name,shown_at) VALUES (?,?,?,?)',
            [$userId,$profile['firstName'],$profile['lastName'],now()]);
        return [
          'flag'=>$profile['flag'],
          'name'=>$profile['firstName'].' '.$profile['lastName'],
          'city'=>$profile['city'],
          'state'=>$profile['state'],
        ];
    });
}
