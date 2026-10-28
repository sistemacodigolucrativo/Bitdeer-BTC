<?php
declare(strict_types=1);
/**
 * All BTC/USD equivalents use a public market quote fetched by PHP.
 * A short SQLite cache shares one rate between screens and account requests;
 * an expired/failed quote is NEVER presented as current or used for new orders.
 * The CI fixture is explicitly inaccessible outside local CI servers.
 */
function verified_btc_quote(?PDO $db=null): array {
    $test=getenv('BITDEER_TEST_QUOTE_USD');
    if ($test!==false && getenv('CI')==='true' &&
        in_array($_SERVER['SERVER_NAME']??'',['localhost','127.0.0.1'],true)) {
        $p=(float)$test;
        if ($p<1000||$p>10000000) throw new RuntimeException('Invalid CI quote');
        return ['usd'=>$p,'source'=>'CI fixture','quoted_at'=>time()];
    }
    if ($db!==null) {
        $entry=query_one($db,'SELECT value FROM app_settings WHERE name="btc_usd_quote_cache"');
        $saved=$entry?json_decode($entry['value'],true):null;
        if(is_array($saved) && isset($saved['usd'],$saved['source'],$saved['quoted_at']) &&
            is_numeric($saved['usd']) && is_string($saved['source']) &&
            is_numeric($saved['quoted_at']) &&
            (int)$saved['quoted_at']<=time()+5 && (int)$saved['quoted_at']>=time()-60) {
            $p=(float)$saved['usd'];
            if(is_finite($p)&&$p>=1000&&$p<=10000000) {
                return ['usd'=>$p,'source'=>$saved['source'],'quoted_at'=>(int)$saved['quoted_at']];
            }
        }
    }
    // Coinbase and Kraken public endpoints are unauthenticated.
    $providers=[
       ['coinbase','https://api.coinbase.com/v2/prices/spot?currency=USD',null],
       ['kraken','https://api.kraken.com/0/public/Ticker?pair=XBTUSD',null]
    ];
    // CoinGecko's free Demo tier requires an optional key; never hard-code one.
    $demoKey=(string)(getenv('BITDEER_COINGECKO_DEMO_KEY')?:'');
    if($demoKey!=='') $providers[]=['coingecko',
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        $demoKey];
    foreach($providers as [$source,$url,$key]) {
        $header="Accept: application/json\r\nUser-Agent: BitdeerBTC/1.0\r\n";
        if($key!==null) $header.="x-cg-demo-api-key: ".$key."\r\n";
        $ctx=stream_context_create(['http'=>['timeout'=>4,'ignore_errors'=>false,'header'=>$header],
          'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
        $raw=@file_get_contents($url,false,$ctx);
        if(!is_string($raw)||strlen($raw)>30000)continue;
        $data=json_decode($raw,true);
        if(!is_array($data))continue;
        $amount=match($source) {
          'coinbase'=>$data['data']['amount']??null,
          'kraken'=>$data['result']['XXBTZUSD']['c'][0]??
              $data['result']['XBTUSD']['c'][0]??null,
          default=>$data['bitcoin']['usd']??null
        };
        if(!is_numeric($amount))continue;
        $price=(float)$amount;
        if(!is_finite($price)||$price<1000||$price>10000000)continue;
        $quote=['usd'=>$price,'source'=>$source,'quoted_at'=>time()];
        if($db!==null) {
            execute_sql($db,'INSERT INTO app_settings(name,value)
              VALUES ("btc_usd_quote_cache",?) ON CONFLICT(name) DO UPDATE SET value=excluded.value',
              [json_encode($quote,JSON_THROW_ON_ERROR)]);
        }
        return $quote;
    }
    throw new RuntimeException('Cotação BTC/USD indisponível; não é possível registrar novos pedidos agora.');
}
function satoshi_payment(int $priceCents,float $btcUsd): int {
    if($priceCents<=0||!is_finite($btcUsd)||$btcUsd<=0)
        throw new InvalidArgumentException('Invalid BTC quote or amount');
    $sats=(int)round(($priceCents/100)*100000000/$btcUsd);
    if($sats<=0||$sats>1000000000000)throw new RuntimeException('Unsafe satoshi amount');
    return $sats;
}
/** Round at the cent boundary from the same quoted USD/BTC price. */
function btc_satoshis_to_usd_cents(int $sats,float $btcUsd): int {
    if($sats<=0||!is_finite($btcUsd)||$btcUsd<=0)
        throw new InvalidArgumentException('Invalid BTC quote or amount');
    return (int)round($sats / 100000000 * $btcUsd * 100);
}
