import React,{useState} from 'react';
import {Wallet,ShieldCheck,LockKeyhole,ArrowRight,X} from 'lucide-react';
import {LanguageCode} from '../../types';

type Props={
  language:LanguageCode;
  initialAddress?:string;
  onRegister:(address:string)=>Promise<void>;
  onClose:()=>void;
};

const copy={
  pt:{
    eyebrow:'CARTEIRA BITCOIN',
    title:'Cadastre sua carteira Bitcoin',
    description:'Para acessar a Carteira, primeiro informe um endereço Bitcoin válido.',
    start:'Cadastrar carteira Bitcoin',
    address:'Endereço da carteira Bitcoin',
    save:'Salvar carteira',
    saving:'Salvando carteira…',
    invalid:'Informe um endereço Bitcoin válido.',
    failed:'Não foi possível salvar a carteira. Verifique o endereço e tente novamente.',
    required:'O cadastro é obrigatório para acessar a Carteira.',
    confirmTitle:'Confirme o endereço Bitcoin', confirmQuestion:'Este endereço está correto e deseja salvá-lo?',
    correct:'Voltar e corrigir', confirm:'Confirmar e salvar'
  },
  en:{
    eyebrow:'BITCOIN WALLET',
    title:'Register your Bitcoin wallet',
    description:'To access your Wallet, first register a valid Bitcoin address.',
    start:'Register Bitcoin wallet',
    address:'Bitcoin wallet address',
    save:'Save wallet',
    saving:'Saving wallet…',
    invalid:'Enter a valid Bitcoin address.',
    failed:'Could not save the wallet. Check the address and try again.',
    required:'Registration is required to access your Wallet.',
    confirmTitle:'Confirm the Bitcoin address', confirmQuestion:'Is this address correct and do you want to save it?',
    correct:'Go back and correct', confirm:'Confirm and save'
  },
  es:{
    eyebrow:'BILLETERA BITCOIN',
    title:'Registre su billetera Bitcoin',
    description:'Para acceder a su Billetera, primero registre una dirección Bitcoin válida.',
    start:'Registrar billetera Bitcoin',
    address:'Dirección de la billetera Bitcoin',
    save:'Guardar billetera',
    saving:'Guardando billetera…',
    invalid:'Introduzca una dirección Bitcoin válida.',
    failed:'No se pudo guardar la billetera. Revise la dirección e inténtelo de nuevo.',
    required:'El registro es obligatorio para acceder a la Billetera.',
    confirmTitle:'Confirme la dirección Bitcoin', confirmQuestion:'¿Esta dirección es correcta y desea guardarla?',
    correct:'Volver y corregir', confirm:'Confirmar y guardar'
  }
} as const;

function plausibleBitcoinAddress(address:string):boolean {
  // A quick input check only: the PHP server verifies the real BTC checksum.
  return /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|(?:bc1|BC1)[a-zA-Z0-9]{11,87})$/.test(address);
}

export const WalletRequiredModal:React.FC<Props>=({language,initialAddress='',onRegister,onClose})=>{
  const t=copy[language];
  const [editing,setEditing]=useState(false);
  const [address,setAddress]=useState(initialAddress);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [confirming,setConfirming]=useState(false);

  const save=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(busy)return;
    const clean=address.trim();
    if(!plausibleBitcoinAddress(clean)){
      setError(t.invalid);
      return;
    }
    if(!confirming){setConfirming(true);return;}
    setBusy(true);
    setError('');
    try{
      await onRegister(clean);
      // Parent removes this modal only after the server confirms the address.
    }catch{
      setError(t.failed);
    }finally{
      setBusy(false);
    }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="wallet-required-title"
    data-testid="wallet-required-modal"
    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
    <div className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-indigo-400/40 bg-gradient-to-b from-[#232a48] via-[#171b2e] to-[#101423] p-5 sm:p-6 shadow-2xl shadow-indigo-950/40 space-y-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400"/>
      <button type="button" data-testid="wallet-required-close"
        aria-label={language==='en'?'Close':language==='es'?'Cerrar':'Fechar'}
        title={language==='en'?'Close':language==='es'?'Cerrar':'Fechar'}
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
        <X size={18}/>
      </button>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-200">
        <Wallet size={28}/>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-black tracking-[0.15em] text-indigo-300">{t.eyebrow}</p>
        <h2 id="wallet-required-title" className="text-xl font-extrabold leading-tight text-white">{t.title}</h2>
        <p className="text-sm leading-relaxed text-slate-300">{t.description}</p>
      </div>
      {editing
        ? <form onSubmit={e=>{void save(e);}} className="space-y-4" data-testid="wallet-required-form">
            <label className="block space-y-2 text-xs font-semibold text-slate-200">
              <span>{t.address}</span>
              <input autoFocus required type="text" autoComplete="off" spellCheck={false}
                inputMode="text" maxLength={150} placeholder="bc1…"
                data-testid="wallet-required-address" value={address}
                onChange={e=>{setAddress(e.target.value);setConfirming(false);if(error)setError('');}}
                aria-invalid={!!error}
                className="w-full rounded-xl border border-[#3b476a] bg-[#101729] p-3 font-mono text-xs text-white outline-none focus:border-indigo-400"
              />
            </label>
            {error&&<p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
            {confirming?<div className="space-y-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-center">
              <p className="text-sm font-bold text-amber-100">{t.confirmTitle}</p><p className="break-all font-mono text-xs text-white">{address.trim()}</p>
              <p className="text-xs text-slate-300">{t.confirmQuestion}</p>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setConfirming(false)} className="rounded-xl bg-slate-700 p-3 text-xs font-bold">{t.correct}</button><button type="submit" disabled={busy} data-testid="wallet-required-save" className="rounded-xl bg-indigo-600 p-3 text-xs font-bold"><ShieldCheck size={16} className="inline mr-1"/>{busy?t.saving:t.confirm}</button></div>
            </div>:<button type="submit" disabled={busy} data-testid="wallet-required-save" className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3.5 text-sm font-extrabold text-white"><ShieldCheck size={18}/>{t.save}</button>}
          </form>
        : <button type="button" data-testid="wallet-required-start"
            onClick={()=>setEditing(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3.5 text-sm font-extrabold text-white">
            {t.start}<ArrowRight size={18}/>
          </button>}
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
        <LockKeyhole size={13} className="shrink-0"/>{t.required}
      </p>
    </div>
  </div>;
};
