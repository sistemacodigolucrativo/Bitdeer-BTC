<?php
declare(strict_types=1);

/** Restrict domain ownership checks to the canonical virtual host. */
function install_domain(): ?string {
    $host=strtolower((string)(parse_url('http://'.($_SERVER['HTTP_HOST'] ?? ''),PHP_URL_HOST) ?: ''));
    $canonical=strtolower(rtrim((string)($_SERVER['SERVER_NAME'] ?? ''),'.'));
    if ($host!==$canonical || strlen($host)>253 ||
        !preg_match('/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$/D',$host)) return null;
    return $host;
}
/** Exact session nonce; stale and partial records do not authorize the administrator. */
function install_txt_matches(array $records, string $nonce): bool {
    if (!preg_match('/^[a-f0-9]{64}$/D',$nonce)) return false;
    foreach ($records as $record) {
        $value=(string)($record['txt'] ?? '');
        if (hash_equals('bitdeer-install='.$nonce,trim($value,'"'))) return true;
    }
    return false;
}
function install_dns_verified(string $domain, string $nonce): bool {
    if (!function_exists('dns_get_record')) return false;
    $records=@dns_get_record('_bitdeer-install.'.$domain,DNS_TXT);
    return is_array($records) && install_txt_matches($records,$nonce);
}
