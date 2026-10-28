import React, {useEffect,useState} from 'react';
import {ArrowLeft, Trophy, RefreshCw} from 'lucide-react';
import {LanguageCode} from '../../types';
import {api} from '../../services/api';

type Miner={rank:number;alias:string;balanceUsd:string;intervals:number};
type Props={language:LanguageCode;onBack:()=>void};
export const TopMinersView:React.FC<Props>=({language,onBack})=>{
  const [miners,setMiners]=useState<Miner[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const tr=language==='en'
    ?{title:'Top Miners',subtitle:'Ranking by internal credited rewards only',none:'No eligible entries yet',label:'Internal USD',refresh:'Refresh'}
    :language==='es'
    ?{title:'Mineros destacados',subtitle:'Ranking de recompensas internas acreditadas',none:'Sin registros disponibles',label:'USD internos',refresh:'Actualizar'}
    :{title:'Top Miners',subtitle:'Ranking apenas de recompensas internas creditadas',none:'Nenhum registro elegível',label:'USD internos',refresh:'Atualizar'};
  const refresh=async()=>{
    setLoading(true);
    try {
      const result=await api<{miners:Miner[]}>('leaderboard');
      setMiners(result.miners);setError('');
    } catch(e){setError((e as Error).message);}
    finally{setLoading(false);}
  };
  useEffect(()=>{void refresh();},[]);
  return <section className="w-full flex-1 flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="flex items-center justify-between p-4 border-b border-[#232943] bg-[#141829]">
      <button onClick={onBack} aria-label="Voltar" className="p-2 rounded-xl bg-[#1b2137]"><ArrowLeft size={19}/></button>
      <h2 className="font-bold">{tr.title}</h2>
      <button onClick={()=>void refresh()} title={tr.refresh} aria-label={tr.refresh}><RefreshCw size={18}/></button>
    </header>
    <div className="p-4 overflow-y-auto space-y-3">
      <p className="text-xs text-slate-400">{tr.subtitle}. Nenhum valor representa BTC minerado na blockchain.</p>
      {error&&<p role="alert" className="text-amber-300 text-xs">{error}</p>}
      {loading&&<p className="text-xs text-slate-400">...</p>}
      {!loading&&!miners.length&&<p className="text-xs text-slate-400">{tr.none}</p>}
      {miners.map(m=><div key={m.rank} className="bg-[#1b2137] border border-[#272e4b] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#273356] rounded-xl flex items-center justify-center">
          {m.rank<=3?<Trophy className="text-amber-400" size={18}/>:<span className="font-bold text-xs">#{m.rank}</span>}
        </div>
        <div className="flex-1 min-w-0"><strong className="text-sm">{m.alias}</strong>
          <p className="text-xs text-slate-400">{m.intervals} intervalos contabilizados</p></div>
        <div className="text-right"><strong className="font-mono text-xs">{m.balanceUsd}</strong>
          <p className="text-[10px] text-slate-400">{tr.label}</p></div>
      </div>)}
    </div>
  </section>;
};
