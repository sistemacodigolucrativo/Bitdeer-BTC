# Bitdeer BTC — pacote PHP + SQLite

## Estrutura

O pacote ZIP tem public_html com os arquivos do frontend React, api/index.php,
install/index.php e .htaccess, e private/server com os arquivos PHP do backend.
private/data é a pasta destinada ao banco SQLite e NÃO deve ser pública.

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
6. Informe login/senha do administrador e e-mail de suporte. A instalação
   cria automaticamente o SQLite, catálogo de cinco planos e **um novo
   membro fundador** com senha aleatória e código de indicação individual.
   As credenciais do fundador são mostradas uma única vez, depois da prova
   de controle. Guarde-as. Nenhum usuário, código ou histórico do mockup
   (inclusive 8ZPTC) é importado.
7. O recebimento BTC começa **sem endereço configurado**: o administrador
   cadastra/alterará a carteira no painel após a instalação, reautenticando
   com sua senha. Até confirmação, o backend bloqueia pedidos novos.
8. A instalação é recusada após a criação do banco SQLite. Preserve backup
   de `private/data` e nunca publique os arquivos da pasta privada.

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
