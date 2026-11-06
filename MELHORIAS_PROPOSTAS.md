# Melhorias propostas fora do escopo visual

As propostas abaixo não foram implementadas e exigem autorização em uma solicitação separada.

## 1. Comparação visual automatizada das telas

- **Problema/oportunidade:** `tests/browser_smoke.mjs` verifica fluxos e interações em navegador, mas não compara capturas com imagens de referência para detectar regressões visuais.
- **Benefício:** identificar mudanças de espaçamento, clipping e contraste nas telas de membro e administrador antes de publicar.
- **Impacto:** médio; requer definir baselines, manter capturas por viewport e revisar falsos positivos.
- **Justificativa técnica:** os testes atuais geram capturas, mas não fazem comparação visual automatizada.
- **Recomendação:** avaliar em tarefa separada após estabilizar a nova identidade; sem adicionar dependências nesta mudança.

## 2. Auditoria dos componentes e assets legados não montados

- **Problema/oportunidade:** `MainAppWorkspace.tsx`, `OnboardingPreviewScreen.tsx` e arquivos do checkout legado não aparecem no fluxo visual ativo mapeado nesta análise.
- **Benefício:** reduzir ambiguidade sobre quais telas são mantidas e quais estilos precisam de manutenção.
- **Impacto:** baixo a médio; pode afetar integrações externas ou fluxos de pacote que não aparecem na aplicação principal.
- **Justificativa técnica:** componentes e arquivos CSS/JS não referenciados podem se tornar divergentes ou aumentar custo de manutenção.
- **Recomendação:** fazer auditoria de imports e do pacote de publicação antes de decidir por remoção ou arquivamento; nenhum arquivo legado deve ser removido nesta tarefa.
