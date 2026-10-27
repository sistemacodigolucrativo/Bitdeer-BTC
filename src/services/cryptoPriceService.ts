/**
 * Crypto Price Service
 * Implements Anotação nº 04 — Cotação automática do Bitcoin e conversão para dólar
 * - Fetches real-time BTC/USD spot price from public APIs (Coinbase spot price with CoinGecko fallback)
 * - Auto-refreshes periodically
 * - Converts user's mined BTC balance into USD dynamically
 */

export interface BtcPriceState {
  priceUsd: number;
  lastUpdated: number;
  isLoading: boolean;
  isLive: boolean;
  error: boolean;
}

const DEFAULT_FALLBACK_BTC_PRICE = 80285.58; // Default reference from app specifications

class CryptoPriceService {
  private state: BtcPriceState = {
    priceUsd: DEFAULT_FALLBACK_BTC_PRICE,
    lastUpdated: Date.now(),
    isLoading: false,
    isLive: false,
    error: false,
  };

  private listeners: Array<(state: BtcPriceState) => void> = [];
  private fetchIntervalId: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Attempt cached price from localStorage
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('btc_usd_cached_price');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.priceUsd && Date.now() - parsed.lastUpdated < 3600000) {
            this.state.priceUsd = parsed.priceUsd;
            this.state.lastUpdated = parsed.lastUpdated;
          }
        }
      }
    } catch {
      // ignore
    }

    // Trigger initial fetch
    this.fetchPrice();

    // Refresh every 60 seconds
    if (typeof window !== 'undefined') {
      this.fetchIntervalId = window.setInterval(() => {
        this.fetchPrice();
      }, 60000);
    }
  }

  public async fetchPrice(): Promise<number> {
    this.state.isLoading = true;
    this.notify();

    // 1. Try Coinbase Spot API
    try {
      const response = await fetch('https://api.coinbase.com/v2/prices/spot?currency=USD', {
        headers: { Accept: 'application/json' },
        cache: 'no-cache'
      });
      if (response.ok) {
        const json = await response.json();
        const amountStr = json?.data?.amount;
        const parsed = parseFloat(amountStr);
        if (!isNaN(parsed) && parsed > 1000) {
          this.updatePrice(parsed, true);
          return parsed;
        }
      }
    } catch {
      // fallback to next source
    }

    // 2. Try CoinGecko Public API
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
        headers: { Accept: 'application/json' },
        cache: 'no-cache'
      });
      if (response.ok) {
        const json = await response.json();
        const parsed = json?.bitcoin?.usd;
        if (typeof parsed === 'number' && parsed > 1000) {
          this.updatePrice(parsed, true);
          return parsed;
        }
      }
    } catch {
      // fallback to default
    }

    // 3. Keep existing price or default fallback, flagging error/non-live status
    this.state.isLoading = false;
    this.state.isLive = false;
    this.state.error = true;
    this.notify();
    return this.state.priceUsd;
  }

  private updatePrice(price: number, isLive: boolean) {
    this.state = {
      priceUsd: price,
      lastUpdated: Date.now(),
      isLoading: false,
      isLive,
      error: false
    };

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('btc_usd_cached_price', JSON.stringify({
          priceUsd: price,
          lastUpdated: Date.now()
        }));
      }
    } catch {
      // ignore
    }

    this.notify();
  }

  public getState(): BtcPriceState {
    return { ...this.state };
  }

  public subscribe(listener: (state: BtcPriceState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.getState()));
  }

  /**
   * Checks if there is a valid positive price available for conversions
   */
  public hasValidQuote(customPrice?: number): boolean {
    const price = customPrice ?? this.state.priceUsd;
    return typeof price === 'number' && !isNaN(price) && isFinite(price) && price > 0;
  }

  /**
   * Calculates USD value from BTC amount
   * Anotação 04: saldo USD = saldo BTC * cotação BTC
   */
  public convertBtcToUsd(btcAmount: number, customPrice?: number): number {
    const price = customPrice ?? this.state.priceUsd;
    if (!this.hasValidQuote(price) || isNaN(btcAmount)) {
      return 0;
    }
    return btcAmount * price;
  }

  /**
   * Converts USD amount into equivalent BTC using the current or provided BTC/USD quote:
   * BTC equivalente = rendimentoUSD / cotacaoBTCUSD
   */
  public convertUsdToBtc(usdAmount: number, customPrice?: number): number {
    const price = customPrice ?? this.state.priceUsd;
    if (!this.hasValidQuote(price) || isNaN(usdAmount) || usdAmount <= 0) {
      return 0;
    }
    return usdAmount / price;
  }

  /**
   * Converts BTC amount into equivalent Satoshis:
   * Satoshis equivalentes = BTC equivalente * 100000000
   */
  public convertBtcToSatoshis(btcAmount: number): number {
    if (isNaN(btcAmount) || btcAmount <= 0) return 0;
    return btcAmount * 100_000_000;
  }

  /**
   * Converts USD amount directly into equivalent Satoshis using the BTC/USD quote
   */
  public convertUsdToSatoshis(usdAmount: number, customPrice?: number): number {
    const btc = this.convertUsdToBtc(usdAmount, customPrice);
    return this.convertBtcToSatoshis(btc);
  }

  /**
   * Formats a USD amount nicely
   * If microscopic (< $0.01 and > 0), provides up to 5 decimals (e.g. $0.00040)
   * If normal (>= $0.01), formats with standard currency format (e.g. $8.03 or $0.00)
   */
  public formatUsd(usdAmount: number): string {
    if (usdAmount === 0 || isNaN(usdAmount)) {
      return '$0.00';
    }
    if (usdAmount < 0.01) {
      if (usdAmount < 0.000001) {
        return '$0.00';
      }
      return `$${usdAmount.toFixed(4)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdAmount);
  }

  public formatBtcPrice(price?: number): string {
    const val = price ?? this.state.priceUsd;
    if (!this.hasValidQuote(val)) {
      return 'Indisponível';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  }
}

export const cryptoPriceService = new CryptoPriceService();
