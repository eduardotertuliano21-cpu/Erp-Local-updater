import React from 'react';
import { Phone } from 'lucide-react';
import type { OrdemDeServico } from '../../services/assistenciaApi.js';

interface OsCardProps {
  os: OrdemDeServico;
  onMudarStatus: (id: string, novoStatus: OrdemDeServico['status']) => void;
}

export const OsCard: React.FC<OsCardProps> = ({ os, onMudarStatus }) => {
  return (
    <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs hover:shadow-md transition space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-teal-600 dark:text-teal-400 font-mono">
          OS #{os.numero_os}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
          {os.cliente_nome}
        </div>
        {os.cliente_telefone && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{os.cliente_telefone}</span>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
        <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
          {os.equipamento_descricao}
        </div>
        {os.numero_serie && (
          <div className="text-[10px] text-slate-400 font-mono truncate">
            S/N: {os.numero_serie}
          </div>
        )}
        <div className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 italic">
          &quot;{os.defeito_relatado}&quot;
        </div>
      </div>

      {/* Ações de Avanço de Status */}
      <div className="pt-1 flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-700/50">
        {os.status === 'AGUARDANDO_AVALIACAO' && (
          <>
            <button
              onClick={() => onMudarStatus(os.id, 'AGUARDANDO_PECA')}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition"
            >
              + Peça
            </button>
            <button
              onClick={() => onMudarStatus(os.id, 'PRONTO')}
              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition"
            >
              Pronto ✓
            </button>
          </>
        )}
        {os.status === 'AGUARDANDO_PECA' && (
          <button
            onClick={() => onMudarStatus(os.id, 'PRONTO')}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition shadow-xs"
          >
            Marcar Pronto ✓
          </button>
        )}
        {os.status === 'PRONTO' && (
          <button
            onClick={() => onMudarStatus(os.id, 'ENTREGUE')}
            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold transition shadow-xs"
          >
            Entregar ao Cliente
          </button>
        )}
      </div>
    </div>
  );
};
