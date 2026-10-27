/**
 * Módulo de Configuração Central — Checkout Bitcoin (BTC)
 *
 * Contém a fonte da verdade dos 4 planos VIP (valores fixos em USD),
 * endereço público de recebimento BTC (Mainnet SegWit nativo),
 * parâmetros de cache/expiração de cotação, endpoints de APIs públicas
 * com CORS habilitado e flag MOCK_MODE=false (Produção).
 *
 * SEGURANÇA: Nunca armazene chaves privadas ou seeds no front-end.
 */

export type CheckoutPlanId = 'VIP_01' | 'VIP_02' | 'VIP_03' | 'VIP_04';

export interface CheckoutPlanConfig {
  id: CheckoutPlanId;
  appVipTier: 'vip01' | 'vip02' | 'vip03' | 'vip04';
  name: string;
  priceUsd: number;
  dailyRewardUsd: number;
  durationDays: number;
  total30DaysUsd: number;
  hashrateDisplay: string;
  serverModel: string;
}

export interface QuoteSourceConfig {
  id: string;
  name: string;
  url: string;
}

export const CHECKOUT_CONFIG = {
  /**
   * Modo de produção ativo (MOCK_MODE desativado).
   */
  MOCK_MODE: false,

  /**
   * Endereço BTC de recebimento oficial (Mainnet, SegWit nativo Bech32).
   */
  BTC_ADDRESS: 'bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z',

  /**
   * Tempo de cache da cotação em memória (45 segundos — entre 30 e 60s).
   */
  QUOTE_CACHE_TTL_MS: 45_000,

  /**
   * Tempo de trava (lock) da cotação ao abrir o checkout (15 minutos = 900 segundos).
   */
  QUOTE_LOCK_DURATION_SECONDS: 900,

  /**
   * Fontes públicas de cotação BTC/USD com CORS habilitado (em ordem de prioridade/fallback).
   */
  QUOTE_SOURCES: [
    {
      id: 'coinbase',
      name: 'Coinbase Spot',
      url: 'https://api.coinbase.com/v2/prices/spot?currency=USD',
    },
    {
      id: 'coingecko',
      name: 'CoinGecko Simple Price',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    },
    {
      id: 'binance',
      name: 'Binance Ticker',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
    },
    {
      id: 'mempool',
      name: 'Mempool.space Prices',
      url: 'https://mempool.space/api/v1/prices',
    },
  ] as QuoteSourceConfig[],

  /**
   * Fonte da verdade dos 4 planos VIP (valores fixos em USD).
   */
  PLANS: {
    VIP_01: {
      id: 'VIP_01',
      appVipTier: 'vip01',
      name: 'VIP 01',
      priceUsd: 20,
      dailyRewardUsd: 3,
      durationDays: 30,
      total30DaysUsd: 90,
      hashrateDisplay: '+ 275 Gh/s',
      serverModel: 'Antminer S19 Pro (VIP 01)',
    },
    VIP_02: {
      id: 'VIP_02',
      appVipTier: 'vip02',
      name: 'VIP 02',
      priceUsd: 40,
      dailyRewardUsd: 6,
      durationDays: 30,
      total30DaysUsd: 180,
      hashrateDisplay: '+ 575 Gh/s',
      serverModel: 'Antminer S19 XP (VIP 02)',
    },
    VIP_03: {
      id: 'VIP_03',
      appVipTier: 'vip03',
      name: 'VIP 03',
      priceUsd: 60,
      dailyRewardUsd: 12,
      durationDays: 30,
      total30DaysUsd: 360,
      hashrateDisplay: '+ 975 Gh/s',
      serverModel: 'WhatsMiner M50S+ (VIP 03)',
    },
    VIP_04: {
      id: 'VIP_04',
      appVipTier: 'vip04',
      name: 'VIP 04',
      priceUsd: 80,
      dailyRewardUsd: 28,
      durationDays: 30,
      total30DaysUsd: 840,
      hashrateDisplay: '+ 5.4 Th/s',
      serverModel: 'Bitmain Hydro Cluster (VIP 04 • 5.4 Th/s)',
    },
  } as Record<CheckoutPlanId, CheckoutPlanConfig>,
};

export const CHECKOUT_PLANS_LIST: CheckoutPlanConfig[] = [
  CHECKOUT_CONFIG.PLANS.VIP_01,
  CHECKOUT_CONFIG.PLANS.VIP_02,
  CHECKOUT_CONFIG.PLANS.VIP_03,
  CHECKOUT_CONFIG.PLANS.VIP_04,
];

/**
 * Retorna o endereço BTC de recebimento configurado em produção.
 */
export function getConfiguredBtcAddress(): string {
  return CHECKOUT_CONFIG.BTC_ADDRESS.trim();
}
