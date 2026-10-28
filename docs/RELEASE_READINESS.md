# Bitdeer BTC — liberação e responsabilidades

**Branch de integração:** implementation/php-sqlite-backend.
**A branch main e a hospedagem de produção não são alteradas por esta CI.**

## Funcionalidades concluídas no repositório

- Backend PHP com SQLite privado, autenticação, usuários e contratos.
- Suspensão VIP: opção A, vencimento continua correndo e créditos ficam interrompidos.
- Planos inicializados com parâmetros preservados da referência original; teste de baseline.
- Painéis, tickets, histórico VIP, Top Miners demonstrativo (perfis e números fictícios explicitamente identificados), indicações individuais persistidas no SQLite e interface de recompensas/loja.
- Assistente /install de uso único com prova temporária de controle do domínio via DNS TXT, sem chave pré-configurada, ou acesso local.
- API administrativa para diagnosticar extensões, banco, HTTPS, e-mail e carteira.
- Pacote ZIP separado em public_html e private, teste HTTP de ZIP descompactado.
- Teste Chromium com capturas em celular e desktop, verificação de navegação e erros JS.
- Textos da experiência principal explicitam que saldos são internos e não comprovam mineração real de Bitcoin.

## Requisitos que dependem da operação real

1. **Hospedagem:** apontar DocumentRoot para public_html, manter private fora do acesso público e confirmar HTTPS, PHP >= 8.2, PDO SQLite e permissões. Não há servidor de hospedagem conectado a esta automação.
2. **Primeira instalação:** domínio em HTTPS com TXT DNS, IP em HTTPS com comprovante de arquivo enviado pelo operador, ou SSH/loopback local opt-in quando só houver HTTP. Ambos os tipos de endereço são aceitos sem chave extra. O instalador pede a URL pública e cria um membro fundador novo.
3. **Recebimento BTC:** a instalação começa sem endereço BTC; o responsável define, controla e confirma independentemente o endereço pelo painel administrativo. Até isso ocorrer, novos pedidos permanecem bloqueados. O código não executa verificação na blockchain.
4. **Suporte:** configure e verifique o transporte de e-mail no ambiente real. Tickets são persistidos mesmo sem entrega de mensagens. A opção mail() não confirma entrega final.
5. **Identidade:** aplique o procedimento manual em IDENTITY_AND_PASSWORD_RESETS.md. A confirmação registrada depende da verificação humana.
6. **Comercial e legal:** não apresentar créditos internos como BTC efetivamente minerado ou saldo Bitcoin disponível na blockchain. A função Sacar registra somente pedidos administrativos relativos a créditos internos; não envia BTC automaticamente. Confirmar serviço real prestado e conformidade aplicável antes de aceitar contratações pagas.
7. **Paridade:** revisar screenshots e telas originais com usuário final. CI testa navegação e responsividade, não prova identidade pixel a pixel com a versão anterior.
8. **Publicação:** exigir verificação no domínio de destino e aprovação para mesclar a PR à main. Não há deploy automático.

## Referências

- docs/BASELINE_PLANS.md — valores iniciais conferidos.
- docs/DEPLOYMENT.md — instalação e requisitos.
- docs/IDENTITY_AND_PASSWORD_RESETS.md — procedimento de redefinição.
- GitHub Actions — lint, testes SQLite/API, instalação local, pacote ZIP e Chromium.

## Pendências específicas de históricos e pagamentos

A decisão do proprietário exige banco inicial limpo. O código 8ZPTC, usuários e históricos antigos NÃO serão importados, mesmo se aparecerem em arquivos do mockup. A rede nasce do novo membro fundador criado no instalador.

No checkout, a aprovação continua manual e exige conferência externa de TXID. O servidor normaliza e impede reaproveitamento de TXID e permite rejeição com auditoria. Um TXID bem formatado não constitui prova de pagamento.

## Atualização de interface — 7 solicitações (28/10/2026)

- Removido o card externo duplicado de saldo USD na tela inicial; permanece o USD equivalente no painel de mineração e o contador BTC, renomeado.
- O card de endereço BTC/Editar Carteira fica oculto após o cadastro, sem excluir o endereço gravado no SQLite.
- Meu Perfil aplica máscara brasileira de telefone com DDD, limite de 11 dígitos (15 caracteres formatados), e validação no backend.
- Textos dos painéis de membro/admin, onboarding, login e componentes legados foram padronizados, preservando informação de que os créditos são registros internos, não BTC comprovado na blockchain.
- A solicitação de saque passou a uma tela separada com botão Voltar, preservando cadastro de carteira e as regras PHP/SQLite.
- Top Miners apresenta dez perfis de demonstração, bandeiras, país, frase e valores BTC/USD fictícios na disposição de cards da referência visual. Não é ranking de usuários reais.
- O backend `leaderboard` conserva a consulta ao ledger SQLite, mas não é utilizado pelo novo Top Miners ilustrativo.

A auditoria textual foi realizada nos componentes React, incluindo a tela inicial, carteira, solicitações de saque, painel administrativo, traduções de entrada, FAQ legada e rótulo de configurações. Documentação e comentários internos podem continuar usando a terminologia técnica de simulação; não são afirmações visíveis de mineração real.
