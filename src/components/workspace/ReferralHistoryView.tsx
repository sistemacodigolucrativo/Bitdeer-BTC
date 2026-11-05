import React,{useEffect,useState} from 'react';
import {ArrowLeft,ChevronRight,Copy,RefreshCw,Users} from 'lucide-react';
import {api} from '../../services/api';
import {LanguageCode} from '../../types';

type History={id:number;referredAlias:string;rewardUsd:string;createdAt:number};
type Data={code:string;history:History[];totalUsd:string;count:number;unit:string};
type Props={language:LanguageCode;onBack?:()=>void;embedded?:boolean};
export const ReferralHistoryView:React.FC<Props>=({language,onBack,embedded=false})=>{
  const [data,setData]=useState<Data|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [historyOpen,setHistoryOpen]=useState(false);
  const copy=language==='en'?{
    title:'Referrals',total:'Previous referral credits',empty:'No registered referrals',
    registrations:'Registered members',copy:'Copy invitation',history:'Referral history',
    warn:'Only completed registrations appear in the history.'}
    :language==='es'?{
    title:'Referidos',total:'Créditos anteriores por invitación',empty:'No hay referidos registrados',
    registrations:'Miembros registrados',copy:'Copiar invitación',history:'Historial de referidos',
    warn:'Solo los registros completados aparecen en el historial.'}
    :{
    title:'Indicações',total:'Créditos anteriores por indicação',empty:'Nenhuma indicação cadastrada',
    registrations:'Membros cadastrados',copy:'Copiar convite',history:'Histórico de indicações',
    warn:'Somente cadastros concluídos entram no histórico.'};
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const refresh=async()=>{try{
    setData(await api<Data>('referrals.mine'));setError('');
  }catch(e){setError((e as Error).message)}};
  useEffect(()=>{void refresh()},[]);
  const share=async()=>{if(!data)return;
    const link=window.location.origin+'/?invite='+encodeURIComponent(data.code);
    try{await navigator.clipboard.writeText(link);setNotice(copy.copy);}
    catch{setNotice(link);}
  };
  const backLabel=language==='en'?'Back':language==='es'?'Volver':'Voltar';
  const refreshLabel=language==='en'?'Refresh':language==='es'?'Actualizar':'Atualizar';
  return <section data-testid="referrals-in-rewards"
    className={embedded?'min-w-0 space-y-3':
      'flex-1 flex flex-col bg-[#121626] text-white overflow-hidden'}>
    {!embedded&&<header className="p-4 border-b border-[#232943] flex justify-between items-center">
      <button onClick={onBack} aria-label={backLabel}><ArrowLeft size={24}/></button>
      <strong className="text-sm flex items-center gap-2"><Users size={17} className="text-indigo-300"/>{copy.title}</strong>
    </header>}
    <div className={embedded?'min-w-0 space-y-3':'p-4 space-y-4 overflow-y-auto overscroll-y-contain touch-pan-y member-vertical-scroll'}>
      {error&&<p className="text-amber-300 text-xs" role="alert">{error}</p>}
      {notice&&<p className="text-emerald-300 text-xs" role="status">{notice}</p>}
      <div data-testid="referral-credits-summary" className="bg-[#1b2137] border border-[#272e4b] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">{copy.total}</p>
          <button type="button" onClick={()=>void refresh()} aria-label={refreshLabel}
            className="shrink-0 p-2 rounded-lg text-indigo-300"><RefreshCw size={20}/></button>
        </div>
        {data&&<>
        <strong className="text-xl">US$ {data.totalUsd}</strong>
        <p className="text-xs"><Users size={14} className="inline"/> {copy.registrations}: {data.count}</p>
        <div className="text-xs font-mono break-all">{data.code}</div>
        <button className="w-full bg-indigo-600 p-2 rounded-xl text-xs font-semibold flex gap-2 justify-center"
          onClick={()=>void share()}><Copy size={16}/>{copy.copy}</button>
        <p className="text-xs text-amber-300">{copy.warn}</p>
        </>}
      </div>
      {embedded?<button type="button" data-testid="referral-history-toggle"
        aria-expanded={historyOpen} aria-controls="referral-history-panel" onClick={()=>setHistoryOpen(open=>!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[#2c3551] bg-[#1b2137] font-semibold text-xs">
        {copy.history}<ChevronRight size={16} className={'shrink-0 transition-transform '+(historyOpen?'rotate-90':'')}/>
      </button>:<h3 className="font-bold text-sm">{copy.history}</h3>}
      {(!embedded||historyOpen)&&<div id="referral-history-panel" role="region" aria-label={copy.history}>
        {data&&!data.history.length&&<p className="text-slate-400 text-xs">{copy.empty}</p>}
        <ul className="divide-y divide-[#272e4b]">
          {data?.history.map(entry=><li key={entry.id}
            className="py-3 text-sm flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1"><strong className="break-words">{entry.referredAlias}</strong>
              <p className="text-xs text-slate-400">{new Date(entry.createdAt*1000).toLocaleString(locale)}</p></div>
            <strong className="max-w-full break-words">US$ {entry.rewardUsd}</strong>
          </li>)}
        </ul>
      </div>}
    </div>
  </section>;
};
