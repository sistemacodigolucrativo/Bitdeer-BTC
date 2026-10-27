import React, { useState, useEffect } from 'react';
import { Home, Store, Gift, Wallet, Settings as SettingsIcon } from 'lucide-react';
import { LanguageCode, WorkspaceTab, MiningState } from '../types';
import { translations } from '../i18n/translations';
import { miningService } from '../services/miningService';
import { HomeTab } from './workspace/HomeTab';
import { StoreTab } from './workspace/StoreTab';
import { RewardTab } from './workspace/RewardTab';
import { WalletTab } from './workspace/WalletTab';
import { SettingTab } from './workspace/SettingTab';
import { ProfileView } from './workspace/ProfileView';

interface MainAppWorkspaceProps {
  language: LanguageCode;
  onNavigateToLanguage: () => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onResetData: () => void;
  onLogout?: () => void;
}

export const MainAppWorkspace: React.FC<MainAppWorkspaceProps> = ({
  language,
  onNavigateToLanguage,
  onSelectLanguage,
  onResetData,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('home');
  const [showUnifiedProfile, setShowUnifiedProfile] = useState<boolean>(false);
  const [tabResetKey, setTabResetKey] = useState<number>(0);
  const [miningState, setMiningState] = useState<MiningState>(miningService.getState());
  const safeLang: LanguageCode = translations[language] ? language : 'pt';
  const t = translations[safeLang].tabs;

  useEffect(() => {
    const unsubscribe = miningService.subscribe(setMiningState);
    return () => unsubscribe();
  }, []);

  const handleSelectTab = (tab: WorkspaceTab) => {
    setShowUnifiedProfile(false);
    setActiveTab(tab);
    setTabResetKey((prev) => prev + 1);
  };

  const handleStartMining = () => {
    miningService.startMining();
  };

  const handleStopMining = () => {
    miningService.stopMining();
  };

  const handleClaimBoost = (id: string, amount: number) => {
    miningService.addBoost(id, amount);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121526] text-white select-none relative overflow-hidden">
      {/* Main Tab View or Independent Sub-Screen */}
      <div className="flex-1 flex flex-col overflow-hidden pt-4">
        {showUnifiedProfile ? (
          <ProfileView
            language={safeLang}
            onBack={() => setShowUnifiedProfile(false)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeTab
                language={safeLang}
                miningState={miningState}
                onStartMining={handleStartMining}
                onStopMining={handleStopMining}
              />
            )}

            {activeTab === 'store' && (
              <StoreTab
                language={safeLang}
                onUpgradeHashrate={(gh) => handleClaimBoost('store_upgrade', gh)}
              />
            )}

            {activeTab === 'reward' && (
              <RewardTab
                language={safeLang}
                miningState={miningState}
              />
            )}

            {activeTab === 'wallet' && (
              <WalletTab
                language={safeLang}
                miningState={miningState}
                onOpenProfile={() => setShowUnifiedProfile(true)}
              />
            )}

            {activeTab === 'setting' && (
              <SettingTab
                key={tabResetKey}
                language={safeLang}
                onNavigateToLanguage={onNavigateToLanguage}
                onSelectLanguage={onSelectLanguage}
                onOpenProfile={() => setShowUnifiedProfile(true)}
                onResetData={onResetData}
                onLogout={onLogout}
              />
            )}
          </>
        )}
      </div>

      {/* 5 Bottom Tabs (Home, Store, Reward, Wallet, Setting) */}
      <div className="w-full h-16 bg-[#101322] border-t border-[#1f253d] flex items-center justify-around px-2 z-30 select-none">
        {/* Home */}
        <button
          type="button"
          onClick={() => handleSelectTab('home')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors cursor-pointer ${
            activeTab === 'home' && !showUnifiedProfile ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' && !showUnifiedProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">{t.home}</span>
        </button>

        {/* Store */}
        <button
          type="button"
          onClick={() => handleSelectTab('store')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors cursor-pointer ${
            activeTab === 'store' && !showUnifiedProfile ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Store className={`w-5 h-5 ${activeTab === 'store' && !showUnifiedProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">{t.store}</span>
        </button>

        {/* Reward */}
        <button
          type="button"
          onClick={() => handleSelectTab('reward')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors cursor-pointer ${
            activeTab === 'reward' && !showUnifiedProfile ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Gift className={`w-5 h-5 ${activeTab === 'reward' && !showUnifiedProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">{t.reward}</span>
        </button>

        {/* Wallet */}
        <button
          type="button"
          onClick={() => handleSelectTab('wallet')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors cursor-pointer ${
            activeTab === 'wallet' && !showUnifiedProfile ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'wallet' && !showUnifiedProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">{t.wallet}</span>
        </button>

        {/* Setting */}
        <button
          type="button"
          onClick={() => handleSelectTab('setting')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-colors cursor-pointer ${
            activeTab === 'setting' && !showUnifiedProfile ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <SettingsIcon className={`w-5 h-5 ${activeTab === 'setting' && !showUnifiedProfile ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 font-semibold">{t.setting}</span>
        </button>
      </div>
    </div>
  );
};
