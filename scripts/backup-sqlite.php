<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/server/core.php';

$source=data_file();
if(!is_file($source))throw new RuntimeException('SQLite database does not exist');
$directory=(string)(getenv('BITDEER_BACKUP_DIR')?:dirname($source).'/backups');
if(!str_starts_with($directory,'/'))throw new RuntimeException('BITDEER_BACKUP_DIR must be absolute');
if(!is_dir($directory)&&!mkdir($directory,0700,true)&&!is_dir($directory))throw new RuntimeException('Cannot create backup directory');
chmod($directory,0700);
$documentRoot=realpath((string)($_SERVER['DOCUMENT_ROOT']??''));$backupPath=realpath($directory);
if($backupPath===false||($documentRoot!==false&&($backupPath===$documentRoot||str_starts_with($backupPath,$documentRoot.DIRECTORY_SEPARATOR))))
  throw new RuntimeException('Backup directory must be outside the public web root');
$stamp=gmdate('Ymd-His');$target=$backupPath.'/bitdeer-'.$stamp.'.sqlite';$temporary=$target.'.partial';
$db=new PDO('sqlite:'.$source,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('PRAGMA busy_timeout=30000');
try {
  $db->exec('VACUUM INTO '.$db->quote($temporary));
  chmod($temporary,0600);
  $check=new PDO('sqlite:'.$temporary,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  $quick=$check->query('PRAGMA quick_check')->fetchColumn();
  if($quick!=='ok'||$check->query('PRAGMA foreign_key_check')->fetchColumn()!==false)
    throw new RuntimeException('SQLite backup validation failed');
  $check=null;
  if(!rename($temporary,$target))throw new RuntimeException('Could not finalize SQLite backup');
  chmod($target,0600);
} catch(Throwable $e) {if(is_file($temporary))@unlink($temporary);throw $e;}
foreach(glob($backupPath.'/bitdeer-????????-??????.sqlite')?:[] as $old) {
  if(filemtime($old)!==false&&filemtime($old)<time()-30*86400)@unlink($old);
}
$keyPath=(string)(getenv('BITDEER_KYC_KEY_FILE')?:'');
if($keyPath!==''&&is_file($keyPath)) {
  $key=file_get_contents($keyPath);
  if($key===false||strlen($key)!==SODIUM_CRYPTO_SECRETBOX_KEYBYTES)throw new RuntimeException('KYC key backup validation failed');
  $keyDir=$backupPath.'/key-recovery';if(!is_dir($keyDir)&&!mkdir($keyDir,0700,true)&&!is_dir($keyDir))throw new RuntimeException('Cannot create key recovery directory');
  chmod($keyDir,0700);$keyTarget=$keyDir.'/kyc-'.substr(hash('sha256',$key),0,16).'.key';
  if(!is_file($keyTarget)){ $keyTmp=$keyTarget.'.partial';if(file_put_contents($keyTmp,$key,LOCK_EX)!==strlen($key)){@unlink($keyTmp);throw new RuntimeException('Could not save KYC recovery key');}chmod($keyTmp,0600);if(!rename($keyTmp,$keyTarget))throw new RuntimeException('Could not finalize KYC recovery key'); }
  sodium_memzero($key);
}
fwrite(STDOUT,"Backup SQLite validado: ".basename($target)."\n");
