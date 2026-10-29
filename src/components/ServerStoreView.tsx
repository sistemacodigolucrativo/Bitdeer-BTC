import React, {useEffect, useState} from 'react';
import { Cpu, ShieldCheck, Zap, Gem } from 'lucide-react';
import { Plan } from '../services/api';
import { LanguageCode } from '../types';
import { memberTexts } from '../i18n/memberTexts';

type Props={plans:Plan[];activePlanId:string;busy:boolean;language:LanguageCode;
  onPurchase:(id:string)=>void};
export const ServerStoreView:React.FC<Props>=({plans,activePlanId,busy,language,onPurchase})=>{
  const t=memberTexts[language]||memberTexts.pt;
  const options=plans.filter(p=>p.id!=='FREE');
  const [choice,setChoice]=useState('');
  useEffect(()=>{
    if(!choice&&options.length)setChoice(options[0].id);
    if(choice&&options.length&&!options.some(x=>x.id===choice))setChoice(options[0].id);
  },[plans,choice]);
  const selected=options.find(p=>p.id===choice)||options[0];
  const level=Math.max(1,options.findIndex(p=>p.id===selected?.id)+1);
  const color=level>=4?'#fb7185':level===3?'#818cf8':level===2?'#38bdf8':'#60a5fa';
  const locale=language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
  const helper=language==='en'
    ? {description:'Choose a plan. Rates and conditions come from the server.',activation:'Activation follows manual payment confirmation. No fixed deadline is guaranteed.',day:'per day',model:'Equipment illustration',current:'Current plan',choose:'Choose plan',purchase:'Request VIP activation',free:'Free account',term:'days',unavailable:'Plans are not available yet.'}
    : language==='es'
    ? {description:'Elige un plan. Tarifas y condiciones proceden del servidor.',activation:'La activación requiere la confirmación manual del pago. No se garantiza un plazo fijo.',day:'por día',model:'Ilustración del equipo',current:'Plan actual',choose:'Elegir plan',purchase:'Solicitar activación VIP',free:'Cuenta gratuita',term:'días',unavailable:'Planes aún no disponibles.'}
    : {description:'Escolha um plano. Valores e condições vêm do servidor.',activation:'Ativação após conferência manual do pagamento, sem prazo máximo garantido.',day:'por dia',model:'Representação visual do equipamento',current:'Plano atual',choose:'Escolher plano',purchase:'Solicitar ativação VIP',free:'Conta gratuita',term:'dias',unavailable:'Planos ainda não disponíveis.'};
  const currentPlan=plans.find(p=>p.id===activePlanId)||plans.find(p=>p.id==='FREE');
  return <section className="space-y-3" data-testid="store-view">
    {currentPlan && <div data-testid="store-active-plan" className="bg-[#171b2d] border border-[#252c45] p-3 rounded-2xl flex justify-between gap-3 items-center">
      <div className="min-w-0"><span className="text-xs text-slate-400">{helper.current}</span>
        <p className="font-bold">{currentPlan.name} · US$ {currentPlan.dailyUsd}/{t.day}</p></div>
      <ShieldCheck className="text-emerald-400 shrink-0" size={22}/>
    </div>}
    {selected && <>
      <div data-testid="store-plan-illustration" className="bg-[#191e32] border border-[#262e49] rounded-2xl p-3 flex gap-3 items-center overflow-hidden shadow-sm">
        <div className="relative w-[92px] h-[92px] shrink-0" aria-hidden="false">
          <div className="absolute inset-3 rounded-full blur-xl opacity-30" style={{backgroundColor:color}}/>
          <svg viewBox="0 0 160 160" className="relative w-full h-full drop-shadow-sm" role="img" aria-label={helper.model}>
            <polygon points="80,119 151,140 80,157 9,140" fill="#11162d" stroke={color} strokeWidth="1"/>
            <polygon points="80,16 137,45 80,74 23,45" fill="#cbd5e1" stroke={color} strokeWidth="2"/>
            {[0,1,2,3].map(i=><g key={i} transform={'translate(0 '+(i*20)+')'}>
              <polygon points="23,45 80,74 80,86 23,57" fill={i%2?'#2563eb':'#3b82f6'} stroke={color} strokeWidth="1"/>
              <polygon points="80,74 137,45 137,57 80,86" fill="#1a2445" stroke={color} strokeWidth=".8"/>
              <line x1="33" y1="55" x2="65" y2="71" stroke="#bae6fd" strokeWidth="2" strokeDasharray="4,3"/>
              <circle cx="75" cy="77" r="2" fill="#34d399"/>
            </g>)}
            <circle cx="80" cy="46" r="11" fill="#0f172a" stroke={color} strokeWidth="2"/>
            <circle cx="80" cy="46" r="4" fill="#34d399"/>
          </svg>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-bold text-slate-100 break-words">{selected.name} · {selected.serverModel}</p>
          <strong className="text-base leading-tight block">US$ {selected.dailyUsd} <span className="text-[11px] text-slate-400">/ {helper.day}</span></strong>
          <p className="text-[11px] text-slate-300">{selected.durationDays} {helper.term} · {selected.hashrate}</p>
          <p className="text-[11px] text-slate-300">US$ {selected.bonusUsd} + {selected.bonusSatoshis.toLocaleString(locale)} satoshis /24h</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(p=><button key={p.id}
          onClick={()=>setChoice(p.id)}
          className={'flex-1 min-w-20 rounded-xl border p-2 text-xs font-bold flex items-center justify-center gap-1 '+
           (p.id===selected.id?'border-indigo-400 bg-[#363f70]':'border-[#262e49] bg-[#171b2d]')}>
          {p.id===activePlanId?<ShieldCheck size={14}/>:p.id===selected.id?<Gem size={14}/>:<Cpu size={14}/>}
          {p.name}
        </button>)}
      </div>
      <div className="bg-[#171b2d] border border-[#262e49] rounded-2xl p-4 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">{helper.choose}</span><strong>{selected.name}</strong></div>
        <div className="flex justify-between"><span className="text-slate-400">{t.price}</span><strong>US$ {selected.priceUsd}</strong></div>
        <div className="flex justify-between"><span className="text-slate-400">{t.currentPlan}</span><strong>{activePlanId}</strong></div>
        <p className="text-xs text-amber-300">{helper.activation}</p>
        <button disabled={busy||selected.id===activePlanId}
          onClick={()=>onPurchase(selected.id)}
          className="w-full py-3 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] disabled:opacity-40 text-xs font-bold flex gap-2 items-center justify-center">
          <Zap size={16}/>{helper.purchase}
        </button>
      </div>
    </>}
    {!selected&&<p className="text-xs text-slate-400">{helper.unavailable}</p>}
  </section>;
};