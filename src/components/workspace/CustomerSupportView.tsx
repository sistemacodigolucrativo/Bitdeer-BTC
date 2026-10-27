import React, { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Send, Trash2 } from 'lucide-react';
import { LanguageCode } from '../../types';
import { api } from '../../services/api';

type Props = { language: LanguageCode; onBack: () => void };
const draftKey = 'bitdeer_support_draft_v1';
export const CustomerSupportView: React.FC<Props> = ({ language, onBack }) => {
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notice, setNotice] = useState('');
  const tr = language === 'en'
    ? {title:'Customer Support', subject:'Subject', detail:'Description', open:'Open email app', copy:'Copy message', clear:'Clear draft'}
    : language === 'es'
    ? {title:'Soporte', subject:'Asunto', detail:'Contexto', open:'Abrir correo', copy:'Copiar mensaje', clear:'Borrar borrador'}
    : {title:'Suporte', subject:'Assunto', detail:'Contexto', open:'Abrir aplicativo de e-mail', copy:'Copiar mensagem', clear:'Limpar rascunho'};
  useEffect(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(draftKey) || '{}'); setSubject(saved.subject || ''); setContext(saved.context || ''); } catch { /* ignore damaged draft */ }
    api<{email: string}>('support').then(data => setRecipient(data.email)).catch(() => setNotice('Não foi possível carregar o endereço de suporte.'));
  }, []);
  useEffect(() => { sessionStorage.setItem(draftKey, JSON.stringify({subject,context})); }, [subject,context]);
  const message = 'Assunto: ' + subject.trim() + '\n\n' + context.trim();
  function valid(): boolean {
    if (!recipient || !subject.trim() || !context.trim() || subject.length > 120 || context.length > 2500) {
      setNotice('Preencha assunto e contexto (até 120 e 2500 caracteres).'); return false;
    }
    return true;
  }
  function openMail(e: React.FormEvent) {
    e.preventDefault();
    if (!valid()) return;
    const href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject.trim()) +
      '&body=' + encodeURIComponent(context.trim());
    setNotice('Seu aplicativo de e-mail será aberto; confirme o envio nele.');
    window.location.href = href;
  }
  async function copyMessage() {
    if (!valid()) return;
    try { await navigator.clipboard.writeText('Para: ' + recipient + '\n' + message); setNotice('Mensagem copiada. Confirme o envio no seu e-mail.'); }
    catch { setNotice('Não foi possível copiar; selecione o texto manualmente.'); }
  }
  return <section className="w-full flex-1 flex flex-col bg-[#121626] text-white overflow-hidden">
    <header className="p-4 border-b border-[#232943] flex items-center gap-3">
      <button onClick={onBack} aria-label="Voltar"><ArrowLeft size={20}/></button>
      <h2 className="font-bold">{tr.title}</h2>
    </header>
    <form onSubmit={openMail} className="p-5 space-y-4 overflow-auto">
      <p className="text-xs text-slate-400">Destino: {recipient || 'Carregando...'}</p>
      <label className="block text-sm">{tr.subject}
        <input required maxLength={120} value={subject} onChange={e => setSubject(e.target.value)}
          className="block w-full mt-2 rounded-xl bg-[#1e2338] p-3 border border-[#2b3350]" />
      </label>
      <label className="block text-sm">{tr.detail}
        <textarea required maxLength={2500} rows={7} value={context} onChange={e => setContext(e.target.value)}
          className="block w-full mt-2 rounded-xl bg-[#1e2338] p-3 border border-[#2b3350]"/>
      </label>
      {notice && <p role="status" className="text-xs text-amber-300">{notice}</p>}
      <button type="submit" className="w-full rounded-xl bg-indigo-600 p-3 font-semibold flex justify-center gap-2"><Send size={16}/>{tr.open}</button>
      <button type="button" onClick={() => void copyMessage()} className="w-full rounded-xl border border-slate-600 p-3 flex justify-center gap-2"><Copy size={16}/>{tr.copy}</button>
      <button type="button" onClick={() => {setSubject('');setContext('');sessionStorage.removeItem(draftKey);setNotice('');}}
        className="w-full text-slate-400 text-sm flex justify-center gap-2"><Trash2 size={16}/>{tr.clear}</button>
    </form>
  </section>;
};
