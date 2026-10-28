# Bitdeer BTC — liberação e responsabilidades

**Branch de integração:** implementation/php-sqlite-backend.
**A branch main e a hospedagem de produção não são alteradas por esta CI.**

## Funcionalidades concluídas no repositório

- Backend PHP com SQLite privado, autenticação, usuários e contratos.
- Suspensão VIP: opção A, vencimento continua correndo e créditos ficam interrompidos.
- Planos inicializados com parâmetros preservados da referência original; teste de baseline.
- Painéis, tickets, histórico VIP, Top Miners anônimo, indicações individuais persistidas no SQLite e interface de recompensas/loja.
- Assistente /install de uso único com prova temporária de controle do domínio via DNS TXT, sem chave pré-configurada, ou acesso local.
- API administrativa para diagnosticar extensões, banco, HTTPS, e-mail e carteira.
- Pacote ZIP separado em public_html e private, teste HTTP de ZIP descompactado.
- Teste Chromium com capturas em celular e desktop, verificação de navegação e erros JS.
- Textos da experiência principal explicitam que saldos são internos e não comprovam mineração real de Bitcoin.

## Requisitos que dependem da operação real

1. **Hospedagem:** apontar DocumentRoot para public_html, manter private fora do acesso público e confirmar HTTPS, PHP >= 8.2, PDO SQLite e permissões. Não há servidor de hospedagem conectado a esta automação.
2. **Primeira instalação:** para usar o domínio, publique o TXT temporário _bitdeer-install e comprove controle do DNS; também há modo local. A reinstalação permanece bloqueada.
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

## Pendências específicas de históricos e pagamentos

O código antigo 8ZPTC não tem proprietário vinculado à base de membros. Os registros estáticos do frontend não foram importados como cadastros reais. Um histórico anterior comprovado só poderá ser associado mediante identificação do titular e origem dos dados.

No checkout, a aprovação continua manual e exige conferência externa de TXID. O servidor normaliza e impede reaproveitamento de TXID e permite rejeição com auditoria. Um TXID bem formatado não constitui prova de pagamento.
