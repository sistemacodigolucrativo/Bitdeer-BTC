/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageCode, AppScreen } from './types';
import { storageService } from './services/storageService';
import { miningService } from './services/miningService';
import { translations } from './i18n/translations';
import { LanguageScreen } from './components/LanguageScreen';
import { OnboardingPreviewScreen } from './components/OnboardingPreviewScreen';
import { TerminalInitScreen } from './components/TerminalInitScreen';
import { LoginScreen } from './components/LoginScreen';
import { CongratulationsModal } from './components/CongratulationsModal';
import { MainAppWorkspace } from './components/MainAppWorkspace';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('AppErrorBoundary recovered from error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090c17] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xs w-full bg-[#171b2d] border border-[#252c45] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-black text-white">Sincronizando interface...</h2>
            <p className="text-xs text-slate-400">
              Detectamos uma oscilação temporária na exibição. Seus dados e saldo permanecem salvos.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="w-full py-3 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-xs cursor-pointer"
            >
              Continuar no Painel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function normalizeLanguage(lang: unknown): LanguageCode {
  if (typeof lang === 'string' && lang in translations) {
    return lang as LanguageCode;
  }
  return 'pt';
}

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return normalizeLanguage(storageService.getPreferences().language);
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = storageService.getPreferences().theme;
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [activeScreen, setActiveScreen] = useState<AppScreen>('language');
  const [showCongratulations, setShowCongratulations] = useState(false);

  // Sync state with storage changes
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.language) {
        setLanguage(normalizeLanguage(customEvent.detail.language));
      }
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme === 'light' ? 'light' : 'dark');
      }
    };
    window.addEventListener('btc_miner_pref_change', handleStorageChange);
    return () => window.removeEventListener('btc_miner_pref_change', handleStorageChange);
  }, []);

  const handleSelectLanguage = (newLang: LanguageCode) => {
    const validLang = normalizeLanguage(newLang);
    setLanguage(validLang);
    storageService.savePreferences({ language: validLang });
  };

  const handleConfirmLanguage = () => {
    storageService.savePreferences({ language });
    setActiveScreen('onboarding');
  };

  const handleSlideToStart = () => {
    setActiveScreen('terminal');
  };

  const handleEnterWorkspace = () => {
    setActiveScreen('login');
  };

  const handleLoginSuccess = (username?: string) => {
    if (username) {
      storageService.savePreferences({ userName: username });
    }
    setShowCongratulations(true);
  };

  const handleProceedFromCongratulations = () => {
    setShowCongratulations(false);
    setActiveScreen('workspace');
  };

  const handleResetData = () => {
    storageService.reset();
    miningService.resetAll();
    const defaultLang = 'pt';
    setLanguage(defaultLang);
    storageService.savePreferences({ language: defaultLang });
    setShowCongratulations(false);
    setActiveScreen('language');
  };

  return (
    <AppErrorBoundary>
      <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'bg-[#090c17] text-slate-100'} flex flex-col items-center justify-center p-0 md:p-6 overflow-x-hidden transition-colors duration-200`}>
        {/* Mobile App Viewport Container */}
        <main className={`w-full max-w-[420px] h-[100dvh] md:h-[840px] md:rounded-3xl md:shadow-2xl ${theme === 'light' ? 'bg-white border md:border-slate-200 text-slate-800' : 'bg-[#121626] border-0 md:border md:border-[#20263f] text-slate-100'} overflow-hidden flex flex-col relative transition-colors duration-200`}>
          {/* Step 1: Language Screen */}
          {activeScreen === 'language' && (
            <LanguageScreen
              currentLanguage={language}
              onSelectLanguage={handleSelectLanguage}
              onConfirm={handleConfirmLanguage}
            />
          )}

          {/* Step 2: Onboarding Screen with Slide to Start */}
          {activeScreen === 'onboarding' && (
            <OnboardingPreviewScreen
              language={language}
              onBackToLanguage={() => setActiveScreen('language')}
              onSlideToStart={handleSlideToStart}
            />
          )}

          {/* Step 3: Terminal Diagnostics Initialization */}
          {activeScreen === 'terminal' && (
            <TerminalInitScreen
              language={language}
              onEnterWorkspace={handleEnterWorkspace}
            />
          )}

          {/* Step 4: Login with Google & Referral code */}
          {activeScreen === 'login' && !showCongratulations && (
            <LoginScreen
              language={language}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {/* Step 5: Congratulations Welcome Gift Modal */}
          {showCongratulations && (
            <CongratulationsModal
              language={language}
              onProceed={handleProceedFromCongratulations}
            />
          )}

          {/* Step 6: Main App Workspace with Tabs (Home, Store, Reward, Wallet, Setting) */}
          {activeScreen === 'workspace' && (
            <MainAppWorkspace
              language={language}
              onNavigateToLanguage={() => setActiveScreen('language')}
              onSelectLanguage={handleSelectLanguage}
              onResetData={handleResetData}
              onLogout={() => setActiveScreen('login')}
            />
          )}
        </main>
      </div>
    </AppErrorBoundary>
  );
}
