import React, { useEffect, useState } from 'react';
import { LanguageCode } from '../types';
import { api } from '../services/api';

type DemoInvestor = { flag: string; name: string; city: string; state: string };
// Fictional, display-only profiles. The toast never reads the real members table.
const profiles: DemoInvestor[] = [
  {flag:'🇧🇷',name:'Mariana Azevedo',city:'Belford Roxo',state:'RJ'},
  {flag:'🇧🇷',name:'Rafael Mendes',city:'Contagem',state:'MG'},
  {flag:'🇧🇷',name:'Juliana Ribeiro',city:'Campinas',state:'SP'},
  {flag:'🇧🇷',name:'Carlos Oliveira',city:'Feira de Santana',state:'BA'},
  {flag:'🇧🇷',name:'Patrícia Nunes',city:'Curitiba',state:'PR'},
  {flag:'🇦🇷',name:'Camila Fernández',city:'Córdoba',state:'CB'},
  {flag:'🇨🇱',name:'Diego Rojas',city:'Santiago',state:'RM'},
  {flag:'🇨🇴',name:'Valentina Gómez',city:'Medellín',state:'ANT'},
  {flag:'🇵🇪',name:'Sofía Torres',city:'Lima',state:'LMA'},
  {flag:'🇲🇽',name:'Luis Hernández',city:'Guadalajara',state:'JAL'},
  {flag:'🇵🇹',name:'Inês Martins',city:'Porto',state:'Porto'},
  {flag:'🇪🇸',name:'Lucía García',city:'Sevilla',state:'AN'},
  {flag:'🇺🇸',name:'Olivia Parker',city:'Austin',state:'TX'},
  {flag:'🇨🇦',name:'Emma Wilson',city:'Toronto',state:'ON'},
  {flag:'🇫🇷',name:'Léa Bernard',city:'Lyon',state:'ARA'},
  {flag:'🇩🇪',name:'Lukas Weber',city:'München',state:'BY'},
  {flag:'🇮🇹',name:'Giulia Rossi',city:'Milano',state:'MI'},
  {flag:'🇬🇧',name:'George Harris',city:'Manchester',state:'ENG'},
  {flag:'🇯🇵',name:'Haruka Sato',city:'Osaka',state:'Osaka'},
  {flag:'🇦🇺',name:'Mia Taylor',city:'Sydney',state:'NSW'},
  {flag:'🇺🇾',name:'Martín Silva',city:'Montevideo',state:'MO'},
  {flag:'🇵🇾',name:'Andrés Benítez',city:'Asunción',state:'ASU'},
];
const labels: Record<LanguageCode, {title:string;event:string;demo:string}> = {
  pt: {title:'Novos investidores',event:'Acabou de se cadastrar',demo:'Simulação · dados fictícios'},
  en: {title:'New investors',event:'Just signed up',demo:'Simulation · fictional data'},
  es: {title:'Nuevos inversores',event:'Acaba de registrarse',demo:'Simulación · datos ficticios'},
};
function shuffled(avoid?:DemoInvestor):DemoInvestor[] {
  const list=[...profiles];
  for(let i=list.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [list[i],list[j]]=[list[j],list[i]];
  }
  if(avoid && list[list.length-1]===avoid && list.length>1){
    [list[0],list[list.length-1]]=[list[list.length-1],list[0]];
  }
  return list;
}
const randomDelay=()=>30000+Math.floor(Math.random()*90001);

export const NewInvestorToast: React.FC<{language:LanguageCode}> = ({language}) => {
  const [enabled,setEnabled]=useState(false);
  const [current,setCurrent]=useState<DemoInvestor|null>(null);
  const [leaving,setLeaving]=useState(false);

  useEffect(()=>{
    let disposed=false;
    const check=()=>{
      void api<{enabled:boolean;simulation:boolean}>('demo.new-investors.settings')
        .then(x=>{if(!disposed)setEnabled(x.enabled===true && x.simulation===true);})
        .catch(()=>{if(!disposed)setEnabled(false);});
    };
    check();
    const polling=window.setInterval(check,15000);
    const onVisible=()=>{if(document.visibilityState==='visible')check();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{disposed=true;window.clearInterval(polling);document.removeEventListener('visibilitychange',onVisible);};
  },[]);

  useEffect(()=>{
    setCurrent(null);
    setLeaving(false);
    if(!enabled)return;
    let stopped=false;
    let nextTimer:number|undefined;
    let leaveTimer:number|undefined;
    let clearTimer:number|undefined;
    let previous:DemoInvestor|undefined;
    let remaining=shuffled();
    const show=()=>{
      if(stopped)return;
      if(document.visibilityState==='hidden'){
        nextTimer=window.setTimeout(show,randomDelay());
        return;
      }
      if(!remaining.length)remaining=shuffled(previous);
      const profile=remaining.pop();
      if(!profile)return;
      previous=profile;
      setCurrent(profile);
      setLeaving(false);
      leaveTimer=window.setTimeout(()=>setLeaving(true),5000);
      clearTimer=window.setTimeout(()=>setCurrent(null),5700);
      nextTimer=window.setTimeout(show,randomDelay());
    };
    nextTimer=window.setTimeout(show,randomDelay());
    return ()=>{
      stopped=true;
      if(nextTimer!==undefined)window.clearTimeout(nextTimer);
      if(leaveTimer!==undefined)window.clearTimeout(leaveTimer);
      if(clearTimer!==undefined)window.clearTimeout(clearTimer);
    };
  },[enabled]);

  if(!enabled || !current)return null;
  const t=labels[language]??labels.pt;
  return <div data-testid="demo-new-investor-toast" role="status" aria-live="polite"
    className="pointer-events-none absolute inset-x-0 z-40 px-3 sm:px-5"
    style={{bottom:'calc(5.5rem + env(safe-area-inset-bottom, 0px))'}}>
    <div className={'mx-auto w-full max-w-sm min-w-0 overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-[#202942] via-[#181e34] to-[#111725] p-3.5 text-white shadow-[0_14px_42px_rgba(0,0,0,0.52)] backdrop-blur-md '+(leaving?'demo-investor-toast-leave':'demo-investor-toast-enter')}>
      <div className="flex min-w-0 gap-3 items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-xl" aria-hidden="true">✦</div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-extrabold tracking-tight">{t.title}</p>
          <p className="break-words text-xs font-semibold leading-relaxed">{current.flag} {current.name} - {current.city} - {current.state}</p>
          <p className="text-xs text-rose-200">❤️ {t.event}</p>
          <p className="text-[10px] text-slate-300">{t.demo}</p>
        </div>
      </div>
    </div>
  </div>;
};
