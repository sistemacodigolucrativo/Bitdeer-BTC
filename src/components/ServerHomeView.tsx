import React, { useEffect, useRef, useState } from 'react';
import { Gift, Clock, Zap } from 'lucide-react';
import { MemberData } from '../services/api';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { useProjectCopy } from '../i18n/copyMode';

type Props = {
  account: MemberData | null; language: LanguageCode; busy: boolean;
  liveBtc:string|null; liveBalanceUsd:number;
  onStart: () => void; onStop: () => void;
  onRewards: () => void; onHistory: () => void; onAvatarClick:()=>void; avatarLocked:boolean;
  returning:boolean;
};
const details = {
  pt:{mining:'Painel de mineração', active:'Sessão ativa',
    inactive:'Sessão inativa',check:'Atualizar',history:'Histórico',rewards:'Recompensas',
    daily:'Bônus diário',claim:'Resgatar bônus',
    faq:'Perguntas frequentes',session:'Sua sessão encerra em',
    vip:'Plano VIP válido até', noHash:'Capacidade de mineração'},
  en:{mining:'Mining panel', active:'Session active',
    inactive:'Session inactive',check:'Refresh',history:'History',rewards:'Rewards',
    daily:'Daily bonus',claim:'Claim bonus',
    faq:'Frequently asked questions',session:'Your session ends in',
    vip:'VIP plan expires', noHash:'Mining capacity'},
  es:{mining:'Panel de minería', active:'Sesión activa',
    inactive:'Sesión inactiva',check:'Actualizar',history:'Historial',rewards:'Recompensas',
    daily:'Bono diario',claim:'Reclamar bono',
    faq:'Preguntas frecuentes',session:'Tu sesión termina en',
    vip:'Plan VIP hasta', noHash:'Capacidad de minería'}
};
const greetingCopy = {
  pt:{hello:'Olá,', welcome:'seja bem-vindo!', returning:'seja bem-vindo novamente!', member:'Membro', plan:'Plano'},
  en:{hello:'Hello,', welcome:'welcome!', returning:'welcome back!', member:'Member', plan:'Plan'},
  es:{hello:'Hola,', welcome:'te damos la bienvenida', returning:'te damos la bienvenida de nuevo', member:'Miembro', plan:'Plan'}
};
export const ServerHomeView: React.FC<Props> = ({
  account,language,busy,liveBtc,liveBalanceUsd,onStart,onStop,onRewards,onHistory,onAvatarClick,avatarLocked,returning
}) => {
  const t=translations[language]?.home ?? translations.pt.home;
  const d=details[language] ?? details.pt;
  const { copy, mockupMode } = useProjectCopy(language);
  const [clock,setClock]=useState(Date.now());
  const [avatarFailed,setAvatarFailed]=useState(false);
  const avatarUrl=account?.profile.avatarPhoto || account?.profile.avatarUrl || '';
  const welcome=greetingCopy[language] ?? greetingCopy.pt;
  const fullName=account?.profile.displayName.trim() || account?.user.login || welcome.member;
  const nameParts=fullName.split(/\s+/).filter(Boolean);
  const compactName=nameParts.length>2?`${nameParts.slice(0,2).join(' ')}…`:fullName;
  const planId=account?.plan.id ?? 'FREE';
  const planLabel=planId.toUpperCase()==='FREE'?'Free':planId.replace(/_/g,' ').toUpperCase();
  useEffect(()=>setAvatarFailed(false),[avatarUrl]);
  useEffect(()=>{
    const timer=setInterval(()=>setClock(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[]);
  const status=!!account?.mining.running &&
    (account.mining.sessionEndsAt===null || account.mining.sessionEndsAt>clock/1000) &&
    (account.plan.expiresAt===null || account.plan.expiresAt>clock/1000);
  const ends=account?.mining.sessionEndsAt;
  const seconds=ends ? Math.max(0,ends-Math.floor(clock/1000)):0;
  const remaining=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60]
    .map(value=>String(value).padStart(2,'0')).join(':');
  const isVip=account?.plan.id!=='FREE' && account?.plan.id!==undefined;
  const stamp=(v:number)=>new Date(v*1000).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR');
  return <div className="space-y-4 select-none pb-4">
    <div data-testid="home-welcome-card" className="flex items-center gap-3 bg-[#171b2d] border border-[#252c45] rounded-2xl p-3 shadow-sm">
      <div className="relative mr-1 h-10 w-10 shrink-0 overflow-visible">
        <button type="button" onClick={onAvatarClick} disabled={avatarLocked} aria-label={language==='en'?'Set profile image':language==='es'?'Definir imagen de perfil':'Definir imagem de perfil'}
          title={avatarLocked?(language==='en'?'Profile image already set':language==='es'?'Imagen de perfil ya definida':'Imagem de perfil já definida'):undefined}
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-white font-bold ring-2 ring-[#54c8d5]/30">
          {avatarUrl&&!avatarFailed?<img src={avatarUrl} alt="" onError={()=>setAvatarFailed(true)} className="h-full w-full object-cover"/>:fullName.charAt(0).toUpperCase()}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p data-testid="home-welcome-name" className="flex min-w-0 items-center gap-1 text-[11px] font-normal leading-tight text-slate-400">
          <span className="shrink-0 font-normal">{welcome.hello}</span>
          <strong className="min-w-0 flex-1 single-line-ellipsis font-bold text-slate-200" title={fullName}>{compactName}</strong>
        </p>
        <p data-testid="home-welcome-message" className="mt-0.5 single-line-ellipsis text-xs font-normal leading-tight text-white">
          {returning?welcome.returning:welcome.welcome}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <button type="button" data-testid="home-rewards-shortcut" onClick={onRewards}
          aria-label={d.rewards} title={d.rewards}
          className="flex items-center justify-center rounded-lg border border-[#4f46e5]/60 bg-indigo-500/15 p-2 text-indigo-400"><Gift size={24}/></button>
      </div>
    </div>
    <section className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 overflow-hidden shadow-md">
      <div className="mb-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h3 className="single-line-ellipsis min-w-0 text-[clamp(0.625rem,2.8vw,0.75rem)] font-black tracking-wider text-slate-300 uppercase">{d.mining}</h3>
        <span data-testid="home-plan-daily-card" aria-label={`${planLabel} · USD ${account?.plan.dailyUsd ?? '0.00'}/${language==='en'?'day':language==='es'?'día':'dia'}`}
          className="inline-flex w-fit min-w-max shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-center font-mono text-[10px] font-bold leading-tight text-emerald-400">
          <span className="whitespace-nowrap text-center">
             {planLabel} · USD {account?.plan.dailyUsd ?? '0.00'}/{language==='en'?'day':language==='es'?'día':'dia'}
          </span>
        </span>
      </div>
      <div className="bg-[#11182b] border border-[#303b59] rounded-2xl px-4 py-3 mb-4">
        <p className="text-[11px] text-slate-400">
          {copy('homeBtcLabel')}
        </p>
        <strong data-testid="mining-live-btc" className="text-2xl font-bold font-mono text-amber-300">{liveBtc??'—'} BTC</strong>

        <p data-testid="mining-live-usd" className="text-xs text-slate-300 mt-1">
          USD {liveBalanceUsd.toFixed(8)}
        </p>
      </div>
      <div className={'flex items-center mb-5 '+(mockupMode?'justify-between':'justify-center')}>
        {mockupMode&&<div>
          <div className="text-2xl font-black text-white">{account?.plan.hashrate ?? '---'}</div>
          <p className="text-[11px] mt-1 text-slate-300">{d.noHash}</p>
          <p className="text-[11px] mt-1 flex items-center gap-2">
            <span className={'w-2 h-2 rounded-full '+(status?'bg-emerald-400 animate-pulse':'bg-slate-500')}/>
            {status?d.active:d.inactive}
          </p>
        </div>}
        <div className="shrink-0 flex flex-col items-center gap-1">
        {!mockupMode&&<span className="text-base font-bold text-white text-center">{language==='en'?'Processor':language==='es'?'Procesador':'Processador'}</span>}
        {!mockupMode&&<span className="text-lg font-bold text-slate-100 text-center">{account?.plan.hashrate ?? '---'}</span>}
        <svg viewBox="0 0 120 70" className={(mockupMode?'w-24 h-16':'w-36 h-24 max-w-full')+' drop-shadow-md'} aria-label={copy('equipmentAlt')}>
          <rect x="10" y="10" width="95" height="50" rx="6" fill="#1e294b" stroke="#3b82f6" strokeWidth="1.5"/>
          <circle cx="35" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <circle cx="75" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <path d="M35 21v28M21 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[35px_35px] animate-spin':''}/>
          <path d="M75 21v28M61 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[75px_35px] animate-spin':''}/>
          <circle cx="95" cy="52" r="7" fill="#f59e0b"/><text x="95" y="55" textAnchor="middle" fill="white" fontSize="8">₿</text>
        </svg>
        {!mockupMode&&<p className="text-sm flex items-center justify-center gap-2"><span className={'w-2.5 h-2.5 rounded-full '+(status?'bg-emerald-400 animate-pulse':'bg-slate-500')}/>{status?'Processor ON':'Processor OFF'}</p>}
        </div>
      </div>
      <button data-testid="mining-session-toggle" onClick={status?onStop:onStart}
        disabled={busy}
        className={'w-full py-4 px-4 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-40 '+
          (status?'bg-emerald-600 hover:bg-emerald-500':'bg-[#f43f5e] hover:bg-[#e11d48]')}>
        {status?<><Zap size={18}/>{t.stopMining}</>:t.startMining}
      </button>
      {status && ends!==null && ends!==undefined && <p data-testid="session-countdown" className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Clock size={14}/>{d.session}: {remaining}</p>}
      {isVip && account?.plan.expiresAt && <p className="mt-2 text-xs text-slate-400">{d.vip}: {stamp(account.plan.expiresAt)}</p>}
      {copy('homeNotice') && <p role="note" className="mt-3 text-[11px] leading-relaxed text-amber-200/90">{copy('homeNotice')}</p>}
    </section>
  </div>;
};
