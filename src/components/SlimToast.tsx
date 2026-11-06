import React from 'react';
import { Check, X } from 'lucide-react';
import { LanguageCode } from '../types';

type Props = {
  message: string;
  language: LanguageCode;
  onDismiss: () => void;
};

export const SlimToast: React.FC<Props> = ({ message, language, onDismiss }) => {
  if (!message) return null;
  const dismissLabel = language === 'en'
    ? 'Dismiss notification'
    : language === 'es'
      ? 'Cerrar notificación'
      : 'Fechar aviso';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3">
      <div
        data-testid="slim-toast"
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-fit max-w-full min-w-0 items-center gap-2 rounded-xl border border-emerald-300/20 bg-[#17251f]/95 px-3.5 py-2 text-emerald-50 shadow-lg shadow-black/25 backdrop-blur-sm"
      >
        <Check size={15} className="shrink-0 text-emerald-300" aria-hidden="true" />
        <span className="min-w-0 break-words text-xs leading-4">{message}</span>
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald-100/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
