# Mapeamento de referências a simulação, demonstração e dados fictícios

**Escopo:** interface do projeto na raiz, clone `ProjetoGIT` e respostas relevantes da API.  
**Data do levantamento:** 6 de novembro de 2026.  
**Alterações no sistema:** nenhuma. Este documento registra apenas o mapeamento.

## Resumo

Foram encontradas referências explícitas a simulação, demonstração, dados fictícios e valores ilustrativos em telas de membros e de administradores. A maior inconsistência é que alguns dados gerados como simulação aparecem em tabelas sem uma identificação visível correspondente.

As ocorrências listadas nas cópias da raiz e de `ProjetoGIT` são correspondentes. O levantamento foi feito por inspeção do código e das condições de renderização; não houve interação visual em todos os estados autenticados.

## Referências que podem aparecer para membros

| Área | Texto ou comportamento encontrado | Condição de exibição | Localização |
|---|---|---|---|
| Top Mineradores | “Ranking demonstrativo com 200 perfis fictícios. Os valores não são BTC minerados nem saldos de membros.” Há textos equivalentes em inglês e espanhol. Quando a cotação está disponível, há outro aviso: “Os perfis BTC são fictícios.” | Ao abrir Top Mineradores no painel de membros. | `src/components/workspace/TopMinersView.tsx:114–133` |
| Aviso de novos investidores | “Simulação · dados fictícios”. Os nomes, cidades e estados exibidos são perfis fictícios. O texto também existe em inglês e espanhol. | O administrador precisa ativar a notificação; o aviso é exibido no painel de membros. | `src/components/NewInvestorToast.tsx:5–34, 103–115` |
| Configurações | “Bitcoin Cloud Mining — projeto demonstrativo”. | Rodapé da tela de configurações. | `src/components/workspace/SettingTab.tsx:352–355` |
| Inicialização após login | Animação com mensagens como “Connecting to Node”, “Verifying Node Availability” e “Mining Core Ready”. O código identifica os registros como simulados, mas essa tela não informa isso explicitamente ao usuário. | A sequência é apresentada após o login. | `src/components/TerminalInitScreen.tsx:10–25`; fluxo em `src/App.tsx` |
| Pagamentos recentes | A tabela tem o título “Últimos Pagamentos BTC” (ou equivalentes em outros idiomas), sem aviso visual de que as linhas são fictícias. | Feed incluído no espaço do membro. | `src/components/MockPaymentFeed.tsx`; inclusão em `src/components/MemberWorkspace.tsx:409` |
| Histórico de saques da conta padrão | A API acrescenta registros históricos de demonstração para a conta padrão. A resposta marca esses registros com `simulation: true`, mas a interface mostra identificador, valores e status sem exibir essa marca. | Condicional à conta padrão identificada no backend. | Dados em `server/api.php:766–784`; renderização em `src/components/MemberWorkspace.tsx:424–435` |

### Feed de pagamentos: divergência entre API e interface

O backend gera dez registros fictícios e retorna `simulation: true`. A tabela apresenta nomes, datas, identificadores de transação e quantias sob o título “Últimos Pagamentos BTC”, sem sinalização visual que esclareça a natureza desses registros.

- Interface: `src/components/MockPaymentFeed.tsx`
- Montagem no painel: `src/components/MemberWorkspace.tsx:409`
- Geração e resposta da API: `server/api.php:714–750`

O atributo `data-simulation="true"` e o nome técnico `MockPaymentFeed` estão no código/DOM, mas não substituem um aviso legível na tela.

## Referências restritas ao painel administrativo

| Área | Texto ou informação encontrada | Localização |
|---|---|---|
| Conta padrão Marcelo | “Conta padrão Marcelo”, com descrição de cerca de cinco meses de histórico, plano FREE e saldo interno; oferece criação da conta padrão. | `src/components/admin/AdminWorkspace.tsx:206–219`; traduções em `src/i18n/adminTexts.ts:114–152` |
| Random User | A descrição informa que a conta é criada com nome, login e e-mail fictícios e recebe saldo e histórico iguais aos do Marcelo. | `src/components/admin/AdminWorkspace.tsx:221–226`; traduções em `src/i18n/adminTexts.ts:150–152` |
| Configuração de planos | Os campos são identificados como “Capacidade ilustrativa” e “Equipamento ilustrativo”. | `src/components/admin/AdminWorkspace.tsx:137–143`; traduções em `src/i18n/adminTexts.ts:422–428` |
| Detalhes de pedido | Para um pedido aprovado sem referência de pagamento, pode aparecer “Não existe — aprovação simulada”. | `src/components/admin/AdminWorkspace.tsx:287–290`; traduções em `src/i18n/adminTexts.ts:274–276` |
| Saques | Um status possível é “Aprovada (simulação interna; sem envio de BTC)”. | `src/components/admin/AdminWorkspace.tsx:383–388`; traduções em `src/i18n/adminTexts.ts:474–476` |
| Aprovação de pedido | Botão “Aprovar simulação e ativar VIP”. A confirmação diz: “Aprovar somente como simulação interna? Nenhum pagamento BTC real foi confirmado.” | `src/components/admin/AdminWorkspace.tsx:418–423`; traduções em `src/i18n/adminTexts.ts:522–524, 754–756` |
| Notificações de novos investidores | “Novos investidores · toast demonstrativo”, acompanhado de texto que esclarece que os cadastros são fictícios e não usam dados de membros ou inscrições reais. | `src/components/admin/AdminWorkspace.tsx:468–479` |
| Atribuição de plano a membro | “Atribuição sem simular pagamento real; mantém o histórico contratual anterior.” | `src/components/admin/AdminMemberRecords.tsx:117–120`; traduções em `src/i18n/adminTexts.ts:786–788` |

## Textos encontrados no código que não parecem estar ativos no fluxo atual

- **Tela de onboarding:** as traduções incluem “Explore a simulação de recompensas em Bitcoin” (português), “Explore the Bitcoin reward simulator” (inglês) e a versão em espanhol. A tela `OnboardingPreviewScreen` usa essas traduções, mas não foi encontrada conectada ao fluxo atual do aplicativo.
  - Traduções: `src/i18n/translations.ts:122, 230, 338`
  - Componente: `src/components/OnboardingPreviewScreen.tsx`
- **Aviso da tela inicial do membro:** há texto preparado informando que os registros internos não comprovam Bitcoin efetivamente minerado. A propriedade `notice` foi encontrada em `ServerHomeView`, mas não foi encontrada sendo renderizada pelo componente.
  - `src/components/ServerHomeView.tsx:14–26`

## Indicadores técnicos ou metadados, não necessariamente visíveis na tela

- A resposta de `mock.payments.latest` inclui `simulation: true`; os registros são gerados como amostras fictícias no backend.
- A configuração das notificações de novos investidores também retorna `simulation: true`.
- Os registros de saques da conta padrão incluem `simulation: true`.
- O feed de pagamentos contém `data-simulation="true"` no DOM.
- Nomes técnicos como `MockPaymentFeed`, `mock.payments.latest` e comentários com “sample”, “fictional” ou “simulated” são encontrados no código, mas não são, por si só, texto visível ao usuário.

As respostas de API citadas fazem parte de fluxos autenticados do sistema; este levantamento não as classifica como páginas públicas anônimas.

## Termos não encontrados como avisos ativos na interface

Na busca por textos da interface, não foram encontrados avisos ativos usando literalmente “mockup”, “wireframe” ou “amostra”. Termos como “mock”, “sample” e “simulation” aparecem em nomes internos, comentários, metadados e identificadores técnicos. Exemplos de formulário (como “ex.: João Silva”) são instruções de preenchimento, não avisos de que dados da plataforma são fictícios.

## Escopo e limitações da verificação

- Busca e inspeção de código do frontend, textos de interface, páginas estáticas relevantes e respostas relacionadas do backend.
- Comparação das ocorrências entre a raiz do projeto e `ProjetoGIT`.
- Não foram feitas alterações em componentes, dados, APIs ou banco de dados.
- Não foi feito login nem teste interativo de cada tela autenticada nesta etapa. A exibição efetiva de itens condicionais — por exemplo, o aviso de novos investidores — depende das condições descritas acima.
- Este documento mapeia textos e comportamentos identificados no código; não é uma auditoria de todos os dados existentes no banco.
