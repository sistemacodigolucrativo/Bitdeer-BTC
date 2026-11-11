import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Send, Trash2, RefreshCw } from 'lucide-react';
import { LanguageCode } from '../../types';
import { api } from '../../services/api';

type Props = {language: LanguageCode; onBack: () => void};
type Ticket = {id:number;subject:string;message:string;status:'open'|'resolved';
  ticket_state:'open'|'replied'|'closed';admin_reply:string|null;
  notification_status:'pending'|'accepted'|'failed';created_at:number;
  replies:Array<{id:number;author:'admin'|'member';message:string;created_at:number}>};
const draftKey = 'bitdeer_support_draft_v2';
const labels = {
  pt: {title:'Atendimento',subject:'Assunto',message:'Descreva sua solicitação',
    submit:'Abrir ticket',refresh:'Atualizar',clear:'Limpar rascunho',
    history:'Meus tickets',email:'Abrir e-mail para suporte',back:'Voltar',empty:'Nenhum atendimento registrado.',resolved:'Resolvido',open:'Aberto',submitted:'Informe assunto e descrição.',emailMissing:'O endereço de suporte não está disponível.',emailNotice:'Confirme o envio no seu aplicativo de e-mail.',created:'registrado.',accepted:'E-mail encaminhado ao transporte, entrega não verificada',unconfirmed:'Notificação por e-mail pendente ou indisponível',transported:'Notificação encaminhada ao transporte de e-mail; recebimento não confirmado.',notTransported:'Notificação por e-mail não confirmada; ticket registrado para atendimento.'},
  en: {title:'Support',subject:'Subject',message:'Describe your request',
    submit:'Create ticket',refresh:'Refresh',clear:'Clear draft',
    history:'My tickets',email:'Open support email',back:'Back',empty:'No support requests registered.',resolved:'Resolved',open:'Open',submitted:'Enter a subject and description.',emailMissing:'The support email address is unavailable.',emailNotice:'Confirm delivery in your email application.',created:'registered.',accepted:'Email accepted by the transport, delivery not verified',unconfirmed:'Email notification pending or unavailable',transported:'Email accepted by the transport; delivery is not confirmed.',notTransported:'Email notification not confirmed; ticket has been recorded for support.'},
  es: {title:'Soporte',subject:'Asunto',message:'Describa su solicitud',
    submit:'Crear ticket',refresh:'Actualizar',clear:'Borrar borrador',
    history:'Mis tickets',email:'Abrir correo de soporte',back:'Volver',empty:'No hay solicitudes de soporte registradas.',resolved:'Resuelto',open:'Abierto',submitted:'Indique asunto y descripción.',emailMissing:'La dirección de soporte no está disponible.',emailNotice:'Confirme el envío en su aplicación de correo.',created:'registrado.',accepted:'Correo aceptado por el transporte, entrega no verificada',unconfirmed:'Notificación por correo pendiente o no disponible',transported:'Notificación aceptada por el transporte de correo; recepción no confirmada.',notTransported:'Notificación por correo no confirmada; ticket registrado para atención.'}
};
export const CustomerSupportView: React.FC<Props> = ({language,onBack}) => {
  const tr=labels[language] || labels.pt;
  const [subject,setSubject]=useState('');
  const [message,setMessage]=useState('');
  const [recipient,setRecipient]=useState('');
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState('');
  const [replyTicket,setReplyTicket]=useState<number|null>(null);
  const [replyMessage,setReplyMessage]=useState('');
  const replyLabels=language==='en'?{reply:'Reply',send:'Send reply',cancel:'Cancel',you:'You',support:'Support',closed:'This ticket is closed.'}:
    language==='es'?{reply:'Responder',send:'Enviar respuesta',cancel:'Cancelar',you:'Tú',support:'Soporte',closed:'Este ticket está cerrado.'}:
    {reply:'Responder',send:'Enviar resposta',cancel:'Cancelar',you:'Você',support:'Suporte',closed:'Este ticket está fechado.'};
  async function submitReply(e:React.FormEvent,ticketId:number){
    e.preventDefault();setLoading(true);setNotice('');
    try{await api('support.ticket.reply',{ticketId,message:replyMessage.trim()});setReplyMessage('');setReplyTicket(null);await refresh();}
    catch(error){setNotice((error as Error).message);}
    finally{setLoading(false);}
  }
  async function refresh(){
    try {setTickets((await api<{tickets:Ticket[]}>('support.tickets.mine')).tickets);}
    catch(e){setNotice((e as Error).message);}
  }
  useEffect(()=>{
    try {
      const saved=JSON.parse(sessionStorage.getItem(draftKey)||'{}');
      setSubject(saved.subject||'');setMessage(saved.message||'');
    } catch { /* ignored */ }
    void refresh();
    api<{email:string}>('support').then(d=>setRecipient(d.email)).catch(()=>{});
  },[]);
  useEffect(()=>{
    sessionStorage.setItem(draftKey,JSON.stringify({subject,message}));
  },[subject,message]);
  async function submit(e:React.FormEvent){
    e.preventDefault();setNotice('');
    if(subject.trim().length<3||message.trim().length<10){setNotice(tr.submitted);return;}
    setLoading(true);
    try{
      const result=await api<{ticket:{id:number;notification_status:string}}>(
        'support.ticket.create',{subject:subject.trim(),message:message.trim()});
      setSubject('');setMessage('');sessionStorage.removeItem(draftKey);
      setNotice('Ticket #'+result.ticket.id+' '+tr.created+' '+
        (result.ticket.notification_status==='accepted'?tr.transported:tr.notTransported));
      await refresh();
    }catch(e){setNotice((e as Error).message);}
    finally{setLoading(false);}
  }
  function openMail(){
    if(!recipient){setNotice(tr.emailMissing);return;}
    const url='mailto:'+recipient+'?subject='+encodeURIComponent(subject.trim())+
      '&body='+encodeURIComponent(message.trim());
    window.location.href=url;
    setNotice(tr.emailNotice);
  }
  return <section className="w-full flex-1 flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="p-4 border-b border-[#232943] flex items-center gap-3">
      <button onClick={onBack} aria-label={tr.back}><ArrowLeft size={24}/></button>
      <h2 className="font-bold">{tr.title}</h2>
      <button className="ml-auto" onClick={()=>void refresh()} aria-label={tr.refresh}><RefreshCw size={24}/></button>
    </header>
    <div className="flex-1 min-h-0 p-4 space-y-5 overflow-y-auto overscroll-y-contain touch-pan-y member-vertical-scroll">
      <form onSubmit={e=>void submit(e)} className="space-y-3">
        <label className="block text-sm">{tr.subject}
          <input required minLength={3} maxLength={120} value={subject}
            onChange={e=>setSubject(e.target.value)}
            className="w-full block mt-2 rounded-xl bg-[#1e2338] p-3 border border-[#2b3350]"/>
        </label>
        <label className="block text-sm">{tr.message}
          <textarea required minLength={10} maxLength={2500} value={message}
            onChange={e=>setMessage(e.target.value)} rows={5}
            className="w-full block mt-2 rounded-xl bg-[#1e2338] p-3 border border-[#2b3350]"/>
        </label>
        {notice && <p role="status" className="text-amber-300 text-xs">{notice}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center gap-2 justify-center rounded-xl bg-indigo-600 p-3 disabled:opacity-50">
          <Send size={16}/>{tr.submit}
        </button>
        {recipient && <button type="button" onClick={openMail}
          className="w-full flex items-center gap-2 justify-center rounded-xl border border-slate-600 p-3 text-sm">
          <Mail size={16}/>{tr.email}
        </button>}
        <button type="button" className="w-full flex items-center justify-center gap-2 text-xs text-slate-400"
          onClick={()=>{setSubject('');setMessage('');sessionStorage.removeItem(draftKey);}}>
          <Trash2 size={15}/>{tr.clear}
        </button>
      </form>
      <section className="space-y-2">
        <h3 className="font-bold text-sm">{tr.history}</h3>
        {!tickets.length && <p className="text-xs text-slate-400">{tr.empty}</p>}
        {tickets.map(ticket=><article key={ticket.id}
          className="bg-[#1e2338] p-3 rounded-xl text-xs border border-[#2b3350] space-y-1">
          <strong>#{ticket.id} · {ticket.subject}</strong>
          <p>{ticket.ticket_state==='replied'?(language==='en'?'Answered':language==='es'?'Respondido':'Respondido'):ticket.ticket_state==='closed'?(language==='en'?'Closed':language==='es'?'Cerrado':'Fechado'):tr.open} · {new Date(ticket.created_at*1000).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR')}</p>
          <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
          {ticket.replies?.map(reply=><div key={`${reply.author}-${reply.id}`} data-testid="member-ticket-reply" className="border-t border-[#3d465c] mt-2 pt-2 text-emerald-200">
            <p className="font-semibold mb-1">{reply.author==='admin'?replyLabels.support:replyLabels.you} · {new Date(reply.created_at*1000).toLocaleString(language==='en'?'en-US':language==='es'?'es-ES':'pt-BR')}</p>
            <p className="whitespace-pre-wrap">{reply.message}</p>
          </div>)}
          {ticket.ticket_state==='closed'?<p>{replyLabels.closed}</p>:replyTicket===ticket.id?
            <form onSubmit={e=>void submitReply(e,ticket.id)} className="space-y-2 pt-2">
              <textarea aria-label={replyLabels.reply} required minLength={2} maxLength={2500} rows={3} value={replyMessage} onChange={e=>setReplyMessage(e.target.value)} className="w-full rounded-xl bg-[#121626] p-3 border border-[#3d465c]"/>
              <button disabled={loading} className="rounded-lg bg-indigo-600 px-3 py-2">{replyLabels.send}</button>{' '}
              <button type="button" onClick={()=>setReplyTicket(null)} className="text-slate-300 underline">{replyLabels.cancel}</button>
            </form>:
            <button type="button" onClick={()=>{setReplyTicket(ticket.id);setReplyMessage('');}} className="rounded-lg border border-indigo-400 px-3 py-2 mt-2">{replyLabels.reply}</button>}
          <p className="text-slate-400">{ticket.notification_status==='accepted'?tr.accepted:tr.unconfirmed}</p>
        </article>)}
      </section>
    </div>
  </section>;
};
