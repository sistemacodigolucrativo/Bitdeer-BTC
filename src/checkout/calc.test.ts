/**
 * Teste Automatizado das Funções Puras de Cálculo USD -> BTC (src/checkout/calc.ts)
 * e Configuração de Produção (src/checkout/config.ts)
 */
import { calculateUsdToBtc, buildBip21Uri } from './calc';
import { CHECKOUT_CONFIG, getConfiguredBtcAddress } from './config';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`[FALHA] ${label}: esperado=${expected}, obtido=${actual}`);
  }
}

export function runCalcUnitTests() {
  console.log('=== Executando Testes Unitários de Produção (Checkout BTC) ===');

  // 0. Verifica configuração de produção
  assertEqual(CHECKOUT_CONFIG.MOCK_MODE, false, 'MOCK_MODE deve ser false');
  assertEqual(
    getConfiguredBtcAddress(),
    'bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z',
    'Endereço BTC de recebimento oficial Mainnet SegWit'
  );

  // Caso 1: Cotação exata US$ 100.000,00 -> VIP_01 (US$ 20) = 0.00020000 BTC (20.000 satoshis)
  const c1 = calculateUsdToBtc(CHECKOUT_CONFIG.PLANS.VIP_01.priceUsd, 100_000);
  assertEqual(c1.satoshis, 20_000, 'VIP_01 @ $100k sats');
  assertEqual(c1.amountBtcFormatted, '0.00020000', 'VIP_01 @ $100k BTC formatado');

  // Caso 2: Cotação US$ 80.000,00 para os 4 planos
  const v1 = calculateUsdToBtc(20, 80_000);
  assertEqual(v1.satoshis, 25_000, 'VIP_01 ($20) @ $80k');
  assertEqual(v1.amountBtcFormatted, '0.00025000', 'VIP_01 ($20) @ $80k formatado');

  const v2 = calculateUsdToBtc(40, 80_000);
  assertEqual(v2.satoshis, 50_000, 'VIP_02 ($40) @ $80k');
  assertEqual(v2.amountBtcFormatted, '0.00050000', 'VIP_02 ($40) @ $80k formatado');

  const v3 = calculateUsdToBtc(60, 80_000);
  assertEqual(v3.satoshis, 75_000, 'VIP_03 ($60) @ $80k');
  assertEqual(v3.amountBtcFormatted, '0.00075000', 'VIP_03 ($60) @ $80k formatado');

  const v4 = calculateUsdToBtc(80, 80_000);
  assertEqual(v4.satoshis, 100_000, 'VIP_04 ($80) @ $80k');
  assertEqual(v4.amountBtcFormatted, '0.00100000', 'VIP_04 ($80) @ $80k formatado');

  // Caso 3: Cotação quebrada US$ 93.457,19 -> Verifica arredondamento SEMPRE PARA CIMA (ceil)
  const c3 = calculateUsdToBtc(20, 93457.19);
  assertEqual(c3.satoshis, 21_401, 'VIP_01 ($20) @ $93.457,19 deve arredondar para cima (21401 sats)');
  assertEqual(c3.amountBtcFormatted, '0.00021401', 'VIP_01 ($20) @ $93.457,19 formatado');
  if (c3.amountBtc * 93457.19 < 20) {
    throw new Error('Arredondamento cobrou menos que o preço em USD!');
  }

  // Caso 4: Padrão BIP21 com endereço de produção Mainnet e label
  const uri = buildBip21Uri(
    getConfiguredBtcAddress(),
    c3.amountBtcFormatted,
    'BitCloud VIP 01'
  );
  assertEqual(
    uri,
    'bitcoin:bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z?amount=0.00021401&label=BitCloud%20VIP%2001',
    'URI BIP21 padrão com endereço de produção'
  );

  console.log('✓ Todos os testes unitários de cálculo USD -> BTC e endereço de produção passaram!');
}

runCalcUnitTests();
