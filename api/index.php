<?php
declare(strict_types=1);
// Production can keep server PHP sources outside the public document root.
$sibling=dirname(__DIR__,2).'/private/server';
$default=is_file($sibling.'/api.php') ? $sibling : dirname(__DIR__).'/server';
$dir=(string)(getenv('BITDEER_SERVER_DIR') ?: $default);
$file=realpath($dir.'/api.php');
if ($file===false || !is_file($file)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error'=>'Backend PHP indisponível']);
    exit;
}
require_once $file;
