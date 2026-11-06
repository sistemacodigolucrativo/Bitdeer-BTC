// Member-facing translations independent of administrative Portuguese-only copy.
export const memberViewCopy = {
  pt: {
    back:'Voltar à carteira', title:'Solicitação de Saque', walletRegistration:'Cadastrar carteira Bitcoin',
    request:'SOLICITAR SAQUE', close:'Fechar', address:'Endereço de recebimento BTC',
    save:'Salvar carteira', wallet:'Carteira', quote:'Cotação BTC/USD',
    unavailable:'indisponível', source:'Fonte', rateNotice:'O servidor verifica a cotação ao registrar o pedido.',
    minimum:'Saque mínimo', period:'Prazo do plano', days:'dia(s)', usd:'Dólar (USD)',
    btc:'Bitcoin (BTC)', amount:'Valor solicitado', submit:'Enviar para minha carteira',
    terms:'Solicitações de saque exigem um plano VIP 01 a 04 ativo. Sem um VIP vigente, nenhuma solicitação é registrada. A aprovação exige conferência administrativa.',
    requests:'Solicitações de saque', equivalent:'equivalência interna',
    awaiting:'Aguardando assinatura VIP', pending:'Aguardando análise administrativa',
    approved:'Solicitação aprovada', rejected:'Rejeitado', failed:'Falhou', order:'Pedido',
    demoWithdrawal:'Demonstração · sem envio de BTC',
    withdrawalNotice:'A solicitação informa a quantidade de Bitcoin equivalente ao valor em dólar para a sua carteira registrada.',
    perBtc:'por BTC', qrAlt:'QR de endereço e valor BTC deste pedido',
    satoshis:'satoshis internos', units:'unidades USD', phone:'Informe um telefone internacional válido com DDI, por exemplo +55, +1, +44 ou +36.',
    orderPending:'Pendente', orderApproved:'Aprovado', orderRejected:'Rejeitado', orderExpired:'Expirado'
  },
  en: {
    back:'Back to wallet', title:'Withdrawal Request', walletRegistration:'Register Bitcoin wallet',
    request:'REQUEST WITHDRAWAL', close:'Close', address:'Receiving BTC address',
    save:'Save wallet', wallet:'Wallet', quote:'BTC/USD rate',
    unavailable:'unavailable', source:'Source', rateNotice:'The server verifies the rate when the request is submitted.',
    minimum:'Minimum withdrawal', period:'Plan term', days:'day(s)', usd:'Dollar (USD)',
    btc:'Bitcoin (BTC)', amount:'Requested amount', submit:'Send to my wallet',
    terms:'Withdrawal requests require an active VIP 01–04 plan. Without an active VIP, no request is recorded. Approval requires administrative review.',
    requests:'Withdrawal requests', equivalent:'internal equivalent',
    awaiting:'Awaiting VIP subscription', pending:'Awaiting administrative review',
    approved:'Request approved', rejected:'Rejected', failed:'Failed', order:'Order',
    demoWithdrawal:'Demo · no BTC sent',
    withdrawalNotice:'The request states the Bitcoin amount equivalent to the dollar value for your registered wallet.',
    perBtc:'per BTC', qrAlt:'QR for the BTC address and amount of this order',
    satoshis:'internal satoshis', units:'USD units', phone:'Enter a valid international phone number with a country calling code, such as +55, +1, +44 or +36.',
    orderPending:'Pending', orderApproved:'Approved', orderRejected:'Rejected', orderExpired:'Expired'
  },
  es: {
    back:'Volver a la billetera', title:'Solicitud de Retiro', walletRegistration:'Registrar billetera Bitcoin',
    request:'SOLICITAR RETIRO', close:'Cerrar', address:'Dirección BTC de recepción',
    save:'Guardar billetera', wallet:'Billetera', quote:'Cotización BTC/USD',
    unavailable:'no disponible', source:'Fuente', rateNotice:'El servidor verifica la cotización al registrar la solicitud.',
    minimum:'Retiro mínimo', period:'Plazo del plan', days:'día(s)', usd:'Dólar (USD)',
    btc:'Bitcoin (BTC)', amount:'Importe solicitado', submit:'Enviar a mi billetera',
    terms:'Las solicitudes de retiro requieren un plan VIP 01–04 activo. Sin un VIP vigente, no se registra ninguna solicitud. La aprobación requiere revisión administrativa.',
    requests:'Solicitudes de retiro', equivalent:'equivalencia interna',
    awaiting:'Esperando suscripción VIP', pending:'En revisión administrativa',
    approved:'Solicitud aprobada', rejected:'Rechazado', failed:'Falló', order:'Pedido',
    demoWithdrawal:'Demostración · sin envío de BTC',
    withdrawalNotice:'La solicitud informa el importe de Bitcoin equivalente al valor en dólares para su billetera registrada.',
    perBtc:'por BTC', qrAlt:'QR de dirección e importe BTC del pedido',
    satoshis:'satoshis internos', units:'unidades USD', phone:'Introduzca un teléfono internacional válido con prefijo, por ejemplo +55, +1, +44 o +36.',
    orderPending:'Pendiente', orderApproved:'Aprobado', orderRejected:'Rechazado', orderExpired:'Vencido'
  }
} as const;
