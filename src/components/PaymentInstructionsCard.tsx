import React, { useEffect, useState } from 'react';
import { Bitcoin, Check, Clock3, Copy, ExternalLink, Link2, ShieldCheck, X } from 'lucide-react';

type Language = 'pt' | 'en' | 'es';

export type PaymentInstructionsOrder = {
  orderId: number;
  priceUsd: string;
  quoteRateUsd: string;
  quoteSource: string;
  btcAddress: string;
  btcSatoshis: number;
  btcAmount: string;
  expiresAt: number;
  proofUrl: string | null;
  proofSubmittedAt: number | null;
};

type Props = {
  language: Language;
  order: PaymentInstructionsOrder;
  qrDataUrl: string;
  remainingSeconds: number;
  proofLink: string;
  proofSaving: boolean;
  copied: 'address' | 'btc' | null;
  onProofLinkChange: (value: string) => void;
  onSubmitProof: () => void;
  onCopyAddress: () => void;
  onCopyAmount: () => void;
  onClose: () => void;
};

const copy = {
  pt: {
    title: 'Instruções de pagamento',
    order: 'Pedido',
    exactAmount: 'Envie exatamente',
    amount: 'Valor BTC',
    rate: 'Cotação BTC/USD',
    source: 'Fonte da cotação',
    expires: 'Cotação expira em',
    expired: 'Cotação expirada',
    scan: 'Escaneie para pagar',
    address: 'Endereço Bitcoin',
    copyAddress: 'Copiar endereço',
    copyAmount: 'Copiar valor',
    copied: 'Copiado',
    proofTitle: 'Enviar comprovante',
    proofHint: 'Cole o link público do comprovante para análise administrativa.',
    proofPlaceholder: 'https://…',
    submit: 'Enviar para análise',
    submitting: 'Enviando…',
    submitted: 'Link de comprovante enviado',
    submittedAt: 'Enviado em',
    submittedLink: 'Link enviado',
    noConfirmation: 'O envio do link não confirma o pagamento nem ativa o plano. A ativação ocorre somente após a verificação administrativa.',
    paymentWarning: 'Confira o valor e o endereço antes de enviar. Não pague após o vencimento.',
    back: 'Voltar',
    next: 'Avançar',
    close: 'Fechar instruções',
  },
  en: {
    title: 'Payment instructions',
    order: 'Order',
    exactAmount: 'Send exactly',
    amount: 'BTC amount',
    rate: 'BTC/USD rate',
    source: 'Rate source',
    expires: 'Rate expires in',
    expired: 'Rate expired',
    scan: 'Scan to pay',
    address: 'Bitcoin address',
    copyAddress: 'Copy address',
    copyAmount: 'Copy amount',
    copied: 'Copied',
    proofTitle: 'Submit proof',
    proofHint: 'Paste a public proof link for administrative review.',
    proofPlaceholder: 'https://…',
    submit: 'Send for review',
    submitting: 'Submitting…',
    submitted: 'Proof link submitted',
    submittedAt: 'Submitted',
    submittedLink: 'Submitted link',
    noConfirmation: 'Submitting a link does not confirm payment or activate your plan. Activation follows administrative verification only.',
    paymentWarning: 'Check the amount and address before sending. Do not pay after expiry.',
    back: 'Back',
    next: 'Next',
    close: 'Close instructions',
  },
  es: {
    title: 'Instrucciones de pago',
    order: 'Pedido',
    exactAmount: 'Envíe exactamente',
    amount: 'Importe BTC',
    rate: 'Cotización BTC/USD',
    source: 'Fuente de cotización',
    expires: 'La cotización vence en',
    expired: 'Cotización vencida',
    scan: 'Escanee para pagar',
    address: 'Dirección Bitcoin',
    copyAddress: 'Copiar dirección',
    copyAmount: 'Copiar importe',
    copied: 'Copiado',
    proofTitle: 'Enviar comprobante',
    proofHint: 'Pegue un enlace público del comprobante para revisión administrativa.',
    proofPlaceholder: 'https://…',
    submit: 'Enviar para revisión',
    submitting: 'Enviando…',
    submitted: 'Enlace del comprobante enviado',
    submittedAt: 'Enviado',
    submittedLink: 'Enlace enviado',
    noConfirmation: 'Enviar un enlace no confirma el pago ni activa el plan. La activación ocurre únicamente tras la verificación administrativa.',
    paymentWarning: 'Compruebe el importe y la dirección antes de enviar. No pague después del vencimiento.',
    back: 'Volver',
    next: 'Siguiente',
    close: 'Cerrar instrucciones',
  },
} as const;

function formatCountdown(seconds: number, language: Language) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (language === 'en') {
    return hours > 0
      ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      : `${minutes}m ${String(secs).padStart(2, '0')}s`;
  }
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}min ${String(secs).padStart(2, '0')}s`
    : `${minutes}min ${String(secs).padStart(2, '0')}s`;
}

export const PaymentInstructionsCard: React.FC<Props> = ({
  language,
  order,
  qrDataUrl,
  remainingSeconds,
  proofLink,
  proofSaving,
  copied,
  onProofLinkChange,
  onSubmitProof,
  onCopyAddress,
  onCopyAmount,
  onClose,
}) => {
  const t = copy[language] ?? copy.pt;
  const [step,setStep]=useState<1|2|3>(1);
  useEffect(()=>setStep(1),[order.orderId]);
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
  const expiryDate = new Date(order.expiresAt * 1000);
  const submittedDate = order.proofSubmittedAt
    ? new Date(order.proofSubmittedAt * 1000).toLocaleString(locale)
    : null;
  const addressFontSize = `${Math.max(5.5, Math.min(8.5, 252 / Math.max(order.btcAddress.length * 0.61, 1)))}px`;
  const countdown = formatCountdown(remainingSeconds, language);

  return (
    <section
      data-testid="payment-instructions-card"
      aria-labelledby="payment-instructions-title"
      className="relative flex max-h-[calc(100dvh-2rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-indigo-300/20 bg-[#171b2d] text-white shadow-xl shadow-slate-950/25"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      <header className="relative z-10 flex shrink-0 min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#171b2d] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/[0.08] text-amber-200">
            <Bitcoin size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="payment-instructions-title" className="single-line-ellipsis text-sm font-semibold tracking-tight text-white sm:text-base">
              {t.title}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <X size={19} aria-hidden="true" />
        </button>
      </header>

      <div data-testid="payment-step-content" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
        <div data-testid="payment-stage-1" className={step===1?'flex min-w-0 flex-col items-center':'hidden'}>
          <div className="flex w-full min-w-0 flex-col items-center">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t.scan}
            </p>
            <div className="mx-auto flex aspect-square w-full max-w-[190px] items-center justify-center overflow-hidden rounded-xl bg-white p-2 sm:max-w-[210px]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${t.scan} — ${t.order} #${order.orderId}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div
                  role="status"
                  aria-label={language === 'en' ? 'Loading QR code' : language === 'es' ? 'Cargando código QR' : 'Carregando código QR'}
                  className="h-full w-full animate-pulse rounded-lg bg-slate-200"
                />
              )}
            </div>
          </div>
          <p className="mt-3 flex max-w-md items-start gap-2 text-center text-[11px] leading-relaxed text-amber-100/80">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
            <span>{t.paymentWarning}</span>
          </p>
        </div>

        <div className={step===1?'hidden':'mx-auto w-full max-w-2xl space-y-3'}>
          <div data-testid="payment-stage-2" className={step===2?'space-y-3':'hidden'}>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-amber-100/70">{t.exactAmount}</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <strong className="min-w-0 break-all font-mono text-[clamp(1.35rem,5vw,2rem)] font-bold leading-tight tracking-tight text-amber-100 tabular-nums">
                {order.btcAmount}
              </strong>
              <span className="text-xs font-semibold text-amber-100/70">BTC</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              USD {order.priceUsd} <span className="text-slate-500">·</span> {order.btcSatoshis.toLocaleString(locale)} sats
            </p>
            <button
              type="button"
              onClick={onCopyAmount}
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-200/20 bg-[#201f2d] px-3 text-xs font-semibold text-amber-100 transition hover:bg-[#2a2837] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {copied === 'btc' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied === 'btc' ? t.copied : t.copyAmount}
            </button>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#141827] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.address}</p>
            <div className="flex min-w-0 items-center gap-2">
              <p data-testid="payment-btc-address" title={order.btcAddress}
                className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center font-mono leading-4 tracking-[-0.04em] text-slate-100"
                style={{fontSize:addressFontSize}}>{order.btcAddress}</p>
              <button type="button" onClick={onCopyAddress}
                aria-label={copied==='address'?t.copied:t.copyAddress}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#222944] px-2.5 text-[11px] font-semibold text-slate-100 transition hover:bg-[#2c3556] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                {copied==='address'?<Check size={13} aria-hidden="true"/>:<Copy size={13} aria-hidden="true"/>}
                {copied==='address'?t.copied:t.copyAddress}
              </button>
            </div>
          </div>

          <dl className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-white/[0.07] bg-[#141827] p-3">
            <div className="min-w-0">
              <dt className="text-[10px] text-slate-500">{t.rate}</dt>
              <dd className="mt-1 truncate font-mono text-xs text-slate-200">USD {order.quoteRateUsd}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[10px] text-slate-500">{t.source}</dt>
              <dd className="mt-1 truncate text-xs text-slate-200" title={order.quoteSource}>{order.quoteSource || '—'}</dd>
            </div>
            <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 border-t border-white/[0.07] pt-2">
              <dt className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400">
                <Clock3 size={13} aria-hidden="true" />
                <span>{t.expires}</span>
              </dt>
              <dd className={`shrink-0 font-mono text-xs tabular-nums ${remainingSeconds <= 0 ? 'text-rose-300' : 'text-amber-200'}`}>
                {remainingSeconds <= 0 ? t.expired : countdown}
              </dd>
            </div>
            <div className="col-span-2 min-w-0 text-right text-[10px] text-slate-500">
              {expiryDate.toLocaleString(locale)}
            </div>
          </dl>
          <p className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true"/>
            <span>{t.paymentWarning}</span>
          </p>
          </div>

          <div data-testid="payment-stage-3" className={step===3?'space-y-3':'hidden'}>
          <form className="min-w-0 space-y-2.5" onSubmit={(event)=>{event.preventDefault();onSubmitProof();}}>
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-indigo-200" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-100">{t.proofTitle}</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{t.proofHint}</p>
            <label className="sr-only" htmlFor={`proof-link-${order.orderId}`}>{t.proofTitle}</label>
            <input
              id={`proof-link-${order.orderId}`}
              type="url"
              inputMode="url"
              disabled={remainingSeconds <= 0 || proofSaving}
              value={proofLink}
              onChange={(event) => onProofLinkChange(event.target.value)}
              placeholder={t.proofPlaceholder}
              className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#111522] px-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-indigo-300/50 focus:ring-2 focus:ring-indigo-300/15"
            />
            {order.proofSubmittedAt !== null && (
              <div role="status" className="min-w-0 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                  <Check size={14} aria-hidden="true" /> {t.submitted}
                </p>
                {submittedDate && <p className="mt-1 text-[10px] text-slate-400">{t.submittedAt}: {submittedDate}</p>}
                {order.proofUrl && (
                  <a
                    href={order.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-indigo-200 underline decoration-indigo-200/40 underline-offset-2"
                  >
                    <span className="truncate">{t.submittedLink}</span>
                    <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={proofSaving || !proofLink.trim() || remainingSeconds <= 0}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 text-sm font-bold text-[#171b2d] transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b2d]"
            >
              {remainingSeconds <= 0 ? t.expired : proofSaving ? t.submitting : t.submit}
              {!proofSaving && <ExternalLink size={15} aria-hidden="true" />}
            </button>
            <p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/80">
              {t.noConfirmation}
            </p>
          </form>
          <p className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true"/>
            <span>{t.paymentWarning}</span>
          </p>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-white/[0.07] bg-[#151a2a] px-3 py-2.5 sm:px-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
          <span>{t.order} <strong data-testid="payment-order-reference" className="font-mono font-medium text-slate-400">#{order.orderId}</strong></span>
          <span data-testid="payment-step-number" aria-live="polite" className="font-mono tabular-nums text-slate-300">{step}/3</span>
        </div>
        <div role="progressbar" aria-label={`${step}/3`} aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}
          className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-indigo-300 transition-[width] duration-300" style={{width:`${step/3*100}%`}}/>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" data-testid="payment-step-back" onClick={()=>setStep(step===3?2:1)} disabled={step===1}
            className="min-h-9 min-w-24 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40">
            {t.back}
          </button>
          <button type="button" data-testid="payment-step-next" onClick={()=>setStep(step===1?2:3)} disabled={step===3}
            className="min-h-9 min-w-24 rounded-lg bg-indigo-300 px-3 text-xs font-bold text-[#171b2d] transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-40">
            {t.next}
          </button>
        </div>
      </footer>
    </section>
  );
};
