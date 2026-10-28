# Bitdeer PHP + SQLite — implementação em desenvolvimento

**Esta branch não é uma implantação de produção.** O frontend novo usa apenas dados
do backend; a interface antiga ainda está preservada nos arquivos do projeto,
mas seus saldos simulados em localStorage não devem ser apresentados como dados reais.

## Ambiente

- PHP 8.2+, PDO SQLite e mbstring.
- React/Vite: npm install && npm run build.
- PHP precisa servir /api/index.php; os arquivos em dist/ são estáticos.
- SQLite deve ficar **fora da raiz pública**. Configure BITDEER_DB_PATH como caminho
  absoluto. O padrão fica em um diretório irmão do projeto: bitdeer-private-data.
  Verifique a configuração real da raiz pública antes de usar.
- Nunca implemente fallback de /api ou /install para o index.html do React.

## Instalador e pendências

Decisão técnica 13 continua pendente. O instalador browser está implementado
e suporta políticas A, B e C, mas **nenhuma política é selecionada por padrão**.
Sem as variáveis de autorização exigidas, /install/ responde HTTP 423.
O instalador testa chave privada e CSRF, cria SQLite em diretório privado
e impede uma segunda instalação. Consulte docs/DEPLOYMENT.md para ativação
somente após decisão explícita do proprietário.

O provisionamento CLI continua disponível apenas para testes/desenvolvimento.
O assistente de navegador agora faz o provisionamento inicial completo, mas
só pode ser habilitado com a proteção explícita da decisão nº 13.

Em um ambiente isolado, fora de produção:

    BITDEER_ALLOW_CLI_PROVISION=1 BITDEER_DB_PATH=/caminho/privado/db.sqlite \
      php bin/provision.php login_admin 'senha-forte-exclusiva' contato@dominio.com

O script se recusa a sobrescrever uma instalação existente.

## API

Todos os endpoints usam /api/index.php?action=NOME, sem reescrita de URL.
Autenticação via cookie HttpOnly SameSite, token CSRF e verificação de papel
no servidor. Só contas de membro podem acessar perfil e mineração.

- register, login, session, logout, profile, profile.update
- plans, orders.create, orders.mine, mining.start, mining.stop,
  rewards.claim, ledger
- support, support.ticket.create, support.tickets.mine
- admin.support.tickets, admin.support.status, admin.support.notify
- admin.members, admin.status, admin.member.edit, admin.orders, admin.order.approve
- admin.plan.save, admin.settings, admin.payment.settings, admin.overview

A redefinição de senha usa verificação administrativa registrada. O administrador
precisa verificar a identidade por canal independente, reautenticar com sua
senha, registrar o método e a referência não sensível e usar uma autorização
única válida por 10 minutos. A nova senha é armazenada em hash e todas as
sessões antigas são revogadas. O sistema não comprova de forma automática
que a verificação externa foi realmente executada: isso é responsabilidade
do administrador.

## Regras cobertas

Instalação limpa em SQLite, usuário público sempre membro, sessões simultâneas
revogáveis, suspensão de conta, arquivamento lógico, pagamento manual aprovado
pelo administrador, contratos VIP com snapshots e cálculo de recompensa por
tempo decorrido e relógio do servidor, com transações SQLite.

O saldo aqui representa **recompensas internas**, não comprovação de BTC
efetivamente minerado nem saldo em blockchain. Os bônus USD e satoshis têm resgate diário e histórico no SQLite. A interface
de membros acessa esses dados pela API, sem usar o antigo localStorage como
fonte de verdade.

## Pendências antes de publicar

- Decisão 13: definir qual política será realmente ativada na hospedagem;
  os três modos e o bloqueio de reinstalação têm testes isolados.
- Suspensão VIP — opção A: o prazo de vigência do contrato continua correndo;
  novos créditos permanecem interrompidos até reativação, sem retroativos.
- Formalização operacional dos métodos de verificação de identidade: a
  verificação manual já é registrada, mas depende de procedimento humano.
- Reconciliar todos os componentes visuais do aplicativo legado,
  incluindo internacionalização completa e estados responsivos.
- Verificar domínio/HTTPS e se a confirmação de endereço BTC é feita
  pelo responsável por controlar a carteira, não somente pelo painel.
- Configurar efetivamente o serviço de e-mail caso tickets devam gerar
  notificações; tickets são persistidos mesmo sem transporte de e-mail.
- Confirmar requisitos da hospedagem (PHP, PDO SQLite e diretórios privados).
- Deploy/publicação só com autorização específica.

A CI desta branch executa lint PHP, TypeScript, build React e integração HTTP
com banco SQLite temporário. A CI não publica nada.


## Checkout Bitcoin centralizado (revisão atual)

A antiga página pública em `/btc-checkout/` foi desativada. O fluxo
autenticado na aba Store cria um pedido **pendente** via API. O servidor
obtém uma cotação BTC/USD de provedores públicos, calcula a quantidade
em satoshis, armazena preço/cotação/endereço/duração e retorna os dados
travados do pedido. O painel mostra QR BIP21 e permite copiar os valores.

O servidor não confirma pagamentos por conta própria; o administrador
deve verificar o TXID externamente e informar o identificador da
transação na aprovação manual. Um pedido expirado não ativa um plano
e a taxa/versão não pode ser alterada retroativamente.

A disponibilidade das APIs externas de cotação deve ser validada no
ambiente de hospedagem. Não usar os dados de teste da CI para pagamentos.
O endereço BTC inicial é preservado do checkout original e deve ser
verificado pelo proprietário antes de colocar o fluxo em produção.

## Regras de mineração desta revisão

Os planos têm `session_seconds` e `restart_cooldown_seconds`.
O FREE inicial tem sessão de 2h e cooldown de 2h após encerramento;
os VIPs iniciais são contínuos, com corte na data de vencimento.
As condições ficam armazenadas por snapshot no contrato.
Uma alteração nos limites exige nova revisão do plano e não modifica
contratações já vigentes.

**Atenção:** essa escolha de sessão/pausa FREE é uma implementação
provisória conforme a anotação de duas horas, não uma redefinição
do plano original. Confirmar os detalhes com o proprietário antes
da liberação pública.

## Compatibilidade visual

A navegação de cinco abas Home, Store, Reward, Wallet e Setting foi
reintroduzida no novo workspace, mas o layout interno ainda não foi
reconciliado pixel a pixel com os componentes React antigos.
Esses componentes continuam no repositório e só devem ser
reintegrados após consumir a API sem leitura de saldos de localStorage.


## Pacote de implantação sem publicação automática

A CI gera um arquivo ZIP para homologação contendo uma pasta publica
para o React compilado e rotas PHP, e outra pasta privada para o backend
e SQLite. Não contém credenciais e não faz deploy. Consulte
docs/DEPLOYMENT.md antes de usar; a raiz pública do domínio
deve apontar apenas para public_html.

A autenticação administrativa exige confirmação da posse do endereço
BTC antes de criar novos pedidos. O valor é armazenado no SQLite,
e o estado de confirmação pode ser revogado pelo administrador.

Tickets de suporte são registrados em support_tickets, e as
notificações por e-mail são opt-in no servidor. Uma notificação
aceita pelo transporte não significa entrega comprovada.
