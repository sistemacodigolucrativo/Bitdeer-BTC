# Análise do template visual atual

## Escopo e método

Análise estática da raiz usada pelo Preview e do clone `ProjetoGIT/`, mais capturas da tela pública de login em 1280 × 800 e 402 × 874. Nenhum arquivo visual foi alterado nesta fase. A captura mostra a experiência sem sessão; os painéis autenticados foram mapeados pelo fluxo e pelos componentes, não por captura visual.

## 1. Estrutura do projeto

Árvore principal (pastas de origem; cache, dependências e saídas de build foram excluídos):

- `src/`: frontend React e TypeScript.
  - `components/`: telas e componentes; `components/admin/` concentra administração e `components/workspace/` concentra telas e modais do membro.
  - `services/`: chamadas à API, cotação, mineração e armazenamento.
  - `i18n/`: traduções e textos localizados.
  - `config/`, `types/`, `utils/` e `checkout/`: regras de apresentação/configuração, tipos e utilitários do frontend.
- `public/`: arquivos públicos, 14 capturas históricas de referência e `btc-checkout/`.
- `api/`, `server/`, `install/` e `bin/`: endpoints e backend PHP, instalação e provisionamento.
- `tests/`: 13 arquivos de verificação, incluindo integração, navegador, instalação e estrutura de pacote.
- `docs/`, `deploy/`, `scripts/` e `.github/workflows/`: documentação, publicação, automação e validação.

## 2. Tecnologia do frontend

- React 19, TypeScript, Vite 8 e Tailwind CSS 4.
- Ícones de interface: `lucide-react`; alguns gráficos e ilustrações são SVGs inline.
- A tela independente `/btc-checkout/` é HTML/CSS estático. A documentação do projeto identifica o checkout independente como desativado; o fluxo de pedidos ativo fica dentro da aplicação autenticada.
- A aplicação principal usa PHP/SQLite. Essa camada não faz parte do escopo de redesign.

## 3. Arquivos de apresentação e templates

- `src/index.css`: viewport, primeiro paint, suporte ao modo claro, rolagem e animações específicas.
- `src/components/**/*.tsx`: a maior parte da apresentação está em classes Tailwind inline. Esses arquivos também contêm estado, handlers, validações, eventos e seletores `data-testid`; por isso não são seguros para edição visual sem necessidade comprovada.
- `public/btc-checkout/index.html`: página estática desativada com CSS inline.
- `public/btc-checkout/style.css`, `checkout.js` e demais scripts do checkout legado: não são referenciados pelo HTML atualmente servido; preservados.
- `index.html`: shell de entrada e metadados do Vite; não é necessário para a mudança visual proposta.

## 4. Padrões visuais atuais

- Base escura azul-marinho: `#121526` / `#121626`; superfícies comuns `#171b2d`, `#191e32`, `#1b2137` e `#11182c`.
- Bordas azul-acinzentadas: `#232a43`, `#252c45`, `#262e49` e `#2b3350`.
- Indigo (`#6366f1`) aparece em ações e estados selecionados; rosa/vermelho (`#f43f5e`) é usado em ações principais; verde indica mineração/status; âmbar identifica BTC e elementos financeiros.
- Tipografia usa a pilha sans padrão do Tailwind/sistema; valores e identificadores usam `font-mono`.
- Espaçamento recorrente de 3 a 5 unidades Tailwind; cantos arredondados de `xl` a `3xl`; cards recebem bordas e sombras discretas.
- As cores estão distribuídas por dezenas de classes utilitárias em componentes, em vez de uma paleta semântica centralizada.

## 5. Navegação e organização

- `src/App.tsx` controla sessão, login/cadastro, idioma, inicialização e a escolha entre painel de membro e painel administrativo.
- Membro: navegação inferior com Início, Loja, Recompensas, Carteira e Configurações; há telas secundárias de perfil, suporte, histórico, ranking, assinaturas e saque.
- Administração: menu abre seções de visão geral, membros, planos, pedidos, saques, configurações, auditoria e suporte.
- O dashboard de membro ativo é `MemberWorkspace`; `AdminWorkspace` é o painel administrativo ativo. `MainAppWorkspace` e `OnboardingPreviewScreen` não têm referências de montagem no fluxo atual; não devem ser ativados nem removidos neste trabalho.

## 6. Responsividade atual

- O shell usa `100dvh`, viewport dinâmico, `viewport-fit=cover`, áreas seguras do dispositivo e rolagem interna.
- Em mobile, a aplicação ocupa a tela e mantém navegação inferior; formulários, modais e painéis usam grades e breakpoints Tailwind.
- O viewport do membro fica limitado a 420 px mesmo em desktop; o administrativo pode chegar a `max-w-6xl`.
- O menu administrativo abre como dropdown; listas e áreas longas usam rolagem interna e há classes específicas para histórico e ranking.
- Nas capturas do login em desktop e mobile, campos e ações ficaram visíveis; isso não comprova todos os estados das telas autenticadas.

## 7. Oportunidades visuais de baixo risco

- Definir tokens CSS semânticos e reaplicá-los sobre as classes já existentes.
- Harmonizar fundos, cards, bordas, ações, foco, campos e estados entre login, telas do membro, administração, modais e página pública de checkout.
- Dar mais espaço ao painel do membro em telas maiores sem retirar a navegação inferior.
- Melhorar foco visível e alvos de toque sem mudar nomes, classes existentes, atributos, eventos ou ações.
- Estender `prefers-reduced-motion` às animações decorativas e manter animações pesadas fora de mobile.
- Preservar o modo claro existente com tokens próprios.

## 8. Arquivos seguros e arquivos preservados

### Seguros para a mudança planejada

- `src/index.css` na raiz e em `ProjetoGIT/`.
- Somente o bloco `<style>` de `public/btc-checkout/index.html` na raiz e em `ProjetoGIT/`.

Nenhum JSX, classe existente, ID, `name`, `data-*`, conteúdo textual, estrutura de formulário ou atributo de evento está previsto para mudança.

### Devem permanecer intocados

- `src/App.tsx`, todos os componentes TSX, serviços, tipos, configurações, traduções e utilitários.
- `server/`, `api/`, `install/`, `bin/`, banco de dados e regras de backend.
- `package.json`, `bun.lock`, `vite.config.ts`, `.replit`, workflows e dependências.
- `public/btc-checkout/*.js`, `public/btc-checkout/style.css` não referenciado, imagens/capturas existentes e o `index.html` principal.
- Todo arquivo do clone fora dos dois arquivos de apresentação listados acima.

## 9. Diferenças entre raiz e clone

Os 77 arquivos de frontend têm os mesmos caminhos nas duas cópias. A única diferença de conteúdo em `src/` encontrada foi a declaração inicial do Tailwind em `src/index.css`: a raiz usa `source(none)` e `@source "./"`, enquanto o clone usa `@import "tailwindcss";`. O HTML do checkout é idêntico. Os scripts de desenvolvimento em `package.json` diferem e serão preservados. As regras visuais novas serão replicadas nas duas cópias sem remover essas diferenças.

## 10. Baseline e limitações de observação

- `bun run lint` foi executado antes da implementação e passou (`tsc --noEmit`).
- As capturas do Preview exibiram o login sem sessão. O navegador registrou 401 na consulta de sessão (esperado sem autenticação) e um 404 de recurso cuja origem não foi identificada; esses registros são baseline e não foram alterados nesta fase.
- O fluxo visual autenticado será verificado após a implementação com a suíte existente de navegador, quando disponível. Nenhuma funcionalidade foi alterada nesta fase.
