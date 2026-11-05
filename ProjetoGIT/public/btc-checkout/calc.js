/**
 * calc.js — Funções puras e testáveis para conversão USD -> BTC (arredondamento sempre para cima em 8 casas)
 */

export const SATOSHIS_PER_BTC = 100_000_000;

/**
 * Calcula o valor em BTC e em satoshis a partir de um preço fixo em USD e da cotação BTC/USD atual.
 * Arredonda SEMPRE PARA CIMA (Math.ceil) na 8ª casa decimal (satoshi) para nunca cobrar a menos.
 *
 * @param {number} priceUsd Preço do plano em USD (ex.: 20, 40, 60, 80)
 * @param {number} btcUsdRate Cotação atual de 1 BTC em USD (ex.: 85432.10)
 * @returns {{ priceUsd: number, btcUsdRate: number, satoshis: number, amountBtc: number, amountBtcFormatted: string }}
 */
export function calculateUsdToBtc(priceUsd, btcUsdRate) {
  if (typeof priceUsd !== 'number' || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('priceUsd deve ser um número positivo.');
  }
  if (typeof btcUsdRate !== 'number' || !Number.isFinite(btcUsdRate) || btcUsdRate <= 0) {
    throw new Error('btcUsdRate deve ser um número positivo.');
  }

  const rawSatoshis = (priceUsd * SATOSHIS_PER_BTC) / btcUsdRate;
  // Subtrai 1e-9 apenas para evitar artefato de ponto flutuante IEEE-754 em divisões exatas
  const satoshis = Math.ceil(rawSatoshis - 1e-9);
  const amountBtc = satoshis / SATOSHIS_PER_BTC;
  const amountBtcFormatted = amountBtc.toFixed(8);

  return {
    priceUsd,
    btcUsdRate,
    satoshis,
    amountBtc: Number(amountBtcFormatted),
    amountBtcFormatted,
  };
}

/**
 * Monta URI no padrão BIP21: bitcoin:ENDERECO?amount=VALOR_BTC&label=...
 */
export function buildBip21Uri(address, amountBtcFormatted, label) {
  const cleanAddress = (address || '').trim();
  const baseUri = `bitcoin:${cleanAddress}?amount=${amountBtcFormatted}`;
  if (label && label.trim()) {
    return `${baseUri}&label=${encodeURIComponent(label.trim())}`;
  }
  return baseUri;
}
