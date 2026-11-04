<?php
declare(strict_types=1);
require_once __DIR__.'/demo_identities.php';

/**
 * Fictitious identities used only by the administrative Random User tool.
 * The mail domains are RFC-reserved examples, so no account points to a
 * third party's inbox.
 */
function random_member_identity(): array {
    $identity=unique_demo_identities(1)[0];
    $parts=explode(' ',$identity['name']);
    $first=(string)($parts[0]??'Member');
    $last=(string)($parts[count($parts)-1]??'User');
    $ascii=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$first.$last);
    $base=strtolower(preg_replace('/[^A-Za-z0-9]/','',$ascii===false?$first.$last:$ascii)??'member');
    $login=$base.random_int(100,9999);
    $domains=['example.com','example.org','example.net','mail.test','demo.invalid'];
    return ['displayName'=>$identity['name'],'login'=>$login,
      'email'=>$login.'@'.$domains[random_int(0,count($domains)-1)],
      'nationality'=>'Internacional'];
    /* Legacy compact catalogue retained below for package compatibility. */
    $catalogue=[
      'Brasil'=>[
        'first'=>['Ana','Beatriz','Camila','Diego','Eduardo','Fernanda','Gabriel','Helena','Igor','Juliana','Larissa','Mateus'],
        'last'=>['Almeida','Barbosa','Costa','Ferreira','Gomes','Lima','Mendes','Nogueira','Oliveira','Pereira','Rocha','Santos']],
      'Estados Unidos'=>[
        'first'=>['Avery','Brooke','Caleb','Dylan','Ethan','Grace','Harper','Jordan','Logan','Mia','Noah','Sophie'],
        'last'=>['Anderson','Bennett','Carter','Dawson','Ellis','Foster','Gray','Hughes','Jackson','Morgan','Parker','Reed']],
      'Reino Unido'=>[
        'first'=>['Amelia','Arthur','Charlotte','Daniel','Emily','George','Hannah','James','Lily','Oliver','Rosie','Thomas'],
        'last'=>['Baker','Clarke','Davies','Edwards','Fletcher','Green','Harris','King','Mitchell','Roberts','Taylor','Walker']],
      'Portugal'=>[
        'first'=>['Afonso','Beatriz','Carolina','Duarte','Ines','Joana','Leonor','Manuel','Margarida','Miguel','Rita','Tiago'],
        'last'=>['Cardoso','Correia','Costa','Faria','Goncalves','Martins','Monteiro','Moreira','Pinto','Rodrigues','Silva','Sousa']],
      'Espanha'=>[
        'first'=>['Alejandro','Alba','Carmen','Diego','Elena','Hugo','Irene','Javier','Lucia','Mateo','Noa','Sergio'],
        'last'=>['Alonso','Diaz','Fernandez','Garcia','Gil','Jimenez','Lopez','Martin','Moreno','Navarro','Romero','Torres']],
      'Franca'=>[
        'first'=>['Antoine','Camille','Chloe','Etienne','Hugo','Juliette','Leo','Manon','Mathis','Nina','Theo','Zoe'],
        'last'=>['Bernard','Chevalier','Dubois','Fournier','Girard','Lambert','Leroy','Moreau','Petit','Rousseau','Simon','Vincent']],
      'Alemanha'=>[
        'first'=>['Anna','Emil','Felix','Greta','Hannah','Jonas','Lea','Leon','Lina','Lukas','Mila','Noah'],
        'last'=>['Becker','Fischer','Hoffmann','Klein','Koch','Mueller','Neumann','Richter','Schneider','Schulz','Vogel']],
      'Hungria'=>[
        'first'=>['Adam','Anna','Balazs','Bence','Csilla','Dora','Eszter','Gabor','Lilla','Mate','Noemi','Zoltan'],
        'last'=>['Balogh','Farkas','Horvath','Kiss','Kovacs','Molnar','Nagy','Nemeth','Szabo','Toth','Varga','Veres']],
    ];
    $nationality=array_keys($catalogue)[random_int(0,count($catalogue)-1)];
    $entry=$catalogue[$nationality];
    $first=$entry['first'][random_int(0,count($entry['first'])-1)];
    $last=$entry['last'][random_int(0,count($entry['last'])-1)];
    $ascii=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$first.$last);
    $base=strtolower(preg_replace('/[^A-Za-z0-9]/','',$ascii===false?$first.$last:$ascii)??'member');
    $login=$base.random_int(100,9999);
    $domains=['example.com','example.org','example.net','mail.test','demo.invalid'];
    return ['displayName'=>$first.' '.$last,'login'=>$login,
      'email'=>$login.'@'.$domains[random_int(0,count($domains)-1)],
      'nationality'=>$nationality];
}
