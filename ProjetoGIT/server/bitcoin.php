<?php
declare(strict_types=1);
/** Minimal BIP-173/BIP-350 validator for Bitcoin mainnet segwit receivers. */
function btc_receive_address_valid(string $address): bool {
    if (strlen($address)>90 || strlen($address)<14) return false;
    if ($address!==strtolower($address)) return false;
    if (!str_starts_with($address,'bc1')) return false;
    $charset='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    $symbols=[];
    foreach (str_split(substr($address,3)) as $char) {
        $digit=strpos($charset,$char);
        if ($digit===false) return false;
        $symbols[]=$digit;
    }
    if (count($symbols)<7) return false;
    $generator=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
    $chk=1;
    $values=[3,3,0,2,3,...$symbols]; // "bc" HRP expansion.
    foreach ($values as $digit) {
        $top=$chk>>25;
        $chk=(($chk & 0x1ffffff)<<5)^$digit;
        for ($i=0;$i<5;$i++) {
            if (($top>>$i)&1) $chk ^= $generator[$i];
        }
    }
    $version=$symbols[0];
    if ($version>16) return false;
    $expected=$version===0 ? 1 : 0x2bc830a3;
    if ($chk!==$expected) return false;
    $payload=array_slice($symbols,1,-6);
    $acc=0;$bits=0;$bytes=[];
    foreach ($payload as $symbol) {
        $acc=(($acc<<5)|$symbol)&0xfff;
        $bits+=5;
        while ($bits>=8) {
            $bits-=8;
            $bytes[]=($acc>>$bits)&255;
        }
    }
    if ($bits>=5 || (($acc & ((1<<$bits)-1))!==0)) return false;
    $count=count($bytes);
    return $count>=2 && $count<=40 && ($version!==0 || $count===20 || $count===32);
}
