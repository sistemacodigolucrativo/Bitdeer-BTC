import React, { useState, useEffect } from 'react';
import { Gift, Zap, Rocket, Award, Trophy, Gem, Sparkles, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LanguageCode, MiningState, RewardClaimResult } from '../../types';
import { translations } from '../../i18n/translations';
import { miningService } from '../../services/miningService';
import { getDailyRewardUsd } from '../../config/dailyRewards';

interface RewardTabProps {
  language: LanguageCode;
  miningState?: MiningState;
  onClaimSpeedBooster?: () => void;
}

export const RewardTab: React.FC<RewardTabProps> = ({
  language,
  miningState: propMiningState
}) => {
  const t = translations[language].reward;

  // Track mining state from service or prop
  const [internalState, setInternalState] = useState<MiningState>(() => propMiningState || miningService.getState());
  // Live tick to keep the 24h countdowns updating every second
  const [, setTicker] = useState<number>(Date.now());
  // Modal for Anotação nº 02 (Pop-up após cada resgate)
  const [claimSuccessModal, setClaimSuccessModal] = useState<RewardClaimResult | null>(null);

  useEffect(() => {
    const unsubscribe = miningService.subscribe(setInternalState);
    const interval = window.setInterval(() => {
      setTicker(Date.now());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const state = propMiningState || internalState;
  const hasVip = miningService.hasVipAccess();

  const handleClaim = (rewardId: string) => {
    const result = miningService.claimZoneReward(rewardId);
    if (result.success) {
      setClaimSuccessModal(result);
    }
  };

  // Recompensas da Reward Zone (Anotação 01 e Anotação 03)
  const rewardItems = [
    {
      id: 'speed',
      title: t.speedBooster,
      subtitle: '+15 TH/s (+15.000 Gh/s)',
      icon: <Zap className="w-5 h-5 text-white" />,
      iconBg: 'bg-[#f43f5e]'
    },
    {
      id: 'pro',
      title: t.proBooster,
      subtitle: '+30 TH/s (+30.000 Gh/s)',
      icon: <Rocket className="w-5 h-5 text-white" />,
      iconBg: 'bg-[#6366f1]'
    },
    {
      id: 'silver',
      title: `${t.silver} Tier`,
      subtitle: '+5.000 Satoshis (+0.00005 BTC)',
      icon: <Award className="w-5 h-5 text-white" />,
      iconBg: 'bg-slate-500'
    },
    {
      id: 'gold',
      title: `${t.gold} Tier`,
      subtitle: '+20.000 Satoshis (+0.0002 BTC)',
      icon: <Trophy className="w-5 h-5 text-white" />,
      iconBg: 'bg-amber-500'
    },
    {
      id: 'diamond',
      title: `${t.diamond} Tier`,
      subtitle: '+50.000 Satoshis (+0.0005 BTC)',
      icon: <Gem className="w-5 h-5 text-white" />,
      iconBg: 'bg-cyan-500'
    },
    {
      id: 'jackpot',
      title: `${t.jackpot} Bonus`,
      subtitle: '🔥 +100.000 Satoshis (+0.001 BTC)',
      icon: <Sparkles className="w-5 h-5 text-white" />,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-rose-500'
    }
  ];

  return (
    <div className="w-full flex-1 overflow-y-auto px-4 py-4 space-y-3.5 select-none pb-20 relative">
      {/* Header Banner (Anotação Nº 04: Removida a cápsula "Grátis" do card Área de Recompensas) */}
      <div className="bg-[#171b2d] border border-[#252c45] rounded-3xl p-4 flex items-center gap-3.5 shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <Gift className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white leading-tight">
              {t.title}
            </h2>
            {hasVip && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {state.userVipTier === 'vip01'
                  ? 'VIP 01'
                  : state.userVipTier === 'vip02'
                  ? 'VIP 02'
                  : state.userVipTier === 'vip03'
                  ? 'VIP 03'
                  : state.userVipTier === 'vip04'
                  ? 'VIP 04'
                  : state.userVipTier.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-snug mt-1">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Notice de Regras de Elegibilidade & Intervalo de 24h (Anotação nº 01 & 03) */}
      <div className="bg-[#15192c] border border-[#232943] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>
            {language === 'pt' && (
              <>Intervalo de resgate: <strong className="text-slate-200">24 horas</strong></>
            )}
            {language === 'es' && (
              <>Intervalo de reclamo: <strong className="text-slate-200">24 horas</strong></>
            )}
            {language === 'en' && (
              <>Claim cooldown: <strong className="text-slate-200">24 hours</strong></>
            )}
          </span>
        </div>

        {hasVip ? (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            {language === 'pt' ? 'Elegibilidade VIP ativa' : language === 'es' ? 'Elegibilidad VIP activa' : 'Active VIP eligibility'}
          </span>
        ) : (
          <div className="flex items-center gap-1 text-rose-400 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              {language === 'pt'
                ? 'Nenhum VIP ativo • Requer plano VIP para resgate'
                : language === 'es'
                ? 'Sin VIP activo • Requiere plan VIP para reclamar'
                : 'No active VIP • Requires active VIP plan to claim'}
            </span>
          </div>
        )}
      </div>

      {/* Rewards List */}
      <div className="space-y-2.5">
        {rewardItems.map((reward) => {
          const lastClaimed = state.rewardCooldowns[reward.id];
          const cooldown = miningService.checkCooldown(lastClaimed);
          const isAvailable = hasVip && cooldown.isAvailable;

          return (
            <div
              key={reward.id}
              className="bg-[#191e32] border border-[#262e49] rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all hover:border-[#353f66]"
            >
              {/* Left side: Icon + Title + Subtitle */}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${reward.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}>
                  {reward.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{reward.title}</h4>
                  <p className="text-[11px] text-emerald-400 font-semibold">{reward.subtitle}</p>
                </div>
              </div>

              {/* Right button with Claim, Cooldown or VIP Required */}
              {isAvailable ? (
                <button
                  onClick={() => handleClaim(reward.id)}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-[#10b981] hover:bg-[#059669] text-white shadow-md shadow-emerald-950/40 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t.claim}
                </button>
              ) : !hasVip ? (
                <button
                  disabled
                  className="px-3.5 py-2 rounded-xl font-bold text-[11px] bg-slate-800/80 text-rose-300 border border-rose-500/30 cursor-not-allowed flex items-center gap-1"
                  title={
                    language === 'pt'
                      ? 'Requer possuir um plano VIP ativo para resgatar'
                      : language === 'es'
                      ? 'Requiere plan VIP activo para reclamar'
                      : 'Requires an active VIP plan to claim'
                  }
                >
                  <ShieldCheck className="w-3 h-3 text-rose-400" />
                  <span>
                    {language === 'pt' ? 'Requer VIP' : language === 'es' ? 'Requiere VIP' : 'VIP Required'}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-3.5 py-2 rounded-xl font-mono font-bold text-[11px] bg-slate-800/90 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-not-allowed"
                  title="Resgate em intervalo de 24 horas"
                >
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>{cooldown.formatted}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pop-up Modal de Confirmação de Resgate (Anotação nº 02) */}
      {claimSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* 3D Gift Box Visual Graphic */}
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-rose-500/25 rounded-full blur-xl animate-pulse" />
              <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
                {/* Gift Box Base */}
                <polygon points="60,65 105,42 60,20 15,42" fill="#e11d48" />
                <polygon points="15,42 60,65 60,105 15,82" fill="#be123c" />
                <polygon points="60,65 105,42 105,82 60,105" fill="#9f1239" />

                {/* Gold Ribbon Vertical */}
                <polygon points="60,20 67,23 45,70 38,67" fill="#fbbf24" opacity="0.9" />
                <polygon points="38,67 45,70 45,108 38,105" fill="#f59e0b" />
                <polygon points="80,55 87,52 87,90 80,93" fill="#d97706" />

                {/* Gold Ribbon Horizontal */}
                <polygon points="15,42 105,42 105,48 15,48" fill="#fbbf24" opacity="0.3" />

                {/* 3D Bow Ribbons */}
                <ellipse cx="48" cy="22" rx="14" ry="7" fill="#fbbf24" transform="rotate(-20 48 22)" />
                <ellipse cx="72" cy="22" rx="14" ry="7" fill="#fbbf24" transform="rotate(20 72 22)" />
                <circle cx="60" cy="23" r="6" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

                {/* Sparkles */}
                <circle cx="25" cy="20" r="2" fill="#fef08a" className="animate-ping" />
                <circle cx="95" cy="30" r="2.5" fill="#fef08a" className="animate-pulse" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-white tracking-tight mb-1">
              🎉 Parabéns!
            </h3>
            <p className="text-xs text-emerald-400 font-bold mb-3">
              {claimSuccessModal.rewardName} Resgatado com Sucesso!
            </p>

            {/* Credit Info Card */}
            <div className="w-full bg-[#121526] border border-[#252c48] rounded-2xl p-3.5 mb-4 text-center">
              <p className="text-xs font-semibold text-slate-200">
                {claimSuccessModal.benefitDescription}
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Benefício creditado imediatamente e salvo na sua conta.
              </p>
            </div>

            <p className="text-[11px] text-slate-500 mb-5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Próximo resgate desta recompensa disponível em 24h.
            </p>

            {/* Continue Button */}
            <button
              onClick={() => setClaimSuccessModal(null)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-black text-xs tracking-wider shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
