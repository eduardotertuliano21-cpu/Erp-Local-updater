import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { NovaOpModal } from './NovaOpModal.js';

export const PcpView: React.FC = () => {
  const [subTab, setSubTab] = useState<'ORDENS' | 'FICHAS'>('ORDENS');
  const [ordens, setOrdens] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Ficha técnica state
  const [prodFichaSelecionado, setProdFichaSelecionado] = useState<string>('');
  const [insumosFicha, setInsumosFicha] = useState<any[]>([]);
  const [novoInsumoId, setNovoInsumoId] = useState('');
  const [novoInsumoQtd, setNovoInsumoQtd] = useState('');
  const [novoInsumoUn, setNovoInsumoUn] = useState('UN');

  // Nova OP modal
  const [modalNovaOp, setModalNovaOp] = useState(false);

  const carregarProdutos = async () => {
    const res = await api.pesquisarProdutos('');
    if (res.success && res.data) setProdutos(res.data);
  };

  const carregarOrdens = async () => {
    setLoading(true);
    const res = await api.listarOrdensPcp();
    if (res.success && res.data) setOrdens(res.data);
    setLoading(false);
  };

  useEffect(() => {
    carregarProdutos();
    carregarOrdens();
  }, []);

  const carregarFicha = async (prodId: string) => {
    setProdFichaSelecionado(prodId);
    if (!prodId) {
      setInsumosFicha([]);
      return;
    }
    const res = await api.obterFichaTecnica(prodId);
    if (res.success && res.data) setInsumosFicha(res.data);
  };

  const handleAdicionarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = parseFloat(novoInsumoQtd.replace(',', '.'));
    if (!prodFichaSelecionado || !novoInsumoId || isNaN(qtd) || qtd <= 0) {
      alert('Selecione o insumo e informe a quantidade.');
      return;
    }

    const res = await api.salvarInsumoFicha({
      produto_pai_id: prodFichaSelecionado,
      insumo_produto_id: novoInsumoId,
      quantidade_necessaria: qtd,
      unidade_medida: novoInsumoUn,
    });

    if (res.success) {
      setNovoInsumoQtd('');
      carregarFicha(prodFichaSelecionado);
    } else {
      alert(res.error || 'Erro ao adicionar insumo');
    }
  };

  const handleFinalizarOp = async (id: string, qtdPlanejada: number) => {
    const qtdStr = prompt(`Confirmar finalização da ordem? Quantidade efetivamente produzida:`, String(qtdPlanejada));
    if (qtdStr) {
      const qtdEfetiva = parseFloat(qtdStr.replace(',', '.'));
      if (!isNaN(qtdEfetiva) && qtdEfetiva > 0) {
        const res = await api.finalizarOrdemPcp(id, qtdEfetiva);
        if (res.success) {
          alert('✓ Ordem Finalizada! Insumos baixados e produto acabado adicionado ao estoque.');
          carregarOrdens();
        } else {
          alert(res.error || 'Erro ao finalizar ordem');
        }
      }
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide">PCP & PRODUÇÃO (BOM)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fichas Técnicas de Insumos, Baixa Automática de Estoque e Ordens de Produção
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSubTab('ORDENS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'ORDENS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ordens de Produção (OP)
            </button>
            <button
              onClick={() => setSubTab('FICHAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'FICHAS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fichas Técnicas (Receitas)
            </button>
          </div>

          {subTab === 'ORDENS' && (
            <button
              onClick={() => setModalNovaOp(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              + Nova Ordem (OP)
            </button>
          )}
        </div>
      </div>

      {/* Ordens de Produção Table */}
      {subTab === 'ORDENS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">OP #</th>
                  <th className="px-4 py-3">Produto a Fabricar</th>
                  <th className="px-4 py-3">Planejada</th>
                  <th className="px-4 py-3">Produzida</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Carregando ordens...</td></tr>
                ) : ordens.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Nenhuma ordem de produção registrada.</td></tr>
                ) : (
                  ordens.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">#{op.numero}</td>
                      <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-100">{op.produto_descricao || op.produto_id}</td>
                      <td className="px-4 py-3">{Number(op.quantidade_planejada).toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{Number(op.quantidade_produzida).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          op.status === 'FINALIZADA' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{op.data_inicio ? new Date(op.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="px-4 py-3 text-right font-sans">
                        {op.status !== 'FINALIZADA' && (
                          <button
                            onClick={() => handleFinalizarOp(op.id, op.quantidade_planejada)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                          >
                            Finalizar & Baixar Insumos
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fichas Técnicas (BOM) */}
      {subTab === 'FICHAS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Selecione o Produto Acabado / Transformado:</label>
            <select
              value={prodFichaSelecionado}
              onChange={(e) => carregarFicha(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="">Selecione um produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.descricao} ({p.codigo_barras})</option>
              ))}
            </select>
          </div>

          {prodFichaSelecionado && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Insumos da Ficha Técnica (BOM)</h3>
              
              <div className="bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-sans font-semibold">
                    <tr>
                      <th className="px-3 py-2">Insumo / Matéria-Prima</th>
                      <th className="px-3 py-2">Qtd Necessária (p/ 1 unidade)</th>
                      <th className="px-3 py-2">Unidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {insumosFicha.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4 text-slate-400 font-sans">Nenhum insumo cadastrado na receita.</td></tr>
                    ) : (
                      insumosFicha.map((ins) => (
                        <tr key={ins.id}>
                          <td className="px-3 py-2 text-slate-900 dark:text-white font-sans">{ins.insumo_descricao}</td>
                          <td className="px-3 py-2 font-bold text-amber-600 dark:text-amber-400">{ins.quantidade_necessaria}</td>
                          <td className="px-3 py-2">{ins.unidade_medida}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form Adicionar Insumo */}
              <form onSubmit={handleAdicionarInsumo} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">Adicionar Insumo</label>
                  <select value={novoInsumoId} onChange={(e) => setNovoInsumoId(e.target.value)} required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-white focus:outline-none">
                    <option value="">Selecione o insumo...</option>
                    {produtos.filter((p) => p.id !== prodFichaSelecionado).map((p) => (
                      <option key={p.id} value={p.id}>{p.descricao}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">Qtd</label>
                  <input type="text" required value={novoInsumoQtd} onChange={(e) => setNovoInsumoQtd(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-white focus:outline-none" />
                </div>
                <div className="w-20">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">UN</label>
                  <select value={novoInsumoUn} onChange={(e) => setNovoInsumoUn(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs text-slate-800 dark:text-white focus:outline-none">
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="LT">LT</option>
                  </select>
                </div>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs transition">
                  + Inserir
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova OP */}
      <NovaOpModal
        isOpen={modalNovaOp}
        produtos={produtos}
        onClose={() => setModalNovaOp(false)}
        onSalvo={carregarOrdens}
      />
    </div>
  );
};
