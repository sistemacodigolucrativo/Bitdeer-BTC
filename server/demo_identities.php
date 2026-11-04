<?php
declare(strict_types=1);

/**
 * International fictitious identities for display-only records.  The catalogue
 * is built from culturally matching name pairs: 6 groups x 10 x 10 = 600
 * distinct given names and surnames. No member data is read or modified.
 */
function demo_identity_catalogue(): array {
    $groups=[
      ['Brasil','🇧🇷',['Ana','Beatriz','Camila','Diego','Eduardo','Fernanda','Gabriel','Helena','Igor','Juliana'],['Maria','Clara','Luiza','Henrique','Luiz','Carolina','Lucas','Sofia','Rafael','Cristina'],['Almeida','Barbosa','Costa','Ferreira','Gomes','Lima','Mendes','Oliveira','Pereira','Rocha'],['Silva','Santos','Souza','Carvalho','Ribeiro','Teixeira','Moreira','Cardoso','Monteiro','Azevedo']],
      ['Estados Unidos','🇺🇸',['Avery','Brooke','Caleb','Dylan','Ethan','Grace','Harper','Jordan','Logan','Mia'],['James','Rose','Michael','Reese','Alexander','Marie','Jane','Taylor','William','Claire'],['Anderson','Bennett','Carter','Dawson','Ellis','Foster','Gray','Hughes','Jackson','Morgan'],['Parker','Reed','Taylor','Walker','Wilson','Hayes','Cooper','Brooks','Sullivan','Bailey']],
      ['Reino Unido','🇬🇧',['Amelia','Arthur','Charlotte','Daniel','Emily','George','Hannah','James','Lily','Oliver'],['Rose','Edward','Grace','William','Jane','Alexander','Louise','Henry','Mae','Thomas'],['Baker','Clarke','Davies','Edwards','Fletcher','Green','Harris','King','Mitchell','Roberts'],['Taylor','Walker','Wright','Young','Bennett','Collins','Fisher','Graham','Hunter','Palmer']],
      ['Portugal','🇵🇹',['Afonso','Beatriz','Carolina','Duarte','Ines','Joana','Leonor','Manuel','Margarida','Miguel'],['Manuel','Sofia','Rita','Joao','Maria','Filipa','Isabel','Jose','Teresa','Andre'],['Cardoso','Correia','Costa','Faria','Goncalves','Martins','Monteiro','Moreira','Pinto','Rodrigues'],['Silva','Sousa','Teixeira','Vieira','Lopes','Melo','Neves','Nunes','Ramos','Vaz']],
      ['Espanha','🇪🇸',['Alejandro','Alba','Carmen','Diego','Elena','Hugo','Irene','Javier','Lucia','Mateo'],['Jose','Maria','Isabel','Luis','Sofia','Manuel','Teresa','Carlos','Beatriz','Antonio'],['Alonso','Diaz','Fernandez','Garcia','Gil','Jimenez','Lopez','Martin','Moreno','Navarro'],['Romero','Torres','Vega','Serrano','Castro','Molina','Ortega','Santos','Ramos','Iglesias']],
      ['França','🇫🇷',['Antoine','Camille','Chloe','Etienne','Hugo','Juliette','Leo','Manon','Mathis','Nina'],['Louis','Marie','Claire','Pierre','Alexandre','Louise','Paul','Sophie','Jean','Elise'],['Bernard','Chevalier','Dubois','Fournier','Girard','Lambert','Leroy','Moreau','Petit','Rousseau'],['Simon','Vincent','Marchand','Garnier','Faure','Mercier','Blanc','Guerin','Boyer','Henry']],
    ];
    $catalogue=[];
    foreach($groups as [$country,$flag,$first,$middle,$last,$secondLast]) {
        for($i=0;$i<10;$i++) for($j=0;$j<10;$j++) {
            $given=$first[$i].' '.$middle[$j];
            $family=$last[$i].' '.$secondLast[$j];
            $catalogue[]=['name'=>$given.' '.$family,'given'=>$given,'family'=>$family,'country'=>$country,'flag'=>$flag];
        }
    }
    return $catalogue;
}

/** @return array<int,array{name:string}> */
function unique_demo_identities(int $count): array {
    $catalogue=demo_identity_catalogue();
    if($count<1 || $count>count($catalogue)) throw new InvalidArgumentException('Invalid identity count');
    $keys=array_keys($catalogue);
    shuffle($keys);
    $chosen=[];$givens=[];$families=[];
    foreach($keys as $key) {
        $identity=$catalogue[$key];
        if(isset($givens[$identity['given']])||isset($families[$identity['family']]))continue;
        $chosen[]=['name'=>$identity['name'],'country'=>$identity['country'],'flag'=>$identity['flag']];
        $givens[$identity['given']]=true;$families[$identity['family']]=true;
        if(count($chosen)===$count)return $chosen;
    }
    throw new RuntimeException('Could not produce unique display identities');
}
