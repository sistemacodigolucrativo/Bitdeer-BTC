import React, { useState } from 'react';
import { X, Pickaxe, Users, Clock, Calendar, CheckCircle2, ArrowDownRight, Layers } from 'lucide-react';
import { LanguageCode } from '../../types';
import { miningService } from '../../services/miningService';

interface MiningRecordModalProps {
  language: LanguageCode;
  onClose: () => void;
}

export const MiningRecordModal: React.FC<MiningRecordModalProps> = ({
  language,
  onClose
}) => {
  // ANOTAÇÃO 01:
  // "Na tela 'Mining Record', exibir no topo a quantidade de satoshis minerados pelo usuário.
  // A quantidade NÃO deve ser atualizada automaticamente em tempo real enquanto a tela estiver aberta.
  // A atualização deverá ocorrer quando o usuário sair da tela ou do aplicativo e retornar."
  // Captured via initial useState snapshot so it remains frozen while modal is open.
  const [snapshotSatoshis] = useState<number>(() => {
    const totalBtc = miningService.getState().totalBtc;
    return Math.floor(totalBtc * 100_000_000);
  });

  // ANOTAÇÃO 02:
  // "Na tela 'Mining Record', exibir também a opção 'Referral BTC', informando a quantidade
  // de Bitcoin que o usuário ganhou por meio de indicações.
  // O valor apresentado deve corresponder aos ganhos reais de indicação registrados na conta."
  const [referralBtcSnapshot] = useState<number>(() => {
    return miningService.getState().referralBtc ?? 0.000000000000;
  });

  // ANOTAÇÃO 03:
  // "Na tela 'Mining Record', disponibilizar um histórico dos ganhos em satoshis por sessão
  // de utilização do aplicativo. Cada sessão deve apresentar a quantidade de satoshis acumulada
  // durante aquele período. Quando o usuário sair e entrar novamente no aplicativo, uma nova sessão
  // deverá ser registrada separadamente, permitindo consultar os ganhos de cada sessão individualmente."
  const [sessionsSnapshot] = useState(() => {
    return [...miningService.getState().miningSessions];
  });

  const [currentSessionSnapshot] = useState(() => {
    return {
      satoshis: Math.round(miningService.getState().currentSessionSatoshis),
      durationSeconds: miningService.getState().currentSessionDurationSeconds
    };
  });

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white select-none">
        
        {/* Header */}
        <div className="p-4 border-b border-[#252c48] flex items-center justify-between bg-[#141829]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Pickaxe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Mining Record</h3>
              <p className="text-[10px] text-slate-400">Histórico e métricas de mineração</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* ANOTAÇÃO 01: Quantidade de satoshis minerados no topo (Fixo enquanto aberto) */}
          <div className="bg-gradient-to-br from-[#1e2540] to-[#161a2e] border border-amber-500/30 rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400/90 flex items-center gap-1.5">
                <Pickaxe className="w-3.5 h-3.5" />
                Satoshis Minerados
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Total Acumulado
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {snapshotSatoshis.toLocaleString('pt-BR')}
              </span>
              <span className="text-sm font-bold text-amber-400 font-mono">SATS</span>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
              <span>Equivalente: {(snapshotSatoshis / 100_000_000).toFixed(8)} BTC</span>
              <span className="text-slate-500 italic">Atualizado ao entrar na tela</span>
            </div>
          </div>

          {/* ANOTAÇÃO 02: Referral BTC (Ganhos de Indicação) */}
          <div className="bg-[#15192c] border border-[#262f4e] rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                Referral BTC
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conta Verificada
              </span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="font-mono text-base font-black text-white">
                {referralBtcSnapshot.toFixed(12)} <span className="text-xs text-rose-400 font-sans">BTC</span>
              </p>
              <span className="text-[11px] text-slate-400 font-medium">Ganhos por indicação</span>
            </div>
          </div>

          {/* ANOTAÇÃO 03: Histórico de Ganhos por Sessão */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Ganhos por Sessão
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {sessionsSnapshot.length + (currentSessionSnapshot.satoshis > 0 ? 1 : 0)} sessões registradas
              </span>
            </div>

            {/* Sessão Atual em Progresso (se houver satoshis acumulados) */}
            {currentSessionSnapshot.satoshis > 0 && (
              <div className="bg-[#1d233d] border border-indigo-500/40 rounded-2xl p-3 shadow-sm relative">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sessão Atual (Ativa)
                  </span>
                  <span className="text-emerald-400 font-mono font-black">
                    +{currentSessionSnapshot.satoshis} SATS
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                  <span>Duração: {formatDuration(currentSessionSnapshot.durationSeconds)}</span>
                  <span>{(currentSessionSnapshot.satoshis / 100_000_000).toFixed(8)} BTC</span>
                </div>
              </div>
            )}

            {/* Lista das Sessões Anteriores */}
            <div className="space-y-2">
              {sessionsSnapshot.map((session, idx) => (
                <div
                  key={session.id || idx}
                  className="bg-[#141829] border border-[#232943] rounded-2xl p-3 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Sessão #{session.sessionNumber}
                    </span>
                    <span className="text-emerald-400 font-mono font-black">
                      +{session.satoshisMined} SATS
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {session.dateFormatted}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Duração: {formatDuration(session.durationSeconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 leading-tight text-center px-2 pt-1">
              Ao sair e entrar novamente no aplicativo, uma nova sessão é registrada automaticamente com os ganhos daquele período.
            </p>
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
