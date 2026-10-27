import React from 'react';
import { X, Shield } from 'lucide-react';
import { LanguageCode } from '../../types';

interface PrivacyPolicyModalProps {
  language: LanguageCode;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#252c48] flex items-center justify-between bg-[#141829]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Privacy Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto text-xs text-slate-300 space-y-3 leading-relaxed">
          <p className="font-semibold text-white">1. Cloud-Based Simulation Technology</p>
          <p className="text-slate-400">
            Our platform operates exclusively through remote cloud infrastructure. Your mobile device is never utilized for hardware compute or battery-intensive proof-of-work mining.
          </p>

          <p className="font-semibold text-white">2. User Data Protection</p>
          <p className="text-slate-400">
            Account credentials, wallet public keys, and mining statistics are stored locally and encrypted using state-of-the-art standards. We never ask for private keys or seed phrases.
          </p>

          <p className="font-semibold text-white">3. Fair Play and Rewards</p>
          <p className="text-slate-400">
            All bonus multipliers, boosts, and daily rewards are distributed strictly according to your selected VIP tier and eligibility schedules.
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#252c48] bg-[#141829]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
