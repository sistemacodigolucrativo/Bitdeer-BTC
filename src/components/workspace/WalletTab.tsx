import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Lock, Copy, Check, Share2, RefreshCw, AlertCircle, TrendingUp, TrendingDown, UserPlus, Users, Gift } from 'lucide-react';
import { LanguageCode, MiningState } from '../../types';
import { translations } from '../../i18n/translations';
import { cryptoPriceService, BtcPriceState } from '../../services/cryptoPriceService';
import { miningService } from '../../services/miningService';
import { INITIAL_REFERRAL_HISTORY, INITIAL_REFERRAL_BTC_TOTAL } from '../../services/referralBackend';
import { copyToClipboard } from '../../utils/clipboard';

type ChartPeriodDays = 7 | 15 | 30;

interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

const historyMemoryCache: Partial<Record<ChartPeriodDays, { points: PriceHistoryPoint[]; fetchedAt: number }>> = {};

/**
 * Gera curva aproximada realista de alta e queda do BTC caso as APIs públicas falhem
 */
function buildApproximateBtcCurve(days: ChartPeriodDays, anchorPrice: number): PriceHistoryPoint[] {
  const basePrice = typeof anchorPrice === 'number' && Number.isFinite(anchorPrice) && anchorPrice > 1000 ? anchorPrice : 80285.58;
  const now = Date.now();
  const dayMs = 86_400_000;

  // Variações percentuais diárias realistas para 30 dias (altas e quedas do BTC)
  const offsets30 = [
    -0.068, -0.059, -0.064, -0.048, -0.035, -0.042, -0.028, -0.015, -0.024, -0.038,
    -0.031, -0.018, -0.006, 0.008, -0.004, -0.019, -0.011, 0.005, 0.018, 0.011,
    0.026, 0.014, -0.003, 0.009, 0.022, 0.015, -0.005, 0.007, -0.004, 0,
  ];

  const slice = offsets30.slice(offsets30.length - days);
  return slice.map((pct, idx) => ({
    timestamp: now - (days - 1 - idx) * dayMs,
    price: Number((basePrice * (1 + pct)).toFixed(2)),
  }));
}

interface WalletTabProps {
  language: LanguageCode;
  miningState: MiningState;
  onOpenProfile?: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  language,
  miningState,
  onOpenProfile
}) => {
  const safeLang: LanguageCode = translations[language] ? language : 'pt';
  const t = translations[safeLang].wallet;
  const [subTab, setSubTab] = useState<'mining' | 'referral'>('mining');
  const [copied, setCopied] = useState(false);
  const [priceState, setPriceState] = useState<BtcPriceState>(cryptoPriceService.getState());

  // Estados do gráfico Live Hash (7d, 15d, 30d)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriodDays>(7);
  const [chartPoints, setChartPoints] = useState<PriceHistoryPoint[]>(() =>
    buildApproximateBtcCurve(7, cryptoPriceService.getState().priceUsd)
  );
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [chartApiError, setChartApiError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = cryptoPriceService.subscribe((next) => {
      if (isMountedRef.current) {
        setPriceState(next);
      }
    });
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const fetchChartHistory = useCallback(
    async (days: ChartPeriodDays, forceRefresh = false) => {
      const cached = historyMemoryCache[days];
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < 120_000) {
        if (isMountedRef.current) {
          setChartPoints(cached.points);
          setChartApiError(null);
        }
        return;
      }

      if (isMountedRef.current) {
        setIsChartLoading(true);
        setChartApiError(null);
      }

      const fetchWithTimeout = async (url: string, timeoutMs = 7000) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timer);
        }
      };

      // 1. Tenta CoinGecko market_chart (CORS habilitado)
      try {
        const cgRes = await fetchWithTimeout(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
        );
        if (cgRes.ok) {
          const json = await cgRes.json();
          if (Array.isArray(json?.prices)) {
            const parsed: PriceHistoryPoint[] = json.prices
              .map((item: any) => ({
                timestamp: Number(item?.[0]),
                price: Number(item?.[1]),
              }))
              .filter(
                (pt: PriceHistoryPoint) =>
                  Number.isFinite(pt.timestamp) && Number.isFinite(pt.price) && pt.price > 0
              );
            if (parsed.length >= 2) {
              historyMemoryCache[days] = { points: parsed, fetchedAt: Date.now() };
              if (isMountedRef.current) {
                setChartPoints(parsed);
                setIsChartLoading(false);
              }
              return;
            }
          }
        }
      } catch {
        // Tenta fallback secundário
      }

      // 2. Fallback: Binance Klines (BTCUSDT diário, público com CORS habilitado)
      try {
        const binRes = await fetchWithTimeout(
          `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=${days}`
        );
        if (binRes.ok) {
          const klines = await binRes.json();
          if (Array.isArray(klines)) {
            const parsed: PriceHistoryPoint[] = klines
              .map((k: any) => ({
                timestamp: Number(k?.[0]),
                price: parseFloat(k?.[4]), // close price
              }))
              .filter(
                (pt: PriceHistoryPoint) =>
                  Number.isFinite(pt.timestamp) && Number.isFinite(pt.price) && pt.price > 0
              );
            if (parsed.length >= 2) {
              historyMemoryCache[days] = { points: parsed, fetchedAt: Date.now() };
              if (isMountedRef.current) {
                setChartPoints(parsed);
                setIsChartLoading(false);
              }
              return;
            }
          }
        }
      } catch {
        // Usa curva aproximada de fallback e exibe aviso de erro
      }

      // 3. Fallback local com mensagem de erro caso as APIs falhem
      const fallbackCurve = buildApproximateBtcCurve(days, cryptoPriceService.getState().priceUsd);
      if (isMountedRef.current) {
        setChartPoints(fallbackCurve);
        setChartApiError(
          'Não foi possível obter o histórico da API no momento. Exibindo variação aproximada de referência.'
        );
        setIsChartLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchChartHistory(chartPeriod, false);
  }, [chartPeriod, fetchChartHistory]);

  // Geometria SVG calculada para o gráfico de alta e queda do BTC
  const chartGeometry = useMemo(() => {
    const validPoints = Array.isArray(chartPoints)
      ? chartPoints.filter(
          (p) => p && Number.isFinite(p.timestamp) && Number.isFinite(p.price) && p.price > 0
        )
      : [];
    const pts =
      validPoints.length >= 2
        ? validPoints
        : buildApproximateBtcCurve(chartPeriod, priceState.priceUsd);

    const prices = pts.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = Math.max(maxPrice - minPrice, 1);

    const width = 300;
    const height = 76;
    const padX = 10;
    const padY = 10;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coords = pts.map((pt, index) => {
      const x = padX + (index / Math.max(pts.length - 1, 1)) * usableW;
      const normalizedY = (pt.price - minPrice) / priceRange;
      const y = padY + usableH - normalizedY * usableH;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), price: pt.price, timestamp: pt.timestamp };
    });

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
      .join(' ');

    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;

    const changePct = first.price > 0 ? ((last.price - first.price) / first.price) * 100 : 0;

    const formatShortDate = (ts: number) => {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '--/--';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    return {
      coords,
      linePath,
      areaPath,
      first,
      last,
      minPrice,
      maxPrice,
      changePct,
      startDateLabel: formatShortDate(first.timestamp),
      endDateLabel: formatShortDate(last.timestamp),
    };
  }, [chartPoints, chartPeriod, priceState.priceUsd]);

  const safeTotalBtc =
    typeof miningState?.totalBtc === 'number' && Number.isFinite(miningState.totalBtc)
      ? miningState.totalBtc
      : 0;
  const formattedBtc = safeTotalBtc.toFixed(12);
  const totalSatoshis = Math.floor(safeTotalBtc * 100_000_000);
  const hasQuote = cryptoPriceService.hasValidQuote(priceState.priceUsd);
  const balanceUsd = hasQuote
    ? cryptoPriceService.convertBtcToUsd(safeTotalBtc, priceState.priceUsd)
    : 0;
  const formattedUsd = hasQuote ? cryptoPriceService.formatUsd(balanceUsd) : 'Indisponível';
  const formattedBtcPrice = cryptoPriceService.formatBtcPrice(priceState.priceUsd);
  const referralCode = '8ZPTC';

  // Saldo de Indicação persistido em BTC (travado pela cotação do momento de cada cadastro)
  const referralList =
    Array.isArray(miningState?.referralHistory) && miningState.referralHistory.length > 0
      ? miningState.referralHistory
      : INITIAL_REFERRAL_HISTORY;
  const safeReferralBtc =
    typeof miningState?.referralBtc === 'number' && Number.isFinite(miningState.referralBtc) && miningState.referralBtc > 0
      ? miningState.referralBtc
      : INITIAL_REFERRAL_BTC_TOTAL;
  const formattedReferralBtc = safeReferralBtc.toFixed(12);

  // Estados para cadastro de novo indicado com código de convite
  const [showSignupReferralForm, setShowSignupReferralForm] = useState(false);
  const [referredName, setReferredName] = useState('');
  const [referredEmail, setReferredEmail] = useState('');
  const [referredCode, setReferredCode] = useState(referralCode);
  const [referralFeedback, setReferralFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterReferred = async (e: React.FormEvent) => {
    e.preventDefault();
    setReferralFeedback(null);
    setIsSubmittingReferral(true);

    try {
      const result = await miningService.registerReferralSignup({
        fullName: referredName,
        email: referredEmail,
        inviteCode: referredCode,
      });

      if (result.success) {
        setReferredName('');
        setReferredEmail('');
        setReferredCode(referralCode);
        setReferralFeedback({ type: 'success', text: result.message });
        setTimeout(() => {
          if (isMountedRef.current) {
            setReferralFeedback(null);
            setShowSignupReferralForm(false);
          }
        }, 3200);
      } else {
        setReferralFeedback({ type: 'error', text: result.message });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingReferral(false);
      }
    }
  };

  const handleRefreshPrice = () => {
    cryptoPriceService.fetchPrice();
    fetchChartHistory(chartPeriod, true);
  };

  return (
    <div className="w-full flex-1 overflow-y-auto px-4 py-4 space-y-4 select-none pb-20">
      {/* Top Segmented Tab Switcher [ Mining | Referral ] */}
      <div className="w-full bg-[#171b2d] border border-[#252c45] rounded-2xl p-1.5 flex items-center">
        <button
          onClick={() => setSubTab('mining')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            subTab === 'mining'
              ? 'bg-[#f43f5e] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.miningTab}
        </button>

        <button
          onClick={() => setSubTab('referral')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            subTab === 'referral'
              ? 'bg-[#f43f5e] text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.referralTab}
        </button>
      </div>

      {subTab === 'mining' ? (
        <>
          {/* Mining Balance Card (Anotação nº 04: Cotação e Conversão Automática) */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
              <span>{t.balance}</span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl flex-shrink-0">
                ₿
              </div>
              <div>
                <p className="font-mono text-lg font-black text-white tracking-tight">
                  {formattedBtc} <span className="font-sans text-xs text-amber-400">BTC</span>
                </p>
                {/* Saldo convertido em USD e Satoshis coerentes */}
                <div className="text-xs text-slate-300 font-semibold tracking-wide flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">≈</span>
                    <span className="text-emerald-400 font-mono font-bold">{formattedUsd}</span>
                    {hasQuote && <span className="text-[10px] text-slate-500">USD</span>}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] font-mono text-amber-300/90">
                    {totalSatoshis.toLocaleString('pt-BR')} SATS
                  </span>
                </div>
              </div>
            </div>

            {/* Cotação do Bitcoin e conversão */}
            <div className="mt-4 pt-3 border-t border-[#232a43] flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>BTC/USD:</span>
                {priceState.isLive ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Cotação em tempo real" />
                ) : (
                  <span className="text-[10px] text-amber-400 font-sans">
                    {priceState.error ? '(Cotação offline / referência)' : '(Referência em cache)'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={priceState.isLive ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {formattedBtcPrice}
                </span>
                <button
                  onClick={handleRefreshPrice}
                  disabled={priceState.isLoading}
                  title="Atualizar cotação agora"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${priceState.isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Mining Historical Chart Card ("LIVE HASH" — Variação BTC/USD 7d, 15d, 30d) */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 shadow-md space-y-3">
            {/* Top Bar: Seletor de Período (7 dias, 15 dias, 30 dias) + Variação */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#121626] border border-[#232a43] rounded-xl p-1">
                {([7, 15, 30] as ChartPeriodDays[]).map((period) => {
                  const active = chartPeriod === period;
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setChartPeriod(period)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#f43f5e] text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period} dias
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                {chartGeometry.changePct >= 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{chartGeometry.changePct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {chartGeometry.changePct.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>

            {/* Min / Max Referência do Período */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
              <span>
                Mín ({chartPeriod}d):{' '}
                <strong className="text-slate-200">
                  {cryptoPriceService.formatBtcPrice(chartGeometry.minPrice)}
                </strong>
              </span>
              <span>
                Máx ({chartPeriod}d):{' '}
                <strong className="text-slate-200">
                  {cryptoPriceService.formatBtcPrice(chartGeometry.maxPrice)}
                </strong>
              </span>
            </div>

            {/* Aviso de Erro com Fallback caso a API falhe */}
            {chartApiError && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-[10px] text-amber-300">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>{chartApiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchChartHistory(chartPeriod, true)}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold shrink-0 cursor-pointer"
                >
                  Tentar
                </button>
              </div>
            )}

            {/* SVG Gráfico de Alta e Queda do BTC */}
            <div className="h-28 w-full flex flex-col justify-between relative">
              <div className="flex-1 flex items-center relative">
                {isChartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#191e32]/60 z-10 rounded-xl">
                    <RefreshCw className="w-4 h-4 text-rose-400 animate-spin" />
                  </div>
                )}
                <svg viewBox="0 0 300 76" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="btcLiveHashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Área preenchida sob a curva */}
                  <path d={chartGeometry.areaPath} fill="url(#btcLiveHashGrad)" />

                  {/* Linha de alta e queda do preço do Bitcoin */}
                  <path
                    d={chartGeometry.linePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Ponto inicial e final */}
                  <circle
                    cx={chartGeometry.first.x}
                    cy={chartGeometry.first.y}
                    r="4"
                    fill="#f43f5e"
                  />
                  <circle
                    cx={chartGeometry.last.x}
                    cy={chartGeometry.last.y}
                    r="4.5"
                    fill="#f43f5e"
                    stroke="#fff"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>

              {/* Bottom timeline axis */}
              <div className="pt-2 border-t border-[#232a43] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>
                  {chartGeometry.startDateLabel} — {chartGeometry.endDateLabel}
                </span>
                <span className="font-bold text-slate-300 tracking-wider">LIVE HASH</span>
              </div>
            </div>
          </div>

          {/* WITHDRAW Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">
              {t.withdraw}
            </h3>

            <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 text-center flex flex-col items-center">
              {/* Computer & Gear graphic */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current stroke-2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <circle cx="17" cy="15" r="3" fill="#6366f1" />
                </svg>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5">{t.setupAccount}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
                {t.setupDesc}
              </p>

              <button
                onClick={onOpenProfile}
                className="py-2.5 px-6 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                {language === 'pt' ? 'Configurar Conta' : language === 'es' ? 'Configurar Cuenta' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 1. Card "Como ganhar recompensa" no topo da tela de indicações, imediatamente abaixo das abas */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 shadow-md space-y-3">
            <h4 className="text-xs font-extrabold text-white tracking-wide">{t.howToEarn}</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">{t.step1}</p>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-300">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">{t.step2}</p>
              </div>
            </div>
          </div>

          {/* Referral Phones Graphic */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-36 flex items-center justify-center">
              <svg viewBox="0 0 280 120" className="w-full h-full">
                {/* Center phone */}
                <rect x="105" y="10" width="70" height="105" rx="10" fill="#1e2238" stroke="#3b82f6" strokeWidth="2" />
                <rect x="112" y="22" width="56" height="80" rx="4" fill="#0f172a" />
                <circle cx="140" cy="55" r="16" fill="#3b82f6" opacity="0.4" />
                <text x="140" y="60" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">₿</text>

                {/* Left phone */}
                <rect x="35" y="25" width="60" height="90" rx="8" fill="#171b2d" opacity="0.8" />
                {/* Right phone */}
                <rect x="185" y="25" width="60" height="90" rx="8" fill="#171b2d" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* 3. Card "Saldo de indicação" com valor convertido e persistido em BTC no momento de cada cadastro */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {t.referralBalance}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                US$ 1,00 / indicado (travado em BTC)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base flex-shrink-0">
                ₿
              </div>
              <div>
                <p className="font-mono text-base font-black text-white">
                  {formattedReferralBtc} <span className="font-sans text-xs text-amber-400">BTC</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Saldo em BTC fixado pela cotação do instante de cada cadastro ({referralList.length} indicados)
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed text-center px-2">
            {t.referralDesc}
          </p>

          {/* 2. Botão "Compartilhar e ganhar" posicionado abaixo do saldo de indicação e do card "Como ganhar recompensa" */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-4 px-4 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-black text-sm shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span className="tracking-widest bg-black/20 px-2 py-0.5 rounded-md font-mono">{referralCode}</span>
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : t.shareToEarn}</span>
          </button>

          {/* 4. Lista de Indicados (abaixo do botão "Compartilhar e ganhar") */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{t.referredListTitle}</h4>
                  <p className="text-[10px] text-slate-400">
                    Cadastrados com o código <span className="font-mono text-amber-400 font-bold">{referralCode}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReferralFeedback(null);
                  setShowSignupReferralForm((prev) => !prev);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#222944] hover:bg-[#2c3556] text-[10px] font-bold text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showSignupReferralForm ? 'Fechar' : 'Novo Cadastro'}</span>
              </button>
            </div>

            {/* Formulário de conclusão de cadastro de indicado com código de convite */}
            {showSignupReferralForm && (
              <form
                onSubmit={handleRegisterReferred}
                className="p-3 rounded-2xl bg-[#121626] border border-[#252d47] space-y-2.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Registrar indicado com código</span>
                  <span className="font-mono text-emerald-400">
                    US$ 1,00 ≈ {(1 / (priceState.priceUsd > 1000 ? priceState.priceUsd : 80285.58)).toFixed(8)} BTC
                  </span>
                </div>

                <input
                  type="text"
                  value={referredName}
                  onChange={(e) => setReferredName(e.target.value)}
                  placeholder="Nome e sobrenome do indicado (ex.: João Silva)"
                  className="w-full bg-[#191e32] border border-[#2b3353] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="email"
                    value={referredEmail}
                    onChange={(e) => setReferredEmail(e.target.value)}
                    placeholder="E-mail (ex.: joao@dominio.com)"
                    className="col-span-2 bg-[#191e32] border border-[#2b3353] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={referredCode}
                    onChange={(e) => setReferredCode(e.target.value.toUpperCase())}
                    placeholder="Código"
                    className="col-span-1 bg-[#191e32] border border-[#2b3353] rounded-xl px-2.5 py-2 text-xs font-mono text-amber-300 uppercase text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {referralFeedback && (
                  <div
                    className={`p-2 rounded-xl text-[11px] font-semibold ${
                      referralFeedback.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {referralFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReferral}
                  className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {isSubmittingReferral ? 'Processando cadastro...' : 'Concluir Cadastro e Creditar US$ 1 em BTC'}
                </button>
              </form>
            )}

            {/* Lista de Indicados: exibe apenas Nome e Sobrenome do indicado e E-mail mascarado pelo backend */}
            <div className="divide-y divide-[#232a43]">
              {referralList.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {item.fullName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {item.maskedEmail}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block font-mono text-[11px] font-bold text-emerald-400">
                      +{item.amountBtc.toFixed(8)} BTC
                    </span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      {item.createdAtFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
