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
3. Mantendo a estrutura do ZIP, o PHP encontra private/server e private/data
   automaticamente. Não há MySQL nem edição manual do banco.
   BITDEER_SERVER_DIR e BITDEER_DB_PATH são opcionais apenas quando a
   estrutura de diretórios for alterada.
4. Acesse https://SEU_DOMINIO/install na hospedagem com o domínio virtual
   configurado como host canônico (HTTP_HOST deve coincidir com SERVER_NAME).
   Sem chave pré-configurada, o instalador mostrará um desafio DNS:
   criar TXT _bitdeer-install.SEUDOMINIO com o valor único exibido na página.
   Publique esse TXT no provedor DNS do domínio e prossiga no mesmo navegador.
   O código aleatório expira em 30 minutos, só vale naquela sessão e
   a instalação é bloqueada após criar o SQLite e o administrador.
   A verificação exige dns_get_record (DNS TXT habilitado no PHP).
5. Instalação por acesso local/loopback continua disponível sem etapa DNS.
   Não exponha a interface local a terceiros por proxy sem autenticação.
   Se o servidor não identificar um host canônico confiável, o instalador
   NÃO liberará cadastro remoto de administrador; corrija o virtual host.
6. Formulário: login do primeiro administrador, senha e e-mail de suporte.
   O provisionamento inicial cria as tabelas e os cinco planos.
7. Acessos públicos à rota não comprovam domínio: só o TXT publicado
   pelo operador DNS autoriza a primeira conta administrativa.
   Evite reutilizar desafios entre tentativas ou manter o TXT expirado.
   Após instalar, o /install recusa outra instalação.

### Requisitos importantes
- Raiz pública apontada somente a public_html; private permanece fora dela.
- Conexão HTTPS válida pelo domínio do site.
- PHP 8.2+, pdo_sqlite, mbstring, dns_get_record e acesso DNS TXT.
- Pastas privadas graváveis e permissões restritas.
- O assistente protege contra reinstalação, mas não substitui
  backups e configuração do servidor.


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
