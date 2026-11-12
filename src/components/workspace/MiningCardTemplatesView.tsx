import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { MemberData } from '../../services/api';
import { ServerHomeView } from '../ServerHomeView';

export type MiningCardTemplate = 'aurora' | 'studio' | 'neon' | 'minimal';

const copy = {
  pt: {
    title: 'Preview do painel', subtitle: 'Compare os layouts com os dados atuais da sua conta e escolha como o Painel de Mineração aparece no Início.', back: 'Voltar', active: 'Em uso', choose: 'Usar este layout', saving: 'Salvando…',
    layouts: [
      ['aurora', 'Aurora', 'Composição ampla, com destaque para o processador e os saldos.'],
      ['studio', 'Studio', 'Saldos e processador organizados em colunas.'],
      ['neon', 'Neon', 'Contraste vibrante, brilho e estado do processador em evidência.'],
      ['minimal', 'Minimal', 'Composição compacta, limpa e direta.'],
    ] as const,
  },
  en: {
    title: 'Dashboard preview', subtitle: 'Compare layouts using your current account data and choose how the Mining Panel appears on Home.', back: 'Back', active: 'Active', choose: 'Use this layout', saving: 'Saving…',
    layouts: [
      ['aurora', 'Aurora', 'Spacious composition highlighting the processor and balances.'],
      ['studio', 'Studio', 'Balances and processor organized in columns.'],
      ['neon', 'Neon', 'Vibrant contrast, glow, and a prominent processor status.'],
      ['minimal', 'Minimal', 'A compact, clean, straightforward composition.'],
    ] as const,
  },
  es: {
    title: 'Vista previa del panel', subtitle: 'Compara los diseños con los datos actuales de tu cuenta y elige cómo aparece el Panel de Minería en Inicio.', back: 'Volver', active: 'Activo', choose: 'Usar este diseño', saving: 'Guardando…',
    layouts: [
      ['aurora', 'Aurora', 'Composición amplia que destaca el procesador y los saldos.'],
      ['studio', 'Studio', 'Saldos y procesador organizados en columnas.'],
      ['neon', 'Neon', 'Contraste vibrante, brillo y estado destacado.'],
      ['minimal', 'Minimal', 'Composición compacta, limpia y directa.'],
    ] as const,
  },
};

export const MiningCardTemplatesView: React.FC<{
  language: 'pt' | 'en' | 'es'; selected: MiningCardTemplate; saving: boolean; error?: string;
  account: MemberData | null; liveBalanceUsd: number; liveBtc: string | null;
  onSelect: (template: MiningCardTemplate) => void; onBack: () => void;
}> = ({ language, selected, saving, error = '', account, liveBalanceUsd, liveBtc, onSelect, onBack }) => {
  const t = copy[language] ?? copy.pt;
  return <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
    <header className="mb-4 flex items-start gap-3">
      <button type="button" onClick={onBack} aria-label={t.back} className="rounded-xl border border-[#303b59] bg-[#11182c] p-2 text-slate-200"><ArrowLeft size={19}/></button>
      <div><h2 className="text-lg font-extrabold text-white">{t.title}</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">{t.subtitle}</p></div>
    </header>
    {error&&<p role="alert" className="mb-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs text-rose-100">{error}</p>}
    <div className="grid gap-4 xl:grid-cols-2">
      {t.layouts.map(([id, name, description]) => {
        const key = id as MiningCardTemplate;
        const active = selected === key;
        return <article key={key} className={`min-w-0 rounded-2xl border p-3 transition ${active ? 'border-indigo-300/70 bg-indigo-400/[0.08] shadow-lg shadow-indigo-950/25' : 'border-[#2b3350] bg-[#171b2d]'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div><h3 className="font-bold text-white">{name}</h3><p className="mt-1 text-[11px] leading-relaxed text-slate-400">{description}</p></div>
            {active && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200"><Check size={12}/>{t.active}</span>}
          </div>
          <div className="pointer-events-none min-w-0 select-none">
            <ServerHomeView account={account} language={language} busy liveBtc={liveBtc} liveBalanceUsd={liveBalanceUsd}
              onStart={()=>{}} onStop={()=>{}} onRewards={()=>{}} onHistory={()=>{}} onAvatarClick={()=>{}}
              avatarLocked returning={false} template={key} previewOnly/>
          </div>
          <button type="button" disabled={saving || active} onClick={()=>onSelect(key)} className={`mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:cursor-default disabled:opacity-60 ${active ? 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.99]'}`}>
            {saving ? t.saving : active ? t.active : t.choose}
          </button>
        </article>;
      })}
    </div>
  </section>;
};
