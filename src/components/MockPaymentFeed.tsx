import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import {LanguageCode} from '../types';

type Entry={hash:string;name:string;valueUsd:string;btc:string;createdAt:number};
type LatestPayments={records:Entry[];total:number;simulation:true};
export const MockPaymentFeed:React.FC<{language:LanguageCode}>=({language})=>{
  const [rows,setRows]=useState<Entry[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const tr=language==='en'
    ?{title:'Latest BTC Payments',notice:'Fictional demonstration records. Not blockchain confirmations or transfers.',value:'Value',amount:'Bitcoin quantity',loading:'Loading records…'}
    :language==='es'
    ?{title:'Últimos Pagos BTC',notice:'Datos ficticios de demostración. No son pagos ni confirmaciones en blockchain.',value:'Valor',amount:'Cantidad Bitcoin',loading:'Cargando registros…'}
    :{title:'Últimos Pagamentos BTC',notice:'Registros fictícios de demonstração. Não são pagamentos ou confirmações na blockchain.',value:'Valor',amount:'Quantidade Bitcoin',loading:'Carregando registros…'};
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';

  useEffect(()=>{
    let mounted=true;
    let pending=false;
    async function load(){
      if(pending)return;
      pending=true;
      try{
        // Backend returns fresh fictional records, using its verified BTC/USD quote.
        // The IANA timezone makes the two calendar dates local to this viewer.
        const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
        const data=await api<LatestPayments>('mock.payments.latest',{timezone});
        if(mounted){
          setRows(data.records.slice(0,10));
          setError('');
        }
      }catch(e){
        if(mounted){
          // Do not display outdated BTC equivalents as if the quote were current.
          setRows([]);
          setError((e as Error).message);
        }
      }finally{
        pending=false;
        if(mounted)setLoading(false);
      }
    }
    void load();
    // Keep the quote current and update relative dates across local midnight.
    const timer=window.setInterval(()=>{void load()},60000);
    return ()=>{mounted=false;window.clearInterval(timer)};
  },[]);

  return <section data-testid="simulated-payments" className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-3 space-y-3">
    <h3 className="font-bold text-sm">{tr.title}</h3>
    <p className="text-xs text-amber-300">{tr.notice}</p>
    {loading&&rows.length===0&&!error&&<p role="status" className="text-xs text-slate-400">{tr.loading}</p>}
    {error&&<p role="alert" className="text-xs text-red-300">{error}</p>}
    <div className="space-y-2">
      {rows.map(row=><article data-testid="simulated-payment-row" key={row.hash} className="p-2.5 bg-[#101629] rounded-xl border border-[#262e49] text-xs space-y-1">
        <div className="flex justify-between gap-2"><strong>{row.name}</strong><span>{new Date(row.createdAt*1000).toLocaleString(locale)}</span></div>
        <p className="font-mono text-[10px] break-all text-slate-400">{row.hash}</p>
        <div className="flex justify-between gap-2"><span>{tr.value}: US$ {row.valueUsd}</span><span>{tr.amount}: {row.btc} BTC</span></div>
      </article>)}
    </div>
  </section>;
};
