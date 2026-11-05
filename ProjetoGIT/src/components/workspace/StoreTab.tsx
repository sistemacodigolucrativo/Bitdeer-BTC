import React, { useState } from 'react';
import { LanguageCode, VipTier } from '../../types';
import { translations } from '../../i18n/translations';

import { miningService } from '../../services/miningService';
import { getDailyRewardUsd } from '../../config/dailyRewards';
import { CHECKOUT_PLANS_LIST, CheckoutPlanId } from '../../checkout/config';
import { BtcCheckoutModal } from './BtcCheckoutModal';

interface StoreTabProps {
  language: LanguageCode;
  onUpgradeHashrate: (gh: number) => void;
}

interface VipPlan {
  id: VipTier;
  checkoutPlanId?: CheckoutPlanId;
  name: string; // FREE, VIP 01, VIP 02, VIP 03, VIP 04
  priceUsd: number;
  durationDays: number;
  total30DaysUsd: number;
  boostDisplay: string;
  powerNumber: number; // in Gh/s
  serverModel: string;
}

export const StoreTab: React.FC<StoreTabProps> = ({
  language,
  onUpgradeHashrate
}) => {
  const t = translations[language].store;

  // Cinco planos (Plano Gratuito + 4 níveis VIP com preços fixos em USD conforme fonte da verdade)
  const vipPlans: VipPlan[] = [
    {
      id: 'none',
      name: 'FREE',
      priceUsd: 0,
      durationDays: 30,
      total30DaysUsd: 30,
      boostDisplay: '+ 0 Gh/s',
      powerNumber: 0,
      serverModel: 'Antminer S19 (Plano Gratuito)'
    },
    {
      id: 'vip01',
      checkoutPlanId: 'VIP_01',
      name: 'VIP 01',
      priceUsd: 20,
      durationDays: 30,
      total30DaysUsd: 90,
      boostDisplay: '+ 275 Gh/s',
      powerNumber: 275,
      serverModel: 'Antminer S19 Pro (VIP 01)'
    },
    {
      id: 'vip02',
      checkoutPlanId: 'VIP_02',
      name: 'VIP 02',
      priceUsd: 40,
      durationDays: 30,
      total30DaysUsd: 180,
      boostDisplay: '+ 575 Gh/s',
      powerNumber: 575,
      serverModel: 'Antminer S19 XP (VIP 02)'
    },
    {
      id: 'vip03',
      checkoutPlanId: 'VIP_03',
      name: 'VIP 03',
      priceUsd: 60,
      durationDays: 30,
      total30DaysUsd: 360,
      boostDisplay: '+ 975 Gh/s',
      powerNumber: 975,
      serverModel: 'WhatsMiner M50S+ (VIP 03)'
    },
    {
      id: 'vip04',
      checkoutPlanId: 'VIP_04',
      name: 'VIP 04',
      priceUsd: 80,
      durationDays: 30,
      total30DaysUsd: 840,
      boostDisplay: '+ 5.4 Th/s',
      powerNumber: 5400,
      serverModel: 'Bitmain Hydro Cluster (VIP 04 • 5.4 Th/s)'
    }
  ];

  const [selectedVipId, setSelectedVipId] = useState<VipTier>(() => {
    const currentTier = miningService.getState().userVipTier;
    return currentTier && currentTier !== 'none' ? currentTier : 'vip01';
  });
  const [showDetails, setShowDetails] = useState(false);
  const [boostActivated, setBoostActivated] = useState(false);
  const [checkoutModalPlanId, setCheckoutModalPlanId] = useState<CheckoutPlanId | null>(null);

  // Active plan currently selected among the 4 VIP cards
  const activeVip = vipPlans.find(p => p.id === selectedVipId && p.id !== 'none') || vipPlans[1];
  const selectedPlanDailyUsd = getDailyRewardUsd(activeVip.id);
  const formattedPlanDailyUsd = selectedPlanDailyUsd.toFixed(2).replace('.', ',');

  const handleBoost = () => {
    if (activeVip.checkoutPlanId) {
      setCheckoutModalPlanId(activeVip.checkoutPlanId);
    }
  };

  return (
    <div className="w-full flex-1 overflow-y-auto px-4 py-4 space-y-4 select-none pb-20">
      {/* Top Card: Exibe exclusivamente a cápsula do plano selecionado e sua recompensa diária */}
      <div className="bg-[#171b2d] border border-[#252c45] rounded-2xl p-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] text-slate-400">
            {t.hashingPower}
          </p>
          <div className="mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-xs tracking-wide border border-rose-500/30">
              {activeVip.name} — US$ {formattedPlanDailyUsd}/dia
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-1.5 rounded-xl bg-[#22283e] hover:bg-[#2b3350] text-xs font-bold text-slate-200 transition-colors cursor-pointer"
        >
          {t.viewBtn}
        </button>
      </div>

      {/* 3D Isometric Server Stack Graphic — Progressivo do VIP 01 ao VIP 04 */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-6 flex items-center justify-center relative overflow-hidden shadow-md">
        {activeVip.id === 'vip01' && (
          <div className="relative w-44 h-44 flex items-center justify-center animate-in fade-in duration-200">
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl">
              {/* Top Blade */}
              <polygon points="80,18 135,46 80,74 25,46" fill="#e2e8f0" />
              <polygon points="25,46 80,74 80,86 25,58" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <polygon points="80,74 135,46 135,58 80,86" fill="#1e294b" />
              {/* Vents */}
              <line x1="38" y1="56" x2="68" y2="70" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />

              {/* Middle Blade */}
              <polygon points="25,64 80,92 80,104 25,76" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <polygon points="80,92 135,64 135,76 80,104" fill="#1e294b" />
              <line x1="38" y1="74" x2="68" y2="88" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />

              {/* Bottom Blade */}
              <polygon points="25,82 80,110 80,122 25,94" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
              <polygon points="80,110 135,82 135,94 80,122" fill="#1e294b" />
              <line x1="38" y1="92" x2="68" y2="106" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3,3" />

              {/* LED Status indicators */}
              <circle cx="74" cy="79" r="2" fill="#10b981" />
              <circle cx="74" cy="97" r="2" fill="#10b981" />
              <circle cx="74" cy="115" r="2" fill="#10b981" />
            </svg>
          </div>
        )}

        {activeVip.id === 'vip02' && (
          <div className="relative w-44 h-44 flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute w-32 h-32 rounded-full bg-cyan-500/15 blur-xl" />
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl">
              {/* Isometric Base Platform */}
              <polygon points="80,112 146,132 80,152 14,132" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" opacity="0.9" />
              <polygon points="80,116 136,132 80,148 24,132" fill="#1e293b" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="3,2" />

              {/* Top Shield & Cooling Core */}
              <polygon points="80,10 138,38 80,66 22,38" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="80,17 122,38 80,59 38,38" fill="#0ea5e9" opacity="0.25" />
              <ellipse cx="80" cy="38" rx="18" ry="9" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.2" />
              <ellipse cx="80" cy="38" rx="8" ry="4" fill="#38bdf8" />

              {/* Blade 1 (Upper Overclocked) */}
              <polygon points="22,38 80,66 80,79 22,51" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="80,66 138,38 138,51 80,79" fill="#172554" stroke="#1e40af" strokeWidth="0.8" />
              <line x1="32" y1="48" x2="66" y2="64" stroke="#bae6fd" strokeWidth="2" strokeDasharray="4,2" />
              <line x1="94" y1="64" x2="128" y2="48" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />

              {/* Blade 2 */}
              <polygon points="22,55 80,83 80,96 22,68" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
              <polygon points="80,83 138,55 138,68 80,96" fill="#172554" stroke="#1e40af" strokeWidth="0.8" />
              <line x1="32" y1="65" x2="66" y2="81" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4,2" />
              <line x1="94" y1="81" x2="128" y2="65" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />

              {/* Blade 3 */}
              <polygon points="22,72 80,100 80,113 22,85" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="80,100 138,72 138,85 80,113" fill="#172554" stroke="#1e40af" strokeWidth="0.8" />
              <line x1="32" y1="82" x2="66" y2="98" stroke="#bae6fd" strokeWidth="2" strokeDasharray="4,2" />
              <line x1="94" y1="98" x2="128" y2="82" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />

              {/* Blade 4 (Base Power Unit) */}
              <polygon points="22,89 80,117 80,130 22,102" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1" />
              <polygon points="80,117 138,89 138,102 80,130" fill="#0f172a" stroke="#1e3a8a" strokeWidth="0.8" />
              <line x1="32" y1="99" x2="66" y2="115" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4,2" />

              {/* Vertical External Bus Pipes */}
              <line x1="28" y1="42" x2="28" y2="104" stroke="#38bdf8" strokeWidth="2" />
              <line x1="132" y1="42" x2="132" y2="104" stroke="#38bdf8" strokeWidth="2" />

              {/* Dual Status LEDs */}
              <circle cx="73" cy="71" r="2.2" fill="#10b981" />
              <circle cx="87" cy="71" r="2" fill="#38bdf8" />
              <circle cx="73" cy="88" r="2.2" fill="#10b981" />
              <circle cx="87" cy="88" r="2" fill="#38bdf8" />
              <circle cx="73" cy="105" r="2.2" fill="#10b981" />
              <circle cx="87" cy="105" r="2" fill="#38bdf8" />
              <circle cx="73" cy="122" r="2.2" fill="#10b981" />
              <circle cx="87" cy="122" r="2" fill="#38bdf8" />
            </svg>
          </div>
        )}

        {activeVip.id === 'vip03' && (
          <div className="relative w-44 h-44 flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 blur-xl" />
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
              {/* Isometric Data Center Matrix Floor */}
              <polygon points="80,104 154,130 80,156 6,130" fill="#0f172a" stroke="#6366f1" strokeWidth="1.5" />
              <polygon points="80,110 142,130 80,150 18,130" fill="#1e1b4b" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="3,3" />

              {/* Left Auxiliary Node Tower */}
              <polygon points="32,54 58,67 32,80 6,67" fill="#a5b4fc" />
              <polygon points="6,67 32,80 32,126 6,113" fill="#4338ca" stroke="#818cf8" strokeWidth="1" />
              <polygon points="32,80 58,67 58,113 32,126" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
              <line x1="12" y1="78" x2="26" y2="85" stroke="#c7d2fe" strokeWidth="1.8" />
              <line x1="12" y1="90" x2="26" y2="97" stroke="#c7d2fe" strokeWidth="1.8" />
              <line x1="12" y1="102" x2="26" y2="109" stroke="#c7d2fe" strokeWidth="1.8" />

              {/* Right Auxiliary Node Tower */}
              <polygon points="128,54 154,67 128,80 102,67" fill="#a5b4fc" />
              <polygon points="102,67 128,80 128,126 102,113" fill="#4338ca" stroke="#818cf8" strokeWidth="1" />
              <polygon points="128,80 154,67 154,113 128,126" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
              <line x1="108" y1="78" x2="122" y2="85" stroke="#c7d2fe" strokeWidth="1.8" />
              <line x1="108" y1="90" x2="122" y2="97" stroke="#c7d2fe" strokeWidth="1.8" />
              <line x1="108" y1="102" x2="122" y2="109" stroke="#c7d2fe" strokeWidth="1.8" />

              {/* Central High-Density WhatsMiner Tower */}
              <polygon points="80,12 122,33 80,54 38,33" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.2" />
              <polygon points="80,19 108,33 80,47 52,33" fill="#6366f1" />
              <circle cx="80" cy="33" r="6" fill="#34d399" />

              {/* 5 Stacked High-Density Blades */}
              {[0, 16, 32, 48, 64].map((offset, idx) => (
                <g key={idx} transform={`translate(0, ${offset})`}>
                  <polygon points="38,33 80,54 80,66 38,45" fill={idx % 2 === 0 ? '#4f46e5' : '#3b82f6'} stroke="#818cf8" strokeWidth="0.9" />
                  <polygon points="80,54 122,33 122,45 80,66" fill="#1e1b4b" stroke="#3730a3" strokeWidth="0.9" />
                  <line x1="46" y1="43" x2="70" y2="55" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="3,2" />
                  <line x1="90" y1="55" x2="114" y2="43" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
                  <circle cx="75" cy="58" r="2" fill="#10b981" />
                  <circle cx="85" cy="58" r="2" fill="#f59e0b" />
                </g>
              ))}

              {/* Glowing Fiber Optic Interconnect Bridges */}
              <line x1="32" y1="120" x2="80" y2="132" stroke="#34d399" strokeWidth="2" />
              <line x1="128" y1="120" x2="80" y2="132" stroke="#34d399" strokeWidth="2" />
            </svg>
          </div>
        )}

        {activeVip.id === 'vip04' && (
          <div className="relative w-44 h-44 flex items-center justify-center animate-in fade-in duration-200">
            {/* Dual Neon Aura for Hydro Cluster VIP 04 */}
            <div className="absolute w-36 h-36 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
            <div className="absolute w-24 h-24 rounded-full bg-amber-400/20 blur-lg" />
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
              {/* Cyber-Grid Hydro Base Platform */}
              <polygon points="80,104 156,131 80,158 4,131" fill="#090d1a" stroke="#f43f5e" strokeWidth="1.6" />
              <polygon points="80,109 144,131 80,153 16,131" fill="#18122b" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4,2" />

              {/* Left Hydro Cooling Tower */}
              <polygon points="28,46 54,59 28,72 2,59" fill="#fda4af" />
              <polygon points="2,59 28,72 28,124 2,111" fill="#9f1239" stroke="#fb7185" strokeWidth="1" />
              <polygon points="28,72 54,59 54,111 28,124" fill="#1f122b" stroke="#e11d48" strokeWidth="1" />
              <line x1="15" y1="68" x2="15" y2="115" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,3" />
              <line x1="22" y1="72" x2="22" y2="119" stroke="#fbbf24" strokeWidth="2" />

              {/* Right Hydro Cooling Tower */}
              <polygon points="132,46 158,59 132,72 106,59" fill="#fda4af" />
              <polygon points="106,59 132,72 132,124 106,111" fill="#9f1239" stroke="#fb7185" strokeWidth="1" />
              <polygon points="132,72 158,59 158,111 132,124" fill="#1f122b" stroke="#e11d48" strokeWidth="1" />
              <line x1="119" y1="68" x2="119" y2="115" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,3" />
              <line x1="126" y1="72" x2="126" y2="119" stroke="#fbbf24" strokeWidth="2" />

              {/* Central Bitmain Hydro Reactor Core (5.4 Th/s) */}
              <polygon points="80,28 124,50 80,72 36,50" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.4" />
              <polygon points="80,34 112,50 80,66 48,50" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1" />

              {/* 5 Hydro-Cooled Quantum Blades */}
              {[0, 14, 28, 42, 56].map((offset, idx) => (
                <g key={idx} transform={`translate(0, ${offset})`}>
                  <polygon
                    points="36,50 80,72 80,83 36,61"
                    fill={idx % 2 === 0 ? '#e11d48' : '#0284c7'}
                    stroke="#fda4af"
                    strokeWidth="0.9"
                  />
                  <polygon
                    points="80,72 124,50 124,61 80,83"
                    fill="#161229"
                    stroke="#fbbf24"
                    strokeWidth="0.9"
                  />
                  <line x1="44" y1="59" x2="72" y2="73" stroke="#fef08a" strokeWidth="2" strokeDasharray="3,2" />
                  <line x1="88" y1="73" x2="116" y2="59" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,2" />
                  <circle cx="75" cy="76" r="2.2" fill="#10b981" />
                  <circle cx="80" cy="78" r="2.2" fill="#fbbf24" />
                  <circle cx="85" cy="76" r="2.2" fill="#38bdf8" />
                </g>
              ))}

              {/* Hydro Tubes Connecting Towers to Central Reactor */}
              <path d="M 28 72 Q 54 65, 65 65" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              <path d="M 132 72 Q 106 65, 95 65" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="28" y1="124" x2="80" y2="142" stroke="#fbbf24" strokeWidth="2.2" />
              <line x1="132" y1="124" x2="80" y2="142" stroke="#fbbf24" strokeWidth="2.2" />

              {/* Floating Golden Bitcoin Core Emblem at Apex */}
              <circle cx="80" cy="24" r="14" fill="#18122b" stroke="#fbbf24" strokeWidth="2" />
              <circle cx="80" cy="24" r="10.5" fill="#f59e0b" />
              <text
                x="80"
                y="29"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
                fontFamily="monospace"
              >
                ₿
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* Upgrade Your HashRate Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white">{t.upgradeTitle}</h3>

        {/* Cards maiores dos 4 Planos VIP — clicar apenas seleciona o card */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {CHECKOUT_PLANS_LIST.map(plan => {
            const isSelected = activeVip.checkoutPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedVipId(plan.appVipTier)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e2540] border-[#f43f5e] ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/30 scale-[1.01]'
                    : 'bg-[#171b2d] border-[#252c45] hover:border-[#364063]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{plan.name}</span>
                  <span className="text-xs font-black text-amber-400">US$ {plan.priceUsd}</span>
                </div>
                <div className="mt-2 space-y-1 text-[10px] text-slate-300">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Diário:</span>
                    <span className="font-bold text-emerald-400">US$ {plan.dailyRewardUsd}/dia</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Duração:</span>
                    <span>{plan.durationDays} dias</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Total 30d:</span>
                    <span className="font-bold text-white">US$ {plan.total30DaysUsd}</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-3 px-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            {t.detailsBtn}
          </button>

          <button
            onClick={handleBoost}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
              boostActivated
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f43f5e] hover:bg-[#e11d48] text-white shadow-rose-950/30'
            }`}
          >
            <span>Ativar plano</span>
          </button>
        </div>

        {/* Details Dropdown/Expand */}
        {showDetails && (
          <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3.5 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
            <p><strong>Plano Selecionado:</strong> {activeVip.name} — US$ {formattedPlanDailyUsd}/dia</p>
            {activeVip.priceUsd > 0 && (
              <p><strong>Preço de Ativação:</strong> US$ {activeVip.priceUsd},00 (Total 30 dias: US$ {activeVip.total30DaysUsd},00)</p>
            )}
            <p><strong>Equipamento Alocado:</strong> {activeVip.serverModel}</p>
            <p><strong>Uptime Garantido:</strong> 100% de disponibilidade em nuvem</p>
            <p><strong>Latência de Rede:</strong> 8ms para o pool oficial</p>
          </div>
        )}

        {/* Bullet Notes */}
        <div className="space-y-2 pt-2 text-[11px] text-slate-400">
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <span>{t.bullet1}</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <span>{t.bullet2}</span>
          </p>
        </div>
      </div>

      {/* Modal de Checkout em Bitcoin (BTC) 100% Front-End */}
      {checkoutModalPlanId && (
        <BtcCheckoutModal
          initialPlanId={checkoutModalPlanId}
          onClose={() => setCheckoutModalPlanId(null)}
          onPlanActivated={(activatedPlan) => {
            const matchedVip = vipPlans.find(v => v.checkoutPlanId === activatedPlan.id);
            if (matchedVip && matchedVip.powerNumber > 0) {
              onUpgradeHashrate(matchedVip.powerNumber);
            }
            setBoostActivated(true);
            setTimeout(() => setBoostActivated(false), 3000);
          }}
        />
      )}
    </div>
  );
};
