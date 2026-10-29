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
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return normalizeLanguage(storageService.getPreferences().language);
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = storageService.getPreferences().theme;
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [activeScreen, setActiveScreen] = useState<AppScreen>('login');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const choiceRevision=useRef(0);
  // Local, member-scoped selection takes priority on this device. Otherwise
  // restore the persisted SQLite choice (including after changing devices).
  async function restoreMemberLanguage(user:AuthUser) {
    if(user.role!=='member')return;
    const revision=choiceRevision.current;
    const local=storageService.getMemberLanguage(user.id);
    try {
      const result=await api<{language:string|null}>('language.preference');
      if (choiceRevision.current!==revision) return; // user changed language while loading
      const backend=result.language;
      if(local) {
        setLanguage(local);
        storageService.savePreferences({language:local,isFirstLaunch:false});
        if (backend!==local) await api('language.preference',{language:local});
      } else if(backend==='pt'||backend==='en'||backend==='es') {
        setLanguage(backend);
        storageService.saveMemberLanguage(user.id,backend);
      }
    } catch {
      if(local && choiceRevision.current===revision) setLanguage(local);
    }
  }
  useEffect(() => {
    backendSession().then(user => {
      setAuthUser(user);
      setActiveScreen('workspace');
      void restoreMemberLanguage(user);
    }).catch(() => {}).finally(() => setCheckingSession(false));
  }, []);

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
    choiceRevision.current+=1;
    if(authUser?.role==='member') {
      storageService.saveMemberLanguage(authUser.id,validLang);
      void api('language.preference',{language:validLang}).catch(()=>{});
    } else {
      storageService.savePreferences({language:validLang,isFirstLaunch:false});
    }
  };

  const handleConfirmLanguage = () => {
    storageService.savePreferences({ language,isFirstLaunch:false });
    if (authUser?.role==='member') {
      storageService.saveMemberLanguage(authUser.id,language);
      void api('language.preference',{language}).catch(()=>{});
    }
    setActiveScreen('terminal');
  };

  const handleEnterWorkspace = () => {
    setActiveScreen('workspace');
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setShowCongratulations(false);
    if(user.role==='admin'){setActiveScreen('workspace');return;}
    const local=storageService.getMemberLanguage(user.id);
    if(local){
      setLanguage(local);
      storageService.savePreferences({language:local,isFirstLaunch:false});
      setActiveScreen('terminal');
      void restoreMemberLanguage(user); // Keep SQLite aligned in the background.
      return;
    }
    // First device sign-in: use SQLite choice if available, otherwise ask once.
    // While checking, render neither the language picker nor an obsolete intro.
    const revision=++choiceRevision.current;
    setCheckingSession(true);
    void api<{language:string|null}>('language.preference').then(({language:remote})=>{
      if(choiceRevision.current!==revision)return;
      if(remote==='pt'||remote==='en'||remote==='es'){
        storageService.saveMemberLanguage(user.id,remote);
        setLanguage(remote);
        setActiveScreen('terminal');
      } else {
        setActiveScreen('language');
      }
    }).catch(()=>{
      if(choiceRevision.current===revision)setActiveScreen('language');
    }).finally(()=>setCheckingSession(false));
  };

  const handleProceedFromCongratulations = () => {
    setShowCongratulations(false);
    setActiveScreen('workspace');
  };

  const handleResetData = () => {
    storageService.reset();

    const defaultLang = 'pt';
    setLanguage(defaultLang);
    storageService.savePreferences({ language: defaultLang });
    setShowCongratulations(false);
    setActiveScreen('login');
  };

  return (
    <AppErrorBoundary language={language}>
      <div className={`min-h-screen ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'bg-[#090c17] text-slate-100'} flex flex-col items-center justify-center p-0 md:p-6 overflow-x-hidden transition-colors duration-200`}>
        {/* Mobile App Viewport Container */}
        <main className={`w-full ${authUser?.role === 'admin' ? 'max-w-6xl' : 'max-w-[420px]'} h-[100dvh] md:h-[840px] md:rounded-3xl md:shadow-2xl ${theme === 'light' ? 'bg-white border md:border-slate-200 text-slate-800' : 'bg-[#121626] border-0 md:border md:border-[#20263f] text-slate-100'} overflow-hidden flex flex-col relative transition-colors duration-200`}>
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
              ? <AdminWorkspace user={authUser} onLogout={() => {void backendLogout().finally(() => {setAuthUser(null);setActiveScreen('login');});}}/>
              : <MemberWorkspace user={authUser} language={language}
                onChangeLanguage={handleSelectLanguage}
                onLogout={() => {void backendLogout().finally(() => {setAuthUser(null);setActiveScreen('login');});}}/>
          )}
        </main>
      </div>
    </AppErrorBoundary>
  );
}
