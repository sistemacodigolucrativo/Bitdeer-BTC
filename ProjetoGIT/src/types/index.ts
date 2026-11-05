export type LanguageCode = 'en' | 'es' | 'pt';

export type AppScreen = 
  | 'language'
  | 'onboarding'
  | 'terminal'
  | 'login'
  | 'workspace';

export type WorkspaceTab = 'home' | 'store' | 'reward' | 'wallet' | 'setting';

export type VipTier = 'none' | 'vip01' | 'vip02' | 'vip03' | 'vip04';

export interface UserPreferences {
  language: LanguageCode;
  lastUpdated: string;
  isFirstLaunch: boolean;
  userName?: string;
  userEmail?: string;
  phone?: string;
  walletAddress?: string;
  gender?: string;
  referralCode?: string;
  theme?: 'dark' | 'light';
}

export interface RewardClaimResult {
  success: boolean;
  message?: string;
  rewardId?: string;
  rewardName?: string;
  benefitDescription?: string;
  creditedHashrate?: number;
  creditedSatoshis?: number;
  creditedBtc?: number;
}

export interface MiningSessionRecord {
  id: string;
  sessionNumber: number;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  satoshisMined: number;
  btcAmt: number;
  dateFormatted: string;
}

export interface SubscriptionRecord {
  id: string;
  tierId: string;
  tierName: string; // e.g. "VIP 01", "VIP 02"
  hashRate: string; // e.g. "+ 275 Gh/s"
  serverModel: string;
  purchaseDate: number;
  purchaseDateFormatted: string;
  status: 'active' | 'completed';
  priceFormatted: string;
  transactionId: string;
}

export interface ReferralRecord {
  id: string;
  fullName: string; // Nome e sobrenome do indicado (nunca inclui nome do indicador)
  maskedEmail: string; // E-mail mascarado no backend (ex.: jo***@dominio.com)
  rewardUsd: number; // US$ 1,00 fixo no ato do cadastro
  amountBtc: number; // Valor em BTC convertido e travado pela cotação do momento do cadastro
  btcUsdRateUsed: number; // Cotação BTC/USD utilizada no momento do cadastro
  createdAt: number; // Timestamp (ms) do cadastro
  createdAtFormatted: string; // Data e hora formatadas
}

export interface MiningState {
  isMining: boolean;
  baseHashrate: number; // in Gh/s
  bonusHashrate: number; // in Gh/s
  totalBtc: number; // balance
  referralBtc: number; // Saldo de indicação acumulado em BTC (travado na cotação de cada cadastro)
  referralHistory: ReferralRecord[]; // Lista de indicados com e-mail já mascarado pelo backend
  activeMinersCount: number;
  miningStartTime?: number;
  sessionEndTime?: number; // timestamp when active session expires
  sessionSecondsLeft: number; // remaining seconds (default 1800 for 30min)
  claimedBoosts: string[];
  userVipTier: VipTier; // Active VIP Plan (Anotação 03)
  rewardCooldowns: Record<string, number>; // 24h timestamp tracker for each reward in Reward Zone
  reward1ClaimedAt?: number; // 24h cooldown timestamp for 25.6 Gh/s
  reward2ClaimedAt?: number; // 24h cooldown timestamp for +2h time
  reward3ClaimedAt?: number; // 24h cooldown timestamp for 10.000 satoshis
  // Anotação 03: Histórico de ganhos por sessão
  miningSessions: MiningSessionRecord[];
  currentSessionId: string;
  currentSessionSatoshis: number;
  currentSessionDurationSeconds: number;
  // Anotação 04: Histórico de compras / assinaturas
  subscriptionsHistory: SubscriptionRecord[];
  // Controle de rendimento diário por timestamp e precisão acumulada
  lastAccrualTimestamp?: number;
  accruedUsdUnits?: number;
  accruedMiningUsd?: number;
  pendingUsdUnitsForBtc?: number;
  dailyYieldRuleActivatedAt?: number;
}


