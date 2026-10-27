import React, { useState } from 'react';
import { api } from '../../services/api.js';

interface AjusteEstoqueModalProps {
  isOpen: boolean;
  posicao: any[];
  onClose: () => void;
  onSalvo: () => void;
}

export const AjusteEstoqueModal: React.FC<AjusteEstoqueModalProps> = ({
  isOpen,
  posicao,
  onClose,
  onSalvo,
}) => {
  const [ajusteProdId, setAjusteProdId] = useState('');
  const [ajusteTipo, setAjusteTipo] = useState<'ENTRADA_COMPRA' | 'SAIDA_VENDA' | 'AJUSTE_INVENTARIO' | 'PERDA_AVARIA'>('AJUSTE_INVENTARIO');
  const [ajusteAlmox, setAjusteAlmox] = useState<'LOJA' | 'DEPOSITO' | 'DEFEITO'>('LOJA');
  const [ajusteQtd, setAjusteQtd] = useState('');
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  if (!isOpen) return null;

  const handleSalvarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = parseFloat(ajusteQtd.replace(',', '.'));
    if (!ajusteProdId || isNaN(qtd) || qtd <= 0) {
      alert('Selecione o produto e informe a quantidade.');
      return;
    }

    const res = await api.ajustarEstoque({
      produto_id: ajusteProdId,
      tipo: ajusteTipo,
      almoxarifado: ajusteAlmox,
      quantidade: qtd,
      motivo: ajusteMotivo || 'Ajuste manual de inventário',
    });

    if (res.success) {
      setAjusteQtd('');
      setAjusteMotivo('');
      onSalvo();
      onClose();
    } else {
      alert(res.error || 'Erro ao realizar ajuste');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <form onSubmit={handleSalvarAjuste} className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-bold text-white text-sm">NOVO AJUSTE MANUAL DE ESTOQUE</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Produto *</label>
          <select value={ajusteProdId} onChange={(e) => setAjusteProdId(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white">
            <option value="">Selecione o produto...</option>
            {posicao.map((p) => (
              <option key={p.produto_id} value={p.produto_id}>{p.descricao} ({p.codigo_barras})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Ajuste</label>
            <select value={ajusteTipo} onChange={(e) => setAjusteTipo(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white">
              <option value="AJUSTE_INVENTARIO">AJUSTE INVENTÁRIO (+)</option>
              <option value="PERDA_AVARIA">PERDA / AVARIA (-)</option>
              <option value="ENTRADA_COMPRA">ENTRADA MANUAL (+)</option>
              <option value="SAIDA_VENDA">SAÍDA MANUAL (-)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Almoxarifado</label>
            <select value={ajusteAlmox} onChange={(e) => setAjusteAlmox(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white">
              <option value="LOJA">LOJA</option>
              <option value="DEPOSITO">DEPÓSITO</option>
              <option value="DEFEITO">DEFEITO</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Quantidade *</label>
          <input type="text" required value={ajusteQtd} onChange={(e) => setAjusteQtd(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-emerald-400 font-bold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Motivo / Justificativa</label>
          <input type="text" value={ajusteMotivo} onChange={(e) => setAjusteMotivo(e.target.value)} placeholder="Ex: Contagem de inventário ou avaria no transporte" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded">Cancelar</button>
          <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded">Gravar Movimento</button>
        </div>
      </form>
    </div>
  );
};
