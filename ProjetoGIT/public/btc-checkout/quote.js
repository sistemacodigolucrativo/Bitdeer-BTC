/**
 * quote.js — Módulo de Cotação BTC/USD Client-Side com Fallback Automático e Cache em Memória (30-60s)
 */
import { CONFIG } from './config.js';

let memoryCache = {
  quote: null,
  expiresAt: 0,
};

function parseQuoteResponse(sourceId, data) {
  let rate = NaN;
  if (sourceId === 'coinbase') rate = parseFloat(data?.data?.amount);
  else if (sourceId === 'coingecko') rate = Number(data?.bitcoin?.usd);
  else if (sourceId === 'binance') rate = parseFloat(data?.price);
  else if (sourceId === 'mempool') rate = Number(data?.USD);

  if (!Number.isFinite(rate) || rate <= 1000) {
    throw new Error(`Valor inválido (${rate}) em ${sourceId}`);
  }
  return rate;
}

export async function fetchBtcUsdQuote(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && memoryCache.quote && now < memoryCache.expiresAt) {
    return { ...memoryCache.quote, fromCache: true };
  }

  const errors = [];

  for (const source of CONFIG.QUOTE_SOURCES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(source.url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rateUsd = parseQuoteResponse(source.id, json);

      const quoteObj = {
        rateUsd,
        sourceId: source.id,
        sourceName: source.name,
        fetchedAt: Date.now(),
        fromCache: false,
      };
      memoryCache = {
        quote: quoteObj,
        expiresAt: Date.now() + CONFIG.QUOTE_CACHE_TTL_MS,
      };
      return quoteObj;
    } catch (err) {
      errors.push(`${source.name}: ${err.message || err}`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `Falha em todas as fontes de cotação BTC/USD (${errors.join('; ')}).`
  );
}
