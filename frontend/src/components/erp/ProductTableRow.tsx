import React from 'react';
import type { Produto } from '../../types/pdv.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { Edit, Trash2, Barcode } from 'lucide-react';

interface ProductTableRowProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  onGerenciarCodigos?: (produto: Produto) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = React.memo(({
  produto: p,
  onEdit,
  onDelete,
  onGerenciarCodigos,
}) => {
  const { isRestaurante, isVestuario } = useBusinessMode();
  const isBalanca = p.pesavel === 1 || p.unidade_medida === 'KG' || Boolean(p.codigo_balanca);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors h-[54px]">
      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.codigo_barras}</td>
      <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
        {p.foto && (
          <img
            src={`/imagens/${p.foto}`}
            alt={p.descricao}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate max-w-[200px]">{p.descricao}</span>
            {isBalanca && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                ⚖️ Balança
              </span>
            )}
          </div>
          {isVestuario && (p.marca || p.tamanho || p.cor) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
              {p.marca && <span className="text-slate-500 dark:text-slate-400 font-bold">{p.marca}</span>}
              {p.tamanho && <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold border border-rose-500/20">TAM: {p.tamanho}</span>}
              {p.cor && <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 font-mono border border-pink-500/20">COR: {p.cor}</span>}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-sans">
        {isRestaurante ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30">
            🍽️ Cardápio
          </span>
        ) : isBalanca ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 font-mono">
            ⚖️ Balança {p.codigo_balanca ? `(#${p.codigo_balanca})` : ''}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
            📦 Padrão
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-300">{p.categoria || 'GERAL'}</td>
      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">R$ {p.preco_venda.toFixed(2)}</td>
      <td className="px-4 py-3">{p.unidade_medida || 'UN'}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          p.ativo !== 0 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
        }`}>
          {p.ativo !== 0 ? 'ATIVO' : 'INATIVO'}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-sans space-x-1.5">
        {onGerenciarCodigos && (
          <button
            onClick={() => onGerenciarCodigos(p)}
            className="p-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Códigos & Embalagens (WMS)"
          >
            <Barcode className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onEdit(p)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center transition"
          title="Editar"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(p)}
          className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 inline-flex items-center transition"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
});
