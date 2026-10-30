import React from 'react';
import {LanguageCode} from '../types';
import {memberTexts} from '../i18n/memberTexts';
import {memberViewCopy} from '../i18n/memberViewCopy';

export type RewardHistoryData={
  accruals:Array<{plan_id:string;start_ts:number;end_ts:number;earned_units:number;adminEdited?:boolean}>;
  bonuses:Array<{plan_id:string;claimed_at:number;bonus_usd_units:number;bonus_satoshis:number;adminEdited?:boolean}>;
};

export const RewardHistoryLog:React.FC<{
  language:LanguageCode;ledger:RewardHistoryData;onRefresh:()=>void;
}>=({language,ledger,onRefresh})=>{
  const words=memberTexts[language]||memberTexts.pt;
  const tr=memberViewCopy[language];
  const dateLocale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  return <div data-testid="reward-history-log" className="space-y-3">
    <h2 className="font-bold text-lg">{words.rewardLog}</h2>
    <button type="button" className="text-xs border border-slate-600 rounded-lg p-2"
      onClick={onRefresh}>{words.updateLog}</button>
    <h3 className="text-sm font-semibold">{words.accrual}</h3>
    {ledger.accruals.length===0&&<p className="text-xs text-slate-400">{words.noAccrual}</p>}
    {ledger.accruals.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
      {r.plan_id} · {new Date(r.start_ts*1000).toLocaleString(dateLocale)} — {new Date(r.end_ts*1000).toLocaleString(dateLocale)}
      <p>{words.earnedUnits}: {r.earned_units}</p>
      {r.adminEdited&&<p className="text-amber-300">Histórico demonstrativo ajustado</p>}
    </div>)}
    <h3 className="text-sm font-semibold">{words.dailyBonusClaims}</h3>
    {ledger.bonuses.length===0&&<p className="text-xs text-slate-400">{words.noBonus}</p>}
    {ledger.bonuses.map((r,i)=><div key={i} className="p-3 bg-[#1b2137] rounded-xl text-xs">
      {r.plan_id} · {new Date(r.claimed_at*1000).toLocaleString(dateLocale)}
      <p>{r.bonus_satoshis} {tr.satoshis} · {r.bonus_usd_units} {tr.units}</p>
      {r.adminEdited&&<p className="text-amber-300">Histórico demonstrativo ajustado</p>}
    </div>)}
  </div>;
};
