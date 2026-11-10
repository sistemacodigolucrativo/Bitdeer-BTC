import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { useProjectCopy } from '../i18n/copyMode';
import { AuthUser, login as backendLogin, register as backendRegister } from '../services/api';

const SESSION_PREFERENCE_KEY = 'bitdeer:stay-connected';

type SavedSessionPreference = { login: string; stayConnected: boolean };

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

function getSavedSessionPreference(): SavedSessionPreference | null {
  try {
    const saved = window.localStorage.getItem(SESSION_PREFERENCE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<SavedSessionPreference>;
    if (typeof parsed.login !== 'string' || typeof parsed.stayConnected !== 'boolean') return null;
    const login = normalizeLogin(parsed.login);
    return login ? { login, stayConnected: parsed.stayConnected } : null;
  } catch {
    return null;
  }
}

interface LoginScreenProps {
  language: LanguageCode;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLoginSuccess
}) => {
  const t = translations[language].login;
  const { copy } = useProjectCopy(language);
  const loginDisclaimer = copy('loginDisclaimer');
  const sessionCopy = language === 'en' ? {
    title: 'Stay signed in?',
    description: 'Choose whether this device keeps your session. If you agree, it lasts up to 30 days. Otherwise, it ends when you close the browser or after 12 hours.',
    stay: 'Yes, stay signed in',
    temporary: 'No, only this session',
    back: 'Go back',
  } : language === 'es' ? {
    title: '¿Mantener la sesión iniciada?',
    description: 'Elija si este dispositivo conserva su sesión. Si acepta, dura hasta 30 días. Si no, termina al cerrar el navegador o después de 12 horas.',
    stay: 'Sí, mantener la sesión',
    temporary: 'No, solo esta sesión',
    back: 'Volver',
  } : {
    title: 'Permanecer conectado?',
    description: 'Escolha se este dispositivo deve manter sua sessão. Se aceitar, ela dura até 30 dias. Se recusar, termina ao fechar o navegador ou após 12 horas.',
    stay: 'Sim, permanecer conectado',
    temporary: 'Não, apenas nesta sessão',
    back: 'Voltar',
  };
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [inviteCode,setInviteCode] = useState(
    ()=>new URLSearchParams(window.location.search).get('invite') || ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false);
  const [savedSessionPreference, setSavedSessionPreference] = useState(getSavedSessionPreference);

  const completeLogin = async (stayConnected: boolean) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await backendLogin(loginInput.trim(), passwordInput, stayConnected);
      const preference = { login: normalizeLogin(user.login), stayConnected };
      setSavedSessionPreference(preference);
      try {
        window.localStorage.setItem(SESSION_PREFERENCE_KEY, JSON.stringify(preference));
      } catch {
        // The secure server session still works when local storage is unavailable.
      }
      setSessionPromptOpen(false);
      onLoginSuccess(user);
    } catch (e) {
      setSessionPromptOpen(false);
      setErrorMessage((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!registerMode) {
      const savedPreference = getSavedSessionPreference() ?? savedSessionPreference;
      if (savedPreference?.login === normalizeLogin(loginInput)) {
        void completeLogin(savedPreference.stayConnected);
        return;
      }
      setSessionPromptOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const userLogin = loginInput.trim();
      await backendRegister(userLogin, passwordInput, fullNameInput.trim(),inviteCode.trim());
      const user = await backendLogin(userLogin, passwordInput, false);
      onLoginSuccess(user);
    } catch (e) {
      setErrorMessage((e as Error).message);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#121526] text-white p-5 sm:p-6 select-none overflow-y-auto">
      {/* Top and Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-4 w-full max-w-sm mx-auto">
        {/* Gold CPU Chip Icon with Bitcoin */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-5 relative flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            {/* Outer Chip Pins */}
            <rect x="15" y="10" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="27" y="10" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="39" y="10" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="51" y="10" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="63" y="10" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="75" y="10" width="6" height="6" fill="#f59e0b" rx="1" />

            <rect x="15" y="84" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="27" y="84" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="39" y="84" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="51" y="84" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="63" y="84" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="75" y="84" width="6" height="6" fill="#f59e0b" rx="1" />

            <rect x="10" y="27" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="10" y="39" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="10" y="51" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="10" y="63" width="6" height="6" fill="#f59e0b" rx="1" />

            <rect x="84" y="27" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="84" y="39" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="84" y="51" width="6" height="6" fill="#f59e0b" rx="1" />
            <rect x="84" y="63" width="6" height="6" fill="#f59e0b" rx="1" />

            {/* Chip Body */}
            <rect x="16" y="16" width="68" height="68" rx="8" fill="#1e2238" stroke="#333b5c" strokeWidth="2" />
            <rect x="22" y="22" width="56" height="56" rx="6" fill="#141728" />

            {/* Center Gold Bitcoin B */}
            <text
              x="50"
              y="58"
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="30"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              ₿
            </text>
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 text-center">
          {t.title}
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed mb-6">
          {copy('loginSubtitle')}
        </p>

        {/* Conventional Authentication Form (Login + Password + Optional Invite Code) */}
        <form onSubmit={handleFormSubmit} className="w-full space-y-3.5">
          {/* Error Message if any */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campo Login / E-mail */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.loginLabel}
            </label>
            <div className="relative flex items-center bg-[#181d33] border border-[#2b3353] rounded-2xl px-3.5 py-3 text-sm focus-within:border-indigo-500 transition-colors">
              <User className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={t.loginPlaceholder}
                className="bg-transparent border-none text-white text-sm placeholder:text-slate-500 w-full outline-hidden"
                autoComplete="username"
              />
            </div>
          </div>
          {/* Campo Senha com Visualização de Senha (ícone de olho) */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 block">
              {t.passwordLabel}
            </label>
            <div className="relative flex items-center bg-[#181d33] border border-[#2b3353] rounded-2xl px-3.5 py-3 text-sm focus-within:border-indigo-500 transition-colors">
              <Lock className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={t.passwordPlaceholder}
                className="bg-transparent border-none text-white text-sm placeholder:text-slate-500 w-full outline-hidden pr-2"
                autoComplete={registerMode ? 'new-password' : 'current-password'}
                minLength={registerMode ? 12 : undefined}
                maxLength={256}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer flex-shrink-0"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {registerMode && <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">{language==='en'?'Full name (optional)':language==='es'?'Nombre completo (opcional)':'Nome completo (opcional)'}</label>
            <input value={fullNameInput} onChange={e => setFullNameInput(e.target.value)}
              className="bg-[#181d33] border border-[#2b3353] rounded-2xl px-3.5 py-3 text-sm text-white w-full"/>
          </div>}
          {registerMode && <label className="block text-xs text-slate-300">
            {language==='en'?'Invite code (optional)':language==='es'?'Código de invitación (opcional)':'Código de indicação (opcional)'}
            <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())}
              maxLength={20} className="w-full mt-2 bg-[#181d33] border border-[#2b3353] rounded-2xl p-3 text-sm"/>
          </label>}
          {/* Cadastro público sempre gera uma conta de membro. */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-950/40 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{registerMode ? language==='en'?'Create member account':language==='es'?'Crear cuenta de miembro':'Criar conta de membro' : t.accessBtn}</span>
              )}
            </button>
          </div>
        </form>
        {sessionPromptOpen && <div role="dialog" aria-modal="true" aria-labelledby="stay-connected-title"
          data-testid="stay-connected-dialog"
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <section className="w-full max-w-sm rounded-2xl border border-indigo-400/30 bg-[#171b2d] p-5 shadow-2xl">
            <h3 id="stay-connected-title" className="text-base font-extrabold text-white">{sessionCopy.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{sessionCopy.description}</p>
            <div className="mt-4 grid gap-2">
              <button type="button" disabled={isLoading} onClick={()=>void completeLogin(true)}
                className="min-h-11 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
                {isLoading ? '…' : sessionCopy.stay}
              </button>
              <button type="button" disabled={isLoading} onClick={()=>void completeLogin(false)}
                className="min-h-11 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 disabled:opacity-60">
                {sessionCopy.temporary}
              </button>
              <button type="button" disabled={isLoading} onClick={()=>setSessionPromptOpen(false)}
                className="min-h-10 text-xs font-semibold text-slate-400 underline underline-offset-4 disabled:opacity-60">
                {sessionCopy.back}
              </button>
            </div>
          </section>
        </div>}
        <button type="button" onClick={() => {setRegisterMode(v=>!v);setErrorMessage('');}}
          className="mt-4 text-indigo-300 text-xs underline">
          {registerMode ? language==='en'?'Already have an account? Sign in':language==='es'?'¿Ya tienes cuenta? Iniciar sesión':'Já tenho conta — Entrar' : language==='en'?'New here? Sign up':language==='es'?'¿Eres nuevo? Crear cuenta':'Novo por aqui? Criar conta'}
        </button>
      </div>

      {/* Footer Terms & Disclaimer */}
      <footer className="pt-3 pb-1 text-center space-y-2 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-3 text-xs text-indigo-400">
          <span className="hover:underline cursor-pointer">{t.terms}</span>
          <span className="text-slate-600">|</span>
          <span className="hover:underline cursor-pointer">{t.privacy}</span>
        </div>

        {loginDisclaimer && <p className="text-[10px] text-slate-500 leading-tight">{loginDisclaimer}</p>}
      </footer>
    </div>
  );
};
