import React,{useEffect,useState} from 'react';
import {Gift,Coins,ShieldCheck,ChevronRight} from 'lucide-react';
import {MemberData} from '../services/api';
import {LanguageCode} from '../types';
import { useProjectCopy } from '../i18n/copyMode';
import {ReferralHistoryView} from './workspace/ReferralHistoryView';
import {RewardHistoryLog,RewardHistoryData} from './RewardHistoryLog';
import {UsdAmount,UsdMark} from './UsdMark';

type Props={account:MemberData|null;language:LanguageCode;busy:boolean;
  ledger:RewardHistoryData;onClaim:()=>void;onRefreshHistory:()=>void};
export const ServerRewardView:React.FC<Props>=({account,language,busy,ledger,onClaim,onRefreshHistory})=>{
  const { copy } = useProjectCopy(language);
  const [now,setNow]=useState(Date.now());
  const [historyOpen,setHistoryOpen]=useState(false);
  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return ()=>window.clearInterval(timer);
  },[]);
  const last=account?.mining.lastBonusAt??null;
  const seconds=last===null?0:Math.max(0,last+86400-Math.floor(now/1000));
  const available=!!account&&seconds===0;
  const count=(n:number)=>n.toString().padStart(2,'0');
  const countdown=count(Math.floor(seconds/3600))+':'+count(Math.floor((seconds%3600)/60))+':'+count(seconds%60);
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const t=language==='en'?{
    title:'Rewards',usd:'Bonus',sats:'Satoshi bonus',claim:'Claim both daily bonuses',
    waiting:'Next claim in',ledger:'Reward history',
    notice:copy('rewardNotice')
  }:language==='es'?{
    title:'Recompensas',usd:'Bono',sats:'Bono en satoshis',claim:'Reclamar ambos bonos diarios',
    waiting:'Próximo reclamo en',ledger:'Historial de recompensas',
    notice:copy('rewardNotice')
  }:{
    title:'Recompensas',usd:'Bônus',sats:'Bônus em satoshis',claim:'Resgatar ambos os bônus diários',
    waiting:'Próximo resgate em',ledger:'Histórico de recompensas',
    notice:copy('rewardNotice')
  };
  return <section data-testid="rewards-premium" className="space-y-3 pb-4">
    <header className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-extrabold">{t.title}</h2>
      <span className="flex shrink-0 items-center justify-center rounded-lg border border-[#4f46e5]/60 bg-indigo-500/15 p-2 text-indigo-400"><Gift size={24}/></span>
    </header>
    <div className="space-y-2" data-testid="rewards-compact-claim">
      <div data-testid="reward-bonus-grid" className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#2c3551] bg-[#212943] p-2.5 min-w-0">
          <p className="flex gap-1 items-center text-[11px] text-slate-300"><Gift size={14} className="text-indigo-300"/>{t.usd} <UsdMark/></p>
          <strong className="text-base font-extrabold tabular-nums"><UsdAmount>{account?.plan.bonusUsd??'0.00'}</UsdAmount></strong>
        </div>
        <div className="rounded-xl border border-[#2c3551] bg-[#212943] p-2.5 min-w-0">
          <p className="flex gap-1 items-center text-[11px] text-slate-300"><Coins size={14} className="text-amber-300"/>{t.sats}</p>
          <strong className="text-base font-extrabold tabular-nums">{(account?.plan.bonusSatoshis??0).toLocaleString(locale)}</strong>
        </div>
      </div>
      <button type="button" onClick={onClaim} disabled={busy||!available}
        className="w-full py-2.5 px-2 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] font-bold text-xs disabled:opacity-40"
        data-testid="claim-daily-rewards">
        {available?t.claim:t.waiting+' '+countdown}
      </button>
      <p className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight px-1">
        <ShieldCheck size={13} className="shrink-0"/>{t.notice}
      </p>
    </div>
    <ReferralHistoryView language={language} embedded/>
    <button type="button" data-testid="reward-history-toggle" aria-controls="rewards-history-panel"
      aria-expanded={historyOpen} onClick={()=>{
        setHistoryOpen(open=>!open);
        if(!historyOpen)onRefreshHistory();
      }}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#2c3551] bg-[#1b2137] font-semibold text-xs">
      {t.ledger}<ChevronRight size={16} className={historyOpen?'rotate-90 transition-transform':'transition-transform'}/>
    </button>
    {historyOpen&&<div id="rewards-history-panel" role="region" aria-label={t.ledger}
      data-testid="reward-history-panel" className="rounded-xl border border-[#2c3551] bg-[#171b2d] p-3 space-y-3">
      <RewardHistoryLog language={language} ledger={ledger} onRefresh={onRefreshHistory}/>
    </div>}
  </section>;
};
