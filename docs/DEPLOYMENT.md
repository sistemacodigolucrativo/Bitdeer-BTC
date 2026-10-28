# Bitdeer BTC — pacote PHP + SQLite

## Estrutura

O pacote ZIP tem public_html com os arquivos do frontend React, api/index.php,
install/index.php e .htaccess, e private/server com os arquivos PHP do backend.
private/data é a pasta destinada ao banco SQLite e NÃO deve ser pública.

## Instalação

1. Hospedagem com PHP >=8.2, PDO SQLite, mbstring, HTTPS, Apache rewrite
   (ou configuração equivalente do Nginx/PHP-FPM).
2. Descompacte o ZIP e aponte a raiz pública do domínio EXCLUSIVAMENTE para
   public_html. A pasta private deve estar fora do alcance do navegador.
3. Configure as variáveis de ambiente do processo PHP com CAMINHOS ABSOLUTOS:
   BITDEER_SERVER_DIR=/caminho/bitdeer/private/server
   BITDEER_DB_PATH=/caminho/bitdeer/private/data/bitdeer.sqlite
4. A decisão técnica 13 continua pendente. O instalador aceita as políticas
   A (chave privada fornecida), B (chave definida pelo proprietário no
   servidor) e C (chave privada e restrição IP). NENHUMA é escolhida
   automaticamente. Para habilitar conscientemente:
   BITDEER_INSTALL_POLICY=A, B ou C
   BITDEER_INSTALL_KEY_HASH=HASH_DE_UMA_CHAVE_FORTE_ALEATORIA
   A política C exige também BITDEER_INSTALL_ALLOWED_IPS com IPs separados
   por vírgula, conferidos contra REMOTE_ADDR.
5. Para gerar o hash da chave de instalação:
   php -r 'echo password_hash($argv[1], PASSWORD_DEFAULT), PHP_EOL;' 'SUA_CHAVE_ALEATORIA_COM_NO_MINIMO_24_CARACTERES'
   Nunca use a string de exemplo como chave real e nunca inclua chaves
   ou senhas em arquivos do frontend, repositório ou páginas públicas.
6. Após a proteção configurada, acesse https://SEU_DOMINIO/install.
   Informe a chave de instalação, login do administrador, senha forte e
   e-mail de suporte. O SQLite e os planos serão criados automaticamente.
7. A reinstalação é recusada quando a base já existe. Remova as variáveis
   de autorização do instalador após a primeira instalação.

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
A política de vencimento VIP durante suspensão ainda precisa de aprovação.
A paridade visual completa com o frontend legado requer revisão.
