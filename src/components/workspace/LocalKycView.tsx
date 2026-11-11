import React,{useEffect,useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {LanguageCode} from '../../types';
import {api} from '../../services/api';

export type LocalKycRecord={userId:number;documentType:string;document:Blob;photo:Blob;submittedAt:number;approveAt:number};

function openStore():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('bitdeer-local-kyc',1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records',{keyPath:'userId'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error??new Error('IndexedDB indisponível'));
  });
}
export async function readLocalKyc(userId:number):Promise<LocalKycRecord|null>{
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readonly');const req=tx.objectStore('records').get(userId);
    req.onsuccess=()=>resolve((req.result as LocalKycRecord|undefined)??null);
    req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onerror=()=>db.close();
  });
}
async function saveLocalKyc(record:LocalKycRecord):Promise<void>{
  const db=await openStore();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite');tx.objectStore('records').put(record);
    tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
export const LocalKycView:React.FC<{userId:number;language:LanguageCode;durationMinutes:number|null;onDuration:(value:number)=>void;onBack:()=>void;onSaved:(record:LocalKycRecord)=>void}>=({userId,language,durationMinutes,onDuration,onBack,onSaved})=>{
  const [record,setRecord]=useState<LocalKycRecord|null>(null);const [kind,setKind]=useState('passport');
  const [documentFile,setDocumentFile]=useState<File|null>(null);const [photo,setPhoto]=useState<File|null>(null);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [clock,setClock]=useState(Date.now());
  const tr=language==='en'?{title:'KYC verification',back:'Back',doc:'Identification document',photo:'Identification photo',type:'Document type',send:'Save submission',pending:'KYC verification in progress',approved:'KYC verification approved — simulated',note:'Simulation only; this does not verify identity. Files remain in this browser on this device.',error:'Could not save files on this device.',size:'Use JPG, PNG, WebP or PDF for the document and an image for the photo, up to 8 MB each.',submitted:'Submitted'}:
    language==='es'?{title:'Verificación KYC',back:'Volver',doc:'Documento de identidad',photo:'Fotografía de identificación',type:'Tipo de documento',send:'Guardar envío',pending:'Verificación KYC en curso',approved:'Verificación KYC aprobada — simulada',note:'Solo simulación; no verifica la identidad. Los archivos quedan en este navegador y dispositivo.',error:'No se pudieron guardar los archivos en este dispositivo.',size:'Use JPG, PNG, WebP o PDF para el documento y una imagen para la foto, hasta 8 MB cada uno.',submitted:'Enviado'}:
    {title:'Verificação KYC',back:'Voltar',doc:'Documento de identificação',photo:'Fotografia de identificação',type:'Tipo de documento',send:'Salvar envio',pending:'Verificação KYC em andamento',approved:'Verificação KYC aprovada — simulada',note:'Somente simulação; não valida a identidade. Os arquivos ficam neste navegador e dispositivo.',error:'Não foi possível salvar os arquivos neste dispositivo.',size:'Use JPG, PNG, WebP ou PDF no documento e uma imagem na foto, até 8 MB cada.',submitted:'Enviado'};
  useEffect(()=>{let active=true;readLocalKyc(userId).then(r=>{if(active)setRecord(r);}).catch(()=>{if(active)setError(tr.error);});return()=>{active=false;};},[userId]);
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),30000);return()=>window.clearInterval(timer);},[]);
  async function submit(e:React.FormEvent){e.preventDefault();setError('');
    const validDoc=documentFile&&['application/pdf','image/jpeg','image/png','image/webp'].includes(documentFile.type)&&documentFile.size<=8*1024*1024;
    const validPhoto=photo&&['image/jpeg','image/png','image/webp'].includes(photo.type)&&photo.size<=8*1024*1024;
    if(!validDoc||!validPhoto||!documentFile||!photo){setError(tr.size);return;}
    setBusy(true);try{const setting=await api<{durationMinutes:number}>('kyc.settings');if(!Number.isInteger(setting.durationMinutes)||setting.durationMinutes<1||setting.durationMinutes>43200)throw new Error('Invalid duration');onDuration(setting.durationMinutes);const now=Date.now();const r={userId,documentType:kind,document:documentFile,photo,submittedAt:now,approveAt:now+setting.durationMinutes*60000};await saveLocalKyc(r);setRecord(r);onSaved(r);}catch{setError(tr.error);}finally{setBusy(false);}
  }
  return <section className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-white"><button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-indigo-200"><ArrowLeft size={24}/>{tr.back}</button><h2 className="text-xl font-bold">{tr.title}</h2>
    <p className="text-xs text-slate-400">{tr.note}</p>
    {error&&<p role="alert" className="text-rose-300 text-xs">{error}</p>}
    {record?<div className="space-y-2 rounded-xl bg-[#1b2137] p-4"><strong className="text-sm">{clock>=(durationMinutes===null?record.approveAt:record.submittedAt+durationMinutes*60000)?tr.approved:tr.pending}</strong><p className="text-xs text-slate-300">{tr.submitted}: {new Date(record.submittedAt).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR')}</p></div>:
      <form onSubmit={e=>void submit(e)} className="space-y-4"><label className="block text-sm">{tr.type}<select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-xl bg-[#1b2137] p-3"><option value="passport">Passaporte / Passport</option><option value="rg">RG</option><option value="cpf">CPF</option><option value="other">Outro / Other</option></select></label>
        <label className="block text-sm">{tr.doc}<input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setDocumentFile(e.target.files?.[0]??null)} className="mt-2 block w-full text-xs"/></label>
        <label className="block text-sm">{tr.photo}<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)} className="mt-2 block w-full text-xs"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 p-3 text-sm font-bold disabled:opacity-50">{tr.send}</button></form>}
  </section>;
};
