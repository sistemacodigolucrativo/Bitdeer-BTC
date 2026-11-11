/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode, AppScreen } from './types';
import { storageService } from './services/storageService';
import { AuthUser, api, session as backendSession, logout as backendLogout } from './services/api';
import { AdminWorkspace } from './components/admin/AdminWorkspace';
import { MemberWorkspace } from './components/MemberWorkspace';
import { translations } from './i18n/translations';
import { LanguageScreen } from './components/LanguageScreen';
import { TerminalInitScreen } from './components/TerminalInitScreen';
import { LoginScreen } from './components/LoginScreen';
import { CongratulationsModal } from './components/CongratulationsModal';
import { CopyModeProvider } from './i18n/copyMode';


class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; language: LanguageCode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; language: LanguageCode }) {
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
      const t=this.props.language==='en'
        ? {title:'Synchronizing interface...',description:'A temporary display error occurred. Your records and balance remain saved.',continue:'Continue to dashboard'}
        :this.props.language==='es'
        ? {title:'Sincronizando interfaz...',description:'Se produjo un error temporal de visualización. Sus registros y saldo están guardados.',continue:'Continuar al panel'}
        : {title:'Sincronizando interface...',description:'Detectamos uma oscilação temporária na exibição. Seus dados e saldo permanecem salvos.',continue:'Continuar no Painel'};
      return (
        <div className="min-h-screen bg-[#090c17] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xs w-full bg-[#171b2d] border border-[#252c45] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-black text-white">{t.title}</h2>
            <p className="text-xs text-slate-400">
              {t.description}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="w-full py-3 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-xs cursor-pointer"
            >
              {t.continue}
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
  // Android WebViews can report an outdated 100vh after address/navigation bars
  // change. Follow the actually visible viewport so the fixed bottom tabs fit.
  useEffect(()=>{
    const updateHeight=()=>{
      const height=window.visualViewport?.height??window.innerHeight;
      if(Number.isFinite(height)&&height>0)
        document.documentElement.style.setProperty('--btc-app-height',Math.round(height)+'px');
    };
    updateHeight();
    window.addEventListener('resize',updateHeight);
    window.addEventListener('orientationchange',updateHeight);
    window.visualViewport?.addEventListener('resize',updateHeight);
    return ()=>{
      window.removeEventListener('resize',updateHeight);
      window.removeEventListener('orientationchange',updateHeight);
      window.visualViewport?.removeEventListener('resize',updateHeight);
    };
  },[]);
  const [language, setLanguage] = useState<LanguageCode>('pt');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = storageService.getPreferences().theme;
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [activeScreen, setActiveScreen] = useState<AppScreen>('login');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const choiceRevision=useRef(0);
  async function restoreAccountLanguage(user:AuthUser,showPicker:boolean):Promise<void> {
    const revision=choiceRevision.current;
    try {
      const result=await api<{language:string|null}>('language.preference');
      if(choiceRevision.current!==revision)return;
      let remote=result.language;
      if(remote!=='pt'&&remote!=='en'&&remote!=='es'&&user.role==='member') {
        const legacy=storageService.getLegacyMemberLanguage(user.id);
        if(legacy){await api('language.preference',{language:legacy});storageService.removeLegacyMemberLanguage(user.id);remote=legacy;}
      }
      if(remote==='pt'||remote==='en'||remote==='es'){
        setLanguage(remote);
        setActiveScreen(user.role==='admin'?'workspace':showPicker?'workspace':'terminal');
      }else if(user.role==='admin')setActiveScreen('workspace');
      else if(showPicker)setActiveScreen('language');
    }catch{if(choiceRevision.current===revision)setActiveScreen(user.role==='admin'?'workspace':'language');}
  }
  useEffect(() => {
    backendSession().then(async user => {
      setAuthUser(user);
      await restoreAccountLanguage(user,user.role==='member');
    }).catch(() => {}).finally(() => setCheckingSession(false));
  }, []);

  // Sync state with storage changes
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
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
    choiceRevision.current+=1;
    if(authUser)void api('language.preference',{language:validLang}).catch(()=>{});
  };

  const handleConfirmLanguage = () => {
    if(authUser)void api('language.preference',{language}).catch(()=>{});
    setActiveScreen('terminal');
  };

  const handleEnterWorkspace = () => {
    setActiveScreen('workspace');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setShowCongratulations(false);
    setCheckingSession(true);
    choiceRevision.current+=1;
    void restoreAccountLanguage(user,user.role==='member').finally(()=>setCheckingSession(false));
  };

  const handleProceedFromCongratulations = () => {
    setShowCongratulations(false);
    setActiveScreen('workspace');
  };

  const handleResetData = () => {
    storageService.reset();

    const defaultLang = 'pt';
    setLanguage(defaultLang);
    setShowCongratulations(false);
    setActiveScreen('login');
  };

  return (
    <CopyModeProvider>
    <AppErrorBoundary language={language}>
      <div className={`btc-app-shell ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'bg-[#121526] text-slate-100'} flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden transition-colors duration-200`}>
        {/* Mobile App Viewport Container */}
        <main className={`btc-app-viewport w-full min-h-0 ${authUser?.role === 'admin' ? 'max-w-6xl' : 'max-w-[420px]'} md:rounded-3xl md:shadow-2xl ${theme === 'light' ? 'bg-white border md:border-slate-200 text-slate-800' : 'bg-[#121626] border-0 md:border md:border-[#20263f] text-slate-100'} overflow-hidden flex flex-col relative transition-colors duration-200`}>
          {checkingSession && <div className="p-8 text-center">{language==='en'?'Checking secure session...':language==='es'?'Verificando sesión segura...':'Verificando sessão segura...'}</div>}
          {/* First-time member language choice, skipped when saved on device or SQLite */}
          {!checkingSession && activeScreen === 'language' && (
            <LanguageScreen
              currentLanguage={language}
              onSelectLanguage={handleSelectLanguage}
              onConfirm={handleConfirmLanguage}
            />
          )}

          {/* Mining Core immediately after login / initial language choice */}
          {!checkingSession && activeScreen === 'terminal' && (
            <TerminalInitScreen
              language={language}
              onEnterWorkspace={handleEnterWorkspace}
            />
          )}

          {/* Step 1: Login before language selection */}
          {!checkingSession && activeScreen === 'login' && !showCongratulations && (
            <LoginScreen
              language={language}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {/* Step 5: Congratulations Welcome Gift Modal */}
          {false && showCongratulations && (
            <CongratulationsModal
              language={language}
              onProceed={handleProceedFromCongratulations}
            />
          )}

          {/* Step 6: Main App Workspace with Tabs (Home, Store, Reward, Wallet, Setting) */}
          {!checkingSession && activeScreen === 'workspace' && authUser && (
            authUser.role === 'admin'
              ? <AdminWorkspace user={authUser} language={language} onChangeLanguage={handleSelectLanguage} onLogout={() => {void backendLogout().finally(() => {setAuthUser(null);setActiveScreen('login');});}}/>
              : <MemberWorkspace user={authUser} language={language}
                onChangeLanguage={handleSelectLanguage}
                onLogout={() => {void backendLogout().finally(() => {setAuthUser(null);setActiveScreen('login');});}}/>
          )}
        </main>
      </div>
    </AppErrorBoundary>
    </CopyModeProvider>
  );
}
