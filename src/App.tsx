/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageCode, AppScreen } from './types';
import { storageService } from './services/storageService';
import { miningService } from './services/miningService';
import { LanguageScreen } from './components/LanguageScreen';
import { OnboardingPreviewScreen } from './components/OnboardingPreviewScreen';
import { TerminalInitScreen } from './components/TerminalInitScreen';
import { LoginScreen } from './components/LoginScreen';
import { CongratulationsModal } from './components/CongratulationsModal';
import { MainAppWorkspace } from './components/MainAppWorkspace';

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return storageService.getPreferences().language || 'pt';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return storageService.getPreferences().theme || 'dark';
  });
  const [activeScreen, setActiveScreen] = useState<AppScreen>('language');
  const [showCongratulations, setShowCongratulations] = useState(false);

  // Sync state with storage changes
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.language) {
        setLanguage(customEvent.detail.language);
      }
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };
    window.addEventListener('btc_miner_pref_change', handleStorageChange);
    return () => window.removeEventListener('btc_miner_pref_change', handleStorageChange);
  }, []);

  const handleSelectLanguage = (newLang: LanguageCode) => {
    setLanguage(newLang);
    storageService.savePreferences({ language: newLang });
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
  );
}
