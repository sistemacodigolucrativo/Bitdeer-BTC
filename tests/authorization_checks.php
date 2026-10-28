<?php
declare(strict_types=1);
require dirname(__DIR__).'/server/bitcoin.php';
require dirname(__DIR__).'/install/ownership.php';
$wallet='bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z';
if (!btc_receive_address_valid($wallet)) throw new Exception('Original wallet should validate');
if (btc_receive_address_valid(substr($wallet,0,-1).'q')) throw new Exception('Invalid checksum accepted');
if (btc_receive_address_valid(strtoupper($wallet))) throw new Exception('Mixed wallet policy bypass');
$nonce=str_repeat('a',64);
if (!install_txt_matches([['txt'=>'bitdeer-install='.$nonce]],$nonce))
    throw new Exception('Exact DNS ownership record should validate');
if (install_txt_matches([['txt'=>'bitdeer-install='.str_repeat('b',64)]],$nonce))
    throw new Exception('Wrong DNS ownership record accepted');
$_SERVER['HTTP_HOST']='example.org';
$_SERVER['SERVER_NAME']='example.org';
if (install_domain()!=='example.org') throw new Exception('Canonical domain not accepted');
$_SERVER['HTTP_HOST']='untrusted.example.org';
if (install_domain()!==null) throw new Exception('Mismatched host accepted');
echo "PASS: wallet checksum and canonical DNS authorization checks\n";

$root=sys_get_temp_dir().'/bitdeer-ip-proof-'.bin2hex(random_bytes(5));
mkdir($root.'/.well-known',0700,true);
$_SERVER['DOCUMENT_ROOT']=$root;
$_SERVER['HTTP_HOST']='203.0.113.5:8443';
if (install_ip_host()!=='203.0.113.5') throw new Exception('IP host parsing failed');
$proof=$root.'/.well-known/bitdeer-install-'.$nonce.'.txt';
if (install_ip_file_verified($nonce)) throw new Exception('Missing IP file accepted');
file_put_contents($proof,'bitdeer-install='.str_repeat('b',64));
if (install_ip_file_verified($nonce)) throw new Exception('Wrong IP proof accepted');
file_put_contents($proof,'bitdeer-install='.$nonce);
if (!install_ip_file_verified($nonce)) throw new Exception('Valid IP proof rejected');
unlink($proof);
rmdir($root.'/.well-known');
rmdir($root);
