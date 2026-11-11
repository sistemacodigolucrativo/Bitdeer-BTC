# Bitdeer BTC — pacote PHP + SQLite

## Estrutura

O pacote ZIP tem public_html com os arquivos do frontend React, api/index.php,
install/index.php e .htaccess, e private/server com os arquivos PHP do backend.
Ele não inclui SQLite. O instalador cria um banco novo em
`private/data/bitdeer.sqlite` para aquela instalação. Mantenha `private` fora
da raiz pública.

## Instalação compatível com VPS ou hospedagem PHP

1. Requer PHP >=8.2, PDO SQLite e mbstring; Apache com rewrite (ou
   PHP-FPM/Nginx equivalente). Aponte a raiz pública para `public_html`
   e mantenha `private` fora da pasta servida por HTTP. Os caminhos
   do backend e SQLite são detectados automaticamente no ZIP.
2. Abra `/install` pelo **domínio** ou pelo **IP** que está acessando.
   O instalador detecta esse endereço e permite configurar sua URL pública
   (HTTP ou HTTPS) e selecionar VPS, hospedagem convencional ou automático.
   A detecção automática do tipo de hospedagem é limitada; não se pode
   diferenciar com segurança VPS e hospedagem compartilhada apenas pelo PHP.
3. Para domínio em HTTPS: prove controle criando o registro TXT
   `_bitdeer-install.SEU-DOMINIO` com o valor temporário exibido.
   Não exige chave privada pré-configurada.
4. Para endereço IP em HTTPS: envie pelo gerenciador de arquivos/SFTP
   o arquivo TXT com nome e conteúdo exibidos em `/install` para a pasta
   `.well-known` dentro de `public_html`. O instalador NÃO cria esse
   arquivo automaticamente. Somente quem pode publicar arquivos no servidor
   consegue satisfazer a verificação. A comprovação vence em 30 minutos.
5. O aplicativo pode utilizar URL HTTP sem SSL, mas **credenciais não
   podem ser enviadas com segurança por HTTP público**. Por isso, a
   configuração inicial de administrador pela internet exige HTTPS.
   Para VPS operando exclusivamente com IP/HTTP, a alternativa é uma
   conexão local protegida (por exemplo, encaminhamento SSH), com
   `BITDEER_INSTALL_ALLOW_LOCAL=1` e Host e IP de loopback. Nunca
   exponha esse modo local a um proxy público. Não é necessário domínio.
6. Informe login e senha exclusivos do administrador e o e-mail de suporte.
   Cada instalação cria um banco independente e não copia contas, sessões,
   senhas, contatos, pedidos ou históricos do preview. A instalação também cria
   a conta demonstrativa de fundador, cujas credenciais são exibidas uma única
   vez após a conclusão.
7. O recebimento BTC começa **sem endereço configurado**: o administrador
   cadastra/alterará a carteira no painel após a instalação, reautenticando
   com sua senha. Até confirmação, o backend bloqueia pedidos novos.
8. A instalação é recusada após a conclusão. Preserve um backup de
   `private/data`; mantenha `private` fora da raiz pública. O ZIP não inclui
   nenhum banco SQLite.

O banco usado pelo preview e versionado como fonte da verdade é
`.local/private/bitdeer.sqlite`. Ele contém contas, sessões e registros
operacionais; mantenha o repositório privado e restrinja o acesso. O ZIP de
instalação não inclui esse banco: novas instalações começam com um SQLite
novo e independente.

**Limites:** a configuração da URL informa o endereço usado pelo aplicativo,
mas não cria domínio DNS, certificado TLS, regra de proxy, vhost ou
permissões da hospedagem. HTTPS deve estar configurado no servidor antes de
transmitir credenciais remotamente.

## Carteira BTC e suporte

Antes de liberar novas contratações, o administrador precisa confirmar
a posse do endereço de recebimento BTC na seção Configurações e informar
novamente sua senha. Até então o servidor bloqueia pedidos novos.

O endereço preservado do checkout antigo NÃO é prova de que o operador
controle essa carteira. Confira independentemente o endereço antes
de usar com pagamentos reais.

Tickets são gravados no SQLite. Para tentar notificação ao e-mail de suporte,
configure BITDEER_ENABLE_MAIL=1 e
BITDEER_MAIL_FROM=suporte@seudominio.example após validar o serviço mail()
da hospedagem. Aceitação pelo servidor de e-mail não significa entrega.

## Avisos

O sistema contabiliza recompensas INTERNAS; não há evidência automática de
mineração efetiva de BTC ou saldo de blockchain. A confirmação de pagamentos
é manual e exige conferência externa do TXID. Verifique termos, capacidade
operacional, conformidade e eventual enquadramento regulatório antes
de anunciar planos ou aceitar pagamentos.

Esta é uma compilação para homologação; não houve deploy ou merge na main.
Suspensão de membro VIP: o vencimento continua correndo (opção A).
Não há crédito durante o período de suspensão ou crédito retroativo.
A paridade visual completa com o frontend legado requer revisão.

## Conta padrão e dados de demonstração

Novas instalações recebem a conta padrão `user` e o histórico que foi mantido
no modelo sanitizado. Sua senha é gerada de novo para cada instalação e mostrada
uma única vez. A conta demonstrativa Marcelo continua disponível para criação
pelo painel administrativo quando não existir.

Os históricos são salvos em `member_history_edits` como **apresentações
demonstrativas**, sem criar pagamentos reais, contratos ativos, TXIDs ou saques
na blockchain. Um crédito inicial explicitamente fictício, contabilizado
em `app_settings.demo_marcelo_seed` e `admin_audit`, reconcilia:

`crédito inicial + recompensas + bônus - saques fictícios = US$ 2.000`.

As equivalências BTC dos registros antigos usam uma **cotação ilustrativa**,
não uma cotação histórica verificada. O saldo BTC atual é calculado pela
cotação pública recente via servidor. O fundador pode navegar normalmente no
painel, e o administrador pode editar os históricos simulados depois.

## Dados centralizados, KYC e cópias de segurança

O perfil, carteira BTC, idioma, preferência de permanência de sessão,
preferências de boas-vindas, contratos, saldos, mineração, recompensas,
indicações, pedidos, saques e auditoria são lidos e gravados pelo PHP/SQLite.
O navegador mantém apenas tema visual e caches de apresentação. As antigas
carteiras e preferências por usuário ainda no navegador não são sobrescritas:
carteira antiga pode ser importada explicitamente em Carteira. Registros KYC
antigos de IndexedDB também permanecem intactos e oferecem transferência
explícita para a conta.

Os novos documentos e selfies KYC são cifrados com libsodium antes de serem
gravados como BLOBs no SQLite. Configure uma chave aleatória de 32 bytes em
`/etc/bitdeer-btc/kyc.key`, fora da raiz pública, com leitura apenas por
root e pelo usuário do PHP. Nunca coloque essa chave no Git ou no banco.
O vhost Nginx deve passar `BITDEER_KYC_KEY_FILE` ao PHP e permitir até 18 MB
somente em `/api/index.php` para os dois arquivos de até 8 MB.

Em VPS, `deploy/install-storage-security.sh` prepara a chave sem substituir
uma chave existente, instala o timer systemd diário e executa a primeira cópia.
As cópias usam `VACUUM INTO`, passam `quick_check` e `foreign_key_check`, ficam
fora da raiz pública com permissões root-only e são mantidas por 30 dias.
O backup inclui cópias protegidas das versões da chave KYC necessárias à
recuperação. Armazene também uma cópia cifrada fora do servidor para cobrir
perda total do host; sem a chave correspondente os documentos KYC não podem
ser decifrados.

Para a atualização de Nginx, faça backup do vhost e aplique
`deploy/kyc-nginx-location.conf` dentro do `location = /api/index.php`.
Valide com `nginx -t` antes de recarregar. Em hospedagem compartilhada, o
provedor precisa permitir PHP PDO SQLite, libsodium, upload multipart e
permissões privadas; o timer systemd é específico de VPS.
