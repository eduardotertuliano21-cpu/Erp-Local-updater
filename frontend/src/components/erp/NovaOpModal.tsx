import React, { useState } from 'react';
import { api } from '../../services/api.js';

interface NovaOpModalProps {
  isOpen: boolean;
  produtos: any[];
  onClose: () => void;
  onSalvo: () => void;
}

export const NovaOpModal: React.FC<NovaOpModalProps> = ({
  isOpen,
  produtos,
  onClose,
  onSalvo,
}) => {
  const [opProdId, setOpProdId] = useState('');
  const [opQtd, setOpQtd] = useState('');

  if (!isOpen) return null;

  const handleCriarOp = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = parseFloat(opQtd.replace(',', '.'));
    if (!opProdId || isNaN(qtd) || qtd <= 0) {
      alert('Selecione o produto acabado e informe a quantidade planejada.');
      return;
    }

    const res = await api.criarOrdemPcp({ produto_id: opProdId, quantidade_planejada: qtd });
    if (res.success) {
      setOpQtd('');
      onSalvo();
      onClose();
    } else {
      alert(res.error || 'Erro ao criar ordem');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <form onSubmit={handleCriarOp} className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-bold text-white text-sm">CRIAR ORDEM DE PRODUÇÃO (OP)</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Produto a Fabricar *</label>
          <select value={opProdId} onChange={(e) => setOpProdId(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white">
            <option value="">Selecione o produto...</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>{p.descricao} ({p.codigo_barras})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Quantidade Planejada *</label>
          <input type="text" required value={opQtd} onChange={(e) => setOpQtd(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-emerald-400 font-bold" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded">Cancelar</button>
          <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded">Abrir Ordem</button>
        </div>
      </form>
    </div>
  );
};
