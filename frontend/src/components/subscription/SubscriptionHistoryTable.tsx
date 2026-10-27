import React from 'react';
import { History, QrCode, CreditCard } from 'lucide-react';
import type { HistoricoAssinaturaItem } from '../../services/stripeSubscriptionApi.js';

interface SubscriptionHistoryTableProps {
  historico: HistoricoAssinaturaItem[];
  loading: boolean;
}

export const SubscriptionHistoryTable: React.FC<SubscriptionHistoryTableProps> = ({
  historico,
  loading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
          <History className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Histórico de Pagamentos de Assinatura</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">{historico.length} transações</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-3 py-2.5">Data / Hora</th>
              <th className="px-3 py-2.5">Método</th>
              <th className="px-3 py-2.5">Plano</th>
              <th className="px-3 py-2.5">Valor</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Comprovante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400 font-sans">Carregando histórico...</td></tr>
            ) : historico.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400 font-sans">Nenhum pagamento registrado ainda.</td></tr>
            ) : (
              historico.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{h.pago_em ? new Date(h.pago_em).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-sans">
                    {h.metodo_pagamento.includes('PIX') ? <QrCode className="w-3.5 h-3.5 text-emerald-500" /> : <CreditCard className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>{h.metodo_pagamento}</span>
                  </td>
                  <td className="px-3 py-2.5">{h.plano}</td>
                  <td className="px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">R$ {h.valor.toFixed(2)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${h.status.includes('TESTE') ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
                      {h.status.includes('TESTE') ? 'PAGO (MODO TESTE)' : h.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 dark:text-slate-500 text-[10px] truncate max-w-[140px]">{h.stripe_payment_id || h.stripe_session_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
