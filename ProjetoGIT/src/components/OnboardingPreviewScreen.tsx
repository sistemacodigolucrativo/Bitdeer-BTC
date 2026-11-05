import React from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

interface OnboardingPreviewScreenProps {
  language: LanguageCode;
  onBackToLanguage: () => void;
  onSlideToStart: () => void;
}

export const OnboardingPreviewScreen: React.FC<OnboardingPreviewScreenProps> = ({
  language,
  onBackToLanguage,
  onSlideToStart
}) => {
  const t = translations[language].onboardingPreview;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center bg-[#121626] text-white select-none p-5 sm:p-6 overflow-y-auto">
      {/* Top Header with Back button */}
      <header className="w-full pt-2 sm:pt-3 flex items-center justify-between">
        <button
          onClick={onBackToLanguage}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-[#1c2238] border border-[#272e4b] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'pt' ? 'Mudar Idioma' : language === 'es' ? 'Cambiar Idioma' : 'Change Language'}</span>
        </button>
      </header>

      {/* UNIFIED CENTERED CONTENT: Bitcoin Coin positioned close to Title, Subtitle, and Button (Anotação 01) */}
      <main className="my-auto w-full max-w-sm flex flex-col items-center justify-center text-center space-y-4 py-2">
        {/* Golden Bitcoin Coin (Positioned immediately above the title without excessive gap) */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-1">
          {/* Subtle warm glow behind coin */}
          <div className="absolute w-20 h-20 bg-amber-500/25 rounded-full blur-xl animate-pulse" />

          {/* 3D Gold Bitcoin Coin */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            {/* Outer coin rim shadow */}
            <circle cx="50" cy="50" r="46" fill="#78350f" opacity="0.4" />
            {/* Outer rim */}
            <circle cx="50" cy="48" r="45" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
            <circle cx="50" cy="48" r="41" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            {/* Inner field with dotted circular accent */}
            <circle cx="50" cy="48" r="36" fill="#f59e0b" stroke="#b45309" strokeWidth="1" strokeDasharray="3,2" />
            <circle cx="50" cy="48" r="32" fill="#d97706" opacity="0.25" />

            {/* Bitcoin ₿ Emblem */}
            <text
              x="50"
              y="59"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="38"
              fontWeight="900"
              fontFamily="sans-serif"
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.5))"
            >
              ₿
            </text>

            {/* Top coin highlight reflection */}
            <path
              d="M 22 30 A 40 40 0 0 1 78 30 A 42 42 0 0 0 22 30 Z"
              fill="#ffffff"
              opacity="0.35"
            />
          </svg>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-[27px] font-black tracking-tight text-white leading-tight">
          {t.stepTitle}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs px-2">
          {t.stepSubtitle}
        </p>

        {/* Button "Minerar Agora" */}
        <div className="w-full pt-3">
          <button
            type="button"
            onClick={onSlideToStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#f43f5e] hover:from-[#e11d48] hover:to-[#be123c] active:scale-[0.98] text-white font-black text-base tracking-wide shadow-xl shadow-rose-950/50 transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-current text-white animate-pulse" />
            <span>{t.mineNowBtn}</span>
          </button>
        </div>
      </main>

      {/* Bottom spacer for balanced vertical alignment */}
      <div className="w-full h-2" />
    </div>
  );
};
