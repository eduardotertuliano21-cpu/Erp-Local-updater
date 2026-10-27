import React, { useState } from 'react';
import { api } from '../../services/api.js';

interface TituloFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvo: () => void;
}

export const TituloFormModal: React.FC<TituloFormModalProps> = ({ isOpen, onClose, onSalvo }) => {
  const [formTipo, setFormTipo] = useState<'PAGAR' | 'RECEBER'>('PAGAR');
  const [formEntidade, setFormEntidade] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formValor, setFormValor] = useState('');
  const [formVencimento, setFormVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [formCategoria, setFormCategoria] = useState('FORNECEDOR');

  if (!isOpen) return null;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(formValor.replace(',', '.'));
    if (!formEntidade || !formDescricao || isNaN(valor)) {
      alert('Preencha os campos obrigatórios corretamente');
      return;
    }

    const res = await api.criarTituloFinanceiro({
      tipo: formTipo,
      entidade_nome: formEntidade,
      descricao: formDescricao,
      valor,
      vencimento: formVencimento,
      categoria: formCategoria,
    });

    if (res.success) {
      onSalvo();
      onClose();
    } else {
      alert(res.error || 'Erro ao criar título');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <form onSubmit={handleSalvar} className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-bold text-white text-sm">NOVO TÍTULO FINANCEIRO</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo</label>
          <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white">
            <option value="PAGAR">CONTAS A PAGAR</option>
            <option value="RECEBER">CONTAS A RECEBER</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Entidade / Favorecido *</label>
          <input type="text" required value={formEntidade} onChange={(e) => setFormEntidade(e.target.value)} placeholder="Ex: Fornecedor Ltda ou Cliente" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição do Título *</label>
          <input type="text" required value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Ex: Compra de Mercadorias ou Aluguel" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Valor (R$) *</label>
            <input type="text" required value={formValor} onChange={(e) => setFormValor(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-emerald-400 font-bold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Vencimento *</label>
            <input type="date" required value={formVencimento} onChange={(e) => setFormVencimento(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria de Conta</label>
          <input type="text" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} placeholder="Ex: FORNECEDOR, ALUGUEL, ENERGIA" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded">Cancelar</button>
          <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded">Salvar</button>
        </div>
      </form>
    </div>
  );
};
