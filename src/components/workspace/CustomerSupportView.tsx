import React, { useState } from 'react';
import { ArrowLeft, FilePlus, Check, Paperclip, X } from 'lucide-react';
import { LanguageCode } from '../../types';
import { storageService } from '../../services/storageService';

interface CustomerSupportViewProps {
  language: LanguageCode;
  onBack: () => void;
}

export const CustomerSupportView: React.FC<CustomerSupportViewProps> = ({
  onBack
}) => {
  const prefs = storageService.getPreferences();
  const [name, setName] = useState(prefs.userName || 'Marcelo Robadel de Souza');
  const [email, setEmail] = useState(prefs.userEmail || 'sistemacodigolucrativo@gmail.com');
  const [message, setMessage] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitted(true);
    setTimeout(() => {
      setMessage('');
      setAttachmentName(null);
      setSubmitted(false);
      onBack();
    }, 2000);
  };

  const handleSimulateAttach = () => {
    setAttachmentName('error_screenshot_log.png');
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

        <h2 className="text-base font-bold text-white tracking-wide">Customer Support</h2>

        <div className="w-9 h-9" />
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Your Name"
              required
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sistemacodigolucrativo@gmail.com"
              required
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Message Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
              className="w-full bg-[#1e2338] border border-[#2b3350] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Attachment Box (matches screenshot) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Attachment</label>
            
            {attachmentName ? (
              <div className="w-full bg-[#1e2338] border border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-indigo-300 font-mono">
                  <Paperclip className="w-4 h-4 text-indigo-400" />
                  <span>{attachmentName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentName(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSimulateAttach}
                className="w-full bg-[#1e2338] hover:bg-[#252c46] border border-[#2b3350] border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <FilePlus className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs text-slate-400">Click to attach screenshot or file</span>
              </button>
            )}
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Request #59201 submitted successfully!</span>
            </div>
          )}

          {/* Submit Request Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitted}
              className="w-full py-3.5 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white font-black text-xs tracking-wider shadow-lg shadow-indigo-950/40 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
