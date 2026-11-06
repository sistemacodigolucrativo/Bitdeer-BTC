import React, { useEffect, useState } from 'react';
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
export const ServerHomeView: React.FC<Props> = ({
  account,language,busy,liveBtc,liveBalanceUsd,onStart,onStop,onRewards,onHistory,onAvatarClick,avatarLocked
}) => {
  const t=translations[language]?.home ?? translations.pt.home;
  const d=details[language] ?? details.pt;
  const { copy } = useProjectCopy(language);
  const [clock,setClock]=useState(Date.now());
  const [avatarFailed,setAvatarFailed]=useState(false);
  const avatarUrl=account?.profile.avatarUrl ?? '';
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
      <button type="button" onClick={onAvatarClick} disabled={avatarLocked} aria-label={language==='en'?'Set profile image':language==='es'?'Definir imagen de perfil':'Definir imagem de perfil'}
        title={avatarLocked?(language==='en'?'Profile image already set':language==='es'?'Imagen de perfil ya definida':'Imagem de perfil já definida'):undefined}
        className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-emerald-600 flex justify-center items-center text-white font-bold">
        {avatarUrl&&!avatarFailed?<img src={avatarUrl} alt="" onError={()=>setAvatarFailed(true)} className="h-full w-full object-cover"/>:(account?.profile.displayName || account?.user.login || 'M').charAt(0).toUpperCase()}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 truncate">{language==='en'?'Welcome back':language==='es'?'Bienvenido de nuevo':'Boas-vindas'}</p>
        <p className="text-sm font-extrabold text-white truncate">{account?.profile.displayName || account?.user.login || (language==='en'?'Member':language==='es'?'Miembro':'Membro')}</p>
      </div>
      <div className="flex shrink-0 items-center">
        <button type="button" data-testid="home-rewards-shortcut" onClick={onRewards}
          aria-label={d.rewards} title={d.rewards}
          className="flex items-center justify-center rounded-lg border border-[#4f46e5]/60 bg-indigo-500/15 p-2 text-indigo-400"><Gift size={24}/></button>
      </div>
    </div>
    <section className="bg-[#191e32] border border-[#262e49] rounded-3xl p-5 overflow-hidden shadow-md">
      <div className="flex justify-between items-center gap-2 mb-4">
        <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">{d.mining}</h3>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
          {account?.plan.id ?? 'FREE'} · US$ {account?.plan.dailyUsd ?? '0.00'}/{language==='en'?'day':language==='es'?'día':'dia'}
        </span>
      </div>
      <div className="bg-[#11182b] border border-[#303b59] rounded-2xl px-4 py-3 mb-4">
        <p className="text-[11px] text-slate-400">
          {copy('homeBtcLabel')}
        </p>
        <strong data-testid="mining-live-btc" className="text-2xl font-bold font-mono text-amber-300">{liveBtc??'—'} BTC</strong>

        <p data-testid="mining-live-usd" className="text-xs text-slate-300 mt-1">
          US$ {liveBalanceUsd.toFixed(8)}
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
        <svg viewBox="0 0 120 70" className="w-24 h-16 drop-shadow-md" aria-label={copy('equipmentAlt')}>
          <rect x="10" y="10" width="95" height="50" rx="6" fill="#1e294b" stroke="#3b82f6" strokeWidth="1.5"/>
          <circle cx="35" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <circle cx="75" cy="35" r="16" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
          <path d="M35 21v28M21 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[35px_35px] animate-spin':''}/>
          <path d="M75 21v28M61 35h28" stroke="#60a5fa" strokeWidth="2" className={status?'origin-[75px_35px] animate-spin':''}/>
          <circle cx="95" cy="52" r="7" fill="#f59e0b"/><text x="95" y="55" textAnchor="middle" fill="white" fontSize="8">₿</text>
        </svg>
      </div>
      <button onClick={status?onStop:onStart}
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
