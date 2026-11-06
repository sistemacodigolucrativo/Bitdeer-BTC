# Checklist de textos: antes e depois

**Objetivo:** revisar as indicações de simulação, demonstração, dados fictícios e valores ilustrativos encontradas na interface.  
**Escopo deste arquivo:** propostas de texto; nenhuma tela, regra, API ou dado foi alterado.  
**Cópias cobertas:** projeto da raiz (preview) e clone `ProjetoGIT`.

## Critério para as propostas

O texto sugerido deve ser direto e claro, mas não pode dar a entender que uma transação, saque, saldo ou mineração fictícia ocorreu de verdade. Nos pontos em que a interface exibe dados gerados como demonstração, a proposta mantém essa informação visível.

## Checklist

### 1. Feed de pagamentos BTC — painel de membros

- [ ] **ANTES**

  “Últimos Pagamentos BTC”

  O título aparece sem aviso visual, embora as dez linhas sejam geradas como registros fictícios e a resposta da API contenha `simulation: true`.

- [ ] **DEPOIS**

  “Pagamentos BTC de demonstração”

  “Registros fictícios. Nenhuma transferência real foi realizada.”

- **Localização:** `src/components/MockPaymentFeed.tsx`; também em `ProjetoGIT/src/components/MockPaymentFeed.tsx`. Dados em `server/api.php:714–750`.

### 2. Histórico de saques de demonstração — painel de membros

- [ ] **ANTES**

  A tabela mostra número, valores em USD/BTC e status, sem rótulo visível de simulação para os registros marcados pelo backend com `simulation: true`.

- [ ] **DEPOIS**

  “Histórico de demonstração”

  Para cada registro simulado: “Registro fictício — nenhum BTC foi enviado.”

- **Localização:** `src/components/MemberWorkspace.tsx:424–435`; também em `ProjetoGIT/src/components/MemberWorkspace.tsx`. Registros marcados em `server/api.php:766–784`.

> **Observação sobre o exemplo do pedido:** a frase “Esta é uma simulação dos seus saques BTC” não foi localizada literalmente no código. A alternativa “Estes são seus saques em BTC” não é recomendada para esses registros, pois poderia afirmar que houve saques reais.

### 3. Top Mineradores

- [ ] **ANTES**

  “Ranking demonstrativo com 200 perfis fictícios. Os valores não são BTC minerados nem saldos de membros.”

- [ ] **DEPOIS**

  “Ranking de demonstração: 200 perfis e valores ilustrativos. Não representa mineradores reais, BTC minerado ou saldos de membros.”

- **Localização:** `src/components/workspace/TopMinersView.tsx:114–133`; também em `ProjetoGIT/src/components/workspace/TopMinersView.tsx`.

### 4. Notificação de novos investidores

- [ ] **ANTES**

  “Novos investidores” / “Acabou de se cadastrar” / “Simulação · dados fictícios”

- [ ] **DEPOIS**

  “Notificação de demonstração” / “Perfil fictício” / “Não representa um cadastro real.”

- **Localização:** `src/components/NewInvestorToast.tsx:5–34, 103–115`; também em `ProjetoGIT/src/components/NewInvestorToast.tsx`. O aviso só é exibido quando ativado pelo administrador.

### 5. Rodapé das configurações

- [ ] **ANTES**

  “Bitcoin Cloud Mining — projeto demonstrativo”

- [ ] **DEPOIS**

  “Ambiente de demonstração — saldos e atividades exibidos podem ser ilustrativos.”

- **Localização:** `src/components/workspace/SettingTab.tsx:352–355`; também em `ProjetoGIT/src/components/workspace/SettingTab.tsx`.

### 6. Animação após o login

- [ ] **ANTES**

  A sequência exibe mensagens como “Connecting to Node”, “Verifying Node Availability” e “Mining Core Ready”, sem informar na tela que é uma animação demonstrativa.

- [ ] **DEPOIS**

  Acrescentar aviso visível: “Animação demonstrativa. Estas etapas não confirmam conexão com um nó nem mineração ativa.”

- **Localização:** `src/components/TerminalInitScreen.tsx:10–25`; também em `ProjetoGIT/src/components/TerminalInitScreen.tsx`.

### 7. Aviso de créditos e mineração no painel inicial

- [ ] **ANTES**

  Existe no código o texto “Registros internos de recompensas. Não comprovam Bitcoin efetivamente minerado.”, mas ele não foi encontrado sendo renderizado na tela inicial do membro.

- [ ] **DEPOIS**

  Exibir junto aos saldos: “Créditos e saldos internos. Não comprovam BTC efetivamente minerado nem pagamento em blockchain.”

- **Localização:** texto definido em `src/components/ServerHomeView.tsx:14–26`; também em `ProjetoGIT/src/components/ServerHomeView.tsx`.

### 8. Conta padrão Marcelo — painel administrativo

- [ ] **ANTES**

  “Conta padrão Marcelo”

  A descrição informa histórico de aproximadamente cinco meses, plano atual FREE e saldo interno.

- [ ] **DEPOIS**

  “Conta de demonstração: Marcelo”

  “Histórico fictício para testes. Recompensas, saques e saldo não representam mineração ou pagamentos reais.”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:206–219`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:114–152`.

### 9. Random User — painel administrativo

- [ ] **ANTES**

  “Cria uma conta povoada com nome, login e e-mail fictícios coerentes, além do mesmo saldo e histórico do Marcelo.”

- [ ] **DEPOIS**

  “Criar conta fictícia para testes, com saldo e histórico demonstrativos. Esses dados não representam uma conta ou atividade financeira real.”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:221–226`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:150–152`.

### 10. Capacidade e equipamento nos planos

- [ ] **ANTES**

  “Capacidade ilustrativa” e “Equipamento ilustrativo”

- [ ] **DEPOIS**

  “Capacidade informativa — não verificada em equipamento real”

  “Equipamento de referência — não indica equipamento conectado”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:137–143`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:422–428`.

### 11. Aprovação interna de pedidos

- [ ] **ANTES**

  Botão: “Aprovar simulação e ativar VIP”

  Confirmação: “Aprovar somente como simulação interna? Nenhum pagamento BTC real foi confirmado.”

- [ ] **DEPOIS**

  Botão: “Ativar VIP em modo de demonstração”

  Confirmação: “Esta ação é apenas interna. Não confirma pagamento nem envia BTC.”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:418–423`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:522–524, 754–756`.

### 12. TXID de um pedido aprovado sem pagamento

- [ ] **ANTES**

  “Não existe — aprovação simulada”

- [ ] **DEPOIS**

  “Sem TXID — aprovação interna, sem transferência BTC.”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:287–290`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:274–276`.

### 13. Aprovação de saque no painel administrativo

- [ ] **ANTES**

  “Aprovada (simulação interna; sem envio de BTC)”

- [ ] **DEPOIS**

  “Aprovada internamente — não houve envio de BTC.”

- **Localização:** `src/components/admin/AdminWorkspace.tsx:383–388`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:474–476`.

### 14. Atribuição de plano a um membro

- [ ] **ANTES**

  “Atribuição sem simular pagamento real; mantém o histórico contratual anterior.”

- [ ] **DEPOIS**

  “A alteração do plano é administrativa. Não registra nem confirma pagamento BTC.”

- **Localização:** `src/components/admin/AdminMemberRecords.tsx:117–120`; também em `ProjetoGIT/src/components/admin/AdminMemberRecords.tsx`. Traduções em `src/i18n/adminTexts.ts:786–788`.

## Itens não incluídos como texto ativo

- O título “Explore a simulação de recompensas em Bitcoin” está nas traduções, mas o componente de onboarding correspondente não foi encontrado conectado ao fluxo atual do aplicativo.
- Nomes de arquivos, comentários, propriedades como `simulation: true` e atributos do DOM não são avisos legíveis para os usuários.

## Observação sobre idiomas

As propostas acima estão em português. Como a interface também tem português, inglês e espanhol, qualquer alteração de copy deve manter os três idiomas alinhados e preservar os identificadores, eventos e comportamentos existentes.

## Limite deste checklist

Este documento é uma proposta de revisão de textos. Ele não implementa as mudanças e não altera funcionalidades. A confirmação visual de estados autenticados e condicionais deve ser feita ao aplicar a copy no aplicativo.
