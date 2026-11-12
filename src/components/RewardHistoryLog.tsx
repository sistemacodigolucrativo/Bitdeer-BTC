import React,{useMemo,useState} from 'react';
import {LanguageCode} from '../types';
import {memberTexts} from '../i18n/memberTexts';
import {useProjectCopy} from '../i18n/copyMode';
import {UsdAmount} from './UsdMark';

export type RewardHistoryData={
  accruals:Array<{plan_id:string;start_ts:number;end_ts:number;earned_units:number;adminEdited?:boolean}>;
  bonuses:Array<{plan_id:string;claimed_at:number;bonus_usd_units:number;bonus_satoshis:number;adminEdited?:boolean}>;
};
type Row={kind:'accrual'|'bonus';at:number;plan:string;detail:string;bonusUsd?:string;bonusSatoshis?:number};

export const RewardHistoryLog:React.FC<{language:LanguageCode;ledger:RewardHistoryData;onRefresh:()=>void;}>=({language,ledger,onRefresh})=>{
  const [page,setPage]=useState(1);
  const words=memberTexts[language]||memberTexts.pt;
  const {copy}=useProjectCopy(language);
  const dateLocale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const labels=language==='en'?{accrual:'Mining credit',bonus:'Daily bonus',previous:'Previous',next:'Next',page:'Page'}:
    language==='es'?{accrual:'Crédito de minería',bonus:'Bono diario',previous:'Anterior',next:'Siguiente',page:'Página'}:
    {accrual:'Crédito de mineração',bonus:'Bônus diário',previous:'Anterior',next:'Próxima',page:'Página'};
  const rows=useMemo<Row[]>(()=>[
    ...ledger.accruals.map(r=>({kind:'accrual' as const,at:r.end_ts,plan:r.plan_id,detail:`${copy('historyEarnedUnits')}: ${r.earned_units}`})),
    ...ledger.bonuses.map(r=>({kind:'bonus' as const,at:r.claimed_at,plan:r.plan_id,detail:'',bonusUsd:(r.bonus_usd_units/864000000).toFixed(2),bonusSatoshis:r.bonus_satoshis})),
  ].sort((a,b)=>b.at-a.at),[ledger,copy]);
  const pages=Math.max(1,Math.ceil(rows.length/10));
  const current=Math.min(page,pages);
  const visible=rows.slice((current-1)*10,current*10);
  return <div data-testid="reward-history-log" className="space-y-3">
    <div className="flex items-center justify-between gap-2"><h2 className="font-bold text-lg">{words.rewardLog}</h2>
      <button type="button" className="text-xs border border-slate-600 rounded-lg p-2" onClick={onRefresh}>{words.updateLog}</button></div>
    {visible.length===0&&<p className="text-xs text-slate-400">{words.noAccrual}</p>}
    {visible.map((row,index)=><div key={`${row.kind}-${row.at}-${index}`} className="p-3 bg-[#1b2137] rounded-xl text-xs">
      <p className="font-semibold">{row.kind==='accrual'?labels.accrual:labels.bonus} · {row.plan}</p>
      <p className="mt-1 text-slate-400">{new Date(row.at*1000).toLocaleString(dateLocale)}</p>
      <p className="mt-1">{row.kind==='bonus'?<>{row.bonusSatoshis?.toLocaleString(dateLocale)} {copy('historySatoshis')} · <UsdAmount>{new Intl.NumberFormat(dateLocale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(row.bonusUsd))}</UsdAmount></>:row.detail}</p>
    </div>)}
    {pages>1&&<nav className="flex items-center justify-between gap-2 text-xs" aria-label={words.rewardLog}>
      <button type="button" disabled={current===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-lg bg-[#252b46] px-3 py-2 disabled:opacity-40">{labels.previous}</button>
      <span className="font-mono text-slate-300">{labels.page} {current} / {pages}</span>
      <button type="button" disabled={current===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="rounded-lg bg-[#252b46] px-3 py-2 disabled:opacity-40">{labels.next}</button>
    </nav>}
  </div>;
};
