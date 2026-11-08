import React,{useEffect,useRef,useState} from 'react';
import {api} from '../services/api';
import {LanguageCode} from '../types';
import { useProjectCopy } from '../i18n/copyMode';

type Entry={hash:string;name:string;country:string;flag:string;valueUsd:string;btc:string;createdAt:number};
type LatestPayments={records:Entry[];total:number;simulation:true};
type ArrivalBatch={at:number;count:number};
const PAYMENT_FEED_SIZE=10;
const HOUR_MS=60*60*1000;

function createHourlyArrivalSchedule(startedAt:number):ArrivalBatch[] {
  let remaining=5+Math.floor(Math.random()*6);
  const batchSizes:number[]=[];
  while(remaining>0) {
    const count=remaining===1||Math.random()<0.5?1:2;
    batchSizes.push(count);
    remaining-=count;
  }
  const weights=batchSizes.map(()=>0.65+Math.random()*0.7);
  const weightTotal=weights.reduce((sum,weight)=>sum+weight,0);
  let elapsed=0;
  return batchSizes.map((count,index)=>{
    elapsed+=HOUR_MS*weights[index]/weightTotal;
    return {at:startedAt+elapsed,count};
  });
}

const MAX_PAYMENT_NAME_CHARACTERS=24;
const displayPaymentName=(name:string)=>{
  const characters=Array.from(name.trim());
  if(characters.length<=MAX_PAYMENT_NAME_CHARACTERS)return name.trim();
  return `${characters.slice(0,MAX_PAYMENT_NAME_CHARACTERS-3).join('').trimEnd()}...`;
};
const displayTransactionId=(id:string)=>{
  const characters=Array.from(id);
  if(characters.length<=12)return id;
  return `${characters.slice(0,6).join('')}...${characters.slice(-6).join('')}`;
};

export const MockPaymentFeed:React.FC<{language:LanguageCode}>=({language})=>{
  const { copy,mockupMode } = useProjectCopy(language);
  const [rows,setRows]=useState<Entry[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [initialized,setInitialized]=useState(false);
  const [enteringHashes,setEnteringHashes]=useState<string[]>([]);
  const rowsRef=useRef<Entry[]>([]);
  const tr=language==='en'
    ?{name:'Name',date:'Date / time',id:'Transaction',value:'Value (USD)',
      amount:'Amount (BTC)',loading:'Loading records…'}
    :language==='es'
    ?{name:'Nombre',date:'Fecha / hora',id:'Transacción',value:'Valor (USD)',
      amount:'Cantidad (BTC)',loading:'Cargando registros…'}
    :{name:'Nome',date:'Data / hora',id:'Transação',value:'Valor (USD)',
      amount:'Quantidade (BTC)',loading:'Carregando registros…'};
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';

  useEffect(()=>{
    let mounted=true;
    let loaded=false;
    let pending=false;
    async function loadInitial(){
      if(loaded||pending)return;
      pending=true;
      try{
        // Backend retains simulation:true; the UI does not modify its source data.
        const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
        const data=await api<LatestPayments>('mock.payments.latest',{timezone});
        if(mounted){
          const initial=data.records.slice(0,PAYMENT_FEED_SIZE);
          rowsRef.current=initial;
          setRows(initial);
          setError('');
          loaded=true;
          setInitialized(true);
        }
      }catch(e){
        if(mounted){
          setError((e as Error).message);
        }
      }finally{
        pending=false;
        if(mounted)setLoading(false);
      }
    }
    void loadInitial();
    const retry=window.setInterval(()=>{if(!loaded)void loadInitial();},60000);
    return ()=>{mounted=false;window.clearInterval(retry)};
  },[]);

  useEffect(()=>{
    if(!initialized||!mockupMode)return;
    let mounted=true;
    let pending=false;
    let timer:number|undefined;
    let entranceTimer:number|undefined;
    let hourlyEnd=0;
    let schedule:ArrivalBatch[]=[];
    let scheduleIndex=0;

    const startHour=(startedAt:number)=>{
      schedule=createHourlyArrivalSchedule(startedAt);
      scheduleIndex=0;
      hourlyEnd=startedAt+HOUR_MS;
    };
    const scheduleNext=()=>{
      if(!mounted)return;
      if(!schedule.length||Date.now()>=hourlyEnd)startHour(Date.now());
      const batch=schedule[scheduleIndex++];
      if(!batch){startHour(Date.now());return scheduleNext();}
      timer=window.setTimeout(()=>{void addBatch(batch.count);},Math.max(0,batch.at-Date.now()));
    };
    const addBatch=async(count:number)=>{
      if(pending){scheduleNext();return;}
      pending=true;
      try{
        const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
        const data=await api<LatestPayments>('mock.payments.latest',{timezone});
        if(mounted){
          const known=new Set(rowsRef.current.map(row=>row.hash));
          const arrivals=data.records.filter(row=>!known.has(row.hash)).slice(0,count)
            .map(row=>({...row,createdAt:Math.floor(Date.now()/1000)}));
          if(arrivals.length){
            const next=[...arrivals,...rowsRef.current].slice(0,PAYMENT_FEED_SIZE);
            rowsRef.current=next;
            setRows(next);
            setEnteringHashes(arrivals.map(row=>row.hash));
            if(entranceTimer!==undefined)window.clearTimeout(entranceTimer);
            entranceTimer=window.setTimeout(()=>setEnteringHashes([]),700);
          }
          setError('');
        }
      }catch(e){
        if(mounted)setError((e as Error).message);
      }finally{
        pending=false;
        scheduleNext();
      }
    };

    startHour(Date.now());
    scheduleNext();
    return ()=>{
      mounted=false;
      if(timer!==undefined)window.clearTimeout(timer);
      if(entranceTimer!==undefined)window.clearTimeout(entranceTimer);
    };
  },[initialized,mockupMode]);

  const cell='border-y border-[#262e49] bg-[#101629] px-2 py-3 text-center align-middle text-xs';
  return <section data-testid="simulated-payments" data-simulation="true"
    className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-3 space-y-3 min-w-0">
    <h3 className="font-bold text-sm">{copy('paymentFeedTitle')}</h3>
    {copy('paymentFeedNotice') && <p role="note" className="text-[11px] leading-relaxed text-amber-200/90">{copy('paymentFeedNotice')}</p>}
    {loading&&rows.length===0&&!error&&<p role="status" className="text-xs text-slate-400">{tr.loading}</p>}
    {error&&<p role="alert" className="text-xs text-red-300">{error}</p>}
    <div data-testid="btc-payments-scroll"
      className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-auto member-horizontal-scroll"
      tabIndex={0} aria-label={copy('paymentFeedTitle')}>
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
          {rows.map(row=><tr data-testid="simulated-payment-row" key={row.hash}
            className={enteringHashes.includes(row.hash)?'payment-feed-row-enter':''}>
            <td className={cell+' border-l rounded-l-lg'}>
              <span className="flex min-w-0 items-center justify-center gap-1 font-semibold" title={row.name}>
                <span aria-label={row.country} className="shrink-0">{row.flag}</span>
                <span className="min-w-0 flex-1 single-line-ellipsis text-center" aria-label={row.name}>{displayPaymentName(row.name)}</span>
              </span>
            </td>
            <td className={cell+' tabular-nums whitespace-nowrap'}>
              {new Date(row.createdAt*1000).toLocaleString(locale)}
            </td>
            <td className={cell}>
              <span data-testid="payment-hash" className="block max-w-full single-line-ellipsis font-mono text-[10px] text-slate-400"
                title={row.hash}>{displayTransactionId(row.hash)}</span>
            </td>
            <td className={cell+' font-mono tabular-nums whitespace-nowrap'}>US$ {row.valueUsd}</td>
            <td className={cell+' border-r rounded-r-lg font-mono tabular-nums whitespace-nowrap'}>{row.btc} BTC</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>;
};
