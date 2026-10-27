import { MiningState, VipTier, RewardClaimResult, MiningSessionRecord, SubscriptionRecord } from '../types';
import {
  UNITS_PER_USD,
  calculateAccumulatedUnits,
  getDailyRewardUsd,
  getDailyBonusUsd,
  getDailyBonusSatoshis,
} from '../config/dailyRewards';
import { cryptoPriceService } from './cryptoPriceService';

const MINING_STORAGE_KEY = 'btc_mining_state_v4';
const DEFAULT_SESSION_SECONDS = 30 * 60; // 30 minutes in seconds
const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const INITIAL_SESSIONS: MiningSessionRecord[] = [
  {
    id: 'sess-02',
    sessionNumber: 2,
    startTime: Date.now() - 3600 * 1000 * 2,
    endTime: Date.now() - 3600 * 1000 * 2 + 1512 * 1000,
    durationSeconds: 1512,
    satoshisMined: 680,
    btcAmt: 0.00000680,
    dateFormatted: '26/10/2026 12:40'
  },
  {
    id: 'sess-01',
    sessionNumber: 1,
    startTime: Date.now() - 3600 * 1000 * 4,
    endTime: Date.now() - 3600 * 1000 * 4 + 1110 * 1000,
    durationSeconds: 1110,
    satoshisMined: 450,
    btcAmt: 0.00000450,
    dateFormatted: '26/10/2026 10:15'
  }
];

const INITIAL_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 'sub-01',
    tierId: 'none',
    tierName: 'FREE',
    hashRate: '5.30 Gh/s',
    serverModel: 'Antminer S19 (Plano Gratuito)',
    purchaseDate: Date.now() - 86400 * 1000 * 2,
    purchaseDateFormatted: '24/10/2026 14:30',
    status: 'active',
    priceFormatted: 'Plano Gratuito (US$ 1,00/dia)',
    transactionId: 'TXN-FREE-INIT-BTC'
  }
];

const INITIAL_MINING_STATE: MiningState = {
  isMining: false,
  baseHashrate: 5.30,
  bonusHashrate: 0,
  totalBtc: 0.000000005000,
  referralBtc: 0.000000000000,
  activeMinersCount: 55161,
  sessionSecondsLeft: DEFAULT_SESSION_SECONDS,
  claimedBoosts: [],
  userVipTier: 'none', // Usuário inicia no Plano Gratuito (US$ 1,00/dia)
  rewardCooldowns: {},
  miningSessions: INITIAL_SESSIONS,
  currentSessionId: 'sess-' + Date.now(),
  currentSessionSatoshis: 0,
  currentSessionDurationSeconds: 0,
  subscriptionsHistory: INITIAL_SUBSCRIPTIONS,
  lastAccrualTimestamp: undefined,
  accruedUsdUnits: 0,
  accruedMiningUsd: 0,
  pendingUsdUnitsForBtc: 0,
  dailyYieldRuleActivatedAt: Date.now()
};

export class MiningService {
  private state: MiningState = { ...INITIAL_MINING_STATE };
  private intervalTimer: number | null = null;
  private listeners: Array<(state: MiningState) => void> = [];

  constructor() {
    this.loadState();
    this.initAppSession();
    this.reconcileSessionOnLoad();
    this.startGlobalTick();
    this.bindWindowEvents();
  }

  private loadState() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MINING_STORAGE_KEY) || localStorage.getItem('btc_mining_state_v3');
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          const hasMigrationTimestamp = typeof parsed.dailyYieldRuleActivatedAt === 'number';

          // Se o estado salvo tinha apenas a cortesia inicial antiga (TXN-8392104-BTC), ajusta para iniciar no Plano Gratuito
          const hadOnlyLegacyCourtesy =
            Array.isArray(parsed.subscriptionsHistory) &&
            parsed.subscriptionsHistory.length === 1 &&
            parsed.subscriptionsHistory[0]?.transactionId === 'TXN-8392104-BTC';

          const resolvedVipTier: VipTier = hadOnlyLegacyCourtesy
            ? 'none'
            : (parsed.userVipTier ?? 'none');

          const resolvedSubscriptions: SubscriptionRecord[] = hadOnlyLegacyCourtesy
            ? INITIAL_SUBSCRIPTIONS
            : (parsed.subscriptionsHistory?.length ? parsed.subscriptionsHistory : INITIAL_SUBSCRIPTIONS);

          // Se havia sessão ativa sem lastAccrualTimestamp (estado legado), infere o último instante salvo
          let inferredLastAccrual = parsed.lastAccrualTimestamp;
          if (
            parsed.isMining &&
            typeof parsed.sessionEndTime === 'number' &&
            typeof inferredLastAccrual !== 'number'
          ) {
            const remSec = typeof parsed.sessionSecondsLeft === 'number' ? parsed.sessionSecondsLeft : 0;
            inferredLastAccrual = parsed.sessionEndTime - (remSec * 1000);
          }

          const accruedUsdUnits = typeof parsed.accruedUsdUnits === 'number' ? parsed.accruedUsdUnits : 0;

          this.state = {
            ...INITIAL_MINING_STATE,
            ...parsed,
            userVipTier: resolvedVipTier,
            rewardCooldowns: parsed.rewardCooldowns || {},
            miningSessions: parsed.miningSessions?.length ? parsed.miningSessions : INITIAL_SESSIONS,
            subscriptionsHistory: resolvedSubscriptions,
            referralBtc: parsed.referralBtc ?? 0.000000000000,
            lastAccrualTimestamp: inferredLastAccrual,
            accruedUsdUnits,
            accruedMiningUsd: accruedUsdUnits / UNITS_PER_USD,
            pendingUsdUnitsForBtc: typeof parsed.pendingUsdUnitsForBtc === 'number' ? parsed.pendingUsdUnitsForBtc : 0,
            dailyYieldRuleActivatedAt: hasMigrationTimestamp ? parsed.dailyYieldRuleActivatedAt : now
          };
        }
      }
    } catch {
      this.state = { ...INITIAL_MINING_STATE, dailyYieldRuleActivatedAt: Date.now() };
    }
  }

  /**
   * Identifies when user re-enters the app and starts a distinct session (Anotação 03)
   */
  private initAppSession() {
    if (typeof window === 'undefined') return;
    try {
      const activeAppSession = sessionStorage.getItem('btc_active_session_flag');
      if (!activeAppSession) {
        // New app launch or revisit: archive any previous open session if it had progress
        if (this.state.currentSessionSatoshis > 0 || this.state.currentSessionDurationSeconds > 30) {
          this.archiveCurrentSession();
        }
        // Start new session
        const newSessionId = 'sess-' + Date.now();
        sessionStorage.setItem('btc_active_session_flag', newSessionId);
        this.state.currentSessionId = newSessionId;
        this.state.currentSessionSatoshis = 0;
        this.state.currentSessionDurationSeconds = 0;
        this.saveState();
      }
    } catch {
      // ignore
    }
  }

  private bindWindowEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeunload', () => {
      this.reconcileMiningProgress(Date.now());
      if (this.state.currentSessionSatoshis > 0) {
        this.archiveCurrentSession();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (this.reconcileMiningProgress(Date.now())) {
          this.saveState();
        }
      }
    });
  }

  public archiveCurrentSession() {
    if (this.state.currentSessionSatoshis <= 0 && this.state.currentSessionDurationSeconds <= 5) {
      return;
    }
    const sessionNum = this.state.miningSessions.length + 1;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    const archived: MiningSessionRecord = {
      id: this.state.currentSessionId || ('sess-' + Date.now()),
      sessionNumber: sessionNum,
      startTime: Date.now() - (this.state.currentSessionDurationSeconds * 1000),
      endTime: Date.now(),
      durationSeconds: this.state.currentSessionDurationSeconds,
      satoshisMined: Math.round(this.state.currentSessionSatoshis),
      btcAmt: parseFloat((this.state.currentSessionSatoshis / 100_000_000).toFixed(8)),
      dateFormatted
    };

    this.state.miningSessions = [archived, ...this.state.miningSessions];
    this.state.currentSessionId = 'sess-' + Date.now();
    this.state.currentSessionSatoshis = 0;
    this.state.currentSessionDurationSeconds = 0;
    this.saveState();
  }

  public saveState() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MINING_STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  /**
   * Converte unidades USD pendentes para BTC e Satoshis caso exista cotação válida no cryptoPriceService.
   */
  private flushPendingUsdToBtc(): boolean {
    const pendingUnits = this.state.pendingUsdUnitsForBtc || 0;
    if (pendingUnits <= 0) return false;

    const priceState = cryptoPriceService.getState();
    if (!cryptoPriceService.hasValidQuote(priceState.priceUsd)) {
      return false;
    }

    const pendingUsd = pendingUnits / UNITS_PER_USD;
    const gainedBtc = cryptoPriceService.convertUsdToBtc(pendingUsd, priceState.priceUsd);
    const gainedSatoshis = cryptoPriceService.convertBtcToSatoshis(gainedBtc);

    this.state.totalBtc = this.state.totalBtc + gainedBtc;
    this.state.currentSessionSatoshis += gainedSatoshis;
    this.state.pendingUsdUnitsForBtc = 0;
    return true;
  }

  /**
   * Motor centralizado de cálculo de rendimento por timestamps:
   * rendimentoPorSegundo = rendimentoDiarioUSD / 86400
   * rendimentoAcumuladoUSD = rendimentoDiarioUSD * tempoDecorridoSegundos / 86400
   */
  public reconcileMiningProgress(now: number = Date.now()): boolean {
    let stateChanged = false;

    if (this.flushPendingUsdToBtc()) {
      stateChanged = true;
    }

    if (!this.state.isMining) {
      return stateChanged;
    }

    // ANOTAÇÃO Nº 02: Planos VIP (VIP 01, 02, 03 e 04) possuem mineração simulada contínua sem limite de 30 minutos
    if (this.hasVipAccess()) {
      const lastTimestamp =
        typeof this.state.lastAccrualTimestamp === 'number'
          ? this.state.lastAccrualTimestamp
          : now;

      const elapsedSeconds = Math.max(0, Math.floor((now - lastTimestamp) / 1000));

      if (elapsedSeconds > 0) {
        const gainedUnits = calculateAccumulatedUnits(elapsedSeconds, this.state.userVipTier);
        this.state.accruedUsdUnits = (this.state.accruedUsdUnits || 0) + gainedUnits;
        this.state.accruedMiningUsd = this.state.accruedUsdUnits / UNITS_PER_USD;
        this.state.pendingUsdUnitsForBtc = (this.state.pendingUsdUnitsForBtc || 0) + gainedUnits;

        this.flushPendingUsdToBtc();

        this.state.currentSessionDurationSeconds += elapsedSeconds;
        this.state.lastAccrualTimestamp = lastTimestamp + (elapsedSeconds * 1000);
        stateChanged = true;
      } else if (typeof this.state.lastAccrualTimestamp !== 'number') {
        this.state.lastAccrualTimestamp = lastTimestamp;
        stateChanged = true;
      }

      if (this.state.sessionEndTime !== undefined) {
        this.state.sessionEndTime = undefined;
        stateChanged = true;
      }

      return stateChanged;
    }

    // PLANO FREE: Preserva o limite de tempo (30 minutos padrão ou 2 horas de bônus)
    if (!this.state.sessionEndTime) {
      if (this.state.sessionSecondsLeft > 0) {
        this.state.lastAccrualTimestamp = now;
        this.state.sessionEndTime = now + (this.state.sessionSecondsLeft * 1000);
        return true;
      } else {
        this.state.isMining = false;
        this.state.lastAccrualTimestamp = undefined;
        return true;
      }
    }

    const lastTimestamp =
      typeof this.state.lastAccrualTimestamp === 'number'
        ? this.state.lastAccrualTimestamp
        : this.state.sessionEndTime - (this.state.sessionSecondsLeft * 1000);

    const effectiveEnd = Math.min(now, this.state.sessionEndTime);
    const elapsedSeconds = Math.max(0, Math.floor((effectiveEnd - lastTimestamp) / 1000));

    if (elapsedSeconds > 0) {
      const gainedUnits = calculateAccumulatedUnits(elapsedSeconds, this.state.userVipTier);
      this.state.accruedUsdUnits = (this.state.accruedUsdUnits || 0) + gainedUnits;
      this.state.accruedMiningUsd = this.state.accruedUsdUnits / UNITS_PER_USD;
      this.state.pendingUsdUnitsForBtc = (this.state.pendingUsdUnitsForBtc || 0) + gainedUnits;

      this.flushPendingUsdToBtc();

      this.state.currentSessionDurationSeconds += elapsedSeconds;
      this.state.lastAccrualTimestamp = lastTimestamp + (elapsedSeconds * 1000);
      stateChanged = true;
    } else if (typeof this.state.lastAccrualTimestamp !== 'number') {
      this.state.lastAccrualTimestamp = lastTimestamp;
      stateChanged = true;
    }

    const refTimestamp = this.state.lastAccrualTimestamp ?? lastTimestamp;
    const secondsRemaining = Math.max(0, Math.floor((this.state.sessionEndTime - refTimestamp) / 1000));

    if (this.state.sessionSecondsLeft !== secondsRemaining) {
      this.state.sessionSecondsLeft = secondsRemaining;
      stateChanged = true;
    }

    if (now >= this.state.sessionEndTime || this.state.sessionSecondsLeft <= 0) {
      this.state.isMining = false;
      this.state.sessionSecondsLeft = 0;
      this.state.sessionEndTime = undefined;
      this.state.lastAccrualTimestamp = undefined;
      stateChanged = true;
    }

    return stateChanged;
  }

  /**
   * Reconciles ongoing session time and mined balance if the app was closed or refreshed
   */
  private reconcileSessionOnLoad() {
    if (this.reconcileMiningProgress(Date.now())) {
      this.saveState();
    }
  }

  private startGlobalTick() {
    if (typeof window === 'undefined') return;
    if (this.intervalTimer) clearInterval(this.intervalTimer);

    this.intervalTimer = window.setInterval(() => {
      if (this.reconcileMiningProgress(Date.now())) {
        this.saveState();
      }
    }, 1000);
  }

  public getState(): MiningState {
    return { ...this.state };
  }

  public getActivePlanDailyRewardUsd(): number {
    return getDailyRewardUsd(this.state.userVipTier);
  }

  public subscribe(listener: (state: MiningState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.getState()));
  }

  public setVipTier(tier: VipTier, now: number = Date.now()) {
    // Finaliza e contabiliza o intervalo anterior na taxa do plano anterior antes de trocar o plano
    this.reconcileMiningProgress(now);
    this.state.userVipTier = tier;

    if (this.state.isMining) {
      if (tier !== 'none') {
        // Planos VIP operam de forma contínua sem expiração de 30 minutos
        this.state.sessionEndTime = undefined;
        this.state.lastAccrualTimestamp = now;
      } else {
        // Ao retornar ao Plano FREE, aplica o cronômetro de sessão
        const seconds = this.state.sessionSecondsLeft > 0 ? this.state.sessionSecondsLeft : DEFAULT_SESSION_SECONDS;
        this.state.sessionSecondsLeft = seconds;
        this.state.lastAccrualTimestamp = now;
        this.state.sessionEndTime = now + (seconds * 1000);
      }
    }

    this.saveState();
  }

  public hasVipAccess(): boolean {
    return this.state.userVipTier !== 'none';
  }

  public startMining(durationSeconds?: number, now: number = Date.now()) {
    if (this.state.isMining) {
      this.reconcileMiningProgress(now);
    }

    this.state.isMining = true;
    this.state.miningStartTime = now;
    this.state.lastAccrualTimestamp = now;

    if (this.hasVipAccess() && typeof durationSeconds !== 'number') {
      // ANOTAÇÃO Nº 02: Mineração contínua para planos VIP
      this.state.sessionEndTime = undefined;
    } else {
      const seconds =
        typeof durationSeconds === 'number' && durationSeconds > 0
          ? durationSeconds
          : this.state.sessionSecondsLeft > 0
          ? this.state.sessionSecondsLeft
          : DEFAULT_SESSION_SECONDS;
      this.state.sessionSecondsLeft = seconds;
      this.state.sessionEndTime = now + (seconds * 1000);
    }

    this.saveState();
  }

  public stopMining(now: number = Date.now()) {
    this.reconcileMiningProgress(now);
    this.state.isMining = false;
    this.state.sessionEndTime = undefined;
    this.state.lastAccrualTimestamp = undefined;
    this.saveState();
  }

  public checkCooldown(lastClaimedAt?: number): { isAvailable: boolean; remainingMs: number; formatted: string } {
    if (!lastClaimedAt) {
      return { isAvailable: true, remainingMs: 0, formatted: '' };
    }
    const elapsed = Date.now() - lastClaimedAt;
    if (elapsed >= COOLDOWN_24H_MS) {
      return { isAvailable: true, remainingMs: 0, formatted: '' };
    }
    const remainingMs = COOLDOWN_24H_MS - elapsed;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return { isAvailable: false, remainingMs, formatted };
  }

  /**
   * Resgate de recompensas na Aba Recompensas (Anotações 01, 02 e 03)
   */
  public claimZoneReward(rewardId: string): RewardClaimResult {
    // Regra 1: Elegibilidade por plano VIP
    if (!this.hasVipAccess()) {
      return {
        success: false,
        message: 'Recompensa exclusiva: requer no mínimo o plano VIP 01 ativo.'
      };
    }

    // Regra 2: Intervalo de 24 horas por recompensa
    const lastClaimed = this.state.rewardCooldowns[rewardId];
    const cooldown = this.checkCooldown(lastClaimed);
    if (!cooldown.isAvailable) {
      return {
        success: false,
        message: `Recompensa em resfriamento. Disponível em ${cooldown.formatted}.`
      };
    }

    // Regra 3 & Anotação 01: Creditar efetivamente o benefício
    let rewardName = '';
    let benefitDescription = '';
    let creditedHashrate = 0;
    let creditedSatoshis = 0;
    let creditedBtc = 0;

    switch (rewardId) {
      case 'speed':
        rewardName = 'Speed Booster';
        creditedHashrate = 15000; // 15 TH/s = 15.000 Gh/s
        this.state.bonusHashrate += creditedHashrate;
        benefitDescription = '+15 TH/s (+15.000 Gh/s) adicionados ao seu poder de mineração!';
        break;

      case 'pro':
        rewardName = 'Pro Booster';
        creditedHashrate = 30000; // 30 TH/s = 30.000 Gh/s
        this.state.bonusHashrate += creditedHashrate;
        benefitDescription = '+30 TH/s (+30.000 Gh/s) adicionados ao seu poder de mineração!';
        break;

      case 'silver':
        rewardName = 'Silver Tier';
        creditedSatoshis = 5000;
        creditedBtc = 0.00005000;
        this.state.totalBtc = this.state.totalBtc + creditedBtc;
        this.state.currentSessionSatoshis += creditedSatoshis;
        benefitDescription = '+5.000 Satoshis (+0.00005000 BTC) creditados no saldo!';
        break;

      case 'gold':
        rewardName = 'Gold Tier';
        creditedSatoshis = 20000;
        creditedBtc = 0.00020000;
        this.state.totalBtc = this.state.totalBtc + creditedBtc;
        this.state.currentSessionSatoshis += creditedSatoshis;
        benefitDescription = '+20.000 Satoshis (+0.00020000 BTC) creditados no saldo!';
        break;

      case 'diamond':
        rewardName = 'Diamond Tier';
        creditedSatoshis = 50000;
        creditedBtc = 0.00050000;
        this.state.totalBtc = this.state.totalBtc + creditedBtc;
        this.state.currentSessionSatoshis += creditedSatoshis;
        benefitDescription = '+50.000 Satoshis (+0.00050000 BTC) creditados no saldo!';
        break;

      case 'jackpot':
        rewardName = 'Jackpot Reward';
        creditedSatoshis = 100000;
        creditedBtc = 0.00100000;
        this.state.totalBtc = this.state.totalBtc + creditedBtc;
        this.state.currentSessionSatoshis += creditedSatoshis;
        benefitDescription = '🔥 Jackpot! +100.000 Satoshis (+0.00100000 BTC) creditados no saldo!';
        break;

      default:
        return { success: false, message: 'Recompensa desconhecida.' };
    }

    // Registra horário de resgate para o intervalo de 24h
    this.state.rewardCooldowns[rewardId] = Date.now();
    this.saveState();

    return {
      success: true,
      rewardId,
      rewardName,
      benefitDescription,
      creditedHashrate,
      creditedSatoshis,
      creditedBtc
    };
  }

  // Home Tab Daily Rewards (Anotação Nº 01: Recompensa diária por plano)
  public claimReward1_Hashrate(): { success: boolean; message?: string; bonusUsd?: number } {
    const { isAvailable } = this.checkCooldown(this.state.reward1ClaimedAt);
    if (!isAvailable) {
      return { success: false, message: 'Recompensa disponível apenas a cada 24 horas.' };
    }
    const bonusUsd = getDailyBonusUsd(this.state.userVipTier);
    const bonusUnits = Math.round(bonusUsd * UNITS_PER_USD);
    this.state.accruedUsdUnits = (this.state.accruedUsdUnits || 0) + bonusUnits;
    this.state.accruedMiningUsd = this.state.accruedUsdUnits / UNITS_PER_USD;
    this.state.pendingUsdUnitsForBtc = (this.state.pendingUsdUnitsForBtc || 0) + bonusUnits;
    this.flushPendingUsdToBtc();

    this.state.reward1ClaimedAt = Date.now();
    this.saveState();
    return { success: true, bonusUsd };
  }

  public claimReward2_Time(now: number = Date.now()): { success: boolean; message?: string } {
    const { isAvailable } = this.checkCooldown(this.state.reward2ClaimedAt);
    if (!isAvailable) {
      return { success: false, message: 'Recompensa disponível apenas a cada 24 horas.' };
    }
    this.reconcileMiningProgress(now);
    const twoHoursSeconds = 2 * 60 * 60; // 7200 seconds (2 horas)
    this.state.sessionSecondsLeft = twoHoursSeconds;
    this.state.isMining = true;
    this.state.miningStartTime = now;
    this.state.lastAccrualTimestamp = now;
    this.state.sessionEndTime = this.hasVipAccess() ? undefined : now + (twoHoursSeconds * 1000);
    this.state.reward2ClaimedAt = now;
    this.saveState();
    return { success: true };
  }

  // ANOTAÇÃO Nº 03: Bônus diário em satoshis por plano (FREE = 10.000, VIP 01..04 = 20.000)
  public claimReward3_Satoshis(): { success: boolean; message?: string; amountBtc?: number; satoshis?: number } {
    const { isAvailable } = this.checkCooldown(this.state.reward3ClaimedAt);
    if (!isAvailable) {
      return { success: false, message: 'Recompensa disponível apenas a cada 24 horas.' };
    }
    const satoshis = getDailyBonusSatoshis(this.state.userVipTier);
    const satoshisToBtc = satoshis / 100_000_000;
    this.state.totalBtc = this.state.totalBtc + satoshisToBtc;
    this.state.currentSessionSatoshis += satoshis;
    this.state.reward3ClaimedAt = Date.now();
    this.saveState();
    return { success: true, amountBtc: satoshisToBtc, satoshis };
  }

  public addBoost(id: string, ghRate: number) {
    if (!this.state.claimedBoosts.includes(id)) {
      this.state.claimedBoosts.push(id);
      this.state.bonusHashrate += ghRate;
      this.saveState();
    }
  }

  /**
   * Anotação 04: Registra a compra real de assinatura ou plano
   */
  public recordSubscriptionPurchase(plan: {
    id: string;
    name: string;
    boostDisplay: string;
    serverModel: string;
    priceFormatted?: string;
  }, nowTs: number = Date.now()) {
    // Contabiliza o intervalo anterior com a taxa do plano anterior antes da mudança
    this.reconcileMiningProgress(nowTs);

    const now = new Date(nowTs);
    const dateFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    
    const newRecord: SubscriptionRecord = {
      id: `sub-${nowTs}`,
      tierId: plan.id,
      tierName: plan.name,
      hashRate: plan.boostDisplay,
      serverModel: plan.serverModel,
      purchaseDate: nowTs,
      purchaseDateFormatted: dateFormatted,
      status: 'active',
      priceFormatted: plan.priceFormatted || 'Assinatura Ativada',
      transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}-BTC`
    };

    // Mark previous subscriptions as completed/upgraded if any
    this.state.subscriptionsHistory = [
      newRecord,
      ...this.state.subscriptionsHistory.map(s => ({ ...s, status: 'completed' as const }))
    ];
    this.setVipTier(plan.id as VipTier, nowTs);
  }

  public resetAll() {
    this.stopMining();
    this.state = {
      ...INITIAL_MINING_STATE,
      dailyYieldRuleActivatedAt: Date.now()
    };
    this.saveState();
  }
}

export const miningService = new MiningService();
