import React from 'react';
import { X, ShieldCheck, Zap, Server, Calendar, CheckCircle, Hash } from 'lucide-react';
import { LanguageCode, SubscriptionRecord } from '../../types';
import { miningService } from '../../services/miningService';

interface SubscriptionHistoryModalProps {
  language: LanguageCode;
  onClose: () => void;
}

export const SubscriptionHistoryModal: React.FC<SubscriptionHistoryModalProps> = ({
  onClose
}) => {
  const subscriptions: SubscriptionRecord[] = miningService.getState().subscriptionsHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white select-none">
        
        {/* Header */}
        <div className="p-4 border-b border-[#252c48] flex items-center justify-between bg-[#141829]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">History Subscription</h3>
              <p className="text-[10px] text-slate-400">Histórico de planos e assinaturas adquiridas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
              Assinaturas Registradas
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Transações Verificadas
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Nenhuma assinatura anterior encontrada.
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-[#141829] border border-[#232943] rounded-2xl p-3.5 space-y-2 hover:border-[#353f66] transition-colors shadow-sm"
                >
                  {/* Top line: Plan Name and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black">
                        {sub.tierName}
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        {sub.hashRate}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {sub.status === 'active' ? '● Ativo' : 'Concluído'}
                    </span>
                  </div>

                  {/* Hardware Model */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Server className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="font-medium text-[11px]">{sub.serverModel}</span>
                  </div>

                  {/* Details Divider */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {sub.purchaseDateFormatted}
                    </span>
                    <span className="text-emerald-400 font-semibold">{sub.priceFormatted}</span>
                  </div>

                  {/* Transaction ID */}
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" />
                    <span>ID: {sub.transactionId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#15192c] border border-[#232943] rounded-2xl p-3 text-[11px] text-slate-400 leading-relaxed">
            💡 O histórico registra todas as assinaturas adquiridas e ativas na sua conta de mineração dedicada.
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="p-3.5 border-t border-[#252c48] bg-[#141829]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] text-white font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
