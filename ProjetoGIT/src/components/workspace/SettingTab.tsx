import React, { useState } from 'react';
import {
  Copy,
  Check,
  Pickaxe,
  Cpu,
  Bell,
  RefreshCw,
  Trash2,
  User,
  TrendingUp,
  Star,
  ChevronRight,
  Headphones,
  Palette,
  Languages,
  Send,
  FileText,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { translations } from '../../i18n/translations';
import { miningService } from '../../services/miningService';
import { storageService } from '../../services/storageService';
import { MiningRecordModal } from './MiningRecordModal';
import { SubscriptionHistoryModal } from './SubscriptionHistoryModal';
import { ProfileView } from './ProfileView';
import { TopMinersView } from './TopMinersView';
import { CustomerSupportView } from './CustomerSupportView';
import { ThemeSettingsModal } from './ThemeSettingsModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { RateUsModal } from './RateUsModal';
import { copyToClipboard } from '../../utils/clipboard';
import { LanguageFlag } from '../Flags';
import { X } from 'lucide-react';

interface SettingTabProps {
  language: LanguageCode;
  onNavigateToLanguage?: () => void;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onOpenProfile?: () => void;
  onResetData: () => void;
  onLogout?: () => void;
}

export const SettingTab: React.FC<SettingTabProps> = ({
  language,
  onNavigateToLanguage,
  onSelectLanguage,
  onOpenProfile,
  onResetData,
  onLogout
}) => {
  const t = translations[language].setting;
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Sub-screen views
  const [activeSubScreen, setActiveSubScreen] = useState<
    'none' | 'profile' | 'topMiners' | 'customerSupport'
  >('none');

  // Modals
  const [showMiningRecord, setShowMiningRecord] = useState(false);
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [showActiveMiner, setShowActiveMiner] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showRateUs, setShowRateUs] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const miningState = miningService.getState();
  const referralCode = '8ZPTC';
  const userEmail = storageService.getPreferences().userEmail || 'sistemacodigolucrativo@gmail.com';
  const referralBtcFormatted = (miningState.referralBtc ?? 0).toFixed(12);

  const handleCopy = async () => {
    await copyToClipboard(referralCode);
    setCopied(true);
    showToast('Código 8ZPTC copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BTC Cloud Mining',
        text: `Junte-se à mineração em nuvem de Bitcoin comigo! Use meu código: ${referralCode}`,
        url: window.location.href
      }).catch(() => {
        handleCopy();
      });
    } else {
      handleCopy();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    }
  };

  // ANOTAÇÃO Nº 07: Abrir Profile, Top Miners e Customer Support como telas independentes sem sobrepor a tela anterior
  if (activeSubScreen === 'profile') {
    return (
      <ProfileView
        language={language}
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  if (activeSubScreen === 'topMiners') {
    return (
      <TopMinersView
        language={language}
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  if (activeSubScreen === 'customerSupport') {
    return (
      <CustomerSupportView
        language={language}
        onBack={() => setActiveSubScreen('none')}
      />
    );
  }

  return (
    <div className="w-full flex-1 overflow-y-auto px-4 py-4 space-y-3.5 select-none pb-20 relative">
      
      {/* 1. Top Card: Referral Rewards & Share to Earn */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 shadow-md space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Referral Rewards</p>
          <p className="font-mono text-base font-black text-white tracking-tight">
            {referralBtcFormatted} <span className="font-sans text-xs text-rose-400 font-bold">BTC</span>
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 px-4 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-black text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span className="tracking-widest bg-black/20 px-2 py-0.5 rounded-md font-mono">{referralCode}</span>
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copiado!' : 'Share to Earn'}</span>
        </button>
      </div>

      {/* 2. Account Card with Inner Menu */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl p-4 shadow-md space-y-3">
        {/* User Account ID Header */}
        <div className="flex items-center gap-2.5 text-xs font-bold text-white">
          <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <span className="font-mono text-slate-200">ID #369032635113926</span>
        </div>

        {/* Inner Menu Container */}
        <div className="bg-[#141829] border border-[#232943] rounded-2xl divide-y divide-[#1f253d] overflow-hidden">
          {/* User Email */}
          <div className="px-4 py-3 text-xs font-semibold text-slate-300 font-mono tracking-tight bg-[#121526]/50">
            {userEmail}
          </div>

          {/* Option 1: Mining Record */}
          <button
            onClick={() => setShowMiningRecord(true)}
            className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-[#1a2035] transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Pickaxe className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white flex-1">Mining Record</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Option 2: View Active Miner */}
          <button
            onClick={() => setShowActiveMiner(true)}
            className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-[#1a2035] transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white flex-1">View Active Miner</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Option 3: View Active Subscription / History Subscription */}
          <button
            onClick={() => setShowSubscriptionHistory(true)}
            className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-[#1a2035] transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">View Active Subscription</span>
              <span className="text-[10px] text-emerald-400 font-medium">History Subscription</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
          </button>
        </div>
      </div>

      {/* 3. Group 1: Profile, Top Miners, Rate Us (Reference Screenshot 31cc2289) */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl overflow-hidden divide-y divide-[#232943] shadow-md">
        {/* Profile (Anotação nº 04: Acesso unificado ao perfil) */}
        <button
          onClick={() => {
            if (onOpenProfile) {
              onOpenProfile();
            } else {
              setActiveSubScreen('profile');
            }
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Profile</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>

        {/* Top Miners */}
        <button
          onClick={() => setActiveSubScreen('topMiners')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Top Miners</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>

        {/* Rate Us */}
        <button
          onClick={() => setShowRateUs(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <Star className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Rate Us</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>
      </div>

      {/* 4. Group 2: Customer Support, Theme Settings, Language (Reference Screenshot 31cc2289) */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl overflow-hidden divide-y divide-[#232943] shadow-md">
        {/* Customer Support */}
        <button
          onClick={() => setActiveSubScreen('customerSupport')}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Customer Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>

        {/* Theme Settings */}
        <button
          onClick={() => setShowThemeSettings(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <Palette className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Theme Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>

        {/* Language (Anotação nº 08: Modal de seleção interna sem deslogar) */}
        <button
          onClick={() => setShowLanguageModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <Languages className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">{t.language}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageFlag code={language} className="w-5 h-3.5 rounded-sm" />
            <span className="text-xs text-slate-400 uppercase font-mono">{language}</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </button>
      </div>

      {/* 5. Group 3: Privacy Policy, Log Out (Anotação nº 09: Removido Share) */}
      <div className="bg-[#191e32] border border-[#262e49] rounded-3xl overflow-hidden divide-y divide-[#232943] shadow-md">
        {/* Privacy Policy */}
        <button
          onClick={() => setShowPrivacyPolicy(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#20263f] transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span className="text-xs font-bold text-white">Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-between hover:bg-rose-950/20 transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3 text-rose-400">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold text-rose-400">Log Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      {/* Reset Data Helper */}
      <div className="pt-1">
        <button
          onClick={onResetData}
          className="w-full p-3 bg-[#141829] border border-[#232943] hover:bg-[#1a2035] rounded-2xl flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-amber-400">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetApp}</span>
          </div>
          <span className="text-[10px] text-slate-500">Restaurar estado inicial</span>
        </button>
      </div>

      {/* App Version Info */}
      <div className="text-center pt-1 text-[11px] text-slate-500">
        <p>{t.version}</p>
        <p className="mt-0.5">Bitcoin Cloud Mining — projeto demonstrativo</p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-full shadow-xl animate-in fade-in zoom-in-95">
          {toastMessage}
        </div>
      )}

      {/* Modal 1: Mining Record */}
      {showMiningRecord && (
        <MiningRecordModal
          language={language}
          onClose={() => setShowMiningRecord(false)}
        />
      )}

      {/* Modal 2: History Subscription */}
      {showSubscriptionHistory && (
        <SubscriptionHistoryModal
          language={language}
          onClose={() => setShowSubscriptionHistory(false)}
        />
      )}

      {/* Modal 3: View Active Miner */}
      {showActiveMiner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black">Active Miner Details</h3>
              </div>
              <button
                onClick={() => setShowActiveMiner(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Base Hashrate:</span>
                <span className="font-mono font-bold text-white">{miningState.baseHashrate.toFixed(2)} Gh/s</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Bonus Hashrate:</span>
                <span className="font-mono font-bold text-emerald-400">+{miningState.bonusHashrate.toFixed(2)} Gh/s</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Total Hashrate:</span>
                <span className="font-mono font-bold text-amber-400">{(miningState.baseHashrate + miningState.bonusHashrate).toFixed(2)} Gh/s</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Plano VIP:</span>
                <span className="font-bold text-rose-400 uppercase">{miningState.userVipTier === 'none' ? 'FREE' : miningState.userVipTier}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Rendimento Diário:</span>
                <span className="font-mono font-bold text-emerald-400">US$ {miningService.getActivePlanDailyRewardUsd().toFixed(2)} / dia</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#141829] rounded-xl">
                <span className="text-slate-400">Status da Máquina:</span>
                <span className="font-bold text-emerald-400">Online 100% Uptime</span>
              </div>
            </div>

            <button
              onClick={() => setShowActiveMiner(false)}
              className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: Theme Settings */}
      {showThemeSettings && (
        <ThemeSettingsModal
          language={language}
          onClose={() => setShowThemeSettings(false)}
        />
      )}

      {/* Modal 5: Privacy Policy */}
      {showPrivacyPolicy && (
        <PrivacyPolicyModal
          language={language}
          onClose={() => setShowPrivacyPolicy(false)}
        />
      )}

      {/* Modal 6: Rate Us */}
      {showRateUs && (
        <RateUsModal
          language={language}
          onClose={() => setShowRateUs(false)}
        />
      )}

      {/* Modal 7: Language Selector (Anotação nº 08: sem deslogar da conta) */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-white select-none">
            {/* Header */}
            <div className="p-4 border-b border-[#252c48] flex items-center justify-between bg-[#141829]">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {language === 'pt' ? 'Selecionar Idioma' : language === 'es' ? 'Seleccionar Idioma' : 'Select Language'}
                </h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Options */}
            <div className="p-4 space-y-2.5">
              {[
                { code: 'pt' as LanguageCode, label: 'Português', sub: 'Brasil / Portugal' },
                { code: 'en' as LanguageCode, label: 'English', sub: 'United States / UK' },
                { code: 'es' as LanguageCode, label: 'Español', sub: 'España / Latinoamérica' }
              ].map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    onClick={() => {
                      storageService.savePreferences({ language: langItem.code });
                      if (onSelectLanguage) {
                        onSelectLanguage(langItem.code);
                      }
                      setShowLanguageModal(false);
                      showToast(
                        langItem.code === 'pt'
                          ? 'Idioma alterado para Português'
                          : langItem.code === 'es'
                          ? 'Idioma cambiado a Español'
                          : 'Language changed to English'
                      );
                    }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#202742] border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-[#15192c] border-[#252c48] hover:border-slate-600 hover:bg-[#1a2037]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LanguageFlag code={langItem.code} className="w-8 h-5 rounded shadow" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{langItem.label}</p>
                        <p className="text-[10px] text-slate-400">{langItem.sub}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-slate-400 font-bold px-1.5 py-0.5 rounded bg-black/20">
                        {langItem.code}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#252c48] bg-[#141829]">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                {language === 'pt' ? 'Fechar' : language === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
