import React, { useEffect, useState } from 'react';
import { Coins, Gift, Info, Lock, RefreshCw, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { MemberData } from '../services/api';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

type Props = {
  account: MemberData | null; language: LanguageCode; busy: boolean; btcUsd:number|null;
  onStart: () => void; onStop: () => void; onRefresh: () => void;
  onRewards: () => void; onHistory: () => void;
};
const details = {
  pt:{balance:'Saldo interno (USD)',mining:'Painel de mineração', active:'Mineração ativa',
    inactive:'Sessão inativa',check:'Atualizar',history:'Histórico',rewards:'Recompensas',
    daily:'Bônus diário',claim:'Resgatar bônus',notice:'Registros internos de recompensas. Não comprovam Bitcoin efetivamente minerado.',
    faq:'Perguntas frequentes',session:'Fim da sessão',cooldown:'Próxima sessão',
    vip:'Plano VIP válido até', noHash:'Capacidade ilustrativa'},
  en:{balance:'Internal USD balance',mining:'Mining panel', active:'Mining running',
    inactive:'Mining stopped',check:'Refresh',history:'History',rewards:'Rewards',
    daily:'Daily bonus',claim:'Claim bonus',notice:'Internal rewards only. This does not prove actual Bitcoin mining.',
    faq:'Frequently asked questions',session:'Session ends',cooldown:'Next session',
    vip:'VIP plan expires', noHash:'Illustrative capacity'},
  es:{balance:'Saldo interno USD',mining:'Panel de minería', active:'Minería activa',
    inactive:'Minería detenida',check:'Actualizar',history:'Historial',rewards:'Recompensas',
    daily:'Bono diario',claim:'Reclamar bono',notice:'Recompensas internas, no prueba de minería real de Bitcoin.',
    faq:'Preguntas frecuentes',session:'Fin de sesión',cooldown:'Próxima sesión',
    vip:'Plan VIP hasta', noHash:'Capacidad ilustrativa'}
};
export const ServerHomeView: React.FC<Props> = ({
  account,language,busy,btcUsd,onStart,onStop,onRefresh,onRewards,onHistory
}) => {
  const t=translations[language]?.home ?? translations.pt.home;
  const d=details[language] ?? details.pt;
  const [expanded,setExpanded]=useState(false);
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{
    const timer=setInterval(()=>setClock(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[]);
  const status=account?.mining.running ?? false;
  const ends=account?.mining.sessionEndsAt;
  const seconds=ends ? Math.max(0,ends-Math.floor(clock/1000)):0;
  const remaining=Math.floor(seconds/60).toString().padStart(2,'0')+':'+
    (seconds%60).toString().padStart(2,'0');
  const inCooldown=!!(account?.mining.cooldownUntil && account.mining.cooldownUntil>clock/1000);
  const isVip=account?.plan.id!=='FREE' && account?.plan.id!==undefined;
  const terminalEnd=account?.mining.sessionEndsAt ?? account?.plan.expiresAt ?? Math.floor(clock/1000);
  const secondsSinceSync=account?.mining.running
    ? Math.max(0,Math.min(Math.floor(clock/1000),terminalEnd)-(account?.asOf??Math.floor(clock/1000))) : 0;
  const simulatedUsd=Number(account?.mining.balanceUsd??'0')+
    secondsSinceSync*Number(account?.plan.dailyUsd??'0')/86400;
  const estimatedBtc=btcUsd && btcUsd>0 ? (simulatedUsd/btcUsd).toFixed(8) : '—';
  const stamp=(v:number)=>new Date(v*1000).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR');
  return <div className="space-y-4 select-none pb-4">
    <div className="flex items-center gap-3 bg-[#171b2d] border border-[#252c45] rounded-2xl p-3 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-emerald-600 flex justify-center items-center text-white font-bold">
        {(account?.profile.displayName || account?.user.login || 'M').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 truncate">{language==='en'?'Welcome back':language==='es'?'Bienvenido de nuevo':'Boas-vindas'}</p>
        <p className="text-sm font-extrabold text-white truncate">{account?.profile.displayName || account?.user.login || 'Membro'}</p>
      </div>
      <button aria-label={d.check} onClick={onRefresh} className="text-slate-300"><RefreshCw size={18}/></button>
    </div>
    <section className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 overflow-hidden shadow-md">
      <div className="flex justify-between items-center gap-2 mb-4">
        <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">{d.mining}</h3>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
          {account?.plan.id ?? 'FREE'} · US$ {account?.plan.dailyUsd ?? '0.00'}/dia
        </span>
      </div>
      <div className="bg-[#11182b] border border-[#303b59] rounded-2xl px-4 py-3 mb-4">
        <p className="text-[11px] text-slate-400">
          {language==='en'?'Simulated Bitcoin counter':language==='es'?'Contador Bitcoin simulado':'Contador de Bitcoin simulado'}
        </p>
        <strong className="text-2xl font-bold font-mono text-amber-300">{estimatedBtc} BTC</strong>
        <p className="text-xs text-slate-300 mt-1">
          {language==='en'?'Estimated USD equivalent':language==='es'?'Equivalencia estimada en USD':'Equivalência estimada em USD'}:
          {' '}US$ {simulatedUsd.toFixed(8)}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {language==='en'?'Internal projection between server updates. Not real blockchain BTC.':
          language==='es'?'Proyección interna; no representa BTC real de blockchain.':
          'Projeção interna entre atualizações. Não representa BTC real na blockchain.'}
        </p>
      </div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-2xl font-black text-white">
            {account?.plan.hashrate ?? '---'}
          </div>
          <p className="text-[11px] mt-1 text-slate-300">{d.noHash}</p>
          <p className="text-[11px] mt-1 flex items-center gap-2">
            <span className={'w-2 h-2 rounded-full '+(status?'bg-emerald-400 animate-pulse':'bg-slate-500')}/>
            {status?d.active:d.inactive}
          </p>
        </div>
        <svg viewBox="0 0 120 70" className="w-24 h-16 drop-shadow-md" aria-label="Equipamento gráfico ilustrativo">
          <rect x="10" y="10" width="95" height="50" rx="6" fill="#1e294b" stroke="#3b82f6" strokeWidth="1.5"/>
          <circle cx="35" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <circle cx="75" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <path d="M35 21v28M21 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[35px_35px] animate-spin':''}/>
          <path d="M75 21v28M61 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[75px_35px] animate-spin':''}/>
          <circle cx="95" cy="52" r="7" fill="#f59e0b"/><text x="95" y="55" textAnchor="middle" fill="white" fontSize="8">₿</text>
        </svg>
      </div>
      <button onClick={status?onStop:onStart}
        disabled={busy || (!status && inCooldown)}
        className={'w-full py-4 px-4 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-40 '+
          (status?'bg-emerald-600 hover:bg-emerald-500':'bg-[#f43f5e] hover:bg-[#e11d48]')}>
        {status?<><Zap size={18}/>{t.stopMining}{ends?' • '+remaining:''}</>:t.startMining}
      </button>
      {ends!==null && ends!==undefined && <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Clock size={14}/>{d.session}: {stamp(ends)}</p>}
      {inCooldown && <p className="mt-2 text-xs text-amber-300">{d.cooldown}: {stamp(account!.mining.cooldownUntil!)}</p>}
      {isVip && account?.plan.expiresAt && <p className="mt-2 text-xs text-slate-400">{d.vip}: {stamp(account.plan.expiresAt)}</p>}
    </section>
    <section className="bg-[#171b2d] border border-[#232a43] rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex justify-center items-center font-bold">＄</div>
          <div><p className="text-[11px] text-slate-400">{d.balance}</p>
            <p className="text-lg font-mono font-extrabold">US$ {account?.mining.balanceUsd ?? '0.00000000'}</p></div>
        </div>
        <Lock size={16} className="text-slate-400"/>
      </div>
      <p className="text-[10px] text-slate-400 mt-3">{d.notice}</p>
      <button onClick={onHistory} className="text-xs text-indigo-300 mt-3 underline">{d.history}</button>
    </section>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3 space-y-3">
        <p className="text-[11px] text-slate-300 font-bold">{d.daily}</p>
        <div className="flex items-center gap-2"><Gift size={19} className="text-indigo-400"/>
          <span className="text-base font-black">US$ {account?.plan.bonusUsd ?? '0.00'} <small className="text-slate-400 text-xs">/24h</small></span>
        </div>
        <button onClick={onRewards} className="w-full bg-[#6366f1] px-1 py-2 rounded-xl text-xs font-bold">{d.rewards}</button>
      </div>
      <div className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-3 space-y-3">
        <p className="text-[11px] text-slate-300 font-bold">Satoshis</p>
        <div className="flex items-center gap-2"><Coins size={19} className="text-amber-400"/>
          <span className="font-black">{(account?.mining.bonusSatoshisBalance ?? 0).toLocaleString()}</span>
        </div>
        <button onClick={onRewards} className="w-full bg-[#f43f5e] px-1 py-2 rounded-xl text-xs font-bold">{d.claim}</button>
      </div>
    </div>
    <section className="bg-[#171b2d] border border-[#232a43] rounded-2xl p-4">
      <button className="w-full flex justify-between items-center text-xs font-bold" onClick={()=>setExpanded(v=>!v)}>
        <span className="flex items-center gap-2"><Info size={16}/>{d.faq}</span>
        {expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
      </button>
      {expanded && <div className="border-t border-[#232a43] mt-3 pt-3 space-y-2 text-xs text-slate-400">
        <p>{d.notice}</p><p>FREE: {account?.plan.sessionSeconds || 7200}s por sessão. VIP: conforme contrato vigente.</p>
        <p>Os benefícios são calculados no servidor, não no armazenamento do navegador.</p>
      </div>}
    </section>
  </div>;
};