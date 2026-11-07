import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, ChevronRight, Clock3, ShieldCheck, X } from 'lucide-react';

type Language = 'pt' | 'en' | 'es';

export type AdminOrderNotification = {
  id: number;
  eventType: 'activation_requested' | 'proof_submitted' | 'proof_updated' | 'payment_confirmed';
  orderId: number;
  userId: number;
  login: string;
  planId: string;
  createdAt: number;
  readAt: number | null;
  simulation: boolean;
};

type Props = {
  language: Language;
  unreadCount: number;
  notifications: AdminOrderNotification[];
  onOpenOrders: () => void;
  onOpenOrder: (orderId: number) => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
};

const copy = {
  pt: {
    label: 'Notificações administrativas',
    heading: 'Atividade dos pedidos',
    unread: 'não lidas',
    markAll: 'Marcar todas como lidas',
    markRead: 'Marcar como lida',
    openOrders: 'Abrir pedidos',
    openOrder: 'Abrir pedido',
    empty: 'Tudo em dia',
    emptyHint: 'Novas solicitações e comprovantes aparecerão aqui.',
    order: 'Pedido',
    member: 'Membro',
    simulation: 'Aprovação simulada',
    simulatedNotice: 'Simulação interna — nenhum pagamento BTC real foi confirmado.',
    actualConfirmation: 'Pagamento confirmado',
    events: {
      activation_requested: 'Solicitação de ativação VIP',
      proof_submitted: 'Comprovante enviado',
      proof_updated: 'Comprovante atualizado',
      payment_confirmed: 'Confirmação de pagamento',
    },
    close: 'Fechar notificações',
    notificationList: 'Lista de notificações',
  },
  en: {
    label: 'Admin notifications',
    heading: 'Order activity',
    unread: 'unread',
    markAll: 'Mark all as read',
    markRead: 'Mark as read',
    openOrders: 'Open orders',
    openOrder: 'Open order',
    empty: 'You are up to date',
    emptyHint: 'New requests and proof links will appear here.',
    order: 'Order',
    member: 'Member',
    simulation: 'Simulated approval',
    simulatedNotice: 'Internal simulation — no real BTC payment was confirmed.',
    actualConfirmation: 'Payment confirmed',
    events: {
      activation_requested: 'VIP activation requested',
      proof_submitted: 'Payment proof submitted',
      proof_updated: 'Payment proof updated',
      payment_confirmed: 'Payment confirmation',
    },
    close: 'Close notifications',
    notificationList: 'Notification list',
  },
  es: {
    label: 'Notificaciones administrativas',
    heading: 'Actividad de pedidos',
    unread: 'sin leer',
    markAll: 'Marcar todas como leídas',
    markRead: 'Marcar como leída',
    openOrders: 'Abrir pedidos',
    openOrder: 'Abrir pedido',
    empty: 'Todo al día',
    emptyHint: 'Las nuevas solicitudes y comprobantes aparecerán aquí.',
    order: 'Pedido',
    member: 'Miembro',
    simulation: 'Aprobación simulada',
    simulatedNotice: 'Simulación interna — no se confirmó ningún pago BTC real.',
    actualConfirmation: 'Pago confirmado',
    events: {
      activation_requested: 'Solicitud de activación VIP',
      proof_submitted: 'Comprobante enviado',
      proof_updated: 'Comprobante actualizado',
      payment_confirmed: 'Confirmación de pago',
    },
    close: 'Cerrar notificaciones',
    notificationList: 'Lista de notificaciones',
  },
} as const;

export const AdminNotificationsBell: React.FC<Props> = ({
  language,
  unreadCount,
  notifications,
  onOpenOrders,
  onOpenOrder,
  onMarkRead,
  onMarkAllRead,
}) => {
  const t = copy[language] ?? copy.pt;
  const [open, setOpen] = useState(false);
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const openOrders = () => {
    onOpenOrders();
    setOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        type="button"
        aria-label={`${t.label}${unreadCount > 0 ? `, ${unreadCount} ${t.unread}` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-[#20243a] text-slate-200 transition hover:border-indigo-300/30 hover:bg-[#292e49] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:h-11 sm:w-11"
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#171b2d] bg-amber-300 px-1 text-[9px] font-black leading-none text-[#251d11] tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/35 sm:bg-transparent"
          />
          <section
            role="dialog"
            aria-label={t.label}
            className="admin-notifications-panel z-50 overflow-hidden rounded-2xl border border-[#343b59] bg-[#171b2d] text-white shadow-2xl shadow-slate-950/45"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#1b2034] px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-300/20 bg-indigo-300/[0.08] text-indigo-200">
                  <Bell size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{t.heading}</h2>
                  <p className="text-[10px] text-slate-400">
                    {unreadCount} {t.unread}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            {unreadCount > 0 && (
              <div className="border-b border-white/[0.06] px-4 py-2">
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-indigo-200 transition hover:text-indigo-100 focus-visible:outline-none focus-visible:underline"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  {t.markAll}
                </button>
              </div>
            )}

            <div className="max-h-[min(65vh,28rem)] overflow-y-auto overscroll-contain p-2" aria-label={t.notificationList}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-8 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-200">
                    <Check size={20} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-100">{t.empty}</p>
                  <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-slate-400">{t.emptyHint}</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {notifications.map((notification) => {
                    const isUnread = notification.readAt === null;
                    const isSimulatedApproval =
                      notification.eventType === 'payment_confirmed' && notification.simulation;
                    const eventLabel = isSimulatedApproval
                      ? t.simulation
                      : notification.eventType === 'payment_confirmed'
                        ? t.actualConfirmation
                        : t.events[notification.eventType];
                    return (
                        <li
                        key={notification.id}
                        className={`min-w-0 rounded-xl border p-3 transition ${
                          isUnread
                            ? 'border-indigo-300/15 bg-indigo-300/[0.055]'
                            : 'border-transparent bg-[#141827] hover:border-white/[0.08]'
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            isSimulatedApproval
                              ? 'bg-amber-300/10 text-amber-200'
                              : notification.eventType === 'payment_confirmed'
                                ? 'bg-emerald-300/10 text-emerald-200'
                                : 'bg-indigo-300/10 text-indigo-200'
                          }`}>
                            {isSimulatedApproval ? <ShieldCheck size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              data-testid="admin-notification-open-order"
                              aria-label={`${t.openOrder} ${t.order} #${notification.orderId}: ${eventLabel}`}
                              onClick={() => onOpenOrder(notification.orderId)}
                              className="group block w-full min-w-0 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <p className="min-w-0 break-words text-xs font-semibold leading-5 text-slate-100 group-hover:text-indigo-100">{eventLabel}</p>
                                {isUnread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" aria-label={t.unread} />}
                              </div>
                              <div className="mt-1 flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400">
                                <span>{t.order} <strong className="break-all font-mono font-semibold text-slate-200">#{notification.orderId}</strong></span>
                                <span className="break-all">{notification.planId}</span>
                              </div>
                              <p className="mt-1 break-words text-[11px] text-slate-300" title={`${notification.login} · ${t.member} #${notification.userId}`}>
                                {notification.login} <span className="text-slate-600">·</span> {t.member} #{notification.userId}
                              </p>
                            </button>
                            {isSimulatedApproval && (
                              <p className="mt-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-amber-100/85">
                                {t.simulatedNotice}
                              </p>
                            )}
                            <div className="mt-2.5 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                              <span className="inline-flex min-w-0 flex-1 items-start gap-1 text-[10px] text-slate-500">
                                <Clock3 className="mt-0.5 shrink-0" size={11} aria-hidden="true" />
                                  <time className="min-w-0 whitespace-normal break-words" dateTime={new Date(notification.createdAt * 1000).toISOString()}>
                                  {new Date(notification.createdAt * 1000).toLocaleString(locale)}
                                </time>
                              </span>
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={() => onMarkRead(notification.id)}
                                  className="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium text-indigo-200 transition hover:bg-indigo-200/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-300"
                                >
                                  {t.markRead}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-white/[0.08] p-2">
              <button
                type="button"
                onClick={openOrders}
                className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl bg-indigo-300/[0.09] px-3 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-300/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <span>{t.openOrders}</span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
};
