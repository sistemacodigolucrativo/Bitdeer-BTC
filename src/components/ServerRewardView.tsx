import React, {useEffect,useState} from 'react';
import {Gift, Coins, ShieldCheck, Clock, ChevronRight, Sparkles} from 'lucide-react';
import {MemberData} from '../services/api';
import {LanguageCode} from '../types';
type Props={account:MemberData|null;language:LanguageCode;busy:boolean;
  onClaim:()=>void;onHistory:()=>void};
export const ServerRewardView:React.FC<Props>=({account,language,busy,onClaim,onHistory})=>{
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return ()=>window.clearInterval(timer);},[]);
  const last=account?.mining.lastBonusAt??null;
  const seconds=last===null?0:Math.max(0,(last+86400)-Math.floor(now/1000));
  const available=!!account&&seconds===0;
  const count=(n:number)=>n.toString().padStart(2,'0');
  const countdown=count(Math.floor(seconds/3600))+':'+count(Math.floor((seconds%3600)/60))+':'+count(seconds%60);
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const t=language==='en'?{
    title:'Rewards',available:'Daily reward',usd:'USD reward',sats:'Satoshi reward',
    claim:'Claim both daily bonuses',waiting:'Next claim in',frequency:'Once every 24 hours',
    ledger:'Reward history',notice:'One claim grants both bonuses. Values are internal ledger units, not actual mined BTC.'}
    :language==='es'?{
    title:'Recompensas',available:'Recompensa diaria',usd:'Bono USD',sats:'Bono en satoshis',
    claim:'Reclamar ambos bonos diarios',waiting:'Próximo reclamo en',frequency:'Cada 24 horas',
    ledger:'Historial de recompensas',notice:'Un reclamo concede ambos bonos. Son unidades internas, no BTC reales.'}
    :{
    title:'Recompensas',available:'Recompensa diária',usd:'Bônus em USD',sats:'Bônus em satoshis',
    claim:'Resgatar ambos os bônus diários',waiting:'Próximo resgate em',frequency:'A cada 24 horas',
    ledger:'Histórico de recompensas',notice:'Um único resgate credita ambos os bônus. São unidades internas, não BTC efetivamente minerado.'};
  return <div className="space-y-4 pb-4">
    <header className="flex items-center justify-between">
      <div><h2 className="text-xl font-black">{t.title}</h2>
        <p className="text-xs text-slate-400 mt-1">{t.frequency}</p></div>
      <Gift size={25} className="text-indigo-400"/>
    </header>
    <div className="rounded-3xl border border-[#262e49] bg-[#191e32] p-5 text-center shadow-md relative overflow-hidden">
      <div className="absolute w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl -top-20 right-5"/>
      <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3">
        <Sparkles size={36} className="text-indigo-300"/>
      </div>
      <strong className="text-xl">{t.available}</strong>
      <p className="text-xs text-slate-400 mt-2">{account?.plan.id||'FREE'}</p>
      {seconds>0&&<div className="flex justify-center items-center text-amber-300 gap-2 mt-3 text-sm font-mono font-bold">
        <Clock size={16}/>{t.waiting}: {countdown}
      </div>}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-[#262e49] bg-[#171b2d] p-4 text-center">
        <Gift className="mx-auto text-indigo-400 mb-2" size={24}/>
        <p className="text-xs text-slate-400">{t.usd}</p>
        <p className="text-lg font-black mt-2">US$ {account?.plan.bonusUsd??'0.00'}</p>
      </div>
      <div className="rounded-2xl border border-[#262e49] bg-[#171b2d] p-4 text-center">
        <Coins className="mx-auto text-amber-400 mb-2" size={24}/>
        <p className="text-xs text-slate-400">{t.sats}</p>
        <p className="text-lg font-black mt-2">{(account?.plan.bonusSatoshis??0).toLocaleString(locale)}</p>
      </div>
    </div>
    <div className="rounded-2xl border border-[#262e49] bg-[#171b2d] p-4 space-y-4">
      <p className="flex gap-2 text-xs text-slate-400"><ShieldCheck size={17}/>{t.notice}</p>
      <button onClick={onClaim} disabled={busy||!available}
        className="w-full p-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs disabled:opacity-40">
        {available?t.claim:t.waiting+' '+countdown}
      </button>
    </div>
    <button onClick={onHistory}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#171b2d] border border-[#262e49] text-sm">
      {t.ledger}<ChevronRight size={18}/>
    </button>
  </div>;
};