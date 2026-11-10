import { LanguageCode } from '../types';
import type { ProjectCopyKey } from './mockup';

export const legitimoCopy = {
  onboardingTitle: {
    pt: 'Mineração de Bitcoin com recompensas verificadas',
    en: 'Bitcoin mining with verified rewards',
    es: 'Minería de Bitcoin con recompensas verificadas'
  },
  onboardingSubtitle: {
    pt: 'Acompanhe sua mineração, recompensas e histórico de pagamentos.',
    en: 'Track your mining activity, rewards and payment history.',
    es: 'Consulta tu actividad de minería, recompensas e historial de pagos.'
  },
  terminalNotice: {
    pt: 'Connection to node and mining confirmed by the service.',
    en: 'Connection to node and mining confirmed by the service.',
    es: 'Connection to node and mining confirmed by the service.'
  },
  loginSubtitle: {
    pt: 'Acesse sua conta para acompanhar sua mineração e pagamentos.',
    en: 'Access your account to track mining activity and payments.',
    es: 'Accede a tu cuenta para consultar tu minería y tus pagos.'
  },
  loginDisclaimer: {
    pt: '',
    en: '',
    es: ''
  },
  homeBalanceLabel: {
    pt: '',
    en: '',
    es: ''
  },
  homeBtcLabel: {
    pt: 'Bitcoin minerado e confirmado (BTC)',
    en: 'Bitcoin mined and confirmed (BTC)',
    es: 'Bitcoin minado y confirmado (BTC)'
  },
  homeNotice: {
    pt: '',
    en: '',
    es: ''
  },
  equipmentAlt: {
    pt: 'Equipamento de mineração conectado',
    en: 'Connected mining equipment',
    es: 'Equipo de minería conectado'
  },
  vipRewardNotice: {
    pt: 'Plano VIP ativo: mineração e recompensas confirmadas conforme as condições do plano.',
    en: 'Active VIP plan: mining and rewards are confirmed under the plan terms.',
    es: 'Plan VIP activo: minería y recompensas confirmadas según las condiciones del plan.'
  },
  homeFaqAnswer: {
    pt: 'No plano FREE, as sessões duram duas horas, seguidas de duas horas de intervalo. Nos planos VIP, mineração e recompensas seguem as condições do contrato.',
    en: 'On the FREE plan, sessions last two hours followed by a two-hour break. VIP mining and rewards follow the contract terms.',
    es: 'En el plan FREE, las sesiones duran dos horas y luego hay dos horas de pausa. La minería y las recompensas VIP siguen las condiciones del contrato.'
  },
  withdrawalDemoBadge: {
    pt: 'Saque BTC enviado para a carteira',
    en: 'BTC withdrawal sent to wallet',
    es: 'Retiro BTC enviado a la billetera'
  },
  withdrawalAvailableCredits: {
    pt: 'Saldo disponível para saque',
    en: 'Balance available for withdrawal',
    es: 'Saldo disponible para retiro'
  },
  withdrawalEquivalent: {
    pt: 'valor BTC confirmado',
    en: 'confirmed BTC amount',
    es: 'importe BTC confirmado'
  },
  withdrawalNotice: {
    pt: 'A solicitação envia Bitcoin para a carteira registrada após a confirmação do processamento.',
    en: 'The request sends Bitcoin to the registered wallet once processing is confirmed.',
    es: 'La solicitud envía Bitcoin a la billetera registrada cuando se confirme el procesamiento.'
  },
  walletBalanceLabel: {
    pt: 'Bitcoin recebido',
    en: 'Bitcoin received',
    es: 'Bitcoin recibido'
  },
  walletSatoshisLabel: {
    pt: 'Bônus Bitcoin confirmados em satoshis',
    en: 'Confirmed Bitcoin bonuses in satoshis',
    es: 'Bonos Bitcoin confirmados en satoshis'
  },
  walletBtcLabel: {
    pt: 'Saldo em BTC',
    en: 'BTC balance',
    es: 'Saldo en BTC'
  },
  rewardNotice: {
    pt: 'Os bônus são creditados como Bitcoin confirmado na sua carteira.',
    en: 'Bonuses are credited as confirmed Bitcoin to your wallet.',
    es: 'Los bonos se acreditan como Bitcoin confirmado en tu billetera.'
  },
  paymentFeedTitle: {
    pt: 'Pagamentos BTC confirmados',
    en: 'Confirmed BTC payments',
    es: 'Pagos BTC confirmados'
  },
  paymentFeedNotice: {
    pt: '',
    en: '',
    es: ''
  },
  topMinersNotice: {
    pt: 'Ranking dos mineradores com resultados e saldos Bitcoin confirmados.',
    en: 'Miner ranking with confirmed Bitcoin results and balances.',
    es: 'Clasificación de mineros con resultados y saldos Bitcoin confirmados.'
  },
  topMinersQuoteNotice: {
    pt: 'Valores em USD calculados pela última cotação BTC/USD disponível.',
    en: 'USD values use the latest available BTC/USD quote.',
    es: 'Los importes en USD usan la última cotización BTC/USD disponible.'
  },
  topMinersListLabel: {
    pt: 'Ranking real de mineradores',
    en: 'Verified miner ranking',
    es: 'Clasificación verificada de mineros'
  },
  investorToastDemoLabel: {
    pt: 'Simulação · dados fictícios',
    en: 'Simulation · fictional data',
    es: 'Simulación · datos ficticios'
  },
  settingsProjectLabel: {
    pt: 'Bitcoin Cloud Mining — mineração real',
    en: 'Bitcoin Cloud Mining — live mining service',
    es: 'Bitcoin Cloud Mining — minería activa'
  },
  storeEquipmentModel: {
    pt: 'Equipamento de mineração conectado',
    en: 'Connected mining equipment',
    es: 'Equipo de minería conectado'
  },
  privacyRewardsHeading: {
    pt: '1. Mineração em nuvem e recompensas Bitcoin verificadas',
    en: '1. Cloud Mining and Verified Bitcoin Rewards',
    es: '1. Minería en la nube y recompensas Bitcoin verificadas'
  },
  adminModeLabel: {
    pt: 'Modo Mockup',
    en: 'Mockup Mode',
    es: 'Modo Mockup'
  },
  adminModeLockedNote: {
    pt: 'Alternador bloqueado; use a prévia temporária de 2 horas neste navegador.',
    en: 'Toggle locked; use the temporary 2-hour preview in this browser.',
    es: 'Alternador bloqueado; usa la vista previa temporal de 2 horas en este navegador.'
  },
  adminPreviewTitle: {
    pt: 'Prévia temporária dos textos legítimos',
    en: 'Temporary legitimate-copy preview',
    es: 'Vista previa temporal de textos legítimos'
  },
  adminPreviewDescription: {
    pt: 'Só troca os textos neste navegador por 2 horas. Depois, volta ao Mockup; os demais usuários não são afetados.',
    en: 'Changes copy only in this browser for 2 hours. It then returns to Mockup; other users are unaffected.',
    es: 'Solo cambia los textos en este navegador por 2 horas. Luego vuelve a Mockup; los demás usuarios no se ven afectados.'
  },
  adminPreviewStart: {
    pt: 'Ver modo legítimo por 2 horas',
    en: 'Preview legitimate copy for 2 hours',
    es: 'Ver modo legítimo durante 2 horas'
  },
  adminPreviewCountdownLabel: {
    pt: 'Modo legítimo ativo neste navegador. Volta ao Mockup em:',
    en: 'Legitimate copy is active in this browser. Returns to Mockup in:',
    es: 'Los textos legítimos están activos en este navegador. Vuelven a Mockup en:'
  },
  adminPreviewStorageError: {
    pt: 'Não foi possível iniciar a prévia: o armazenamento deste navegador está indisponível.',
    en: 'Could not start the preview: this browser’s storage is unavailable.',
    es: 'No se pudo iniciar la vista previa: el almacenamiento de este navegador no está disponible.'
  },
  adminMarceloTitle: {
    pt: 'Conta de produção · Marcelo',
    en: 'Production account · Marcelo',
    es: 'Cuenta de producción · Marcelo'
  },
  adminMarceloDescription: {
    pt: 'Histórico verificado de recompensas, bônus, planos VIP e saques. Saldo confirmado pelo serviço.',
    en: 'Verified history of rewards, bonuses, VIP plans and withdrawals. Balance confirmed by the service.',
    es: 'Historial verificado de recompensas, bonos, planes VIP y retiros. Saldo confirmado por el servicio.'
  },
  adminMarceloAlreadyCreated: {
    pt: 'Conta de produção já criada',
    en: 'Production account already created',
    es: 'Cuenta de producción ya creada'
  },
  adminMarceloCreate: {
    pt: 'Criar conta de produção',
    en: 'Create production account',
    es: 'Crear cuenta de producción'
  },
  adminRandomTitle: {
    pt: 'Novo membro',
    en: 'New member',
    es: 'Nuevo miembro'
  },
  adminRandomDescription: {
    pt: 'Cria uma conta com dados e histórico registrados pelo serviço.',
    en: 'Creates an account with data and history recorded by the service.',
    es: 'Crea una cuenta con datos e historial registrados por el servicio.'
  },
  adminRandomCreate: {
    pt: 'Criar membro',
    en: 'Create member',
    es: 'Crear miembro'
  },
  adminRandomPrompt: {
    pt: 'Criar um novo membro com dados registrados pelo serviço?',
    en: 'Create a new member with data recorded by the service?',
    es: '¿Crear un nuevo miembro con datos registrados por el servicio?'
  },
  adminRandomCreated: {
    pt: 'Membro criado. Guarde as credenciais exibidas apenas nesta sessão.',
    en: 'Member created. Save the credentials shown during this session.',
    es: 'Miembro creado. Guarda las credenciales mostradas durante esta sesión.'
  },
  adminMarceloPrompt: {
    pt: 'Criar a conta Marcelo? Uma conta existente não será modificada.',
    en: 'Create the Marcelo account? An existing account will not be changed.',
    es: '¿Crear la cuenta de Marcelo? No se modificará una cuenta existente.'
  },
  adminMarceloCreated: {
    pt: 'Conta Marcelo criada. Guarde as credenciais exibidas apenas nesta sessão.',
    en: 'Marcelo account created. Save the credentials shown during this session.',
    es: 'Cuenta de Marcelo creada. Guarda las credenciales mostradas durante esta sesión.'
  },
  adminInternalBalanceLabel: {
    pt: 'Saldo:',
    en: 'Balance:',
    es: 'Saldo:'
  },
  adminInternalSatoshisLabel: {
    pt: 'satoshis:',
    en: 'satoshis:',
    es: 'satoshis:'
  },
  adminMissingPaymentRef: {
    pt: 'Referência de pagamento indisponível',
    en: 'Payment reference unavailable',
    es: 'Referencia de pago no disponible'
  },
  adminApprovedWithdrawal: {
    pt: 'Aprovada e enviada em BTC',
    en: 'Approved and sent in BTC',
    es: 'Aprobada y enviada en BTC'
  },
  adminWithdrawalEquivalent: {
    pt: 'valor BTC confirmado',
    en: 'confirmed BTC amount',
    es: 'importe BTC confirmado'
  },
  adminAcceptWithdrawal: {
    pt: 'Aceitar saque após conferência do pagamento',
    en: 'Accept withdrawal after payment review',
    es: 'Aceptar retiro tras revisar el pago'
  },
  adminReviewPrompt: {
    pt: 'Registrar a conferência do pagamento e continuar?',
    en: 'Record payment verification and continue?',
    es: '¿Registrar la verificación del pago y continuar?'
  },
  adminManualPlanNotice: {
    pt: 'Plano atribuído manualmente; pagamentos permanecem vinculados aos registros do serviço.',
    en: 'Plan assigned manually; payments remain tied to service records.',
    es: 'Plan asignado manualmente; los pagos siguen vinculados a los registros del servicio.'
  },
  adminApprovePrompt: {
    pt: 'Confirmar a aprovação após verificar o pagamento BTC na blockchain?',
    en: 'Confirm approval after verifying the BTC payment on the blockchain?',
    es: '¿Confirmar la aprobación tras verificar el pago BTC en la blockchain?'
  },
  adminApproveButton: {
    pt: 'Confirmar pagamento e ativar VIP',
    en: 'Confirm payment and activate VIP',
    es: 'Confirmar pago y activar VIP'
  },
  adminInvestorTitle: {
    pt: 'Novos investidores · atividade em tempo real',
    en: 'New investors · live activity',
    es: 'Nuevos inversores · actividad en tiempo real'
  },
  adminInvestorDescription: {
    pt: 'Exibe eventos de cadastro reais registrados pelo serviço.',
    en: 'Displays real signup events recorded by the service.',
    es: 'Muestra registros reales de altas registrados por el servicio.'
  },
  adminInvestorAria: {
    pt: 'Ativar notificações de novos investidores',
    en: 'Enable new investor notifications',
    es: 'Activar avisos de nuevos inversores'
  },
  adminInvestorEnabled: {
    pt: 'Ativado',
    en: 'Enabled',
    es: 'Activado'
  },
  adminInvestorDisabled: {
    pt: 'Desativado',
    en: 'Disabled',
    es: 'Desactivado'
  },
  adminInvestorPlacement: {
    pt: 'Exibido no painel de membros',
    en: 'Shown in the member workspace',
    es: 'Visible en el panel de miembros'
  },
  adminPaymentNotice: {
    pt: 'Cotações e pagamentos são verificados por integrações ativas; confirmações de blockchain e e-mail são registradas pelo serviço.',
    en: 'Quotes and payments are checked by active integrations; blockchain and email confirmations are recorded by the service.',
    es: 'Las cotizaciones y los pagos se verifican mediante integraciones activas; el servicio registra las confirmaciones de blockchain y correo.'
  },
  adminOverviewNotice: {
    pt: 'Contagens e pagamentos confirmados pelo serviço conectado.',
    en: 'Counts and payments confirmed by the connected service.',
    es: 'Recuentos y pagos confirmados por el servicio conectado.'
  },
  adminDailyUsdLabel: {
    pt: 'Recompensa diária de mineração (USD)',
    en: 'Daily mining reward (USD)',
    es: 'Recompensa diaria de minería (USD)'
  },
  adminDailySatoshisLabel: {
    pt: 'Bônus diário em satoshis BTC',
    en: 'Daily bonus in BTC satoshis',
    es: 'Bono diario en satoshis BTC'
  },
  adminIllustrativeCapacityLabel: {
    pt: 'Capacidade de mineração',
    en: 'Mining capacity',
    es: 'Capacidad de minería'
  },
  adminIllustrativeEquipmentLabel: {
    pt: 'Equipamento de mineração',
    en: 'Mining equipment',
    es: 'Equipo de minería'
  },
  adminRecordsBalanceLabel: {
    pt: 'Saldo verificado (USD e BTC)',
    en: 'Verified balance (USD and BTC)',
    es: 'Saldo verificado (USD y BTC)'
  },
  adminRecordSatoshisLabel: {
    pt: 'Satoshis BTC confirmados',
    en: 'Confirmed BTC satoshis',
    es: 'Satoshis BTC confirmados'
  },
  adminRecordUnitsLabel: {
    pt: 'Recompensa de mineração',
    en: 'Mining reward',
    es: 'Recompensa de minería'
  },
  adminRecordUsdUnitsLabel: {
    pt: 'Bônus em USD confirmado',
    en: 'Confirmed USD bonus',
    es: 'Bono USD confirmado'
  },
  adminRecordCreditCentsLabel: {
    pt: 'Valor confirmado (centavos)',
    en: 'Confirmed amount (cents)',
    es: 'Importe confirmado (centavos)'
  },
  adminRecordBtcEquivalent: {
    pt: 'Bitcoin confirmado (satoshis)',
    en: 'Confirmed Bitcoin (satoshis)',
    es: 'Bitcoin confirmado (satoshis)'
  },
  adminBtcNotWalletNotice: {
    pt: 'O Bitcoin confirmado está disponível na carteira vinculada à conta.',
    en: 'Confirmed Bitcoin is available in the wallet linked to the account.',
    es: 'El Bitcoin confirmado está disponible en la billetera vinculada a la cuenta.'
  },
  adminConfirmBalanceChange: {
    pt: 'Confirmar ajuste do saldo? A operação será registrada na auditoria.',
    en: 'Confirm balance adjustment? The action will be logged.',
    es: '¿Confirmar el ajuste del saldo? Se registrará la operación en la auditoría.'
  },
  historyEarnedUnits: {
    pt: 'Bitcoin creditado',
    en: 'Bitcoin credited',
    es: 'Bitcoin acreditado'
  },
  historySatoshis: {
    pt: 'satoshis BTC',
    en: 'BTC satoshis',
    es: 'satoshis BTC'
  },
  historyUsdUnits: {
    pt: 'USD confirmado',
    en: 'confirmed USD',
    es: 'USD confirmado'
  }
} satisfies Record<ProjectCopyKey, Record<LanguageCode, string>>;
