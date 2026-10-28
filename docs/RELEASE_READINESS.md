# Bitdeer BTC — liberação e responsabilidades

**Branch de integração:** implementation/php-sqlite-backend.
**A branch main e a hospedagem de produção não são alteradas por esta CI.**

## Funcionalidades concluídas no repositório

- Backend PHP com SQLite privado, autenticação, usuários e contratos.
- Suspensão VIP: opção A, vencimento continua correndo e créditos ficam interrompidos.
- Planos inicializados com parâmetros preservados da referência original; teste de baseline.
- Painéis de membros e administrador, suporte/tickets, histórico VIP, Top Miners baseado em créditos internos anônimos, interface de recompensas e loja.
- Assistente /install de uso único sem chave adicional pelo acesso LOCAL ao servidor.
- API administrativa para diagnosticar extensões, banco, HTTPS, e-mail e carteira.
- Pacote ZIP separado em public_html e private, teste HTTP de ZIP descompactado.
- Teste Chromium com capturas em celular e desktop, verificação de navegação e erros JS.
- Textos da experiência principal explicitam que saldos são internos e não comprovam mineração real de Bitcoin.

## Requisitos que dependem da operação real

1. **Hospedagem:** apontar DocumentRoot para public_html, manter private fora do acesso público e confirmar HTTPS, PHP >= 8.2, PDO SQLite e permissões. Não há servidor de hospedagem conectado a esta automação.
2. **Primeira instalação:** com a política de acesso simples, use acesso local/loopback ao servidor. NÃO libere o primeiro cadastro de administrador para visitantes desconhecidos pelo domínio público. Após criar a base, o instalador se bloqueia.
3. **Recebimento BTC:** o responsável deve controlar e confirmar independentemente o endereço pelo painel administrativo. Até isso ocorrer, novos pedidos permanecem bloqueados. O código não executa verificação na blockchain.
4. **Suporte:** configure e verifique o transporte de e-mail no ambiente real. Tickets são persistidos mesmo sem entrega de mensagens. A opção mail() não confirma entrega final.
5. **Identidade:** aplique o procedimento manual em IDENTITY_AND_PASSWORD_RESETS.md. A confirmação registrada depende da verificação humana.
6. **Comercial e legal:** não apresentar créditos internos como BTC minerado ou disponível para saque. Confirmar serviço real prestado e conformidade aplicável antes de aceitar contratações pagas.
7. **Paridade:** revisar screenshots e telas originais com usuário final. CI testa navegação e responsividade, não prova identidade pixel a pixel com a versão anterior.
8. **Publicação:** exigir verificação no domínio de destino e aprovação para mesclar a PR à main. Não há deploy automático.

## Referências

- docs/BASELINE_PLANS.md — valores iniciais conferidos.
- docs/DEPLOYMENT.md — instalação e requisitos.
- docs/IDENTITY_AND_PASSWORD_RESETS.md — procedimento de redefinição.
- GitHub Actions — lint, testes SQLite/API, instalação local, pacote ZIP e Chromium.
