import React,{useEffect,useState} from 'react';
import {ArrowLeft, Calendar, RefreshCw, ShieldCheck} from 'lucide-react';
import {LanguageCode} from '../../types';
import {api} from '../../services/api';

type Contract={id:number|string;plan_id:string;started_at:number;expires_at:number;adminEdited?:boolean};
type Props={language:LanguageCode;onBack:()=>void};
export const SubscriptionHistoryView:React.FC<Props>=({language,onBack})=>{
  const [entries,setEntries]=useState<Contract[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const loc=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const title=language==='en'?'Subscription history':language==='es'?'Historial de suscripciones':'Histórico de assinaturas';
  const tr=language==='en'
    ? {back:'Back',refresh:'Refresh',notice:'Subscription contracts saved in SQLite. VIP activation requires administrative payment confirmation.',
       empty:'No subscriptions registered.',start:'Start',end:'Expires',active:'Active',expired:'Ended'}
    :language==='es'
    ? {back:'Volver',refresh:'Actualizar',notice:'Contratos de suscripción guardados en SQLite. La activación VIP requiere confirmación administrativa del pago.',
       empty:'No hay suscripciones registradas.',start:'Inicio',end:'Vencimiento',active:'Vigente',expired:'Finalizado'}
    : {back:'Voltar',refresh:'Atualizar',notice:'Histórico dos contratos registrados no SQLite. Ativação VIP ocorre somente após confirmação administrativa.',
       empty:'Nenhuma assinatura registrada.',start:'Início',end:'Vencimento',active:'Vigente',expired:'Encerrado'};
  const refresh=async()=>{
    setLoading(true);
    try {const x=await api<{contracts:Contract[]}>('contracts.mine');setEntries(x.contracts);setError('');}
    catch(e){setError((e as Error).message);}
    finally{setLoading(false);}
  };
  useEffect(()=>{void refresh();},[]);
  return <section className="flex-1 flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="flex items-center justify-between p-4 border-b border-[#232943]">
      <button onClick={onBack} aria-label={tr.back}><ArrowLeft size={20}/></button>
      <h2 className="font-bold">{title}</h2>
      <button onClick={()=>void refresh()} aria-label={tr.refresh}><RefreshCw size={18}/></button>
    </header>
    <div className="p-4 overflow-y-auto space-y-3">
      <p className="text-xs text-slate-400">{tr.notice}</p>
      {loading&&<p>...</p>}
      {error&&<p role="alert" className="text-xs text-amber-300">{error}</p>}
      {!loading&&!entries.length&&<p className="text-xs text-slate-400">{tr.empty}</p>}
      {entries.map(x=><article key={x.id} className="p-4 rounded-2xl bg-[#1b2137] border border-[#272e4b] space-y-2">
        <div className="flex justify-between items-center"><strong>{x.plan_id}</strong><ShieldCheck className="text-indigo-400" size={18}/></div>
        <p className="text-xs text-slate-400 flex gap-2"><Calendar size={14}/> {tr.start}: {new Date(x.started_at*1000).toLocaleString(loc)}</p>
        <p className="text-xs text-slate-400">{tr.end}: {new Date(x.expires_at*1000).toLocaleString(loc)}</p>
        <p className="text-xs text-amber-300">{x.expires_at>Date.now()/1000?tr.active:tr.expired}</p>
        {x.adminEdited&&<p className="text-xs text-amber-300">{language==='en'?'Administratively edited demo history — not a verified payment':language==='es'?'Historial demostrativo editado, no pago verificado':'Histórico demonstrativo ajustado, não comprova pagamento'}</p>}
      </article>)}
    </div>
  </section>;
};
