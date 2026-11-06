# Diagnóstico técnico dos painéis: Mockup e Legítimo

**Data da auditoria:** 6 de novembro de 2026
**Escopo:** painel de membro e painel administrativo ativos na raiz do projeto; comparação da camada de interface com `ProjetoGIT`; rotas e persistência do backend PHP/SQLite da raiz.
**Objetivo:** registrar o que funciona, o que é demonstrativo e o que ainda depende de operação ou integração externa.

## Conclusão executiva

O aplicativo não possui dois backends — um Mockup e outro Legítimo. A escolha intitulada “Mockup/Legítimo” alterna somente os textos da interface. Ela não troca dados, banco, endpoints, regras, pagamentos ou mineração.

O modo padrão permanece travado em Mockup (`MOCKUP_LOCK = true`). O painel administrativo desativa a troca permanente. Há uma prévia temporária de textos “Legítimo”, limitada a duas horas no navegador local. Ela não transforma simulações em operações reais. Parte do catálogo Legítimo contém afirmações sobre mineração, pagamentos e envios que não são comprovadas pelo backend atual.

O backend PHP/SQLite executa operações legítimas no sentido de autenticar usuários e persistir dados internos: perfis, contratos, pedidos, créditos internos, solicitações de saque, tickets e auditoria. Isso **não** significa mineração física, saldo BTC on-chain, pagamento confirmado automaticamente ou transferência de BTC. As respostas de saque e partes das ferramentas administrativas são explicitamente marcadas como simulação.

| Classificação | Significado nesta auditoria |
|---|---|
| **Persistente — app** | A ação lê ou grava dados no SQLite e aplica validações do servidor. |
| **Híbrido — interno/demonstrativo** | A ação persiste registros internos, mas seus valores, decisão manual ou resultado não comprovam uma operação externa. |
| **Mockup — apresentação** | Conteúdo inventado, gerado para exibição, sem efeito correspondente no ledger ou em uma transação real. |
| **Manual / dependente de operação** | O sistema registra uma decisão ou pedido; uma pessoa precisa fazer a conferência ou executar a etapa externa. |

## Modos de texto

Implementação: `src/i18n/copyMode.tsx`, `src/i18n/mockup.ts`, `src/i18n/legitimo.ts` e o bloco de configurações em `src/components/admin/AdminWorkspace.tsx`.

- O modo padrão é Mockup, pois `MOCKUP_LOCK` está ativado.
- A troca desativada no painel não pode desbloquear o modo. A prévia de textos Legítimo usa armazenamento local do navegador e expira após duas horas.
- `useProjectCopy` escolhe apenas um catálogo de textos. As chamadas à API, autenticação, persistência e regras continuam iguais.
- Portanto, “Legítimo” é o nome de uma prévia de copy; **não é um status operacional nem certificação de que um serviço real esteja conectado**.
- O catálogo `legitimo.ts` deve ser tratado como conteúdo não aprovado para publicação até que cada afirmação sobre mineração, pagamentos, ranking ou envio de BTC seja respaldada por uma integração e evidência verificável.

## Painel de membro — telas e funcionalidades ativas

O fluxo atual monta `src/components/MemberWorkspace.tsx` por meio de `src/App.tsx`. O estado e as gravações principais são enviados para `server/api.php`.

| Tela / função | Estado | O que realmente acontece |
|---|---|---|
| Login, sessão, cadastro e sair | **Persistente — app** | Login, sessão, encerramento e cadastro são tratados no servidor. Senhas são armazenadas com hash; as rotas de escrita usam proteção de sessão/CSRF. |
| Idioma | **Persistente — app** | A preferência do membro pode ser consultada e gravada na conta; a interface também conserva a preferência do navegador/dispositivo. |
| Início e sessão de “mineração” | **Híbrido — interno/demonstrativo** | `mining.start`, `mining.stop` e o cálculo de créditos usam estado, plano e ledger no SQLite. A cifra ao vivo na tela é uma projeção no cliente do saldo interno. Não há conexão com equipamento, pool ou prova de trabalho que demonstre mineração de BTC. |
| Recompensas e bônus diário | **Híbrido — interno/demonstrativo** | `rewards.claim` aplica o intervalo de 24 horas e registra créditos internos no banco. Valores em USD/satoshis são unidades internas/equivalências, não Bitcoin recebido. |
| Histórico de recompensas | **Persistente — app** | Lê registros internos do ledger (`ledger`). Não é histórico de transações na blockchain. |
| Indicações | **Híbrido — interno/demonstrativo** | Código, eventos e recompensas reais do sistema são consultados no SQLite (`referrals.mine`). Para o usuário de demonstração `user`, cinco entradas e totais de apresentação são acrescentados à resposta, sem gravar eventos de indicação. |
| Loja VIP e checkout | **Manual / dependente de operação** | A criação do pedido grava um pedido pendente no SQLite, com preço, cotação, endereço e valor em BTC. A ativação é manual; não há integração de pagamento que confirme a transação automaticamente. |
| Cotação BTC/USD | **Fonte externa / leitura** | O servidor consulta fontes públicas e pode usar cache. A cotação converte unidades e informa um valor de referência; não confirma pagamento, posse de BTC nem liquidez para saque. |
| Carteira e solicitação de saque | **Híbrido — interno/demonstrativo** | A solicitação valida plano, carteira, mínimo e saldo, reserva créditos internos e grava um pedido. A API responde `simulation: true` e informa que nenhum BTC foi enviado. A aprovação administrativa é uma conferência manual; rejeitar devolve o saldo interno reservado. |
| Histórico de saques | **Híbrido, com dados de demonstração** | Solicitações feitas pelo membro são persistidas. A API também inclui entradas apenas de apresentação para a conta `user`; elas não afetam banco ou saldo. A interface identifica registros que trazem a marca de simulação. |
| Perfil e carteira BTC | **Persistente — app** | Nome, e-mail, telefone, carteira e imagem são atualizados no SQLite com validações. Depois de definida, a imagem fica bloqueada para troca conforme a regra do backend. O campo de carteira não representa custódia nem verifica saldo. |
| Suporte | **Persistente — app; e-mail condicional** | Tickets e respostas são armazenados. O envio de e-mail depende da configuração do servidor; ticket persistido não garante que a mensagem foi entregue. |
| Pagamentos recentes | **Mockup — apresentação** | `mock.payments.latest` gera dez linhas fictícias por chamada, com identificadores `SIM-`, nomes e valores calculados pela cotação. A resposta marca `simulation: true`; não grava pagamentos no ledger e não representa transações. |
| Top Mineradores | **Mockup — apresentação** | `TopMinersView` usa perfis fictícios definidos/gerados no frontend. Não consulta membros nem pagamentos. Existe uma rota `leaderboard` baseada em créditos internos, mas ela não alimenta essa tela. |
| Aviso “Novos investidores” | **Mockup — apresentação** | Nomes e cidades são perfis fictícios locais ao componente. O backend armazena somente a configuração para exibir ou ocultar o aviso; a resposta também é marcada como simulação. |
| Histórico de assinaturas VIP | **Persistente — app** | Lê contratos gravados no SQLite. O registro de contrato não comprova mineração ou pagamento externo. |

Rotas principais do membro: `register`, `login`, `session`, `logout`, `language.preference`, `profile`, `profile.update`, `mining.start`, `mining.stop`, `rewards.claim`, `ledger`, `referrals.mine`, `plans`, `orders.create`, `orders.mine`, `withdraw.quote`, `withdraw.request`, `withdraw.mine`, `contracts.mine`, `support.tickets.mine`, `support.ticket.create` e `mock.payments.latest`.

## Painel administrativo — seções e funcionalidades ativas

O fluxo administrativo ativo está em `src/components/admin/AdminWorkspace.tsx`; os controles de plano, saldo e histórico do membro estão em `src/components/admin/AdminMemberRecords.tsx`.

| Seção / função | Estado | O que realmente acontece |
|---|---|---|
| Visão geral | **Persistente — app** | Contagens de membros, contratos e pedidos são lidas do SQLite. Métricas contam registros do sistema, não atividade de mineração. |
| Busca, lista e detalhes de membros | **Persistente — app** | Lista paginada e detalhes consultam usuários, contratos, pedidos e saldo interno no banco. |
| Editor de membro | **Persistente — app** | Atualiza login, nome, e-mail, telefone e endereço BTC; mantém o histórico associado e registra auditoria. Permissões administrativas não são editáveis pelo formulário. |
| Suspender, reativar, arquivar e restaurar | **Persistente — app** | Altera o estado da conta e registra auditoria. Arquivar preserva históricos. |
| Planos VIP | **Persistente — catálogo interno** | Criação e edição alteram o catálogo SQLite e são usadas por novas contratações/renovações. Hashrate/equipamento são parâmetros ilustrativos; não configuram mineradores físicos. |
| Atribuir plano, ajustar saldo e editar históricos | **Híbrido — gravação interna marcada como simulação** | As ferramentas fazem alterações no SQLite e mantêm trilha de auditoria, mas as respostas/ações são marcadas como simulação. Créditos, ajustes de saldo e histórico não equivalem a dinheiro ou BTC enviados. |
| Pedidos e ativação VIP | **Manual / híbrido** | O pedido e a decisão ficam no banco. O modo simulado pode aprovar sem pagamento real, identificado no fluxo. O caminho não simulado exige um TXID hex de 64 caracteres e impede reutilização, mas não consulta blockchain nem prova que o TXID corresponde a um pagamento recebido. |
| Solicitações de saque | **Manual / híbrido** | Decisão, referência de conferência e auditoria são salvas. A aprovação requer confirmação manual e contrato VIP vigente. A resposta do processamento é `simulation: true`; não há envio de BTC. Rejeição devolve créditos internos. |
| Tickets, respostas e estados de suporte | **Persistente — app; e-mail condicional** | Responder, fechar, reabrir e excluir logicamente gravam estado e histórico; notificação depende de transporte de e-mail configurado. |
| Auditoria administrativa | **Persistente — app** | Ações administrativas são registradas no banco para consulta. Isso documenta o que o app fez, mas não substitui comprovação externa. |
| Configurações de suporte | **Persistente — app** | O e-mail de suporte é salvo no banco. Sua entrega depende do serviço de e-mail no ambiente implantado. |
| Endereço de recebimento BTC | **Persistente — declaração administrativa** | Valida formato, pede a senha do admin e registra a confirmação manual de posse. O próprio painel avisa que essa confirmação não é prova criptográfica; não há verificação on-chain. |
| Diagnóstico de hospedagem | **Leitura do ambiente** | Informa versão PHP, SQLite, permissões, HTTPS, estado do e-mail e confirmação cadastrada da carteira. Não certifica disponibilidade contínua nem entrega de e-mail ou BTC. |
| Redefinição administrativa de senha | **Persistente — procedimento manual** | A verificação é uma declaração do administrador com referência e validade de dez minutos. A nova senha é armazenada com hash e sessões existentes são revogadas. Não há validação independente automática da identidade. |
| Contas demonstrativas Marcelo / usuário aleatório | **Mockup com gravação explícita** | A criação grava contas e históricos fictícios no SQLite e marca a resposta como `simulation: true`. São fixtures de demonstração, não membros ou pagamentos orgânicos. |
| Prévia Mockup/Legítimo | **Somente copy** | A prévia altera o catálogo de textos no navegador; não altera qualquer operação acima. |

Rotas administrativas principais: `admin.overview`, `admin.members`, `admin.member.details`, `admin.member.edit`, `admin.status`, `admin.plans`, `admin.plan.save`, `admin.member.history`, `admin.member.history.save`, `admin.member.plan.assign`, `admin.member.balance.adjust`, `admin.orders`, `admin.order.approve`, `admin.order.reject`, `admin.withdrawals`, `admin.withdraw.process`, `admin.support.tickets`, `admin.support.reply`, `admin.support.manage`, `admin.support.notify`, `admin.audit`, `admin.diagnostics`, `admin.payment.settings`, `admin.settings`, `admin.identity.verify`, `admin.password.reset`, `admin.demo.marcelo.seed` e `admin.demo.random-member.seed`.

## Código legado e telas fora do fluxo ativo

`src/App.tsx` monta `MemberWorkspace`. `MainAppWorkspace` e as telas `HomeTab`, `StoreTab`, `WalletTab` e `RewardTab` pertencem a uma estrutura anterior e não são o fluxo atual. O onboarding de prévia também não está conectado ao login atual. Não confundir esses componentes ou serviços legados com as telas `ServerHomeView`, `ServerStoreView`, `ServerWalletView` e `ServerRewardView` ativas.

O backend contém uma rota `leaderboard` que consulta o ledger interno e gera aliases, mas o componente ativo Top Mineradores não a chama. Isso é uma diferença funcional relevante entre uma capacidade da API e a tela apresentada ao membro.

## Limites e próximos passos recomendados

1. Manter o bloqueio do copy Legítimo até que as afirmações da tela sejam apoiadas por serviços existentes e verificáveis.
2. Se o produto precisar oferecer mineração real, conectar uma fonte operacional que comprove atividade e separar esse dado do contador de créditos internos.
3. Se o produto precisar aceitar pagamentos ou enviar saques, implementar e testar integração de confirmação/transferência, gestão de chaves e controles operacionais apropriados. Um TXID apenas validado por formato não basta.
4. Identificar visualmente todos os registros demonstrativos nas telas — em especial feed de pagamentos, entradas de saque e exemplos de indicação — sem depender de nomes de componentes, atributos HTML ou marcações ocultas.
5. Configurar e testar entrega de e-mail no ambiente real antes de tratar notificações de suporte como entregues.
6. Rever as fixtures administrativas e as alterações de saldo/histórico antes de uso com dados reais.

## Como a auditoria foi feita

- Inspeção do fluxo ativo em `src/App.tsx`, telas do membro e telas administrativas.
- Inspeção das rotas PHP correspondentes em `server/api.php` e da persistência SQLite.
- Identificação de chamadas que retornam `simulation: true`, registros de apresentação e conteúdo fictício.
- Comparação da camada de interface entre a raiz e `ProjetoGIT`; alterações visuais existentes são mantidas em paridade. O backend do clone não é tratado como cópia equivalente do backend da raiz.
- A auditoria descreve comportamento do código. Ela não consultou banco de produção, não executou transação real de Bitcoin, não confirmou envio de e-mail externo e não constitui auditoria financeira, regulatória ou de segurança.
