<?php
declare(strict_types=1);
$sibling=dirname(__DIR__,2).'/private/server';
$default=is_file($sibling.'/schema.php') ? $sibling : dirname(__DIR__).'/server';
$dir=(string)(getenv('BITDEER_SERVER_DIR') ?: $default);
$file=realpath($dir.'/schema.php');
if ($file===false || !is_file($file)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Backend PHP indisponível';
    exit;
}
require_once $file;
require_once __DIR__.'/ownership.php';

/**
 * Supported protection policies:
 * A: privately distributed one-time key, configured as a server-side hash.
 * B: owner-provided server-side key (hash only).
 * C: one-time key plus trusted origin IP list.
 * No policy is selected until BITDEER_INSTALL_POLICY is explicitly configured.
 */
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");

function installer_page(string $title, string $message, int $status): never {
    http_response_code($status);
    $safeTitle=htmlspecialchars($title,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
    $safeMsg=htmlspecialchars($message,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
    echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'.$safeTitle.
        '</title><style>body{font:16px system-ui;background:#0c1120;color:#eef2ff;padding:2rem;min-height:90vh;display:grid;place-items:center}main{background:#181f32;max-width:560px;padding:2rem;border:1px solid #374151;border-radius:18px}p{line-height:1.6}</style></head>'.
        '<body><main><h1>'.$safeTitle.'</h1><p>'.$safeMsg.'</p><p><a style="color:#93c5fd" href="/">Voltar ao aplicativo</a></p></main></body></html>';
    exit;
}

$policy=strtoupper(trim((string)(getenv('BITDEER_INSTALL_POLICY') ?: '')));
// A simple first installation without an additional secret is permitted only
// from the hosting server itself. Remote first-admin creation remains locked.
$host=parse_url('http://'.(string)($_SERVER['HTTP_HOST'] ?? ''),PHP_URL_HOST);
$localSetup=$policy==='' &&
    in_array((string)($_SERVER['REMOTE_ADDR'] ?? ''),['127.0.0.1','::1'],true) &&
    in_array($host,['localhost','127.0.0.1','::1'],true);
$dnsDomain=($policy==='' && !$localSetup) ? install_domain() : null;
$dnsSetup=$dnsDomain!==null;
$hash=(string)(getenv('BITDEER_INSTALL_KEY_HASH') ?: '');
if (!$localSetup && !$dnsSetup && (!in_array($policy,['A','B','C'],true) || $hash==='' || !password_get_info($hash)['algo'])) {
    installer_page('Instalador bloqueado',
        'A decisão técnica 13 ainda não foi ativada no servidor. A instalação inicial permanece desabilitada.',423);
}
if ($policy==='C') {
    $ips=preg_split('/[,;\s]+/',(string)(getenv('BITDEER_INSTALL_ALLOWED_IPS') ?: ''),-1,PREG_SPLIT_NO_EMPTY);
    $remote=(string)($_SERVER['REMOTE_ADDR'] ?? '');
    if (!$ips || !in_array($remote,$ips,true)) {
        installer_page('Acesso restrito','O endereço IP não está autorizado para instalação.',403);
    }
}
try {
    $path=data_file();
    if (is_file($path)) {
        installer_page('Instalador encerrado','Existe uma base de dados neste servidor. A reinstalação e a substituição de dados são bloqueadas.',410);
    }
} catch (Throwable $e) {
    error_log('Installer data path invalid: '.$e->getMessage());
    installer_page('Instalação indisponível','Não foi possível validar o diretório privado de dados.',503);
}
$isSecure=(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off');
if (!$isSecure && !in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)) {
    installer_page('HTTPS obrigatório','O provisionamento pelo navegador exige uma conexão HTTPS.',403);
}
session_name('bitdeer_install');
session_set_cookie_params([
    'lifetime'=>0,'path'=>'/install','httponly'=>true,'secure'=>$isSecure,'samesite'=>'Strict',
]);
session_start();
if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
    $_SESSION['csrf']=bin2hex(random_bytes(32));
}
if (!isset($_SESSION['attempts'])) $_SESSION['attempts']=0;
if ($dnsSetup && (!isset($_SESSION['setup_nonce']) || !is_string($_SESSION['setup_nonce']))) {
    $_SESSION['setup_nonce']=bin2hex(random_bytes(32));
    $_SESSION['setup_issued']=time();
}
$error='';
if (($_SERVER['REQUEST_METHOD']??'GET')==='POST') {
    $csrf=$_POST['csrf']??null;
    if (!is_string($csrf)||!hash_equals($_SESSION['csrf'],$csrf)) {
        installer_page('Formulário inválido','Reabra o instalador e tente novamente.',403);
    }
    if ((int)$_SESSION['attempts']>=5) {
        installer_page('Tentativas limitadas','A sessão de instalação foi bloqueada por excesso de tentativas.',429);
    }
    $_SESSION['attempts']++;
    $secret=$_POST['setup_key']??null;
    $login=$_POST['admin_login']??null;
    $pass=$_POST['admin_password']??null;
    $email=$_POST['support_email']??null;
    $accepted=($_POST['confirmation']??null)==='yes';
    if (!$accepted || (!$localSetup && !$dnsSetup && (!is_string($secret) || strlen($secret)<24 ||
        !password_verify($secret,$hash))) ||
        !is_string($login) || !is_string($pass) || !is_string($email)) {
        $error='Credenciais de instalação ou confirmação inválidas.';
    } elseif ($dnsSetup && (
        time()-(int)($_SESSION['setup_issued']??0)>1800 ||
        !install_dns_verified($dnsDomain,(string)$_SESSION['setup_nonce'])
    )) {
        $error='Prova de controle do domínio ausente, incorreta ou expirada. Publique o TXT abaixo e tente novamente.';
    } else {
        try {
            provision($login,$pass,$email);
            unset($_SESSION['csrf'],$_SESSION['attempts']);
            session_destroy();
            installer_page('Instalação concluída',
                'Banco SQLite e administrador inicial criados. O instalador está bloqueado para novas instalações. Entre pelo aplicativo.',200);
        } catch (InvalidArgumentException $e) {
            $error=$e->getMessage();
        } catch (Throwable $e) {
            error_log('Installer provisioning error: '.$e->getMessage());
            installer_page('Instalação indisponível',
                'Não foi possível concluir o provisionamento. Verifique as permissões e o diretório privado de dados.',503);
        }
    }
} elseif (($_SERVER['REQUEST_METHOD']??'GET')!=='GET') {
    installer_page('Método não permitido','Use o formulário do navegador.',405);
}
$csrf=htmlspecialchars($_SESSION['csrf'],ENT_QUOTES,'UTF-8');
$errorHtml=$error!==''?'<p role="alert" style="color:#fca5a5">'.htmlspecialchars($error,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'</p>':'';
?>
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Instalar Bitdeer BTC</title>
<style>
body{font:16px system-ui;background:#0b1120;color:#f9fafb;min-height:100vh;display:grid;place-items:center;padding:18px}
main{max-width:520px;width:100%;background:#171b2d;padding:28px;border-radius:20px;border:1px solid #30374b}
label{display:block;font-size:13px;margin-top:18px}
input:not([type=checkbox]){display:block;width:100%;box-sizing:border-box;padding:12px;background:#111827;border:1px solid #374151;color:#fff;border-radius:10px;margin-top:6px}
button{width:100%;padding:15px;background:#4f46e5;color:white;border:0;border-radius:12px;font-weight:bold;margin-top:22px}
small{color:#94a3b8}
</style></head><body><main>
<h1>Bitdeer BTC — Instalação inicial</h1>
<p>PHP + SQLite, sem banco MySQL. A instalação é única e não importa dados antigos do navegador.</p>
<small><?= $localSetup ? 'Instalação local — sem chave adicional' : ($dnsSetup ? 'Instalação pelo domínio com verificação DNS' : 'Política de proteção: '.htmlspecialchars($policy,ENT_QUOTES,'UTF-8')) ?></small>
<?php if ($dnsSetup): ?>
<p>Para provar que você controla <?=htmlspecialchars($dnsDomain,ENT_QUOTES,'UTF-8')?>, crie um registro DNS do tipo TXT na zona do seu domínio:</p>
<p><strong>Nome:</strong> <code>_bitdeer-install</code></p>
<p><strong>Valor TXT:</strong> <code style="overflow-wrap:anywhere"><?=htmlspecialchars('bitdeer-install='.$_SESSION['setup_nonce'],ENT_QUOTES,'UTF-8')?></code></p>
<p><small>A confirmação é verificada pelo servidor. O código expira após 30 minutos; se expirar, inicie uma nova sessão. Ter acesso à página não autoriza criar o administrador.</small></p>
<?php endif; ?>
<?=$errorHtml?>
<form method="post" autocomplete="off">
<input type="hidden" name="csrf" value="<?=$csrf?>">
<?php if (!$localSetup && !$dnsSetup): ?>
<label>Chave privada de instalação
<input type="password" name="setup_key" required minlength="24" autocomplete="off"></label>
<?php endif; ?>
<label>Usuário administrador
<input name="admin_login" required minlength="3" maxlength="40" autocomplete="off" pattern="[a-zA-Z0-9_.-]+"></label>
<label>Senha inicial do administrador
<input type="password" name="admin_password" required minlength="10" maxlength="256" autocomplete="new-password"></label>
<label>E-mail de suporte
<input type="email" name="support_email" maxlength="254" required></label>
<label><input type="checkbox" name="confirmation" value="yes" required>
 Confirmo que esta é a instalação inicial. Dados existentes não devem ser substituídos.</label>
<button type="submit">Criar SQLite e administrador</button>
</form>
<p><small>Após a instalação, o assistente é bloqueado. Não exponha o SQLite ou o PHP privado ao navegador.</small></p>
</main></body></html>
