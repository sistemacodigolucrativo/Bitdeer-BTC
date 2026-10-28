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

## Atualização: Top Miners, VIP, idiomas e BTC/USD — 28/10/2026

- **Top Miners:** exatamente 200 personagens fictícios distintos, sendo pelo menos 60 novos brasileiros e Ricardo Mendes já existente. Nomes, locais, mensagens e quantidades BTC são gerados de modo determinístico; não referenciam membros registrados nem transações na blockchain. Os USD de demonstração são calculados usando a cotação pública entregue pelo PHP; se indisponível, não exibir número estimado como se fosse atual.
- **Saques e assinatura VIP:** uma conta FREE pode registrar pedido de saque interno se tiver carteira válida, saldo e requisitos do seu plano. O pedido recebe `vip_state=awaiting_vip` no SQLite e retorna o estado público `awaiting_vip` (Aguardando assinatura VIP). Os status originais dos pedidos continuam auditáveis; a aprovação administrativa exige **contrato vigente dos planos VIP_01, VIP_02, VIP_03 ou VIP_04**, validado novamente no backend no instante do processamento, além dos limites de prazo/valor do plano VIP. Uma rejeição devolve o saldo interno reservado; a aplicação não envia BTC automaticamente. A compra do VIP **não representa garantia de saque em Bitcoin**, pois os créditos internos permanecem demonstrativos.
- **Idiomas:** a seleção é salva no armazenamento local com chave individual por membro e sincronizada no SQLite. No novo login, o idioma explícito deste dispositivo é priorizado; em outro dispositivo, busca a preferência da conta no banco. Respostas atrasadas de busca não sobrescrevem uma seleção feita pelo membro.
- **Cotação BTC/USD:** Coinbase Spot é a primeira fonte gratuita e Kraken Ticker pública a alternativa, ambas sem chave. A CoinGecko Demo pode ser usada de modo opcional com a variável de ambiente `BITDEER_COINGECKO_DEMO_KEY` (chave gratuita necessária); nunca incluir segredos no frontend. O servidor mantém cache único de **até 60 segundos** em `app_settings.btc_usd_quote_cache` do SQLite. Mostra fonte e instante da cotação; qualquer falha em todos os provedores impede iniciar novas solicitações/pedidos que exijam taxa vigente, sem usar valores fictícios ou cache expirado. Valores BTC usam 8 casas decimais e USD usa arredondamento a centavos em lançamentos.
- **Validação externa pendente:** a CI usa cotação numérica **apenas em ambiente de teste isolado** (`BITDEER_TEST_QUOTE_USD` + `CI=true`) para não depender de rede. A disponibilidade efetiva das APIs, limites, termos de uso, TLS e cotação real devem ser confirmadas na VPS definitiva. **Não habilitar publicação até homologar.**

### Testes adicionados
- Registro de saque FREE, bloqueio de aprovação sem VIP, promoção do status ao ativar VIP, novo bloqueio após vencimento e preservação do estorno.
- Browser: 200 perfis únicos, representatividade brasileira, seleção de idioma persistida localmente, gravada no SQLite e recuperada após recarregamento.


## Revisão de interface e saldo ao vivo — 28/10/2026

1. Carteira: o parágrafo amarelo com a frase "São registros internos, não BTC minerados ou transferências confirmadas" foi retirado sem reservar espaço visual. A carteira mantém a denominação **recompensas internas**, e o histórico/backend mantêm a identificação correta das unidades.
2. Início: rótulo **Capacidade de mineração** (também traduzido EN/ES). Trata-se do parâmetro de capacidade exibido pelo plano, não de comprovação de uma máquina real.
3. Início: a frase de projeção ficou apenas "Projeção interna entre atualizações", com versões EN/ES correspondentes. A natureza demonstrativa dos créditos continua exposta nas outras telas e documentação.
4. **Contadores ao vivo (visuais):** a carteira e o painel inicial compartilham uma projeção de exibição calculada a cada segundo a partir de uma amostra do PHP/SQLite, reconciliada com `profile` a cada 5 segundos enquanto a página está visível. A projeção para se não houver sessão ativa, após término de sessão/contrato ou após 8 segundos sem nova amostra. O frontend nunca grava saldos, recompensas ou valor de saque. O BTC é somente equivalente USD/BTC conforme última cotação válida, arredondado a **oito casas decimais**. Por precisão de satoshi, a exibição em BTC só muda quando o equivalente acumulado alcança pelo menos 1 satoshi; isso não significa um tick on-chain por segundo.
5. Loja: texto de legenda "Equipamento ilustrativo" retirado dos cards dos planos. O SVG continua uma representação gráfica, identificado como tal para acessibilidade e sem dados de alocação física comprovada.
6. **Ativação VIP em 30 minutos: NÃO IMPLEMENTADA.** O checkout depende de confirmação administrativa manual, sem fila de SLA, automação ou dados de capacidade operacional que comprovem prazo máximo. Para não apresentar publicidade potencialmente falsa, o texto ficou "Ativação após conferência manual do pagamento, sem prazo máximo garantido" com versões EN/ES. Caso o operador comprove o SLA e implemente o controle de cumprimento, o texto poderá ser reavaliado.
7. Idiomas: corrigidos rótulos PT/EN/ES nos painéis de carteira, solicitação de saque, login/cadastro, loja, Top Miners, histórico de contratos, atendimento e telas de status. Administração permanece em português conforme decisão anterior.

**Liberação:** a CI valida cálculos internos sob condições controladas. Ela não prova máquinas de mineração reais, saldos BTC na blockchain, pagamentos BTC, cumprimento de SLA comercial ou produção pronta. `main`, VPS e domínio permanecem inalterados até homologação final.
