<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/server/core.php';

$cases = [
    ['same host direct', 'https://app.example.test', 'app.example.test:8000', '', '', false, true],
    ['trusted local preview proxy', 'https://preview.example.test', '127.0.0.1:8000',
        '127.0.0.1', 'preview.example.test', true, true],
    ['untrusted cross-origin request', 'https://attacker.example.test', 'app.example.test',
        '203.0.113.10', 'attacker.example.test', true, false],
    ['forwarded host ignored outside loopback', 'https://attacker.example.test', 'app.example.test',
        '203.0.113.10', 'attacker.example.test', true, false],
    ['forwarded host ignored when proxy trust disabled', 'https://preview.example.test',
        '127.0.0.1:8000', '127.0.0.1', 'preview.example.test', false, false],
    ['missing Origin header', '', 'app.example.test', '', '', false, true],
    ['invalid Origin header', 'not-an-origin', 'app.example.test', '', '', false, false],
];

foreach ($cases as [$name, $origin, $host, $remote, $forwarded, $trustProxy, $expected]) {
    $actual = request_origin_host_matches($origin, $host, $remote, $forwarded, $trustProxy);
    if ($actual !== $expected) {
        fwrite(STDERR, "FAIL: {$name}\n");
        exit(1);
    }
}

fwrite(STDOUT, "PASS: same-origin and trusted-proxy origin checks\n");
