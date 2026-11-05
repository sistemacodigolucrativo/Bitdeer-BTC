/**
 * Módulo de Gerenciamento de Pedidos do Checkout Bitcoin (BTC)
 *
 * Gerencia o ciclo de vida do pedido de checkout: AGUARDANDO -> EXPIRADO
 * (Sem ativação simulada ou confirmação fictícia no front-end).
 */

import { CHECKOUT_CONFIG, CheckoutPlanConfig, CheckoutPlanId } from './config';

export type OrderStatus = 'AGUARDANDO' | 'EXPIRADO';

export interface CheckoutOrder {
  orderId: string;
  planId: CheckoutPlanId;
  planName: string;
  priceUsd: number;
  dailyRewardUsd: number;
  durationDays: number;
  total30DaysUsd: number;
  amountBtc: number;
  amountBtcFormatted: string;
  satoshis: number;
  btcUsdRate: number;
  quoteSource: string;
  btcAddress: string;
  bip21Uri: string;
  status: OrderStatus;
  createdAt: number;
  quoteExpiresAt: number;
}

/**
 * Cria um novo pedido em estado AGUARDANDO com trava de cotação de 15 minutos.
 */
export function createCheckoutOrder(params: {
  plan: CheckoutPlanConfig;
  amountBtc: number;
  amountBtcFormatted: string;
  satoshis: number;
  btcUsdRate: number;
  quoteSource: string;
  btcAddress: string;
  bip21Uri: string;
}): CheckoutOrder {
  const now = Date.now();
  return {
    orderId: `ORD-${now.toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    planId: params.plan.id,
    planName: params.plan.name,
    priceUsd: params.plan.priceUsd,
    dailyRewardUsd: params.plan.dailyRewardUsd,
    durationDays: params.plan.durationDays,
    total30DaysUsd: params.plan.total30DaysUsd,
    amountBtc: params.amountBtc,
    amountBtcFormatted: params.amountBtcFormatted,
    satoshis: params.satoshis,
    btcUsdRate: params.btcUsdRate,
    quoteSource: params.quoteSource,
    btcAddress: params.btcAddress,
    bip21Uri: params.bip21Uri,
    status: 'AGUARDANDO',
    createdAt: now,
    quoteExpiresAt: now + CHECKOUT_CONFIG.QUOTE_LOCK_DURATION_SECONDS * 1000,
  };
}

/**
 * Marca um pedido como EXPIRADO quando a janela de 15 minutos da cotação termina.
 */
export function expireOrder(order: CheckoutOrder): CheckoutOrder {
  return {
    ...order,
    status: 'EXPIRADO',
  };
}
