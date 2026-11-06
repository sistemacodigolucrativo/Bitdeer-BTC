# Plano de redesign visual premium

## 1. Diagnóstico

O produto já tem uma base funcional mobile-first, uma paleta escura e componentes próprios para membro e administração. A identidade atual, porém, mistura muitas cores utilitárias hard-coded, rosas/indigos/azuis e níveis de contraste variados. O shell de membro permanece com largura de aplicativo móvel em desktop. A experiência autenticada contém mais páginas do que a tela de login visível no Preview.

## 2. Conceito visual

**Bitdeer Mining Console — premium industrial:** interface escura de alto contraste, com superfícies de grafite, âmbar como destaque Bitcoin e ciano como acento tecnológico. Iluminação e textura serão discretas para não competir com saldos, formulários, tabelas e alertas.

## 3. Paleta proposta

| Token | Cor | Uso |
|---|---|---|
| `--btc-bg` | `#0B1016` | Fundo externo |
| `--btc-shell` | `#101821` | Shell principal |
| `--btc-surface` | `#151F2A` | Cards e áreas de conteúdo |
| `--btc-surface-raised` | `#1C2935` | Controles, cards destacados e menus |
| `--btc-border` | `#2B3A47` | Bordas e divisores |
| `--btc-text` | `#F4F7F8` | Texto principal |
| `--btc-muted` | `#A4B1BC` | Texto secundário |
| `--btc-amber` | `#F4B942` | Bitcoin e ação principal |
| `--btc-cyan` | `#54C8D5` | Foco, seleção e tecnologia |
| `--btc-success` | `#4CCB98` | Sucesso e estado ativo |
| `--btc-danger` | `#F06F73` | Erros e ações destrutivas |

O modo claro existente será mantido com fundo neutro claro, superfícies brancas e os mesmos acentos semânticos.

## 4. Tipografia e hierarquia

- Manter pilhas de fontes do sistema, sem baixar fontes ou adicionar dependências.
- Títulos com maior contraste e peso; texto auxiliar com cor secundária legível.
- Valores BTC/USD com a fonte monoespaçada já existente e números tabulares para facilitar comparação.
- Evitar reduzir o texto de formulários, estados, tabelas ou ações abaixo dos tamanhos atuais.

## 5. Organização dos componentes

Preservar a árvore e o fluxo atual. O tema será centralizado em tokens CSS e aplicado a superfícies, controles, bordas, foco e estados via seletores das classes existentes. Login/cadastro, idioma, tela de inicialização, membro, administração, modais e página pública de checkout receberão o mesmo sistema de cores.

## 6. Estratégia de responsividade

- Mobile: manter o uso de tela inteira, áreas seguras, rolagem existente e navegação inferior; reforçar foco e áreas de toque sem mudar os controles.
- Tablet: preservar as colunas existentes e usar espaçamentos intermediários.
- Desktop: permitir maior largura ao viewport de membro e às grades de conteúdo; manter o menu administrativo e as navegações atuais.
- Não remover, esconder ou trocar conteúdo funcional para caber na tela; respeitar rolagem horizontal de conteúdo tabular onde já usada.

## 7. Efeitos e animações

- Gradientes radiais e brilhos estáticos de baixa intensidade para separar o shell do fundo.
- Sombras e bordas em camadas, sem partículas contínuas, vídeo, fumaça ou dependência externa.
- Transições breves em hover/foco, sem animar métricas continuamente.
- `prefers-reduced-motion` desativará transições/animações decorativas; mobile não receberá efeitos de pintura pesados.

## 8. Arquivos que serão modificados

### Implementação visual, em ambas as cópias

- `src/index.css`
- `public/btc-checkout/index.html` — apenas regras do bloco `<style>`, preservando o HTML, textos e link atuais.

### Documentação somente na raiz

- `docs/ANALISE_TEMPLATE_ATUAL.md`
- `docs/PLANO_REDESIGN_PREMIUM.md`
- `docs/RELATORIO_REDESIGN_VISUAL.md` — preencher após validação.
- `MELHORIAS_PROPOSTAS.md`

## 9. Arquivos que não serão modificados

Todos os TSX/JS/TS que contêm comportamento, incluindo `src/App.tsx`, componentes de membro/admin, rotas, serviços, eventos, classes, IDs, `name`, atributos `data-*`, textos traduzidos e markup funcional; todo o backend PHP/SQLite; configurações e dependências; testes; assets; scripts de checkout e CSS legado não carregado.

## 10. Estratégia de implementação

1. Manter os imports específicos de Tailwind que já existem em cada `src/index.css`.
2. Acrescentar tokens e regras visuais globais sem renomear ou remover seletores usados pelos componentes.
3. Afinar o viewport desktop e os estados de foco, campos, superfícies e navegação por CSS.
4. Harmonizar a página estática de checkout com regras CSS, sem alterar conteúdo, rota ou link.
5. Replicar as mesmas regras visuais na raiz e no clone; verificar diferenças com diff restrito aos arquivos permitidos.
6. Não adicionar pacotes, assets remotos ou alterações de lógica.

## 11. Plano de testes

- `bun run lint` e `bun run build` na raiz; build equivalente dentro do clone, sem alterar seu `package.json`.
- Suíte `tests/browser_smoke.mjs` para login/cadastro, menus, áreas do membro e administrador e formulários cobertos pela suíte.
- Capturas do Preview em desktop e mobile da rota pública e da página `/btc-checkout/`.
- Inspeção adicional das telas autenticadas em viewport mobile/tablet/desktop pela suíte de navegador, caso as dependências e o serviço de teste estejam disponíveis.
- Revisar dimensões, overflow, contraste, foco e `prefers-reduced-motion`.
- Confirmar que os arquivos fora do escopo continuam sem alterações; relatar limitações em vez de declarar testes não realizados.

## 12. Aprovação

Este documento e a análise são entregues antes de qualquer alteração visual. A implementação começará somente depois da confirmação do plano.
