/**
 * Módulo de Cotação Client-Side (BTC/USD)
 *
 * REQUISITOS:
 * - Busca a cotação BTC/USD via fetch em APIs públicas com CORS habilitado:
 *   1. Coinbase Spot
 *   2. CoinGecko Simple Price
 *   3. Binance Ticker (BTCUSDT)
 *   4. Mempool.space Prices
 * - Fallback automático entre as fontes.
 * - Cache em memória de 45 segundos (configurável entre 30 e 60s) para evitar rate-limit.
 * - Em caso de falha em TODAS as fontes, lança erro explícito (NUNCA usa valor fixo silenciosamente).
 */

import { CHECKOUT_CONFIG } from './config';

export interface BtcQuoteResult {
  rateUsd: number;
  sourceId: string;
  sourceName: string;
  fetchedAt: number;
  fromCache: boolean;
}

interface QuoteMemoryCache {
  data: BtcQuoteResult | null;
  expiresAt: number;
}

const memoryCache: QuoteMemoryCache = {
  data: null,
  expiresAt: 0,
};

/**
 * Extrai e valida o preço em USD do JSON retornado por cada provedor.
 */
function parseProviderQuote(sourceId: string, payload: unknown): number {
  const data = payload as Record<string, any>;
  let price = NaN;

  switch (sourceId) {
    case 'coinbase':
      price = parseFloat(data?.data?.amount);
      break;
    case 'coingecko':
      price = Number(data?.bitcoin?.usd);
      break;
    case 'binance':
      price = parseFloat(data?.price);
      break;
    case 'mempool':
      price = Number(data?.USD);
      break;
    default:
      throw new Error(`Provedor desconhecido: ${sourceId}`);
  }

  if (!Number.isFinite(price) || price <= 1000) {
    throw new Error(`Cotação inválida retornada por ${sourceId}: ${price}`);
  }

  return price;
}

/**
 * Busca cotação em uma única fonte com timeout de 6 segundos.
 */
async function fetchFromSource(
  sourceId: string,
  sourceName: string,
  url: string
): Promise<BtcQuoteResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} em ${sourceName}`);
    }

    const json = await response.json();
    const rateUsd = parseProviderQuote(sourceId, json);

    return {
      rateUsd,
      sourceId,
      sourceName,
      fetchedAt: Date.now(),
      fromCache: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtém a cotação BTC/USD atual:
 * - Retorna do cache em memória se ainda estiver dentro do TTL (45s) e `forceRefresh` for false.
 * - Caso contrário, percorre as fontes configuradas em ordem até obter sucesso.
 * - Se todas falharem, lança um erro detalhado (nunca usa cotação fixa silenciosa).
 */
export async function getBtcUsdQuote(forceRefresh = false): Promise<BtcQuoteResult> {
  const now = Date.now();

  if (!forceRefresh && memoryCache.data && now < memoryCache.expiresAt) {
    return {
      ...memoryCache.data,
      fromCache: true,
    };
  }

  const errors: string[] = [];

  for (const source of CHECKOUT_CONFIG.QUOTE_SOURCES) {
    try {
      const quote = await fetchFromSource(source.id, source.name, source.url);
      memoryCache.data = quote;
      memoryCache.expiresAt = Date.now() + CHECKOUT_CONFIG.QUOTE_CACHE_TTL_MS;
      return quote;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${source.name}: ${msg}`);
    }
  }

  throw new Error(
    `Não foi possível obter a cotação BTC/USD em tempo real. Todas as fontes falharam (${errors.join(' | ')}).`
  );
}

/**
 * Limpa o cache de cotação em memória (útil para testes).
 */
export function clearQuoteCache(): void {
  memoryCache.data = null;
  memoryCache.expiresAt = 0;
}
