import React, { useEffect, useRef, useState } from 'react';
import { Gift, Clock, Zap } from 'lucide-react';
import { MemberData } from '../services/api';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';
import { useProjectCopy } from '../i18n/copyMode';
import {UsdAmount} from './UsdMark';
import type { MiningCardTemplate } from './workspace/MiningCardTemplatesView';

type Props = {
  account: MemberData | null; language: LanguageCode; busy: boolean;
  liveBtc:string|null; liveBalanceUsd:number;
  onStart: () => void; onStop: () => void;
  onRewards: () => void; onHistory: () => void; onAvatarClick:()=>void; avatarLocked:boolean;
  returning:boolean; template:MiningCardTemplate;
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
  account,language,busy,liveBtc,liveBalanceUsd,onStart,onStop,onRewards,onHistory,onAvatarClick,avatarLocked,returning,template
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
  const cardFrame={
    aurora:'border-indigo-300/15 bg-gradient-to-br from-[#1b2340] via-[#171d32] to-[#101827] rounded-[1.75rem] shadow-[0_18px_45px_-24px_rgba(59,130,246,0.48)]',
    studio:'border-cyan-300/20 bg-[#0b1220] rounded-2xl shadow-[0_16px_42px_-24px_rgba(34,211,238,0.4)]',
    neon:'border-emerald-300/25 bg-gradient-to-br from-[#102820] via-[#13222b] to-[#11172b] rounded-[2rem] shadow-[0_18px_48px_-24px_rgba(52,211,153,0.5)]',
    minimal:'border-slate-500/30 bg-[#171d2a] rounded-2xl shadow-lg',
  }[template];
  const dashboardLayout=template==='studio'?'mb-4 grid gap-3 sm:grid-cols-2 sm:items-stretch':`mb-4 flex flex-col ${template==='neon'?'flex-col-reverse':''} gap-3`;
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
    <section data-mining-template={template} className={`relative isolate overflow-hidden border p-4 sm:p-6 ${cardFrame}`}>
      {template!=='minimal'&&<>
        <div aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-20 -z-10 h-52 w-52 rounded-full blur-3xl ${template==='neon'?'bg-emerald-400/15':'bg-blue-500/10'}`} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
      </>}

      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/70">ÁRBORIS · BTC</p>
          <h3 className="single-line-ellipsis text-sm font-black tracking-wide text-white sm:text-base">{d.mining}</h3>
        </div>
        <span data-testid="home-plan-daily-card" aria-label={`${planLabel} · USD ${account?.plan.dailyUsd ?? '0.00'}/${language==='en'?'day':language==='es'?'día':'dia'}`}
          className="inline-flex w-fit max-w-full items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-center font-mono text-[11px] font-bold leading-tight text-emerald-200 shadow-inner shadow-emerald-200/5">
          <span className="whitespace-nowrap">{planLabel} · <UsdAmount>{account?.plan.dailyUsd ?? '0.00'}</UsdAmount>/{language==='en'?'day':language==='es'?'día':'dia'}</span>
        </span>
      </div>

      <div className={dashboardLayout}>
      <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${template==='minimal'?'content-start':''}`}>
        <div className={`min-w-0 rounded-2xl border p-3 sm:p-4 ${template==='neon'?'border-amber-200/15 bg-black/25':template==='minimal'?'border-slate-500/15 bg-slate-950/30':'border-amber-200/10 bg-slate-950/35'}`}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{copy('homeBtcLabel')}</p>
          <strong data-testid="mining-live-btc" className="block truncate font-mono text-lg font-extrabold tabular-nums text-amber-200 sm:text-2xl">{liveBtc??'—'} <span className="text-xs font-bold">BTC</span></strong>
        </div>
        <div className={`min-w-0 rounded-2xl border p-3 sm:p-4 ${template==='neon'?'border-emerald-200/20 bg-black/25':template==='minimal'?'border-slate-500/15 bg-slate-950/30':'border-emerald-200/10 bg-slate-950/35'}`}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">USD</p>
          <strong data-testid="mining-live-usd" className="block truncate font-mono text-sm font-extrabold tabular-nums text-emerald-100 sm:text-base"><UsdAmount>{liveBalanceUsd.toFixed(8)}</UsdAmount></strong>
        </div>
      </div>

      <div className={`relative min-w-0 overflow-hidden rounded-2xl border px-3 py-4 sm:py-5 ${template==='neon'?'border-emerald-300/30 bg-gradient-to-br from-emerald-950/80 to-slate-950 shadow-inner shadow-emerald-300/10':template==='studio'?'border-cyan-300/20 bg-slate-900/90 shadow-inner shadow-cyan-300/5':template==='minimal'?'border-slate-600/50 bg-slate-900/75':'border-blue-300/20 bg-gradient-to-br from-[#111c36]/95 to-[#0d1426]/95 shadow-inner shadow-blue-300/5'}`}>
        {template!=='minimal'&&<div aria-hidden="true" className={`pointer-events-none absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent ${template==='neon'?'via-emerald-300/70':'via-blue-300/70'} to-transparent`} />}
        <div className="flex flex-col items-center text-center">
          <span className={`text-base font-extrabold tracking-wide text-white sm:text-lg ${template==='minimal'?'':'uppercase'}`}>{mockupMode?d.noHash:(language==='en'?'Processor':language==='es'?'Procesador':'Processador')}</span>
          <span className={`mt-1 font-black tabular-nums text-slate-100 ${template==='neon'?'text-2xl text-emerald-100 drop-shadow-[0_0_9px_rgba(110,231,183,0.55)]':'text-xl sm:text-2xl'}`}>{account?.plan.hashrate ?? '---'}</span>
          {!mockupMode&&<span className="sr-only">{d.noHash}</span>}
          <svg viewBox="0 0 120 70" className={`my-2 h-24 max-w-full sm:h-28 ${template==='minimal'?'w-36':'w-40 sm:w-48'} ${template==='neon'?'drop-shadow-[0_0_18px_rgba(52,211,153,0.4)]':'drop-shadow-[0_0_18px_rgba(59,130,246,0.24)]'}`} aria-label={copy('equipmentAlt')}>
            <rect x="10" y="10" width="95" height="50" rx="6" fill={template==='neon'?'#103c35':'#1e294b'} stroke={template==='neon'?'#6ee7b7':'#60a5fa'} strokeWidth="1.8"/>
            <circle cx="35" cy="35" r="16" fill="#0f172a" stroke={template==='neon'?'#a7f3d0':'#93c5fd'} strokeWidth="1.8"/>
            <circle cx="75" cy="35" r="16" fill="#0f172a" stroke={template==='neon'?'#a7f3d0':'#93c5fd'} strokeWidth="1.8"/>
            <path d="M35 21v28M21 35h28" stroke={template==='neon'?'#6ee7b7':'#60a5fa'} strokeWidth="2.5" className={status?'origin-[35px_35px] animate-spin':''}/>
            <path d="M75 21v28M61 35h28" stroke={template==='neon'?'#6ee7b7':'#60a5fa'} strokeWidth="2.5" className={status?'origin-[75px_35px] animate-spin':''}/>
            <circle cx="95" cy="52" r="7" fill="#f59e0b"/><text x="95" y="55" textAnchor="middle" fill="white" fontSize="8">₿</text>
          </svg>
          <p className="flex min-h-7 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-200 sm:text-sm">
            <span className={'h-2.5 w-2.5 rounded-full '+(status?'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse':'bg-slate-500')}/>
            {mockupMode?(status?d.active:d.inactive):(status?'Processor ON':'Processor OFF')}
          </p>
        </div>
      </div>
      </div>

      <button data-testid="mining-session-toggle" onClick={status?onStop:onStart}
        disabled={busy}
        className={'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-lg transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:py-4 '+
          (status?'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-emerald-950/30 hover:brightness-110':'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-rose-950/30 hover:brightness-110')}>
        {status?<><Zap size={18}/>{t.stopMining}</>:t.startMining}
      </button>

      {(status && ends!==null && ends!==undefined || isVip && account?.plan.expiresAt) && <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-slate-950/25 px-3 py-2.5 text-xs text-slate-300 sm:grid-cols-2">
        {status && ends!==null && ends!==undefined && <p data-testid="session-countdown" className="flex min-w-0 items-center gap-2"><Clock size={14} className="shrink-0 text-blue-300"/><span className="truncate">{d.session}: <strong className="font-mono text-white">{remaining}</strong></span></p>}
        {isVip && account?.plan.expiresAt && <p className="flex min-w-0 items-center gap-2"><Clock size={14} className="shrink-0 text-emerald-300"/><span className="truncate">{d.vip}: <strong className="text-white">{stamp(account.plan.expiresAt)}</strong></span></p>}
      </div>}
      {copy('homeNotice') && <p role="note" className="mt-3 rounded-xl border border-amber-200/10 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">{copy('homeNotice')}</p>}
    </section>
  </div>;
};
