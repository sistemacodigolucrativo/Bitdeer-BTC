import React from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { UkFlag, SpainFlag, PortugalFlag } from './Flags';

interface LanguageScreenProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onConfirm: () => void;
}

interface LanguageItem {
  code: LanguageCode;
  name: string;
  flag: React.ReactNode;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  onConfirm
}) => {
  const t = translations[currentLanguage];

  // The 3 required languages formatted clearly
  const languageList: LanguageItem[] = [
    {
      code: 'en',
      name: currentLanguage === 'pt' ? 'English (Inglês)' : currentLanguage === 'es' ? 'English (Inglés)' : 'English',
      flag: <UkFlag className="w-10 h-7" />
    },
    {
      code: 'es',
      name: currentLanguage === 'pt' ? 'Español (Espanhol)' : 'Español',
      flag: <SpainFlag className="w-10 h-7" />
    },
    {
      code: 'pt',
      name: 'Português',
      flag: <PortugalFlag className="w-10 h-7" />
    }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between items-center bg-[#121626] text-white select-none p-5 sm:p-6 overflow-y-auto">
      {/* Top Header */}
      <header className="w-full pt-3 sm:pt-4 pb-2 text-center">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          {t.screenTitle}
        </h1>
      </header>

      {/* Centered Area: The 3 Language Cards vertically & horizontally centered */}
      <main className="my-auto w-full max-w-sm flex flex-col items-center justify-center space-y-4 py-2">
        <div className="w-full space-y-3.5">
          {languageList.map((item) => {
            const isSelected = currentLanguage === item.code;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onSelectLanguage(item.code)}
                className={`w-full h-[68px] px-4 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm text-left ${
                  isSelected
                    ? 'bg-white text-[#121626] ring-2 ring-indigo-500/20 scale-[1.01]'
                    : 'bg-[#1b2137] text-slate-200 hover:bg-[#222944] border border-[#272e4b]/60 hover:scale-[1.005]'
                }`}
              >
                {/* Flag + Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex-shrink-0">
                    {item.flag}
                  </div>
                  <span
                    className={`text-[16px] sm:text-[17px] font-semibold truncate ${
                      isSelected ? 'text-[#101424] font-bold' : 'text-slate-200'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Radio selection circle */}
                <div className="flex-shrink-0 pl-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full border-2 border-[#5c5bf6] flex items-center justify-center bg-transparent">
                      <div className="w-3 h-3 bg-[#5c5bf6] rounded-full" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[#363d5c]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Green Continue Button directly below the centered language cards */}
        <div className="w-full pt-4">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-950/40 transition-all duration-150 active:scale-[0.99] flex items-center justify-center cursor-pointer"
          >
            {t.continueBtn}
          </button>
        </div>
      </main>

      {/* Subtle bottom spacer for balanced vertical alignment */}
      <div className="w-full h-4" />
    </div>
  );
};
