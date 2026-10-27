<?php
declare(strict_types=1);
/*
 * DECISION 13 OPEN: there is no approved installation-key/IP policy.
 * Never expose a public initial administrator creation flow without it.
 * This remains a deliberate fail-closed placeholder, not a finished installer.
 */
http_response_code(423);
header('Cache-Control: no-store');
header('Content-Type: text/plain; charset=utf-8');
header('X-Content-Type-Options: nosniff');
echo 'Instalador indisponível: a política de proteção /install (decisão técnica 13) ainda precisa ser aprovada.';
