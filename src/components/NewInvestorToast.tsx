import React, { useEffect, useState } from 'react';
import { LanguageCode } from '../types';
import { api } from '../services/api';
import { useProjectCopy } from '../i18n/copyMode';

type DemoInvestor = { flag: string; name: string; location: string };
type ClaimResponse = {
  enabled: boolean;
  simulation: boolean;
  profile: DemoInvestor | null;
  exhausted: boolean;
};
const labels: Record<LanguageCode, {title:string;event:string}> = {
  pt: {title:'Novos investidores',event:'Acabou de se cadastrar'},
  en: {title:'New investors',event:'Just signed up'},
  es: {title:'Nuevos inversores',event:'Acaba de registrarse'},
};
const randomDelay=()=>30000+Math.floor(Math.random()*90001);

export const NewInvestorToast: React.FC<{language:LanguageCode;userId:number}> = ({language,userId}) => {
  const {copy,mockupMode,legitPreviewActive}=useProjectCopy(language);
  const canShowToast=mockupMode||legitPreviewActive;
  const [enabled,setEnabled]=useState(false);
  const [current,setCurrent]=useState<DemoInvestor|null>(null);
  const [leaving,setLeaving]=useState(false);

  useEffect(()=>{
    let disposed=false;
    const check=()=>{
      if(!canShowToast){
        setEnabled(false);
        setCurrent(null);
        return;
      }
      void api<{enabled:boolean;simulation:boolean}>('demo.new-investors.settings')
        .then(x=>{if(!disposed)setEnabled(x.enabled===true && x.simulation===true);})
        .catch(()=>{if(!disposed)setEnabled(false);});
    };
    check();
    const polling=window.setInterval(check,15000);
    const onVisible=()=>{if(document.visibilityState==='visible')check();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{disposed=true;window.clearInterval(polling);document.removeEventListener('visibilitychange',onVisible);};
  },[canShowToast,userId]);

  useEffect(()=>{
    setCurrent(null);
    setLeaving(false);
    if(!enabled||!canShowToast)return;
    let stopped=false;
    let nextTimer:number|undefined;
    let leaveTimer:number|undefined;
    let clearTimer:number|undefined;
    const show=async()=>{
      if(stopped)return;
      if(document.visibilityState==='hidden'){
        nextTimer=window.setTimeout(()=>void show(),randomDelay());
        return;
      }
      try{
        const result=await api<ClaimResponse>('demo.new-investors.claim',{});
        if(stopped)return;
        if(!result.enabled||!result.simulation)return;
        if(!result.profile)return;
        setCurrent(result.profile);
        setLeaving(false);
        leaveTimer=window.setTimeout(()=>setLeaving(true),5000);
        clearTimer=window.setTimeout(()=>setCurrent(null),5700);
        nextTimer=window.setTimeout(()=>void show(),randomDelay());
      }catch{
        if(!stopped)nextTimer=window.setTimeout(()=>void show(),15000);
      }
    };
    nextTimer=window.setTimeout(()=>void show(),legitPreviewActive?1000:randomDelay());
    return ()=>{
      stopped=true;
      if(nextTimer!==undefined)window.clearTimeout(nextTimer);
      if(leaveTimer!==undefined)window.clearTimeout(leaveTimer);
      if(clearTimer!==undefined)window.clearTimeout(clearTimer);
    };
  },[enabled,canShowToast,legitPreviewActive,userId]);

  if(!canShowToast||!enabled||!current)return null;
  const t=labels[language]??labels.pt;
  return <div data-testid="demo-new-investor-toast" role="status" aria-live="polite"
    className="pointer-events-none absolute inset-x-0 z-40 px-3 sm:px-5"
    style={{bottom:'calc(5.5rem + env(safe-area-inset-bottom, 0px))'}}>
    <div className={'mx-auto w-full max-w-sm min-w-0 overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-[#202942] via-[#181e34] to-[#111725] p-3.5 text-white shadow-[0_14px_42px_rgba(0,0,0,0.52)] backdrop-blur-md '+(leaving?'demo-investor-toast-leave':'demo-investor-toast-enter')}>
      <div className="flex min-w-0 gap-3 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-xl" aria-hidden="true">✦</div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-extrabold tracking-tight">{t.title}</p>
          <p className="break-words text-xs font-semibold leading-relaxed">{current.flag} {current.name} - {current.location}</p>
          <p className="text-xs text-rose-200">❤️ {t.event}</p>
          {mockupMode&&<p className="text-[10px] text-slate-300">{copy('investorToastDemoLabel')}</p>}
        </div>
      </div>
    </div>
  </div>;
};
