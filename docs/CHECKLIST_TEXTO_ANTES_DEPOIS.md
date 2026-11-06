# Checklist de textos: antes e depois

**Objetivo:** preparar a copy final de produção para uma interface povoada com dados reais, substituindo rótulos temporários de simulação quando as fontes reais estiverem integradas.  
**Escopo deste arquivo:** propostas de texto; nenhuma tela, regra, API ou dado foi alterado.  
**Cópias cobertas:** projeto da raiz (preview) e clone `ProjetoGIT`.

## Premissa para aplicar os textos “DEPOIS”

O objetivo visual informado é mostrar como a plataforma ficará quando estiver povoada e conectada ao backend real. Os textos “DEPOIS” abaixo são propostas para essa versão de produção: podem substituir avisos de demonstração quando os dados, eventos e estados exibidos vierem de fontes reais e forem confirmados pelo backend.

Enquanto houver dados fictícios, a visualização preenchida deve permanecer isolada em um ambiente de preview/teste sem acesso público como se fosse produção. A copy de produção não deve ser usada para afirmar pagamentos, saques, cadastros ou mineração que ainda não ocorreram.

## Checklist

### 1. Feed de pagamentos BTC — painel de membros

- [ ] **ANTES**

  “Últimos Pagamentos BTC”

  O título aparece sem aviso visual, embora as dez linhas sejam geradas como registros fictícios e a resposta da API contenha `simulation: true`.

- [ ] **DEPOIS**

  “Pagamentos recentes em BTC”

  Usar com registros reais de pagamentos, incluindo seus identificadores e estados confirmados.

- **Localização:** `src/components/MockPaymentFeed.tsx`; também em `ProjetoGIT/src/components/MockPaymentFeed.tsx`. Dados em `server/api.php:714–750`.

### 2. Histórico de saques de demonstração — painel de membros

- [ ] **ANTES**

  A tabela mostra número, valores em USD/BTC e status, sem rótulo visível de simulação para os registros marcados pelo backend com `simulation: true`.

- [ ] **DEPOIS**

  “Estes são seus saques em BTC.”

  Usar essa frase somente para saques efetivamente enviados e confirmados. Para itens ainda não enviados, usar “Solicitações de saque” e o status real do pedido.

- **Localização:** `src/components/MemberWorkspace.tsx:424–435`; também em `ProjetoGIT/src/components/MemberWorkspace.tsx`. Registros marcados em `server/api.php:766–784`.

> **Observação:** as frases do exemplo do pedido não foram localizadas literalmente no código. “Estes são seus saques em BTC” é apropriada somente para transferências reais concluídas; solicitações pendentes devem continuar identificadas como solicitações.

### 3. Top Mineradores

- [ ] **ANTES**

  “Ranking demonstrativo com 200 perfis fictícios. Os valores não são BTC minerados nem saldos de membros.”

- [ ] **DEPOIS**

  “Top Mineradores”

  Exibir o ranking, os perfis e os valores provenientes de atividade real e verificável.

- **Localização:** `src/components/workspace/TopMinersView.tsx:114–133`; também em `ProjetoGIT/src/components/workspace/TopMinersView.tsx`.

### 4. Notificação de novos investidores

- [ ] **ANTES**

  “Novos investidores” / “Acabou de se cadastrar” / “Simulação · dados fictícios”

- [ ] **DEPOIS**

  “Novos investidores” / “Acabou de se cadastrar”

  Exibir somente eventos reais de cadastro, respeitando as regras de privacidade e consentimento aplicáveis.

- **Localização:** `src/components/NewInvestorToast.tsx:5–34, 103–115`; também em `ProjetoGIT/src/components/NewInvestorToast.tsx`. O aviso só é exibido quando ativado pelo administrador.

### 5. Rodapé das configurações

- [ ] **ANTES**

  “Bitcoin Cloud Mining — projeto demonstrativo”

- [ ] **DEPOIS**

  “Bitcoin Cloud Mining”

  Remover a qualificação de projeto demonstrativo na versão de produção povoada com dados reais.

- **Localização:** `src/components/workspace/SettingTab.tsx:352–355`; também em `ProjetoGIT/src/components/workspace/SettingTab.tsx`.

### 6. Animação após o login

- [ ] **ANTES**

  A sequência exibe mensagens como “Connecting to Node”, “Verifying Node Availability” e “Mining Core Ready”, sem informar na tela que é uma animação demonstrativa.

- [ ] **DEPOIS**

  Manter mensagens como “Conectando ao nó” e “Mineração ativa” somente se cada estado refletir verificações reais do backend. Substituir a sequência roteirizada por estados operacionais reais.

- **Localização:** `src/components/TerminalInitScreen.tsx:10–25`; também em `ProjetoGIT/src/components/TerminalInitScreen.tsx`.

### 7. Aviso de créditos e mineração no painel inicial

- [ ] **ANTES**

  Existe no código o texto “Registros internos de recompensas. Não comprovam Bitcoin efetivamente minerado.”, mas ele não foi encontrado sendo renderizado na tela inicial do membro.

- [ ] **DEPOIS**

  Apresentar o saldo e os resultados vindos do backend real. Usar “BTC minerado” somente para valores cuja origem de mineração seja confirmada; identificar separadamente saldos internos, se houver.

- **Localização:** texto definido em `src/components/ServerHomeView.tsx:14–26`; também em `ProjetoGIT/src/components/ServerHomeView.tsx`.

### 8. Conta padrão Marcelo — painel administrativo

- [ ] **ANTES**

  “Conta padrão Marcelo”

  A descrição informa histórico de aproximadamente cinco meses, plano atual FREE e saldo interno.

- [ ] **DEPOIS**

  “Membros”

  Na versão de produção, mostrar os membros e históricos reais. Manter a conta padrão de demonstração fora das telas públicas e dos dados de produção.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:206–219`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:114–152`.

### 9. Random User — painel administrativo

- [ ] **ANTES**

  “Cria uma conta povoada com nome, login e e-mail fictícios coerentes, além do mesmo saldo e histórico do Marcelo.”

- [ ] **DEPOIS**

  “Criar membro”

  Na versão de produção, o cadastro deve criar um membro real com os dados enviados pelo fluxo administrativo; não povoar o ambiente de produção com a conta fictícia de teste.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:221–226`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:150–152`.

### 10. Capacidade e equipamento nos planos

- [ ] **ANTES**

  “Capacidade ilustrativa” e “Equipamento ilustrativo”

- [ ] **DEPOIS**

  “Capacidade de mineração”

  “Equipamento”

  Usar capacidades e equipamentos reais; se forem estimativas, identificá-los como estimados.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:137–143`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:422–428`.

### 11. Aprovação interna de pedidos

- [ ] **ANTES**

  Botão: “Aprovar simulação e ativar VIP”

  Confirmação: “Aprovar somente como simulação interna? Nenhum pagamento BTC real foi confirmado.”

- [ ] **DEPOIS**

  Botão: “Confirmar pagamento e ativar VIP”

  Usar somente quando o backend verificar o pagamento real. A confirmação da interface deve descrever o estado realmente executado.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:418–423`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:522–524, 754–756`.

### 12. TXID de um pedido aprovado sem pagamento

- [ ] **ANTES**

  “Não existe — aprovação simulada”

- [ ] **DEPOIS**

  Exibir o TXID real quando a transação tiver sido confirmada. Enquanto não houver TXID, mostrar o estado factual, como “Aguardando confirmação do pagamento”.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:287–290`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:274–276`.

### 13. Aprovação de saque no painel administrativo

- [ ] **ANTES**

  “Aprovada (simulação interna; sem envio de BTC)”

- [ ] **DEPOIS**

  “Concluído” com o TXID real, somente depois do envio e da confirmação da transação. Se o saque estiver apenas aprovado, mostrar “Aprovado — aguardando envio”.

- **Localização:** `src/components/admin/AdminWorkspace.tsx:383–388`; também em `ProjetoGIT/src/components/admin/AdminWorkspace.tsx`. Traduções em `src/i18n/adminTexts.ts:474–476`.

### 14. Atribuição de plano a um membro

- [ ] **ANTES**

  “Atribuição sem simular pagamento real; mantém o histórico contratual anterior.”

- [ ] **DEPOIS**

  “Atribuir plano manualmente”

  Manter a distinção administrativa: essa ação, por si só, não deve ser apresentada como confirmação de pagamento BTC.

- **Localização:** `src/components/admin/AdminMemberRecords.tsx:117–120`; também em `ProjetoGIT/src/components/admin/AdminMemberRecords.tsx`. Traduções em `src/i18n/adminTexts.ts:786–788`.

## Itens não incluídos como texto ativo

- O título “Explore a simulação de recompensas em Bitcoin” está nas traduções, mas o componente de onboarding correspondente não foi encontrado conectado ao fluxo atual do aplicativo.
- Nomes de arquivos, comentários, propriedades como `simulation: true` e atributos do DOM não são avisos legíveis para os usuários.

## Observação sobre idiomas

As propostas acima estão em português. Como a interface também tem português, inglês e espanhol, qualquer alteração de copy deve manter os três idiomas alinhados e preservar os identificadores, eventos e comportamentos existentes.

## Limite deste checklist

Este documento é uma proposta de revisão de textos. Ele não implementa as mudanças e não altera funcionalidades. A confirmação visual de estados autenticados e condicionais deve ser feita ao aplicar a copy no aplicativo.
