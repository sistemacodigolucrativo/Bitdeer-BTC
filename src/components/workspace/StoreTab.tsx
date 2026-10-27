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

      {/* 3D Isometric Server Stack Graphic */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-6 flex items-center justify-center relative overflow-hidden shadow-md">
        <div className="relative w-44 h-44 flex items-center justify-center">
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
