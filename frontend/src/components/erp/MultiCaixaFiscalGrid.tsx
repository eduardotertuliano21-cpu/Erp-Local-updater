import React from 'react';
import { Network, Plus, Trash2 } from 'lucide-react';

export interface CaixaFiscalItem {
  numero_caixa: string;
  serie_nfce: number;
  proximo_numero_nfce: number;
  apelido?: string;
  ip_ultimo_acesso?: string;
  ultimo_ping?: string;
  ativo?: number;
}

interface MultiCaixaFiscalGridProps {
  caixas: CaixaFiscalItem[];
  onAtualizarCaixa: (index: number, campo: keyof CaixaFiscalItem, valor: any) => void;
  onAdicionarCaixa: () => void;
  onRemoverCaixa: (index: number) => void;
}

export const MultiCaixaFiscalGrid: React.FC<MultiCaixaFiscalGridProps> = ({
  caixas,
  onAtualizarCaixa,
  onAdicionarCaixa,
  onRemoverCaixa,
}) => {
  return (
    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-400" />
          Séries Fiscais Independentes por Caixa (SEFAZ SP Mod 65)
        </span>
        <button
          type="button"
          onClick={onAdicionarCaixa}
          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Caixa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {caixas.map((cx, idx) => (
          <div key={cx.numero_caixa} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-bold flex items-center justify-center border border-amber-500/20">
                  {cx.numero_caixa}
                </span>
                <input
                  type="text"
                  value={cx.apelido || ''}
                  onChange={(e) => onAtualizarCaixa(idx, 'apelido', e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-b border-dashed border-slate-700 focus:border-amber-400 focus:outline-none max-w-[150px]"
                  placeholder="Nome do caixa"
                />
              </div>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => onRemoverCaixa(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  title="Remover caixa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block">Série NFC-e</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={cx.serie_nfce}
                  onChange={(e) => onAtualizarCaixa(idx, 'serie_nfce', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium block">Próximo Nº</label>
                <input
                  type="number"
                  min={1}
                  value={cx.proximo_numero_nfce}
                  onChange={(e) => onAtualizarCaixa(idx, 'proximo_numero_nfce', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {cx.ip_ultimo_acesso && (
              <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono pt-1 border-t border-slate-800/80">
                <span>IP: {cx.ip_ultimo_acesso}</span>
                <span className="text-emerald-400">Ativo</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
