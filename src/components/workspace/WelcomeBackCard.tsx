import React,{useState} from 'react';
import {Sparkles} from 'lucide-react';
import {LanguageCode} from '../../types';

type Props={language:LanguageCode;name:string;days:number|null;demo:boolean;unavailable:boolean;onClose:(remember:boolean)=>void};
export const WelcomeBackCard:React.FC<Props>=({language,name,days,demo,unavailable,onClose})=>{
  const [remember,setRemember]=useState(false);
  const t=language==='en'?{title:'Welcome back!',description:'Explore the latest system updates and review your details.',reference:'Days since the latest withdrawal request:',empty:'No previous withdrawal request is available.',unavailable:'The withdrawal reference is unavailable.',demo:'Demonstration record',hint:'The withdrawal date is only a reference; it is not necessarily your last visit.',profile:'Personal details in My Profile',wallet:'Bitcoin withdrawal wallet',kyc:'KYC verification',remember:'Do not show again'}:
    language==='es'?{title:'¡Qué bueno tenerte de vuelta!',description:'Consulta las actualizaciones del sistema y revisa tus datos.',reference:'Días desde la última solicitud de retiro:',empty:'No hay una solicitud de retiro anterior.',unavailable:'La referencia de retiro no está disponible.',demo:'Registro de demostración',hint:'La fecha del retiro es solo una referencia; no necesariamente es tu última visita.',profile:'Datos personales en Mi perfil',wallet:'Billetera Bitcoin para retiros',kyc:'Verificación KYC',remember:'No volver a mostrar'}:
    {title:'Que bom ter você de volta!',description:'Confira as atualizações do sistema e revise seus dados.',reference:'Dias desde a última solicitação de saque:',empty:'Não há solicitação de saque anterior.',unavailable:'A referência de saque está indisponível.',demo:'Registro de demonstração',hint:'A data do saque é apenas uma referência; não representa necessariamente sua última visita.',profile:'Dados pessoais em Meu perfil',wallet:'Carteira Bitcoin para saques',kyc:'Verificação KYC',remember:'Não mostrar novamente'};
  return <div role="dialog" aria-modal="true" aria-labelledby="welcome-back-title" data-testid="welcome-back-dialog" className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-amber-300/35 bg-gradient-to-b from-[#27243d] via-[#191e32] to-[#101525] p-5 text-white shadow-2xl sm:p-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 text-amber-300"><Sparkles size={25}/></div>
      <h2 id="welcome-back-title" className="mt-4 text-center text-xl font-extrabold">{t.title}</h2>
      <p className="mt-2 break-words text-center text-sm text-slate-200">{name}</p>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-center text-xs text-slate-200">
        {days===null?(unavailable?t.unavailable:t.empty):<>{t.reference} <strong className="text-amber-300">{days}</strong>{demo&&<span className="block mt-1 text-amber-200">{t.demo}</span>}<p className="mt-1 text-[10px] text-slate-400">{t.hint}</p></>}
      </div>
      <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">{t.description}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-200"><li>• {t.profile}</li><li>• {t.wallet}</li><li>• {t.kyc}</li></ul>
      <label className="mt-4 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-4 w-4 accent-indigo-500"/>{t.remember}</label>
      <button type="button" onClick={()=>onClose(remember)} className="mt-4 w-full rounded-xl bg-indigo-600 p-3 text-sm font-bold text-white">OK</button>
    </div>
  </div>;
};
