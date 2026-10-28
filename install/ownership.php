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

/** Verify a public IP literally entered in the browser, without trusting forwarded headers. */
function install_ip_host(): ?string {
    $raw=(string)($_SERVER['HTTP_HOST'] ?? '');
    $host=(string)(parse_url('http://'.$raw,PHP_URL_HOST) ?: '');
    $host=trim($host,'[]');
    if (!filter_var($host,FILTER_VALIDATE_IP)) return null;
    if (in_array($host,['0.0.0.0','::'],true)) return null;
    return $host;
}
/**
 * Ownership of an IP-based site is proved by uploading a nonce file using
 * the hosting panel/SFTP. The HTTP client cannot create it through /install.
 */
function install_ip_file_verified(string $nonce): bool {
    if (!preg_match('/^[a-f0-9]{64}$/D',$nonce)) return false;
    $root=realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if ($root===false) return false;
    $proof=$root.'/.well-known/bitdeer-install-'.$nonce.'.txt';
    if (!is_file($proof) || is_link($proof) || filesize($proof)>256) return false;
    $canonical=realpath($proof);
    if ($canonical===false || !str_starts_with($canonical,$root.'/.well-known/')) return false;
    $content=@file_get_contents($canonical);
    return is_string($content) && hash_equals('bitdeer-install='.$nonce,trim($content));
}
