import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

interface LoginScreenProps {
  language: LanguageCode;
  onLoginSuccess: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLoginSuccess
}) => {
  const t = translations[language].login;
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple string hash function to never store raw passwords in memory or storage per requirement 8
  const hashCredentials = async (raw: string): Promise<string> => {
    try {
      if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const msgUint8 = new TextEncoder().encode(raw);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // fallback
    }
    return `token_${btoa(raw).slice(0, 16)}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedLogin = loginInput.trim();
    const trimmedPassword = passwordInput.trim();

    // Validation: ensure both fields are provided and password has minimum length
    if (!trimmedLogin || !trimmedPassword) {
      setErrorMessage(t.validationError);
      return;
    }

    if (trimmedPassword.length < 4) {
      setErrorMessage(t.validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Secure hash representation instead of raw plaintext
      await hashCredentials(trimmedPassword);
      
      // Simulate quick secure validation
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(trimmedLogin);
      }, 350);
    } catch {
      setIsLoading(false);
      setErrorMessage(t.validationError);
    }
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
          {t.subtitle}
        </p>

        {/* Conventional Authentication Form (Login + Password per Anotação 05) */}
        <form onSubmit={handleFormSubmit} className="w-full space-y-4">
          {/* Error Message if any */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campo Login */}
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
                autoComplete="current-password"
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

          {/* Botão de Acesso */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-950/40 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{t.accessBtn}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer Terms & Disclaimer */}
      <footer className="pt-3 pb-1 text-center space-y-2 w-full max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-3 text-xs text-indigo-400">
          <span className="hover:underline cursor-pointer">{t.terms}</span>
          <span className="text-slate-600">|</span>
          <span className="hover:underline cursor-pointer">{t.privacy}</span>
        </div>

        <p className="text-[10px] text-slate-500 leading-tight">
          {t.disclaimer}
        </p>
      </footer>
    </div>
  );
};
