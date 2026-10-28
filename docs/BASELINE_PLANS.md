# Parâmetros iniciais preservados — Bitdeer BTC

Esta tabela descreve registros **simulados** do sistema e não constitui
declaração de mineração real, rentabilidade garantida ou pagamento automático.

Os parâmetros do SQLite são comparados com os arquivos legados
src/config/dailyRewards.ts e src/checkout/config.ts, versão de
referência 0d39b528ad5eccf5d3fd2f8ff3c99095dd2ed82d.

| Plano | Contratação USD | Crédito interno USD/dia | Bônus interno USD/24h | Satoshis internos/24h | Duração |
| --- | ---: | ---: | ---: | ---: | ---: |
| FREE | 0 | 1,00 | 0,50 | 10.000 | Indeterminada |
| VIP 01 | 20 | 3,00 | 1,00 | 20.000 | 30 dias |
| VIP 02 | 40 | 6,00 | 1,50 | 20.000 | 30 dias |
| VIP 03 | 60 | 12,00 | 2,00 | 20.000 | 30 dias |
| VIP 04 | 80 | 28,00 | 2,50 | 20.000 | 30 dias |

FREE: sessão simulada limitada a 7.200 segundos (2 horas), com
intervalo de 7.200 segundos entre sessões. Os planos VIP têm sessão
contínua até o vencimento contratual.

Todos os valores são seed da primeira instalação; alterações no painel
administrativo afetam apenas novos contratos e renovações. O SQLite,
e não listas estáticas do navegador, é a fonte vigente depois do install.

A apresentação pública de planos pagos requer validação independente
de capacidade operacional, custos, regras contratuais e obrigações legais.

A instalação cria apenas um novo administrador e um novo membro fundador, cada qual com senha forte; a conta fundadora inicia a rede com código de convite novo e nenhum histórico prévio. A conta administrativa e o usuário fundador não importam contas do mockup. A carteira de recebimento fica vazia até cadastro pelo administrador.
