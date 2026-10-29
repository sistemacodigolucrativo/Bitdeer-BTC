import React, {useMemo} from 'react';
import {Wallet, Coins, Lock, TrendingUp, ArrowRight} from 'lucide-react';
import {MemberData} from '../services/api';
import {LanguageCode} from '../types';
type RecordItem={start_ts:number;earned_units:number;end_ts:number;plan_id:string};
type Props={account:MemberData|null;language:LanguageCode;accruals:RecordItem[];
  onEdit:()=>void;onHistory:()=>void;onWithdraw:()=>void;liveBtc:string|null;
  quoteStatus:'loading'|'ready'|'unavailable';onRetryQuote:()=>void;liveBalanceUsd:number;};
export const ServerWalletView:React.FC<Props>=({account,language,accruals,onEdit,onHistory,onWithdraw,liveBtc,quoteStatus,onRetryQuote,liveBalanceUsd})=>{
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const t=language==='en'
    ?{title:'Wallet',balance:'Internal rewards',sats:'Internal satoshi bonuses',
      address:'BTC address registered',empty:'No address registered',edit:'Edit wallet',
      history:'View reward history',chart:'Earned USD — last 7 days',withdraw:'Withdraw',btc:'BTC equivalent'}
    :language==='es'
    ?{title:'Billetera',balance:'Recompensas internas',sats:'Bonos internos en satoshis',
      address:'Dirección BTC registrada',empty:'Ninguna dirección registrada',edit:'Editar billetera',
      history:'Ver historial',chart:'USD acreditados — últimos 7 días',withdraw:'Retirar',btc:'Equivalente en BTC'}
    :{title:'Carteira',balance:'Recompensas internas',sats:'Bônus internos em satoshis',
      address:'Endereço BTC cadastrado',empty:'Nenhum endereço cadastrado',edit:'Editar carteira',
      history:'Ver histórico de recompensas',chart:'USD creditados — últimos 7 dias',withdraw:'Sacar',btc:'Equivalente em BTC'};
  const days=useMemo(()=>{
    const today=new Date();today.setHours(0,0,0,0);
    const result=Array.from({length:7},(_,i)=>({
      time:today.getTime()-(6-i)*86400000,units:0}));
    for(const entry of accruals){
      const when=new Date(entry.start_ts*1000);when.setHours(0,0,0,0);
      const index=Math.round((when.getTime()-result[0].time)/86400000);
      if(index>=0&&index<7)result[index].units+=entry.earned_units;
    }
    return result;
  },[accruals]);
  const largest=Math.max(1,...days.map(d=>d.units));
  return <section className="space-y-4 pb-4">
    <header className="flex items-center justify-between">
      <h2 className="font-black text-xl">{t.title}</h2><Wallet className="text-indigo-300" size={22}/>
    </header>
    <div className="relative bg-[#191e32] border border-[#262e49] rounded-3xl p-5 shadow-md overflow-hidden">
      <div className="absolute right-0 top-0 h-28 w-28 bg-indigo-600/10 blur-2xl rounded-full"/>
      <p className="text-xs text-slate-400">{t.balance}</p>
      <p data-testid="wallet-live-usd" className="text-3xl font-extrabold font-mono mt-3">US$ {account?liveBalanceUsd.toFixed(8):'0.00000000'}</p>
      <p className="text-xs text-slate-300 mt-3">{t.btc}:
        <strong data-testid="wallet-live-btc" className="font-mono ml-2">{liveBtc??'—'} BTC</strong>
      </p>
      {liveBtc===null&&<p role="status" className="text-[11px] text-slate-400 mt-1">
        {quoteStatus==='loading'
          ? language==='en'?'BTC quote being calculated':language==='es'?'Cotización BTC en cálculo':'Cotação BTC sendo calculada'
          : language==='en'?'BTC quote unavailable':language==='es'?'Cotización BTC no disponible':'Cotação BTC indisponível'}
        {quoteStatus==='unavailable'&&<button type="button" onClick={onRetryQuote}
          className="ml-2 underline text-indigo-300">{language==='en'?'Retry':language==='es'?'Reintentar':'Tentar novamente'}</button>}
      </p>}
      <button onClick={onWithdraw} className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold w-full">{t.withdraw}</button>
      <p className="flex gap-2 items-center text-xs text-slate-300 mt-4">
        <Coins size={18} className="text-amber-400"/>{t.sats}: {(account?.mining.bonusSatoshisBalance||0).toLocaleString(locale)}
      </p>
      <p className="mt-4 pt-3 border-t border-[#323b58] flex items-center justify-between text-xs text-slate-400">
        {account?.plan.id||'FREE'}<Lock size={14}/>
      </p>
    </div>
    <div className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-4">
      <h3 className="flex gap-2 items-center text-sm font-bold mb-3"><TrendingUp className="text-emerald-400" size={17}/>{t.chart}</h3>
      <div className="h-28 flex gap-2 justify-between items-end">
        {days.map(day=><div key={day.time} className="flex-1 flex flex-col items-center justify-end h-full">
          <div className="w-full max-w-9 bg-indigo-500 rounded-t-md"
            title={'US$ '+(day.units/864000000).toFixed(8)}
            style={{height:Math.max(4,Math.round(day.units/largest*86))+'px'}}/>
          <small className="text-[10px] text-slate-400 mt-1">
            {new Date(day.time).toLocaleDateString(locale,{weekday:'short'})}</small>
        </div>)}
      </div>
    </div>
    {!account?.profile.walletAddress && <div className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-4">
      <h3 className="text-sm font-bold">{t.address}</h3>
      <p className="font-mono text-xs text-slate-400 break-all mt-2">{t.empty}</p>
      <button onClick={onEdit} className="w-full bg-indigo-600 p-3 rounded-xl mt-4 text-xs font-bold">{t.edit}</button>
    </div>}
    <button onClick={onHistory} className="w-full flex justify-between items-center p-4 bg-[#171b2d] border border-[#262e49] rounded-2xl text-sm">
      {t.history}<ArrowRight size={18}/>
    </button>
  </section>;
};