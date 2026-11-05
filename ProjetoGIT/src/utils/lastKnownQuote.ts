// Public BTC/USD price cache for display only. Never authorize withdrawals from it:
// transactions must use fresh, server-verified quotes.
export type LastKnownQuote = {
  rate: number;
  source: string;
  quotedAt: number;
  savedAt: number;
};

export const LAST_KNOWN_BTC_QUOTE_KEY = 'bitdeer_btc_usd_last_quote_v1';

export function readLastKnownQuote(): LastKnownQuote | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LAST_KNOWN_BTC_QUOTE_KEY);
    if (!raw) return null;
    const quote: LastKnownQuote = JSON.parse(raw);
    if (!Number.isFinite(quote.rate) || quote.rate <= 0 ||
        !Number.isFinite(quote.quotedAt) || quote.quotedAt <= 0 ||
        quote.quotedAt > Date.now() / 1000 + 60 ||
        typeof quote.source !== 'string' ||
        !Number.isFinite(quote.savedAt)) return null;
    return quote;
  } catch {
    return null; // Storage may be disabled in mobile WebViews.
  }
}

export function saveLastKnownQuote(rate: number, source: string, quotedAt: number): void {
  if (!Number.isFinite(rate) || rate <= 0 ||
      !Number.isFinite(quotedAt) || quotedAt <= 0 ||
      quotedAt > Date.now() / 1000 + 60) return;
  try {
    window.localStorage.setItem(LAST_KNOWN_BTC_QUOTE_KEY,
      JSON.stringify({rate,source,quotedAt,savedAt:Date.now() / 1000} satisfies LastKnownQuote));
  } catch {
    // A new live quote remains usable even if storage is unavailable.
  }
}
