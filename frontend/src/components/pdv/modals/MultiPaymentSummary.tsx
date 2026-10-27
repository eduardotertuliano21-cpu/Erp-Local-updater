import React from 'react';
import type { PagamentoItem, MetodoPagamento } from '../../../types/pdv.js';
import { Trash2, Clock } from 'lucide-react';

interface MultiPaymentSummaryProps {
  totalPagar: number;
  pagamentos: PagamentoItem[];
  restante: number;
  troco: number;
  onRemover: (index: number) => void;
}

const getLabelMetodo = (m: MetodoPagamento): string => {
  switch (m) {
    case 'DINHEIRO': return 'Dinheiro';
    case 'PIX': return 'PIX';
    case 'CARTAO_DEBITO': return 'Cartão Débito';
    case 'CARTAO_CREDITO': return 'Cartão Crédito';
    case 'CONVENIO': return 'Convênio / Fiado';
    case 'VALE_REFEICAO': return 'Vale Refeição';
    default: return m;
  }
};

export const MultiPaymentSummary: React.FC<MultiPaymentSummaryProps> = ({
  totalPagar,
  pagamentos,
  restante,
  troco,
  onRemover,
}) => {
  const totalLancado = pagamentos.reduce((acc, p) => acc + p.valor, 0);

  return (
    <div className="space-y-2.5">
      {/* Resumo Numérico Superior */}
      <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/[0.06] text-center font-mono">
        <div className="p-1.5 rounded-lg bg-white/[0.03]">
          <span className="text-[10px] text-zinc-400 uppercase block font-sans">Total</span>
          <span className="text-sm font-black text-white tabular-nums">R$ {totalPagar.toFixed(2)}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-white/[0.03]">
          <span className="text-[10px] text-zinc-400 uppercase block font-sans">Lançado</span>
          <span className="text-sm font-black text-blue-400 tabular-nums">R$ {totalLancado.toFixed(2)}</span>
        </div>
        <div className={`p-1.5 rounded-lg ${restante > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
          <span className="text-[10px] text-zinc-400 uppercase block font-sans">{restante > 0 ? 'Falta Pagar' : 'Status'}</span>
          <span className={`text-sm font-black tabular-nums ${restante > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {restante > 0 ? `R$ ${restante.toFixed(2)}` : '✓ Concluído'}
          </span>
        </div>
      </div>

      {/* Lista de Pagamentos Lançados */}
      {pagamentos.length > 0 && (
        <div className="bg-black/30 rounded-xl border border-white/[0.06] p-2 space-y-1.5 max-h-28 overflow-y-auto">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center justify-between font-mono">
            <span>Pagamentos Adicionados ({pagamentos.length}):</span>
          </div>
          {pagamentos.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.07] px-2.5 py-1.5 rounded-lg border border-white/[0.05] text-xs transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="font-semibold text-zinc-200">{getLabelMetodo(p.metodo)}</span>
                {p.detalhes && <span className="text-[10px] text-zinc-500 italic max-w-[120px] truncate">({p.detalhes})</span>}
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-emerald-400 tabular-nums">R$ {p.valor.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => onRemover(idx)}
                  className="p-1 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer"
                  title="Remover este pagamento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Troco a Devolver */}
      {troco > 0 && (
        <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-300 font-mono">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Troco a Devolver:</span>
          </span>
          <span className="text-lg font-black tabular-nums">R$ {troco.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
