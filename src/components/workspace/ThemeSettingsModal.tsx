import React, { useState } from 'react';
import { X, Moon, Sun, Check } from 'lucide-react';
import { LanguageCode } from '../../types';
import { storageService } from '../../services/storageService';

interface ThemeSettingsModalProps {
  language: LanguageCode;
  onClose: () => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  onClose
}) => {
  const currentTheme = storageService.getPreferences().theme || 'dark';
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>(currentTheme);

  const handleSelect = (theme: 'dark' | 'light') => {
    setSelectedTheme(theme);
    storageService.savePreferences({ theme });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-white select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#252c48] flex items-center justify-between bg-[#141829]">
          <h3 className="text-sm font-bold text-white">Theme Settings</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {/* Dark Mode */}
          <div
            onClick={() => handleSelect('dark')}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedTheme === 'dark'
                ? 'bg-[#202742] border-indigo-500/60 shadow-md'
                : 'bg-[#15192c] border-[#252c48] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Dark Mode (Default)</p>
                <p className="text-[10px] text-slate-400">High contrast dark theme</p>
              </div>
            </div>
            {selectedTheme === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>

          {/* Light Mode */}
          <div
            onClick={() => handleSelect('light')}
            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              selectedTheme === 'light'
                ? 'bg-[#202742] border-indigo-500/60 shadow-md'
                : 'bg-[#15192c] border-[#252c48] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Light Mode</p>
                <p className="text-[10px] text-slate-400">Alternative balanced light theme</p>
              </div>
            </div>
            {selectedTheme === 'light' && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#252c48] bg-[#141829]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
