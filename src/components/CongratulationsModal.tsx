import React from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

interface CongratulationsModalProps {
  language: LanguageCode;
  onProceed: () => void;
}

export const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  language,
  onProceed
}) => {
  const t = translations[language].congratulations;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#121526] text-white p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Visual Indicator: 3D Golden Gift Box (Replaces green checkmark circle per Anotação 03) */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Ambient gift glow */}
          <div className="absolute w-24 h-24 bg-rose-500/20 rounded-full blur-xl animate-pulse" />

          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
            {/* Gift Box Base */}
            <polygon points="60,65 105,42 60,20 15,42" fill="#e11d48" />
            <polygon points="15,42 60,65 60,105 15,82" fill="#be123c" />
            <polygon points="60,65 105,42 105,82 60,105" fill="#9f1239" />

            {/* Gold Ribbon Vertical */}
            <polygon points="60,20 67,23 45,70 38,67" fill="#fbbf24" opacity="0.9" />
            <polygon points="38,67 45,70 45,108 38,105" fill="#f59e0b" />
            <polygon points="80,55 87,52 87,90 80,93" fill="#d97706" />

            {/* Gold Ribbon Horizontal */}
            <polygon points="15,42 105,42 105,48 15,48" fill="#fbbf24" opacity="0.3" />

            {/* 3D Bow Ribbons at Top */}
            <ellipse cx="48" cy="22" rx="14" ry="7" fill="#fbbf24" transform="rotate(-20 48 22)" />
            <ellipse cx="72" cy="22" rx="14" ry="7" fill="#fbbf24" transform="rotate(20 72 22)" />
            <circle cx="60" cy="23" r="6" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Sparkles */}
            <circle cx="25" cy="20" r="2" fill="#fef08a" className="animate-ping" />
            <circle cx="95" cy="30" r="2.5" fill="#fef08a" className="animate-pulse" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-3">
          {t.title}
        </h2>

        {/* Text 1 */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4 px-2">
          {t.desc1}
        </p>

        {/* Thin horizontal divider */}
        <div className="w-full h-[1px] bg-slate-700/60 mb-4" />

        {/* Text 2 */}
        <p className="text-xs text-slate-400 leading-relaxed mb-8 px-2">
          {t.desc2}
        </p>

        {/* Action Button: Single prominent button, "Avaliar app" removed per Anotação 03 */}
        <div className="w-full">
          <button
            type="button"
            onClick={onProceed}
            className="w-full py-4 px-6 rounded-2xl bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/50 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t.actionBtn}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
