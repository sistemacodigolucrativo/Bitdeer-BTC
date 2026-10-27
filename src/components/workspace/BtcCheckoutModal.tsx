import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  CHECKOUT_CONFIG,
  CheckoutPlanConfig,
  CheckoutPlanId,
  getConfiguredBtcAddress,
} from '../../checkout/config';
import {
  calculateUsdToBtc,
  buildBip21Uri,
  formatSatoshis,
  formatUsdCurrency,
  BtcConversionResult,
} from '../../checkout/calc';
import { getBtcUsdQuote, BtcQuoteResult } from '../../checkout/quote';
import {
  CheckoutOrder,
  OrderStatus,
  createCheckoutOrder,
  expireOrder,
} from '../../checkout/mock';

interface BtcCheckoutModalProps {
  initialPlanId?: CheckoutPlanId;
  onClose: () => void;
  onPlanActivated?: (plan: CheckoutPlanConfig) => void;
}

export const BtcCheckoutModal: React.FC<BtcCheckoutModalProps> = ({
  initialPlanId = 'VIP_01',
  onClose,
}) => {
  const selectedPlan = CHECKOUT_CONFIG.PLANS[initialPlanId] || CHECKOUT_CONFIG.PLANS.VIP_01;

  // Estados de cotação e conversão
  const [quote, setQuote] = useState<BtcQuoteResult | null>(null);
  const [conversion, setConversion] = useState<BtcConversionResult | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Estado do pedido e contador regressivo de 15 minutos
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    CHECKOUT_CONFIG.QUOTE_LOCK_DURATION_SECONDS
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Estados de cópia
  const [copiedField, setCopiedField] = useState<'address' | 'btc' | 'bip21' | null>(null);

  const lockDeadlineRef = useRef<number>(
    Date.now() + CHECKOUT_CONFIG.QUOTE_LOCK_DURATION_SECONDS * 1000
  );

  /**
   * Busca cotação BTC/USD nas APIs públicas (com cache de 45s ou forçada)
   * e recalcula o valor em BTC/satoshis para o plano selecionado.
   */
  const loadQuoteAndBuildOrder = useCallback(
    async (plan: CheckoutPlanConfig, forceRefresh = false) => {
      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const fetchedQuote = await getBtcUsdQuote(forceRefresh);
        const calc = calculateUsdToBtc(plan.priceUsd, fetchedQuote.rateUsd);
        const btcAddress = getConfiguredBtcAddress();
        const bip21Uri = buildBip21Uri(
          btcAddress,
          calc.amountBtcFormatted,
          `BitCloud ${plan.name}`
        );

        const newOrder = createCheckoutOrder({
          plan,
          amountBtc: calc.amountBtc,
          amountBtcFormatted: calc.amountBtcFormatted,
          satoshis: calc.satoshis,
          btcUsdRate: fetchedQuote.rateUsd,
          quoteSource: fetchedQuote.sourceName,
          btcAddress,
          bip21Uri,
        });

        lockDeadlineRef.current = newOrder.quoteExpiresAt;
        setRemainingSeconds(CHECKOUT_CONFIG.QUOTE_LOCK_DURATION_SECONDS);
        setQuote(fetchedQuote);
        setConversion(calc);
        setOrder(newOrder);

        // Gera QR Code client-side a partir da URI BIP21
        const qrUrl = await QRCode.toDataURL(bip21Uri, {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(qrUrl);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Erro ao consultar APIs de cotação BTC/USD.';
        setQuoteError(msg);
        setQuote(null);
        setConversion(null);
      } finally {
        setIsLoadingQuote(false);
      }
    },
    []
  );

  // Carrega cotação ao abrir o checkout para o plano já selecionado
  useEffect(() => {
    loadQuoteAndBuildOrder(selectedPlan, false);
  }, [selectedPlan, loadQuoteAndBuildOrder]);

  // Contador regressivo de 15 minutos da trava de cotação
  useEffect(() => {
    if (!order || isLoadingQuote || quoteError) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.ceil((lockDeadlineRef.current - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        // Marca pedido anterior como EXPIRADO e rebusca cotação automaticamente
        const expired = expireOrder(order);
        setOrder(expired);
        loadQuoteAndBuildOrder(selectedPlan, true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order, isLoadingQuote, quoteError, selectedPlan, loadQuoteAndBuildOrder]);

  // Copiar texto para a área de transferência
  const handleCopy = async (text: string, field: 'address' | 'btc' | 'bip21') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const formatCountdown = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderStatusBadge = (status: OrderStatus) => {
    if (status === 'EXPIRADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black tracking-wide">
          <AlertTriangle className="w-3.5 h-3.5" />
          EXPIRADO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black tracking-wide">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        AGUARDANDO
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] max-h-[92vh] bg-[#121626] border border-[#262e49] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#161b2e] border-b border-[#242c46] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              ₿
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">
                Checkout Bitcoin — {selectedPlan.name}
              </h2>
              <p className="text-[10px] text-slate-400">
                US$ {selectedPlan.priceUsd} • US$ {selectedPlan.dailyRewardUsd}/dia ({selectedPlan.durationDays} dias = US$ {selectedPlan.total30DaysUsd})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1f263e] hover:bg-[#2a3352] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Estado de Erro se todas as fontes de cotação falharem */}
          {quoteError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-200">
                    Falha ao obter cotação BTC/USD
                  </h4>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    {quoteError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadQuoteAndBuildOrder(selectedPlan, true)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}

          {/* Estado de Carregamento */}
          {isLoadingQuote && !quoteError && (
            <div className="p-6 rounded-2xl bg-[#171c30] border border-[#252d47] flex flex-col items-center justify-center space-y-2.5">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-xs font-bold text-slate-200">
                Consultando cotação BTC/USD em tempo real...
              </p>
              <p className="text-[10px] text-slate-400">
                Coinbase • CoinGecko • Binance • Mempool.space
              </p>
            </div>
          )}

          {/* Dados do Pagamento Calculado */}
          {!isLoadingQuote && !quoteError && order && conversion && quote && (
            <div className="space-y-3.5">
              {/* Barra de Status do Pedido + Contador de 15 min + Atualizar cotação */}
              <div className="p-3 rounded-2xl bg-[#171c30] border border-[#252d47] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Status do Pedido</span>
                  {renderStatusBadge(order.status)}
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">
                    Cotação travada por
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-mono text-xs font-black text-amber-400">
                      {formatCountdown(remainingSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => loadQuoteAndBuildOrder(selectedPlan, true)}
                      title="Atualizar cotação agora"
                      className="px-2 py-1 rounded-lg bg-[#222944] hover:bg-[#2d3658] text-[10px] font-bold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Atualizar cotação</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumo de Valores (BTC, Satoshis, USD e Cotação Usada) */}
              <div className="p-3.5 rounded-2xl bg-[#171c30] border border-[#252d47] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#252d47] pb-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Valor exato a enviar (BTC)
                    </span>
                    <p className="text-base font-black font-mono text-amber-400 tracking-tight">
                      {conversion.amountBtcFormatted} BTC
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(conversion.amountBtcFormatted, 'btc')}
                    className="px-3 py-1.5 rounded-xl bg-[#222944] hover:bg-[#2c3556] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedField === 'btc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar BTC</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#121626] border border-[#222942]">
                    <span className="text-[10px] text-slate-400 block">Em Satoshis</span>
                    <span className="font-mono font-bold text-white">
                      {formatSatoshis(conversion.satoshis)} sats
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#121626] border border-[#222942]">
                    <span className="text-[10px] text-slate-400 block">Preço Fixo (USD)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatUsdCurrency(conversion.priceUsd)}
                    </span>
                  </div>
                </div>

                {/* Cotação usada com quebra controlada antes do colchete */}
                <div className="text-[11px] text-slate-400 pt-0.5 space-y-0.5">
                  <span className="block whitespace-nowrap">
                    Cotação usada: <strong className="text-slate-200 font-semibold">{quote.sourceName}</strong>
                  </span>
                  <span className="block font-mono font-bold text-slate-200 whitespace-nowrap">
                    [1 BTC = {formatUsdCurrency(quote.rateUsd)}{quote.fromCache ? ' • cache' : ''}]
                  </span>
                </div>
              </div>

              {/* QR Code Client-Side + Endereço BTC + Link BIP21 */}
              <div className="p-4 rounded-2xl bg-[#171c30] border border-[#252d47] space-y-3">
                <div className="flex flex-col items-center space-y-2">
                  {qrDataUrl ? (
                    <div className="p-2.5 bg-white rounded-2xl shadow-md">
                      <img
                        src={qrDataUrl}
                        alt="QR Code BIP21 Bitcoin"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-[#121626] rounded-2xl flex items-center justify-center text-xs text-slate-500">
                      Gerando QR Code...
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">
                    Escaneie com qualquer carteira Bitcoin compatível com BIP21
                  </span>
                </div>

                {/* Endereço BTC de recebimento (Mainnet SegWit nativo) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Endereço BTC de recebimento</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#121626] border border-[#242c46] rounded-xl p-2.5">
                    <code className="text-[11px] font-mono text-slate-200 break-all flex-1">
                      {order.btcAddress}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.btcAddress, 'address')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#222944] hover:bg-[#2c3556] text-[11px] font-bold text-white shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'address' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Link padrão BIP21 */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">
                    URI Padrão BIP21
                  </span>
                  <div className="flex items-center gap-2 bg-[#121626] border border-[#242c46] rounded-xl p-2">
                    <code className="text-[10px] font-mono text-amber-300/90 break-all flex-1">
                      {order.bip21Uri}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.bip21Uri, 'bip21')}
                      className="px-2 py-1 rounded-lg bg-[#222944] hover:bg-[#2c3556] text-[10px] font-bold text-slate-200 shrink-0 cursor-pointer"
                    >
                      {copiedField === 'bip21' ? 'Copiado!' : 'Copiar URI'}
                    </button>
                  </div>

                  <a
                    href={order.bip21Uri}
                    className="mt-1.5 w-full py-2 rounded-xl bg-[#222944] hover:bg-[#2c3556] text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir na Carteira Bitcoin (BIP21)</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
