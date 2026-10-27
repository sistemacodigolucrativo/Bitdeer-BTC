import React, { useState, useEffect, useRef } from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

interface TerminalInitScreenProps {
  language: LanguageCode;
  onEnterWorkspace: () => void;
}

const SIMULATED_LOGS: string[] = [
  'Initializing Mining Core...',
  'Loading Mining Modules...',
  'Checking System Resources...',
  'Connecting to Node...',
  'Establishing Network Connection...',
  'Analyzing Mining Network...',
  'Synchronizing Node...',
  'Validating Network Parameters...',
  'Initializing Hashrate Monitor...',
  'Checking Mining Engine...',
  'Establishing Secure Connection...',
  'Loading Mining Configuration...',
  'Verifying Node Availability...',
  'Preparing Mining Environment...',
  'Synchronization Complete...',
  'Mining Core Ready...'
];

export const TerminalInitScreen: React.FC<TerminalInitScreenProps> = ({
  language,
  onEnterWorkspace
}) => {
  const t = translations[language].terminal;
  const [currentStep, setCurrentStep] = useState(0);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Animation runs across ~5.1 seconds (16 steps * 320ms) - well within 4 to 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= SIMULATED_LOGS.length) {
          clearInterval(interval);
          return SIMULATED_LOGS.length;
        }
        return prev + 1;
      });
    }, 320);

    return () => clearInterval(interval);
  }, []);

  // Autoscroll terminal logs to bottom as each new line is output
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentStep]);

  // Calculate percentage from 0% to 100%
  const progressPercent = Math.min(100, Math.round((currentStep / SIMULATED_LOGS.length) * 100));
  const isComplete = progressPercent === 100;

  // Progressive states for NODE (steps 1 to 5)
  const nodeBlocks = Math.min(8, Math.floor((currentStep / 5) * 8));
  const nodeStatus = currentStep === 0 ? 'OFFLINE' : currentStep < 5 ? 'CONNECTING...' : 'ONLINE';
  const isNodeOnline = nodeBlocks >= 8;

  // Progressive states for HASH RATE (steps 6 to 10)
  const hashrateBlocks = currentStep < 6 ? 0 : Math.min(8, Math.floor(((currentStep - 5) / 5) * 8));
  const hashrateStatus = currentStep < 6 ? 'STANDBY' : currentStep < 10 ? 'CALIBRATING...' : 'READY';
  const isHashrateReady = hashrateBlocks >= 8;

  // Progressive states for NETWORK (steps 11 to 15)
  const networkBlocks = currentStep < 11 ? 0 : Math.min(8, Math.floor(((currentStep - 10) / 5) * 8));
  const networkStatus = currentStep < 11 ? 'OFFLINE' : currentStep < 15 ? 'SYNCING...' : 'ONLINE';
  const isNetworkOnline = networkBlocks >= 8;

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#121526] text-white p-5 sm:p-6 select-none font-sans overflow-y-auto">
      {/* Top Header Section */}
      <div className="w-full">
        {/* Terminal Window Header (3 dots + MINING_CORE in English) */}
        <div className="flex items-center justify-between pt-2 pb-4 border-b border-[#222842]/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="w-3 h-3 rounded-full bg-[#10b981]" />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-slate-400">
            <span>MINING_CORE</span>
            <span className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-[#10b981]' : 'bg-[#10b981] animate-ping'}`} />
          </div>
        </div>

        {/* Scrollable Progressive Log Window (Technical info strictly in English) */}
        <div
          ref={logsContainerRef}
          className="h-36 sm:h-40 my-3.5 bg-[#0b0e1b] border border-[#1e243a] rounded-xl p-3 font-mono text-[12px] sm:text-[13px] text-emerald-400 overflow-y-auto space-y-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-500/20"
        >
          {SIMULATED_LOGS.slice(0, currentStep).map((log, index) => (
            <div key={index} className="flex items-start gap-2 leading-relaxed animate-in fade-in duration-150">
              <span className="text-emerald-500 select-none">&gt;</span>
              <span className="text-emerald-400">{log}</span>
            </div>
          ))}
          {!isComplete && (
            <div className="flex items-center gap-1 text-emerald-300">
              <span className="text-emerald-500">&gt;</span>
              <span className="w-2 h-4 bg-emerald-400 inline-block animate-pulse" />
            </div>
          )}
        </div>

        {/* Diagnostic Status Matrix (All technical operational indicators strictly in English) */}
        <div className="bg-[#171a2e] border border-[#252a46] rounded-2xl p-4 sm:p-5 divide-y divide-[#232943] text-xs font-mono shadow-md">
          {/* NODE Row (with generous spacing so ONLINE does not touch lines) */}
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-300 w-24 sm:w-28 font-bold tracking-wider">
              NODE
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center px-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 sm:w-4 h-2.5 rounded-xs transition-colors duration-200 ${
                    i < nodeBlocks ? 'bg-[#10b981]' : 'bg-[#10b981]/15'
                  }`}
                />
              ))}
            </div>
            <span
              className={`font-bold w-24 sm:w-28 text-right pr-1 transition-colors ${
                isNodeOnline ? 'text-[#10b981]' : 'text-slate-500'
              }`}
            >
              {nodeStatus}
            </span>
          </div>

          {/* HASH RATE Row */}
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-300 w-24 sm:w-28 font-bold tracking-wider">
              HASH RATE
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center px-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 sm:w-4 h-2.5 rounded-xs transition-colors duration-200 ${
                    i < hashrateBlocks ? 'bg-[#f59e0b]' : 'bg-[#f59e0b]/15'
                  }`}
                />
              ))}
            </div>
            <span
              className={`font-bold w-24 sm:w-28 text-right pr-1 transition-colors ${
                isHashrateReady ? 'text-[#f59e0b]' : 'text-slate-500'
              }`}
            >
              {hashrateStatus}
            </span>
          </div>

          {/* NETWORK Row (with generous spacing for NETWORK label and ONLINE text) */}
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-300 w-24 sm:w-28 font-bold tracking-wider">
              NETWORK
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center px-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 sm:w-4 h-2.5 rounded-xs transition-colors duration-200 ${
                    i < networkBlocks ? 'bg-[#6366f1]' : 'bg-[#6366f1]/15'
                  }`}
                />
              ))}
            </div>
            <span
              className={`font-bold w-24 sm:w-28 text-right pr-1 transition-colors ${
                isNetworkOnline ? 'text-[#818cf8]' : 'text-slate-500'
              }`}
            >
              {networkStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Progress Bar, Dynamic Headline & Entry Button */}
      {/* Added generous top margin (mt-6 sm:mt-7) so INITIALIZATION never touches the card above per Anotação 04 */}
      <div className="w-full mt-6 sm:mt-7 space-y-5 pb-2">
        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-slate-400 tracking-widest">INITIALIZATION</span>
            <span className={isComplete ? 'text-emerald-400 font-extrabold' : 'text-indigo-400 font-extrabold'}>
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-3 bg-[#181d33] rounded-full overflow-hidden p-[2px] border border-[#2b3353]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-[#10b981]'
                  : 'bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#a5b4fc]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Translated Headline: Exclusively displayed when 100% is reached (Anotação 02) */}
        <div className="text-center pt-1 min-h-[22px] flex items-center justify-center">
          {isComplete ? (
            <h3 className="text-xs sm:text-sm font-black tracking-widest text-emerald-400 uppercase animate-in fade-in duration-300">
              {t.systemReady}
            </h3>
          ) : null}
        </div>

        {/* Dynamic Translated Action Button: Entrar no Painel / Enter Workspace */}
        <button
          type="button"
          onClick={isComplete ? onEnterWorkspace : undefined}
          disabled={!isComplete}
          className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center ${
            isComplete
              ? 'bg-[#f43f5e] hover:bg-[#e11d48] active:bg-[#be123c] text-white shadow-xl shadow-rose-950/50 active:scale-[0.99] cursor-pointer animate-pulse'
              : 'bg-[#22283e] text-slate-500 cursor-not-allowed shadow-none border border-[#2b3353]/50'
          }`}
        >
          {t.enterWorkspace}
        </button>
      </div>
    </div>
  );
};
