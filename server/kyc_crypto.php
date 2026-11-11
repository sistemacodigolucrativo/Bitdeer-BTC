<?php
declare(strict_types=1);

function kyc_secret_key(): string {
    if (!function_exists('sodium_crypto_secretbox')) throw new RuntimeException('libsodium is required for KYC storage');
    $path=(string)(getenv('BITDEER_KYC_KEY_FILE')?:($_SERVER['BITDEER_KYC_KEY_FILE']??''));
    if($path===''||!str_starts_with($path,'/')||!is_file($path))throw new RuntimeException('KYC encryption key is not configured');
    $key=file_get_contents($path);
    if($key===false||strlen($key)!==SODIUM_CRYPTO_SECRETBOX_KEYBYTES)throw new RuntimeException('KYC encryption key is invalid');
    return $key;
}
function kyc_encrypt(string $plain): array {
    $key=kyc_secret_key();$nonce=random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    try{return ['nonce'=>$nonce,'ciphertext'=>sodium_crypto_secretbox($plain,$nonce,$key)];}
    finally{sodium_memzero($key);}
}
function kyc_decrypt(string $ciphertext,string $nonce): string {
    if(strlen($nonce)!==SODIUM_CRYPTO_SECRETBOX_NONCEBYTES)throw new RuntimeException('KYC encrypted record is invalid');
    $key=kyc_secret_key();
    try{$plain=sodium_crypto_secretbox_open($ciphertext,$nonce,$key);if($plain===false)throw new RuntimeException('KYC record could not be decrypted');return $plain;}
    finally{sodium_memzero($key);}
}
