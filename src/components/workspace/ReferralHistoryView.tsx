import React,{useEffect,useState} from 'react';
import {ArrowLeft,Copy,RefreshCw,Users} from 'lucide-react';
import {api} from '../../services/api';
import {LanguageCode} from '../../types';

type History={id:number;referredAlias:string;rewardUsd:string;createdAt:number};
type Data={code:string;history:History[];totalUsd:string;count:number;unit:string};
type Props={language:LanguageCode;onBack?:()=>void;embedded?:boolean};
export const ReferralHistoryView:React.FC<Props>=({language,onBack,embedded=false})=>{
  const [data,setData]=useState<Data|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const copy=language==='en'?{
    title:'Referrals',total:'Internal referral rewards',empty:'No registered referrals',
    registrations:'Registered members',copy:'Copy invitation',history:'Referral history',
    warn:'Only real, completed registrations are counted. USD is an internal credit, not BTC.'}
    :language==='es'?{
    title:'Referidos',total:'Créditos internos por invitación',empty:'No hay referidos registrados',
    registrations:'Miembros registrados',copy:'Copiar invitación',history:'Historial de referidos',
    warn:'Solo se cuentan registros completados. USD es un crédito interno, no BTC.'}
    :{
    title:'Indicações',total:'Créditos internos por indicação',empty:'Nenhuma indicação cadastrada',
    registrations:'Membros cadastrados',copy:'Copiar convite',history:'Histórico de indicações',
    warn:'Somente cadastros concluídos entram no histórico. USD é crédito interno, não BTC.'};
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
    className={embedded?'rounded-2xl border border-[#2a3350] bg-[#151b2e] p-3 space-y-3':
      'flex-1 flex flex-col bg-[#121626] text-white overflow-hidden'}>
    <header className={embedded?'flex items-center justify-between gap-3':'p-4 border-b border-[#232943] flex justify-between items-center'}>
      {!embedded&&<button onClick={onBack} aria-label={backLabel}><ArrowLeft size={20}/></button>}
      <strong className="text-sm flex items-center gap-2"><Users size={17} className="text-indigo-300"/>{copy.title}</strong>
      <button onClick={()=>void refresh()} aria-label={refreshLabel}
        className="p-2 bg-[#242c47] rounded-lg"><RefreshCw size={16}/></button>
    </header>
    <div className={embedded?'space-y-3':'p-4 space-y-4 overflow-y-auto'}>
      {error&&<p className="text-amber-300 text-xs" role="alert">{error}</p>}
      {notice&&<p className="text-emerald-300 text-xs" role="status">{notice}</p>}
      {data&&<><div className="bg-[#1b2137] border border-[#272e4b] rounded-xl p-3 space-y-2">
        <p className="text-xs text-slate-400">{copy.total}</p>
        <strong className="text-xl">US$ {data.totalUsd}</strong>
        <p className="text-xs"><Users size={14} className="inline"/> {copy.registrations}: {data.count}</p>
        <div className="text-xs font-mono bg-[#101627] p-3 rounded-xl">{data.code}</div>
        <button className="w-full bg-indigo-600 p-2 rounded-xl text-xs font-semibold flex gap-2 justify-center"
          onClick={()=>void share()}><Copy size={16}/>{copy.copy}</button>
        <p className="text-xs text-amber-300">{copy.warn}</p>
      </div>
      <h3 className="font-bold text-sm">{copy.history}</h3>
      {!data.history.length&&<p className="text-slate-400 text-xs">{copy.empty}</p>}
      {data.history.map(entry=><div key={entry.id}
        className="p-3 border border-[#272e4b] rounded-xl bg-[#1b2137] text-sm flex justify-between gap-2">
        <div><strong>{entry.referredAlias}</strong>
          <p className="text-xs text-slate-400">{new Date(entry.createdAt*1000).toLocaleString(locale)}</p></div>
        <strong>US$ {entry.rewardUsd}</strong>
      </div>)}</>}
    </div>
  </section>;
};
