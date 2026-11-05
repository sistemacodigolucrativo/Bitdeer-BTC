/**
 * Módulo de Cálculo Puro — Conversão USD -> BTC e BIP21
 *
 * REGRAS DE NEGÓCIO:
 * 1. amount_btc = price_usd / cotação_BTC_USD_atual
 * 2. Arredondar SEMPRE PARA CIMA (Math.ceil) na 8ª casa decimal (1 satoshi = 10^-8 BTC)
 *    para nunca cobrar a menos do valor em USD.
 * 3. Funções 100% puras, determinísticas e testáveis.
 */

export const SATOSHIS_PER_BTC = 100_000_000;

export interface BtcConversionResult {
  priceUsd: number;
  btcUsdRate: number;
  /** Valor exato em BTC arredondado para cima na 8ª casa decimal (número) */
  amountBtc: number;
  /** String formatada sempre com 8 casas decimais exatas (ex.: "0.00025000") */
  amountBtcFormatted: string;
  /** Quantidade inteira em satoshis (sempre arredondada para cima) */
  satoshis: number;
}

/**
 * Converte um valor em USD para BTC e Satoshis arredondando sempre para cima (ceil) no satoshi.
 *
 * Nota técnica sobre ponto flutuante:
 * Para evitar que divisões exatas em IEEE-754 gerem ex.: 20000.000000000004 satoshis
 * e subam 1 satoshi indevidamente, aplicamos uma tolerância de precisão de 1e-9 antes do Math.ceil.
 */
export function calculateUsdToBtc(priceUsd: number, btcUsdRate: number): BtcConversionResult {
  if (typeof priceUsd !== 'number' || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('Preço em USD inválido. Deve ser um número maior que zero.');
  }
  if (typeof btcUsdRate !== 'number' || !Number.isFinite(btcUsdRate) || btcUsdRate <= 0) {
    throw new Error('Cotação BTC/USD inválida. Deve ser um número maior que zero.');
  }

  const rawSatoshis = (priceUsd * SATOSHIS_PER_BTC) / btcUsdRate;
  // Subtrai 1e-9 apenas para evitar artefato binário quando a divisão já é inteira exata
  const satoshis = Math.ceil(rawSatoshis - 1e-9);
  const amountBtc = satoshis / SATOSHIS_PER_BTC;
  const amountBtcFormatted = amountBtc.toFixed(8);

  return {
    priceUsd,
    btcUsdRate,
    amountBtc: Number(amountBtcFormatted),
    amountBtcFormatted,
    satoshis,
  };
}

/**
 * Gera URI no padrão BIP21 para carteiras Bitcoin:
 * bitcoin:ENDERECO?amount=VALOR_BTC
 */
export function buildBip21Uri(
  address: string,
  amountBtcFormatted: string,
  label?: string
): string {
  const cleanAddress = (address || '').trim();
  const baseUri = `bitcoin:${cleanAddress}?amount=${amountBtcFormatted}`;
  if (label && label.trim()) {
    return `${baseUri}&label=${encodeURIComponent(label.trim())}`;
  }
  return baseUri;
}

/**
 * Formata valor em satoshis no padrão brasileiro/internacional legível (ex.: "24.890 sats").
 */
export function formatSatoshis(satoshis: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(satoshis));
}

/**
 * Formata valor monetário em USD (ex.: "US$ 80.285,58" ou "US$ 20,00").
 */
export function formatUsdCurrency(amountUsd: number): string {
  return `US$ ${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd)}`;
}
