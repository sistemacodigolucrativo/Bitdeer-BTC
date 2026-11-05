<?php
declare(strict_types=1);

// Only expose the intended PHP endpoints; never serve the project root.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$root = dirname(__DIR__);

switch ($path) {
    case '/api':
    case '/api/':
    case '/api/index.php':
        require $root . '/api/index.php';
        break;
    case '/install':
    case '/install/':
    case '/install/index.php':
        require $root . '/install/index.php';
        break;
    default:
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Not found';
}
