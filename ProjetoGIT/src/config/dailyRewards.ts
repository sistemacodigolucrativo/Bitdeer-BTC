import { VipTier } from '../types';

export type PlanRewardId = 'FREE' | 'VIP01' | 'VIP02' | 'VIP03' | 'VIP04';

export const SECONDS_PER_DAY = 86_400;

/**
 * Fator de precisão inteira por segundo:
 * 1 USD = 86.400 segundos * 10.000 subunidades = 864.000.000 unidades exatas.
 * Evita erros de ponto flutuante e perdas por arredondamento em acumulações contínuas.
 */
export const USD_PRECISION_FACTOR = 10_000;
export const UNITS_PER_USD = SECONDS_PER_DAY * USD_PRECISION_FACTOR; // 864,000,000

/**
 * Rendimento diário base do Plano Gratuito em dólares (US$ 1,00 / 24h).
 */
export const FREE_DAILY_REWARD_USD = 1.00;

/**
 * Configuração central das recompensas fictícias diárias (em USD por dia) para os 5 planos:
 * - PLANO GRATUITO (FREE): US$ 1,00 por dia
 * - PLANO VIP 01 (VIP01):  US$ 3,00 por dia
 * - PLANO VIP 02 (VIP02):  US$ 6,00 por dia
 * - PLANO VIP 03 (VIP03):  US$ 12,00 por dia
 * - PLANO VIP 04 (VIP04):  US$ 28,00 por dia
 */
export const DAILY_REWARDS: Record<PlanRewardId, number> = {
  FREE: FREE_DAILY_REWARD_USD,
  VIP01: 3.00,
  VIP02: 6.00,
  VIP03: 12.00,
  VIP04: 28.00,
};

/**
 * Converte o identificador de nível do estado (VipTier) para a chave da configuração central.
 */
export function mapTierToPlanId(tier?: VipTier | PlanRewardId | string): PlanRewardId {
  if (!tier) return 'FREE';
  const normalized = tier.toUpperCase().trim();
  if (normalized === 'VIP01' || normalized === 'VIP 01' || normalized === 'VIP1') return 'VIP01';
  if (normalized === 'VIP02' || normalized === 'VIP 02' || normalized === 'VIP2') return 'VIP02';
  if (normalized === 'VIP03' || normalized === 'VIP 03' || normalized === 'VIP3') return 'VIP03';
  if (normalized === 'VIP04' || normalized === 'VIP 04' || normalized === 'VIP4') return 'VIP04';
  return 'FREE';
}

/**
 * Retorna o rendimento diário em USD configurado para o plano informado.
 */
export function getDailyRewardUsd(tier?: VipTier | PlanRewardId | string): number {
  const planId = mapTierToPlanId(tier);
  const configured = DAILY_REWARDS[planId];
  return typeof configured === 'number' && !isNaN(configured) && configured >= 0
    ? configured
    : FREE_DAILY_REWARD_USD;
}

/**
 * Retorna o rendimento por segundo em USD para o plano informado:
 * rendimentoPorSegundo = rendimentoDiarioUSD / 86400
 */
export function getRewardPerSecondUsd(tier?: VipTier | PlanRewardId | string): number {
  return getDailyRewardUsd(tier) / SECONDS_PER_DAY;
}

/**
 * Calcula o rendimento acumulado em USD para um intervalo em segundos:
 * rendimentoAcumuladoUSD = rendimentoDiarioUSD * tempoDecorridoSegundos / 86400
 */
export function calculateAccumulatedUsd(
  elapsedSeconds: number,
  tier?: VipTier | PlanRewardId | string
): number {
  if (elapsedSeconds <= 0) return 0;
  const dailyUsd = getDailyRewardUsd(tier);
  const unitsPerSec = Math.round(dailyUsd * USD_PRECISION_FACTOR);
  const totalUnits = unitsPerSec * elapsedSeconds;
  return totalUnits / UNITS_PER_USD;
}

/**
 * Calcula as unidades inteiras exatas acumuladas em um intervalo em segundos.
 */
export function calculateAccumulatedUnits(
  elapsedSeconds: number,
  tier?: VipTier | PlanRewardId | string
): number {
  if (elapsedSeconds <= 0) return 0;
  const dailyUsd = getDailyRewardUsd(tier);
  const unitsPerSec = Math.round(dailyUsd * USD_PRECISION_FACTOR);
  return unitsPerSec * elapsedSeconds;
}

/**
 * ANOTAÇÃO Nº 01 — Bônus de Recompensa Diária (em USD a cada 24h) por plano:
 * - Plano FREE:   US$ 0,50 a cada 24 horas
 * - Plano VIP 01: US$ 1,00 a cada 24 horas
 * - Plano VIP 02: US$ 1,50 a cada 24 horas
 * - Plano VIP 03: US$ 2,00 a cada 24 horas
 * - Plano VIP 04: US$ 2,50 a cada 24 horas
 */
export const DAILY_BONUS_USD_BY_PLAN: Record<PlanRewardId, number> = {
  FREE: 0.50,
  VIP01: 1.00,
  VIP02: 1.50,
  VIP03: 2.00,
  VIP04: 2.50,
};

export function getDailyBonusUsd(tier?: VipTier | PlanRewardId | string): number {
  const planId = mapTierToPlanId(tier);
  return DAILY_BONUS_USD_BY_PLAN[planId] ?? DAILY_BONUS_USD_BY_PLAN.FREE;
}

/**
 * ANOTAÇÃO Nº 03 — Bônus Diário em Satoshis (a cada 24h) por plano:
 * - Plano FREE:   10.000 satoshis/dia
 * - Plano VIP 01: 20.000 satoshis/dia
 * - Plano VIP 02: 20.000 satoshis/dia
 * - Plano VIP 03: 20.000 satoshis/dia
 * - Plano VIP 04: 20.000 satoshis/dia
 */
export const DAILY_BONUS_SATOSHIS_BY_PLAN: Record<PlanRewardId, number> = {
  FREE: 10_000,
  VIP01: 20_000,
  VIP02: 20_000,
  VIP03: 20_000,
  VIP04: 20_000,
};

export function getDailyBonusSatoshis(tier?: VipTier | PlanRewardId | string): number {
  const planId = mapTierToPlanId(tier);
  return DAILY_BONUS_SATOSHIS_BY_PLAN[planId] ?? DAILY_BONUS_SATOSHIS_BY_PLAN.FREE;
}

