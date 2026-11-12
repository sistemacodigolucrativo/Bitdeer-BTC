import React from 'react';
import { ArrowLeft, Check, Cpu, LayoutTemplate } from 'lucide-react';

export type MiningCardTemplate = 'aurora' | 'studio' | 'neon' | 'minimal';

const copy = {
  pt: {
    title: 'Preview do painel', subtitle: 'Escolha como o Painel de Mineração aparece no seu Início.', back: 'Voltar', active: 'Em uso', choose: 'Usar este layout', saving: 'Salvando…',
    layouts: [
      ['aurora', 'Aurora', 'Painel amplo, com destaque para o processador e saldos.'],
      ['studio', 'Studio', 'Saldos e processador em colunas, com leitura rápida.'],
      ['neon', 'Neon', 'Contraste vibrante, brilho e status em evidência.'],
      ['minimal', 'Minimal', 'Composição compacta, limpa e direta.'],
    ] as const,
  },
  en: {
    title: 'Dashboard preview', subtitle: 'Choose how the Mining Panel appears on your Home screen.', back: 'Back', active: 'Active', choose: 'Use this layout', saving: 'Saving…',
    layouts: [
      ['aurora', 'Aurora', 'Spacious panel with the processor and balances in focus.'],
      ['studio', 'Studio', 'Balances and processor in columns for quick reading.'],
      ['neon', 'Neon', 'Vibrant contrast, glow, and a prominent status.'],
      ['minimal', 'Minimal', 'A compact, clean, straightforward composition.'],
    ] as const,
  },
  es: {
    title: 'Vista previa del panel', subtitle: 'Elige cómo aparece el Panel de Minería en Inicio.', back: 'Volver', active: 'Activo', choose: 'Usar este diseño', saving: 'Guardando…',
    layouts: [
      ['aurora', 'Aurora', 'Panel amplio, con el procesador y los saldos destacados.'],
      ['studio', 'Studio', 'Saldos y procesador en columnas para leer rápidamente.'],
      ['neon', 'Neon', 'Contraste vibrante, brillo y estado destacado.'],
      ['minimal', 'Minimal', 'Composición compacta, limpia y directa.'],
    ] as const,
  },
};

const previewColors: Record<MiningCardTemplate, { frame: string; accent: string; processor: string }> = {
  aurora: { frame: 'from-indigo-950 via-slate-900 to-slate-950', accent: 'bg-emerald-400', processor: 'border-blue-400/50 bg-blue-950/70' },
  studio: { frame: 'from-slate-900 to-slate-950', accent: 'bg-cyan-300', processor: 'border-cyan-300/40 bg-slate-800' },
  neon: { frame: 'from-emerald-950 via-slate-900 to-blue-950', accent: 'bg-lime-300', processor: 'border-emerald-300/50 bg-emerald-950/50' },
  minimal: { frame: 'from-slate-800 to-slate-900', accent: 'bg-sky-300', processor: 'border-slate-600 bg-slate-800' },
};

const MiniPreview: React.FC<{ template: MiningCardTemplate }> = ({ template }) => {
  const colors = previewColors[template];
  return <div aria-hidden="true" className={`overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${colors.frame} p-2.5`}>
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="h-2 w-20 rounded-full bg-white/70" />
      <div className="h-4 w-14 rounded-md bg-emerald-300/15 ring-1 ring-emerald-300/25" />
    </div>
    <div className={template === 'studio' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      <div className={template === 'minimal' ? 'flex gap-2' : 'grid grid-cols-2 gap-2'}>
        <div className="rounded-lg border border-amber-200/10 bg-black/25 p-2">
          <div className="mb-1 h-1 w-8 rounded bg-white/25"/><div className="h-2 w-full rounded bg-amber-200/80"/>
        </div>
        <div className="rounded-lg border border-emerald-200/10 bg-black/25 p-2">
          <div className="mb-1 h-1 w-7 rounded bg-white/25"/><div className="h-2 w-full rounded bg-emerald-100/80"/>
        </div>
      </div>
      <div className={`flex items-center justify-center gap-2 rounded-lg border p-2 ${colors.processor}`}>
        <Cpu size={template === 'neon' ? 24 : 20} className={template === 'neon' ? 'text-emerald-200 drop-shadow-[0_0_6px_rgba(110,231,183,0.9)]' : 'text-blue-200'}/>
        <div className="space-y-1"><div className="h-1.5 w-12 rounded bg-white/70"/><div className={`h-1 w-8 rounded ${colors.accent}`}/></div>
      </div>
    </div>
    <div className={`mt-2 h-1.5 rounded-full ${template === 'minimal' ? 'bg-sky-400' : colors.accent}`} />
  </div>;
};

export const MiningCardTemplatesView: React.FC<{
  language: 'pt' | 'en' | 'es'; selected: MiningCardTemplate; saving: boolean; error?: string;
  onSelect: (template: MiningCardTemplate) => void; onBack: () => void;
}> = ({ language, selected, saving, error = '', onSelect, onBack }) => {
  const t = copy[language] ?? copy.pt;
  return <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
    <header className="mb-4 flex items-start gap-3">
      <button type="button" onClick={onBack} aria-label={t.back} className="rounded-xl border border-[#303b59] bg-[#11182c] p-2 text-slate-200"><ArrowLeft size={19}/></button>
      <div><h2 className="text-lg font-extrabold text-white">{t.title}</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">{t.subtitle}</p></div>
    </header>
    {error&&<p role="alert" className="mb-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-xs text-rose-100">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {t.layouts.map(([id, name, description]) => {
        const key = id as MiningCardTemplate;
        const active = selected === key;
        return <article key={key} className={`rounded-2xl border p-3 transition ${active ? 'border-indigo-300/70 bg-indigo-400/[0.08] shadow-lg shadow-indigo-950/25' : 'border-[#2b3350] bg-[#171b2d]'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold text-white">{name}</h3>
            {active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200"><Check size={12}/>{t.active}</span>}
          </div>
          <MiniPreview template={key}/>
          <p className="mt-3 min-h-10 text-xs leading-relaxed text-slate-400">{description}</p>
          <button type="button" disabled={saving || active} onClick={()=>onSelect(key)} className={`mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:cursor-default disabled:opacity-60 ${active ? 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.99]'}`}>
            {saving ? t.saving : active ? t.active : t.choose}
          </button>
        </article>;
      })}
    </div>
  </section>;
};
