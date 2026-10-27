import React, { useState, useEffect } from 'react';
import { Info, Lock, ChevronDown, ChevronUp, Gift, Zap, Clock, Coins } from 'lucide-react';
import { LanguageCode, MiningState } from '../../types';
import { translations } from '../../i18n/translations';
import { miningService } from '../../services/miningService';
import {
  getDailyRewardUsd,
  getDailyBonusUsd,
  getDailyBonusSatoshis,
  mapTierToPlanId,
} from '../../config/dailyRewards';

interface HomeTabProps {
  language: LanguageCode;
  miningState: MiningState;
  onStartMining: () => void;
  onStopMining: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  language,
  miningState,
  onStartMining,
  onStopMining
}) => {
  const t = translations[language].home;
  const [faqOpen, setFaqOpen] = useState(false);
  const [, setSecondTicker] = useState(0);

  // Re-render every second to smoothly update countdowns
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const totalHash = (miningState.baseHashrate + miningState.bonusHashrate).toFixed(2);
  const formattedBtc = miningState.totalBtc.toFixed(12);
  const activePlanId = mapTierToPlanId(miningState.userVipTier);
  const activeDailyUsd = getDailyRewardUsd(miningState.userVipTier);
  const dailyBonusUsd = getDailyBonusUsd(miningState.userVipTier);
  const formattedDailyBonusUsd = dailyBonusUsd.toFixed(2).replace('.', ',');
  const dailyBonusSatoshis = getDailyBonusSatoshis(miningState.userVipTier);
  const formattedDailyBonusSatoshis = dailyBonusSatoshis.toLocaleString('pt-BR');
  const isVipPlan = miningState.userVipTier !== 'none';

  // Format session countdown for FREE plan (Anotação 02)
  const sessionMin = Math.floor(miningState.sessionSecondsLeft / 60);
  const sessionSec = miningState.sessionSecondsLeft % 60;
  const sessionTimerFormatted = `${sessionMin.toString().padStart(2, '0')}:${sessionSec.toString().padStart(2, '0')}`;

  // Cooldown status for the 3 daily rewards
  const cdReward1 = miningService.checkCooldown(miningState.reward1ClaimedAt);
  const cdReward2 = miningService.checkCooldown(miningState.reward2ClaimedAt);
  const cdReward3 = miningService.checkCooldown(miningState.reward3ClaimedAt);

  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const handleClaimReward1 = () => {
    const res = miningService.claimReward1_Hashrate();
    if (res.success) {
      const valFormatted = (res.bonusUsd ?? dailyBonusUsd).toFixed(2).replace('.', ',');
      setClaimNotice(`💰 +US$ ${valFormatted} de bônus diário (${activePlanId}) creditados no saldo!`);
      setTimeout(() => setClaimNotice(null), 3000);
    }
  };

  const handleClaimReward2 = () => {
    const res = miningService.claimReward2_Time();
    if (res.success) {
      setClaimNotice('⏱️ Cronômetro ajustado para 2 horas de mineração!');
      setTimeout(() => setClaimNotice(null), 3000);
    }
  };

  const handleClaimReward3 = () => {
    const res = miningService.claimReward3_Satoshis();
    if (res.success) {
      const sats = (res.satoshis ?? dailyBonusSatoshis).toLocaleString('pt-BR');
      const btc = (res.amountBtc ?? dailyBonusSatoshis / 100_000_000).toFixed(8);
      setClaimNotice(`💰 +${sats} Satoshis (+${btc} BTC) creditados no saldo!`);
      setTimeout(() => setClaimNotice(null), 3500);
    }
  };

  return (
    <div className="w-full flex-1 overflow-y-auto px-4 py-4 space-y-4 select-none pb-20 relative">
      {/* Toast Alert for Reward Claims */}
      {claimNotice && (
        <div className="sticky top-2 z-30 py-2.5 px-4 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-xl flex items-center justify-center text-center animate-in fade-in slide-in-from-top-2 duration-200">
          {claimNotice}
        </div>
      )}
      {/* Top User Profile Header */}
      <div className="flex items-center gap-3 bg-[#171b2d] border border-[#252c45] rounded-2xl p-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-slate-400 truncate">{t.greeting}</p>
          <p className="text-sm font-extrabold text-white font-mono tracking-tight">
            {formattedBtc} <span className="text-amber-400 font-sans text-xs">{t.totalBtc}</span>
          </p>
        </div>
      </div>

      {/* MINING PANEL Card */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 relative overflow-hidden shadow-md">
        {/* Panel header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">
            {t.miningPanel}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              {activePlanId} • US$ {activeDailyUsd.toFixed(2)}/dia
            </span>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Mining Hashrate & GPU Rig Graphic */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
              <span>{totalHash}</span>
              <span className="text-xs font-normal text-slate-400">Gh/s</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{miningState.activeMinersCount.toLocaleString()} {t.activeMiners}</span>
            </div>
          </div>

          {/* Mining GPU Rig Graphic with Dual Fans */}
          <div className="w-24 h-16 relative flex items-center justify-center">
            <svg viewBox="0 0 120 70" className="w-full h-full drop-shadow-md">
              {/* Backplate */}
              <rect x="10" y="10" width="95" height="50" rx="6" fill="#1e294b" stroke="#3b82f6" strokeWidth="1.5" />
              {/* Fan 1 */}
              <circle cx="35" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
              <circle cx="35" cy="35" r="4" fill="#93c5fd" />
              <path
                d="M35,21 v28 M21,35 h28"
                stroke="#60a5fa"
                strokeWidth="2"
                className={miningState.isMining ? 'origin-[35px_35px] animate-spin' : ''}
              />
              {/* Fan 2 */}
              <circle cx="75" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
              <circle cx="75" cy="35" r="4" fill="#93c5fd" />
              <path
                d="M75,21 v28 M61,35 h28"
                stroke="#60a5fa"
                strokeWidth="2"
                className={miningState.isMining ? 'origin-[75px_35px] animate-spin' : ''}
              />
              {/* Gold coins */}
              <circle cx="95" cy="52" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
              <text x="95" y="55" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">₿</text>
            </svg>
          </div>
        </div>

        {/* Start / Stop Mining Button (Anotação Nº 02: Contínua para VIP, 30 min para FREE) */}
        <button
          onClick={miningState.isMining ? onStopMining : onStartMining}
          className={`w-full py-4 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.99] shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
            miningState.isMining
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              : 'bg-[#f43f5e] hover:bg-[#e11d48] text-white shadow-rose-950/40'
          }`}
        >
          {miningState.isMining ? (
            <>
              <Zap className="w-4 h-4 fill-current animate-bounce" />
              <span className="font-extrabold">
                {isVipPlan ? t.stopMining : `${t.stopMining} • ${sessionTimerFormatted}`}
              </span>
            </>
          ) : (
            <span>{t.startMining}</span>
          )}
        </button>
      </div>

      {/* Realtime Balance Card */}
      <div className="bg-[#171b2d] border border-[#232a43] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base flex-shrink-0">
              ₿
            </div>
            <div className="font-mono text-base font-extrabold text-white tracking-tight">
              {formattedBtc}
            </div>
          </div>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-[10px] text-slate-400 mt-2.5 leading-tight">
          {isVipPlan
            ? (language === 'pt'
                ? 'Plano VIP ativo: mineração simulada contínua sem limite de tempo.'
                : language === 'es'
                ? 'Plan VIP activo: minería simulada continua sin límite de tiempo.'
                : 'Active VIP Plan: continuous simulated mining with no time limit.')
            : t.miningNotice}
        </p>
      </div>

      {/* Daily Reward Booster Cards (Anotação Nº 01) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recompensa 1: Bônus diário em USD conforme plano ativo (Anotação Nº 01) */}
        <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-300 font-bold">{t.dailyReward}</span>
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center gap-2 my-2">
            <Gift className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <span className="text-base font-black text-white">
              US$ {formattedDailyBonusUsd} <span className="text-[10px] font-normal text-slate-400">/ 24h</span>
            </span>
          </div>
          <button
            onClick={handleClaimReward1}
            disabled={!cdReward1.isAvailable}
            className={`w-full py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              cdReward1.isAvailable
                ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer active:scale-95 shadow-md'
                : 'bg-[#22283e] text-slate-400 cursor-not-allowed border border-[#2c3350]'
            }`}
          >
            {cdReward1.isAvailable ? t.boostMining : `${t.cooldownNotice} ${cdReward1.formatted}`}
          </button>
        </div>

        {/* Recompensa 2: +2 Horas de Mineração (24h cooldown) */}
        <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-300 font-bold">{t.dailyReward}</span>
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center gap-2 my-2">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-black text-white leading-tight">{t.reward2Title}</span>
          </div>
          <button
            onClick={handleClaimReward2}
            disabled={!cdReward2.isAvailable}
            className={`w-full py-2 px-1 rounded-xl text-xs font-bold transition-all ${
              cdReward2.isAvailable
                ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white cursor-pointer active:scale-95 shadow-md'
                : 'bg-[#22283e] text-slate-400 cursor-not-allowed border border-[#2c3350]'
            }`}
          >
            {cdReward2.isAvailable ? t.boostMining : `${t.cooldownNotice} ${cdReward2.formatted}`}
          </button>
        </div>
      </div>

      {/* Terceira Recompensa Diária: Satoshis conforme o plano ativo (Anotação Nº 03: FREE = 10.000, VIP = 20.000) */}
      <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white">{formattedDailyBonusSatoshis} Satoshis</div>
            <div className="text-[10px] text-slate-400">{t.reward3Subtitle}</div>
          </div>
        </div>
        <button
          onClick={handleClaimReward3}
          disabled={!cdReward3.isAvailable}
          className={`px-3 py-2 font-bold text-xs rounded-xl transition-all ${
            cdReward3.isAvailable
              ? 'bg-[#f43f5e] hover:bg-[#e11d48] text-white cursor-pointer active:scale-95 shadow-md shadow-rose-950/30'
              : 'bg-[#22283e] text-slate-400 cursor-not-allowed border border-[#2c3350]'
          }`}
        >
          {cdReward3.isAvailable
            ? (language === 'pt'
                ? `Resgatar ${formattedDailyBonusSatoshis} Satoshis`
                : language === 'es'
                ? `Reclamar ${formattedDailyBonusSatoshis} Satoshis`
                : `Claim ${dailyBonusSatoshis.toLocaleString('en-US')} Satoshis`)
            : `${t.cooldownNotice} ${cdReward3.formatted}`}
        </button>
      </div>

      {/* FAQs Accordion */}
      <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3.5">
        <button
          onClick={() => setFaqOpen(!faqOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[11px]">
              ?
            </span>
            <span>{t.faqs}</span>
          </div>
          {faqOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {faqOpen && (
          <div className="mt-3 pt-3 border-t border-[#222840] space-y-2 text-xs text-slate-400 animate-in fade-in duration-200">
            <p><strong>1. Como funciona a sessão de mineração?</strong> No Plano FREE cada sessão dura 30 minutos contínuos. Nos planos VIP (01 a 04), a mineração simulada é contínua sem limite de tempo.</p>
            <p><strong>2. Como funcionam as recompensas diárias?</strong> Você possui 3 bônus diários (US$ {formattedDailyBonusUsd}, +2 Horas de Mineração e {formattedDailyBonusSatoshis} Satoshis), cada um disponível a cada 24 horas.</p>
            <p><strong>3. Meus dados ficam salvos?</strong> Sim, todo seu saldo e tempos restantes ficam salvos localmente e persistem mesmo ao fechar o app.</p>
          </div>
        )}
      </div>
    </div>
  );
};
