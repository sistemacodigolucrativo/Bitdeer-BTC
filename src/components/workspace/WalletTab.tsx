import React, { useState, useEffect } from 'react';
import { Lock, Copy, Check, Share2, RefreshCw } from 'lucide-react';
import { LanguageCode, MiningState } from '../../types';
import { translations } from '../../i18n/translations';
import { cryptoPriceService, BtcPriceState } from '../../services/cryptoPriceService';
import { copyToClipboard } from '../../utils/clipboard';

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
  const t = translations[language].wallet;
  const [subTab, setSubTab] = useState<'mining' | 'referral'>('mining');
  const [copied, setCopied] = useState(false);
  const [priceState, setPriceState] = useState<BtcPriceState>(cryptoPriceService.getState());

  useEffect(() => {
    const unsubscribe = cryptoPriceService.subscribe(setPriceState);
    return () => unsubscribe();
  }, []);

  const formattedBtc = miningState.totalBtc.toFixed(12);
  const totalSatoshis = Math.floor(miningState.totalBtc * 100_000_000);
  const hasQuote = cryptoPriceService.hasValidQuote(priceState.priceUsd);
  const balanceUsd = hasQuote
    ? cryptoPriceService.convertBtcToUsd(miningState.totalBtc, priceState.priceUsd)
    : 0;
  const formattedUsd = hasQuote ? cryptoPriceService.formatUsd(balanceUsd) : 'Indisponível';
  const formattedBtcPrice = cryptoPriceService.formatBtcPrice(priceState.priceUsd);
  const referralCode = '8ZPTC';

  const handleCopy = async () => {
    await copyToClipboard(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshPrice = () => {
    cryptoPriceService.fetchPrice();
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

          {/* Mining Historical Chart Card */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 shadow-md">
            <div className="h-28 w-full flex flex-col justify-between relative">
              {/* Pink Data point and baseline */}
              <div className="flex-1 flex items-center relative">
                <svg viewBox="0 0 300 70" className="w-full h-full overflow-visible">
                  <path
                    d="M 10 50 Q 80 48, 150 40 T 290 25"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                  />
                  <circle cx="20" cy="50" r="4.5" fill="#f43f5e" />
                  <circle cx="290" cy="25" r="4.5" fill="#f43f5e" />
                </svg>
              </div>

              {/* Bottom timeline axis */}
              <div className="pt-2 border-t border-[#232a43] flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>26/10</span>
                <span>LIVE HASH</span>
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

          {/* Referral Balance Card */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 shadow-md">
            <div className="text-xs font-bold text-slate-400 mb-2">
              {t.referralBalance}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base">
                ₿
              </div>
              <p className="font-mono text-base font-black text-white">
                0.000000000000 <span className="font-sans text-xs text-amber-400">BTC</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed text-center px-2">
            {t.referralDesc}
          </p>

          {/* Share to Earn Button with Code */}
          <button
            onClick={handleCopy}
            className="w-full py-4 px-4 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-black text-sm shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span className="tracking-widest bg-black/20 px-2 py-0.5 rounded-md font-mono">{referralCode}</span>
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : t.shareToEarn}</span>
          </button>

          {/* How to Earn Rewards */}
          <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4">
            <h4 className="text-xs font-bold text-white mb-3">{t.howToEarn}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <p>{t.step1}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
