import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import {LanguageCode} from '../types';

type Entry={hash:string;name:string;valueUsd:string;btc:string;createdAt:number};
type Page={records:Entry[];remaining:number;total:number;exhausted:boolean;simulation:true};
export const MockPaymentFeed:React.FC<{language:LanguageCode}>=({language})=>{
  const [rows,setRows]=useState<Entry[]>([]);
  const [remaining,setRemaining]=useState(200);
  const [loading,setLoading]=useState(false);
  const [started,setStarted]=useState(false);
  const [error,setError]=useState('');
  const tr=language==='en'
    ?{title:'Latest payments — simulation',notice:'Fictional demonstration records. Not blockchain confirmations or transfers.',value:'Value',amount:'Bitcoin quantity',time:'Date',next:'Show next 10',end:'200 demonstration records shown. No records repeated.'}
    :language==='es'
    ?{title:'Últimos pagos — simulación',notice:'Datos ficticios de demostración. No son pagos ni confirmaciones en blockchain.',value:'Valor',amount:'Cantidad Bitcoin',time:'Fecha',next:'Mostrar próximos 10',end:'200 registros mostrados, sin repetición.'}
    :{title:'Últimos pagamentos — simulação',notice:'Registros fictícios de demonstração. Não são pagamentos ou confirmações na blockchain.',value:'Valor',amount:'Quantidade Bitcoin',time:'Horário',next:'Ver próximos 10',end:'200 registros demonstrativos exibidos, sem repetição.'};
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  async function next(){
    if(loading||remaining===0)return;
    setLoading(true);
    try{
      const data=await api<Page>('mock.payments.next',{});
      setRows(data.records);setRemaining(data.remaining);setStarted(true);setError('');
    }catch(e){setError((e as Error).message)}
    finally{setLoading(false)}
  }
  useEffect(()=>{void next()},[]);
  return <section data-testid="simulated-payments" className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-3 space-y-3">
    <h3 className="font-bold text-sm">{tr.title}</h3>
    <p className="text-xs text-amber-300">{tr.notice}</p>
    {error&&<p role="alert" className="text-xs text-red-300">{error}</p>}
    <div className="space-y-2">
      {rows.map(row=><article data-testid="simulated-payment-row" key={row.hash} className="p-2.5 bg-[#101629] rounded-xl border border-[#262e49] text-xs space-y-1">
        <div className="flex justify-between gap-2"><strong>{row.name}</strong><span>{new Date(row.createdAt*1000).toLocaleString(locale)}</span></div>
        <p className="font-mono text-[10px] break-all text-slate-400">{row.hash}</p>
        <div className="flex justify-between gap-2"><span>{tr.value}: US$ {row.valueUsd}</span><span>{tr.amount}: {row.btc} BTC</span></div>
      </article>)}
    </div>
    {started&&remaining===0&&<p data-testid="simulated-payments-exhausted" className="text-xs text-slate-400">{tr.end}</p>}
    {remaining>0&&<button type="button" disabled={loading} data-testid="simulated-payments-next"
      className="w-full rounded-xl bg-indigo-700 px-3 py-2.5 text-xs font-semibold disabled:opacity-50"
      onClick={()=>void next()}>{loading?'...':tr.next+' · '+remaining}</button>}
  </section>;
};
