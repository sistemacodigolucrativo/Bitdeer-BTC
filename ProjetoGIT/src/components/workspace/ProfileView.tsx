import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { LanguageCode } from '../../types';
import { storageService } from '../../services/storageService';

interface ProfileViewProps {
  language: LanguageCode;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onBack
}) => {
  const prefs = storageService.getPreferences();
  const [name, setName] = useState(prefs.userName || 'Marcelo Robadel de Souza');
  const [email, setEmail] = useState(prefs.userEmail || 'sistemacodigolucrativo@gmail.com');
  const [phone, setPhone] = useState(prefs.phone || '');
  const [walletAddress, setWalletAddress] = useState(prefs.walletAddress || '');
  const [gender, setGender] = useState(prefs.gender || 'Select Gender');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatPhoneMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 13);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    const country = digits.slice(0, digits.length - 11);
    const local = digits.slice(-11);
    return `+${country} (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setPhone(formatPhoneMask(e.target.value));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (!trimmedName) {
      setErrorMessage('Informe um nome válido.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    if (phoneDigits.length > 0 && (phoneDigits.length < 10 || phoneDigits.length > 13)) {
      setErrorMessage('Número de telefone inválido. Digite DDD + número (10 a 13 dígitos).');
      return;
    }

    storageService.savePreferences({
      userName: trimmedName,
      userEmail: trimmedEmail,
      phone: phoneDigits ? formatPhoneMask(phoneDigits) : '',
      walletAddress: walletAddress.trim(),
      gender: gender !== 'Select Gender' ? gender : undefined
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#121626] text-white select-none overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#232943] bg-[#141829]">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#1b2137] hover:bg-[#232b47] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white tracking-wide">Profile</h2>

        <div className="w-9 h-9" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* User Avatar Circle */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-emerald-800/80 border-2 border-emerald-500/50 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {(name.trim()[0] || 'M').toUpperCase()}
          </div>
          <p className="text-xs font-semibold text-slate-200 font-mono">{email}</p>
          <p className="text-[11px] text-slate-400 font-mono">ID : 369032635113926</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-3 pt-2">
          {/* Name Field */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setErrorMessage(null);
                setName(e.target.value);
              }}
              placeholder="Name"
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Email Field */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setErrorMessage(null);
                setEmail(e.target.value);
              }}
              placeholder="Email"
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Phone Field */}
          <div>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Wallet Address Field */}
          <div>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter Wallet Address"
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          {/* Select Gender Field */}
          <div className="relative">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="Select Gender" disabled className="bg-[#1e2338]">Select Gender</option>
              <option value="Male" className="bg-[#1e2338]">Male</option>
              <option value="Female" className="bg-[#1e2338]">Female</option>
              <option value="Other" className="bg-[#1e2338]">Other</option>
              <option value="Prefer not to say" className="bg-[#1e2338]">Prefer not to say</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center animate-in fade-in">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Feedback message */}
          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* UPDATE Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white font-black text-xs tracking-wider shadow-lg shadow-indigo-950/40 transition-all cursor-pointer uppercase active:scale-[0.99]"
            >
              UPDATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
