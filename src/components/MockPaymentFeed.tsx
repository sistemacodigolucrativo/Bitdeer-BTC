import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import {LanguageCode} from '../types';

type Entry={hash:string;name:string;country:string;flag:string;valueUsd:string;btc:string;createdAt:number};
type LatestPayments={records:Entry[];total:number;simulation:true};

export const MockPaymentFeed:React.FC<{language:LanguageCode}>=({language})=>{
  const [rows,setRows]=useState<Entry[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const tr=language==='en'
    ?{title:'Demonstration BTC payments',notice:'Fictional records for demonstration; no real payments were made.',name:'Name',date:'Date / time',id:'Transaction',value:'Value (USD)',
      amount:'Amount (BTC)',loading:'Loading records…'}
    :language==='es'
    ?{title:'Pagos BTC de demostración',notice:'Registros ficticios de demostración; no se realizaron pagos reales.',name:'Nombre',date:'Fecha / hora',id:'Transacción',value:'Valor (USD)',
      amount:'Cantidad (BTC)',loading:'Cargando registros…'}
    :{title:'Pagamentos BTC de demonstração',notice:'Registros fictícios para demonstração; nenhum pagamento real foi realizado.',name:'Nome',date:'Data / hora',id:'Transação',value:'Valor (USD)',
      amount:'Quantidade (BTC)',loading:'Carregando registros…'};
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';

  useEffect(()=>{
    let mounted=true;
    let pending=false;
    async function load(){
      if(pending)return;
      pending=true;
      try{
        // Backend retains simulation:true; the UI does not modify its source data.
        const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
        const data=await api<LatestPayments>('mock.payments.latest',{timezone});
        if(mounted){
          setRows(data.records.slice(0,10));
          setError('');
        }
      }catch(e){
        if(mounted){
          setRows([]);
          setError((e as Error).message);
        }
      }finally{
        pending=false;
        if(mounted)setLoading(false);
      }
    }
    void load();
    const timer=window.setInterval(()=>{void load();},60000);
    return ()=>{mounted=false;window.clearInterval(timer)};
  },[]);

  const cell='border-y border-[#262e49] bg-[#101629] px-2 py-3 text-center align-middle text-xs';
  return <section data-testid="simulated-payments" data-simulation="true"
    className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-3 space-y-3 min-w-0">
    <h3 className="font-bold text-sm">{tr.title}</h3>
    <p role="note" className="text-[11px] leading-relaxed text-amber-200/90">{tr.notice}</p>
    {loading&&rows.length===0&&!error&&<p role="status" className="text-xs text-slate-400">{tr.loading}</p>}
    {error&&<p role="alert" className="text-xs text-red-300">{error}</p>}
    <div data-testid="btc-payments-scroll"
      className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-auto member-horizontal-scroll"
      tabIndex={0} aria-label={tr.title}>
      <table className="w-full min-w-[750px] table-fixed border-separate border-spacing-y-1.5">
        <colgroup>
          <col className="w-[22%]"/><col className="w-[18%]"/>
          <col className="w-[26%]"/><col className="w-[15%]"/><col className="w-[19%]"/>
        </colgroup>
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-slate-400">
            {[tr.name,tr.date,tr.id,tr.value,tr.amount].map(title=>
              <th key={title} scope="col" className="px-2 py-2 text-center font-semibold">{title}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row=><tr data-testid="simulated-payment-row" key={row.hash}>
            <td className={cell+' border-l rounded-l-lg'}>
              <span className="flex items-center justify-center gap-1 truncate font-semibold" title={row.name}><span aria-label={row.country} className="shrink-0">{row.flag}</span><span className="truncate">{row.name}</span></span>
            </td>
            <td className={cell+' tabular-nums whitespace-nowrap'}>
              {new Date(row.createdAt*1000).toLocaleString(locale)}
            </td>
            <td className={cell}>
              <span data-testid="payment-hash" className="block max-w-full truncate font-mono text-[10px] text-slate-400"
                title={row.hash}>{row.hash}</span>
            </td>
            <td className={cell+' font-mono tabular-nums whitespace-nowrap'}>US$ {row.valueUsd}</td>
            <td className={cell+' border-r rounded-r-lg font-mono tabular-nums whitespace-nowrap'}>{row.btc} BTC</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
};
