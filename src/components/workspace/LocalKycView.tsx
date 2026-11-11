import {mockupSafetyCopy} from '../../i18n/mockup';
import React,{useEffect,useState} from 'react';
import {ArrowLeft,FileText} from 'lucide-react';
import {LanguageCode} from '../../types';
import {api,apiUpload} from '../../services/api';

export type LocalKycRecord={userId:number;id?:number;documentType:string;document?:Blob;photo?:Blob;submittedAt:number;approveAt:number;status?:'pending'|'approved';documentName?:string;photoName?:string;central?:boolean};
function openStore():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  if(!('indexedDB'in window)){reject(new Error('IndexedDB indisponível'));return;}
  const req=indexedDB.open('bitdeer-local-kyc',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records',{keyPath:'userId'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error??new Error('IndexedDB indisponível'));
});}
export async function readLocalKyc(userId:number):Promise<LocalKycRecord|null>{
  const db=await openStore();return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readonly');const req=tx.objectStore('records').get(userId);
    req.onsuccess=()=>resolve((req.result as LocalKycRecord|undefined)??null);req.onerror=()=>reject(req.error);
    tx.oncomplete=()=>db.close();tx.onerror=()=>db.close();
  });
}
type ServerKycRecord={id:number;documentType:string;documentMime:string;documentName:string;photoMime:string;photoName:string;submittedAt:number;approvedAt:number;status:'pending'|'approved';simulation:true};
export const LocalKycView:React.FC<{userId:number;language:LanguageCode;durationMinutes:number|null;onDuration:(value:number)=>void;onBack:()=>void;onSaved:(record:LocalKycRecord)=>void}>=({userId,language,durationMinutes,onDuration,onBack,onSaved})=>{
  const [record,setRecord]=useState<LocalKycRecord|null>(null);const [legacy,setLegacy]=useState<LocalKycRecord|null>(null);
  const [kind,setKind]=useState('passport');const [documentFile,setDocumentFile]=useState<File|null>(null);const [photo,setPhoto]=useState<File|null>(null);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [clock,setClock]=useState(Date.now());
  const tr=language==='en'?{title:'KYC verification',back:'Back',doc:'Identification document',photo:'Selfie',type:'Document type',send:'Save submission',pending:'KYC verification in progress',approved:mockupSafetyCopy.kycApproved.en,note:mockupSafetyCopy.kycNote.en,choose:'Choose document',error:'Could not save the files to your account.',size:'Use JPG, PNG, WebP or PDF for the document and an image for the selfie, up to 8 MB each.',submitted:'Submitted',move:'Move existing files from this device to your account',openDoc:'View saved document',openPhoto:'View saved selfie',simulation:'The automatic status is a project state and does not authenticate identity.'}:
    language==='es'?{title:'Verificación KYC',back:'Volver',doc:'Documento de identidad',photo:'Selfie',type:'Tipo de documento',send:'Guardar envío',pending:'Verificación KYC en curso',approved:mockupSafetyCopy.kycApproved.es,note:mockupSafetyCopy.kycNote.es,choose:'Elegir documento',error:'No se pudieron guardar los archivos en su cuenta.',size:'Use JPG, PNG, WebP o PDF para el documento y una imagen para la selfie, hasta 8 MB cada uno.',submitted:'Enviado',move:'Transferir archivos existentes de este dispositivo a su cuenta',openDoc:'Ver documento guardado',openPhoto:'Ver selfie guardada',simulation:'El estado automático del proyecto no autentica la identidad.'}:
    {title:'Verificação KYC',back:'Voltar',doc:'Documento de identificação',photo:'Selfie',type:'Tipo de documento',send:'Salvar envio',pending:'Verificação KYC em andamento',approved:mockupSafetyCopy.kycApproved.pt,note:mockupSafetyCopy.kycNote.pt,choose:'Escolher documento',error:'Não foi possível salvar os arquivos na sua conta.',size:'Use JPG, PNG, WebP ou PDF no documento e uma imagem na selfie, até 8 MB cada.',submitted:'Enviado',move:'Transferir arquivos existentes deste dispositivo para sua conta',openDoc:'Abrir documento salvo',openPhoto:'Abrir selfie salva',simulation:'O status automático do projeto não autentica a identidade.'};
  useEffect(()=>{let active=true;void (async()=>{try{
    const {record:serverRecord}=await api<{record:ServerKycRecord|null}>('kyc.mine');
    if(!active)return;if(serverRecord){const normalized={userId,id:serverRecord.id,documentType:serverRecord.documentType,submittedAt:serverRecord.submittedAt*1000,approveAt:serverRecord.approvedAt*1000,status:serverRecord.status,documentName:serverRecord.documentName,photoName:serverRecord.photoName,central:true};setRecord(normalized);onSaved(normalized);return;}
    const local=await readLocalKyc(userId);if(active&&local){setLegacy(local);setKind(local.documentType);}
  }catch(e){if(active)setError((e as Error).message);}})();return()=>{active=false;};},[userId]);
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),30000);return()=>window.clearInterval(timer);},[]);
  async function saveToServer(doc:Blob,photoBlob:Blob,docName:string,photoName:string,documentType:string){
    const validDoc=['application/pdf','image/jpeg','image/png','image/webp'].includes(doc.type)&&doc.size<=8*1024*1024;
    const validPhoto=['image/jpeg','image/png','image/webp'].includes(photoBlob.type)&&photoBlob.size<=8*1024*1024;
    if(!validDoc||!validPhoto)throw new Error(tr.size);
    const setting=await api<{durationMinutes:number}>('kyc.settings');
    if(!Number.isInteger(setting.durationMinutes)||setting.durationMinutes<1||setting.durationMinutes>43200)throw new Error(tr.error);
    onDuration(setting.durationMinutes);
    const result=await apiUpload<{record:ServerKycRecord}>('kyc.submit',{documentType,document:new File([doc],docName||'document', {type:doc.type}),photo:new File([photoBlob],photoName||'selfie',{type:photoBlob.type})});
    const normalized={userId,id:result.record.id,documentType:result.record.documentType,submittedAt:result.record.submittedAt*1000,approveAt:result.record.approvedAt*1000,status:result.record.status,documentName:result.record.documentName,photoName:result.record.photoName,central:true};
    setRecord(normalized);setLegacy(null);onSaved(normalized);
  }
  async function submit(e:React.FormEvent){e.preventDefault();setError('');if(!documentFile||!photo){setError(tr.size);return;}setBusy(true);
    try{await saveToServer(documentFile,photo,documentFile.name,photo.name,kind);}catch(e){setError((e as Error).message||tr.error);}finally{setBusy(false);}}
  async function migrateLegacy(){if(!legacy?.document||!legacy.photo){setError(tr.error);return;}setError('');setBusy(true);
    try{await saveToServer(legacy.document,legacy.photo,'document-legado','selfie-legada',legacy.documentType);}catch(e){setError((e as Error).message||tr.error);}finally{setBusy(false);}}
  const isApproved=record?.status==='approved'||(!!record&&clock>=(durationMinutes===null?record.approveAt:record.submittedAt+durationMinutes*60000));
  return <section className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-white"><button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-indigo-200"><ArrowLeft size={24}/>{tr.back}</button><h2 className="text-xl font-bold">{tr.title}</h2>
    <p className="text-xs text-slate-400">{tr.note}</p>{error&&<p role="alert" className="text-rose-300 text-xs">{error}</p>}
    {record?<div className="space-y-3 rounded-xl bg-[#1b2137] p-4"><strong className="text-sm">{isApproved?tr.approved:tr.pending}</strong><p className="text-xs text-slate-300">{tr.submitted}: {new Date(record.submittedAt).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR')}</p>
      <p className="text-[11px] text-slate-400">{tr.simulation}</p>
      <div className="flex flex-wrap gap-3 text-xs"><a className="text-indigo-200 underline" target="_blank" rel="noreferrer" href="/api/index.php?action=kyc.file&kind=document">{tr.openDoc}</a><a className="text-indigo-200 underline" target="_blank" rel="noreferrer" href="/api/index.php?action=kyc.file&kind=photo">{tr.openPhoto}</a></div>
    </div>:legacy?<div className="space-y-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4"><p className="text-sm">{tr.move}</p><p className="text-xs text-slate-300">{tr.submitted}: {new Date(legacy.submittedAt).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR')}</p><button type="button" disabled={busy} onClick={()=>void migrateLegacy()} className="w-full rounded-xl bg-amber-400/20 p-3 text-sm font-bold">{busy?'…':tr.move}</button></div>:
      <form onSubmit={e=>void submit(e)} className="space-y-4"><label className="block text-sm">{tr.type}<select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-xl bg-[#1b2137] p-3"><option value="passport">{language==='en'?'Passport':language==='es'?'Pasaporte':'Passaporte'}</option><option value="rg">RG</option><option value="cpf">CPF</option><option value="other">{language==='en'?'Other':language==='es'?'Otro':'Outro'}</option></select></label>
        <div className="space-y-2"><p className="text-sm">{tr.doc}</p><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-indigo-400/30 bg-[#1b2137] p-3 text-sm text-indigo-100"><FileText size={26} aria-hidden="true"/><span className="min-w-0 truncate">{documentFile?.name??tr.choose}</span><input aria-label={tr.doc} required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setDocumentFile(e.target.files?.[0]??null)} className="sr-only"/></label></div>
        <label className="block text-sm">{tr.photo}<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)} className="mt-2 block w-full text-xs"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 p-3 text-sm font-bold disabled:opacity-50">{busy?'…':tr.send}</button></form>}
  </section>;
};
