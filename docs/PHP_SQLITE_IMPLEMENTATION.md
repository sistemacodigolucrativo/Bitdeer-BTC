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

Decisão técnica 13 continua pendente. Em razão disso, o endpoint de navegador
/install/ responde **423 Locked** por padrão. Não foi escolhida nenhuma das
alternativas A, B ou C.

Existe um provisionamento CLI limitado a ambiente de teste/desenvolvimento.
Isto não substitui a instalação por navegador especificada para a entrega final.

Em um ambiente isolado, fora de produção:

    BITDEER_ALLOW_CLI_PROVISION=1 BITDEER_DB_PATH=/caminho/privado/db.sqlite \
      php bin/provision.php login_admin 'senha-forte-exclusiva' contato@dominio.com

O script se recusa a sobrescrever uma instalação existente.

## API

Todos os endpoints usam /api/index.php?action=NOME, sem reescrita de URL.
Autenticação via cookie HttpOnly SameSite, token CSRF e verificação de papel
no servidor. Só contas de membro podem acessar perfil e mineração.

- register, login, session, logout, profile, profile.update
- plans, orders.create, orders.mine, mining.start, mining.stop
- support (destinatário público)
- admin.members, admin.status, admin.orders, admin.order.approve
- admin.plan.save, admin.settings

**Bloqueado:** admin.password.reset, até definir procedimento concreto para
verificação de identidade do membro. Senhas antigas não são recuperáveis.

## Regras cobertas

Instalação limpa em SQLite, usuário público sempre membro, sessões simultâneas
revogáveis, suspensão de conta, arquivamento lógico, pagamento manual aprovado
pelo administrador, contratos VIP com snapshots e cálculo de recompensa por
tempo decorrido e relógio do servidor, com transações SQLite.

O saldo aqui representa **recompensas internas**, não comprovação de BTC
efetivamente minerado nem saldo em blockchain. Os bônus USD e satoshis estão
salvos no catálogo, mas ainda precisam ser conectados às rotinas de resgate.

## Pendências antes de publicar

- Decisão 13, instalador browser e ensaios de reinstalação.
- Política sobre efeito da suspensão na data de vencimento VIP; atualmente a
  data contratada continua correndo sem créditos durante suspensão.
- Verificação de identidade para reset de senha.
- Integração final com checkout BTC, carteiras, bônus, cotação e todos os
  widgets do aplicativo legado, com regressão visual.
- Confirmar requisitos da hospedagem (PHP, PDO SQLite e diretórios privados).
- Deploy/publicação só com autorização específica.

A CI desta branch executa lint PHP, TypeScript, build React e integração HTTP
com banco SQLite temporário. A CI não publica nada.
