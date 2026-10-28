<?php
declare(strict_types=1);
/**
 * BTC quote is server-side. Client-supplied rates, satoshis and addresses are
 * deliberately ignored. No payment or blockchain confirmation is automatic.
 */
function verified_btc_quote(): array {
    $test = getenv('BITDEER_TEST_QUOTE_USD');
    if ($test !== false && getenv('CI') === 'true' &&
        in_array($_SERVER['SERVER_NAME'] ?? '', ['127.0.0.1','localhost'], true)) {
        $price=(float)$test;
        if ($price < 1000 || $price > 10000000) throw new RuntimeException('Invalid CI quote');
        return ['usd'=>$price,'source'=>'CI fixture','quoted_at'=>time()];
    }
    $providers = [
        ['coinbase','https://api.coinbase.com/v2/prices/spot?currency=USD'],
        ['coingecko','https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd']
    ];
    foreach ($providers as [$source,$url]) {
        $context=stream_context_create(['http'=>[
            'timeout'=>5,'ignore_errors'=>false,
            'header'=>"Accept: application/json\r\nUser-Agent: BitdeerBTC/1.0\r\n"
        ]]);
        $json=@file_get_contents($url,false,$context);
        if (!is_string($json) || strlen($json)>30000) continue;
        $data=json_decode($json,true);
        if (!is_array($data)) continue;
        $value=$source==='coinbase' ? ($data['data']['amount'] ?? null) :
            ($data['bitcoin']['usd'] ?? null);
        if (!is_numeric($value)) continue;
        $price=(float)$value;
        if (!is_finite($price) || $price<1000 || $price>10000000) continue;
        return ['usd'=>$price,'source'=>$source,'quoted_at'=>time()];
    }
    throw new RuntimeException('No verified BTC/USD market quote available');
}
function satoshi_payment(int $priceCents, float $btcUsd): int {
    if ($priceCents <= 0 || !is_finite($btcUsd) || $btcUsd<=0) {
        throw new InvalidArgumentException('Invalid BTC quote or amount');
    }
    $sats=(int)round(($priceCents/100)*100000000/$btcUsd);
    if ($sats<=0 || $sats>1000000000000) throw new RuntimeException('Unsafe satoshi amount');
    return $sats;
}
