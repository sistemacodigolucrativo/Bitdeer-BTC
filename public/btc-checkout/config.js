/**
 * config.js — Fonte única da verdade (Planos, Endereço BTC de Produção, Expiração, Fontes de Cotação e MOCK_MODE=false)
 * SEGURANÇA: Apenas endereço público de recebimento. NUNCA inclua chaves privadas no front-end.
 */
export const CONFIG = {
  MOCK_MODE: false,

  // Endereço BTC de recebimento oficial (Mainnet, SegWit nativo Bech32)
  BTC_ADDRESS: 'bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z',

  // Cache em memória da cotação (45 segundos — entre 30 e 60s)
  QUOTE_CACHE_TTL_MS: 45_000,

  // Trava da cotação no checkout: 15 minutos (900 segundos)
  QUOTE_LOCK_SECONDS: 900,

  // Fontes públicas de cotação BTC/USD com CORS habilitado (ordem de fallback)
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
  ],

  // Planos fixos em USD (fonte da verdade)
  PLANS: [
    {
      id: 'VIP_01',
      name: 'VIP 01',
      priceUsd: 20,
      dailyUsd: 3,
      durationDays: 30,
      total30DaysUsd: 90,
    },
    {
      id: 'VIP_02',
      name: 'VIP 02',
      priceUsd: 40,
      dailyUsd: 6,
      durationDays: 30,
      total30DaysUsd: 180,
    },
    {
      id: 'VIP_03',
      name: 'VIP 03',
      priceUsd: 60,
      dailyUsd: 12,
      durationDays: 30,
      total30DaysUsd: 360,
    },
    {
      id: 'VIP_04',
      name: 'VIP 04',
      priceUsd: 80,
      dailyUsd: 28,
      durationDays: 30,
      total30DaysUsd: 840,
    },
  ],
};

export function getReceivingAddress() {
  return (CONFIG.BTC_ADDRESS || '').trim();
}
