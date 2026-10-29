import React, { useState, useEffect } from 'react';
import { campanhasApi, type CampanhaPromocional } from '../../services/campanhasApi.js';
import { api } from '../../services/api.js';
import { CampanhaFormModal } from './CampanhaFormModal.js';
import { Flame, Plus, Calendar, Trash2, Edit, CheckSquare, Square, Search } from 'lucide-react';

export const PromocoesView: React.FC = () => {
  const [campanhas, setCampanhas] = useState<CampanhaPromocional[]>([]);
  const [campanhaAtiva, setCampanhaAtiva] = useState<CampanhaPromocional | null>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [termoBusca, setTermoBusca] = useState(''), [selecionados, setSelecionados] = useState<string[]>([]);
  const [modalAberto, setModalAberto] = useState(false), [campanhaEditando, setCampanhaEditando] = useState<CampanhaPromocional | null>(null);
  const [processandoVinculo, setProcessandoVinculo] = useState(false);

  const carregarCampanhas = async () => {
    const res = await campanhasApi.listar();
    if (res.success && res.data) {
      setCampanhas(res.data);
      if (!campanhaAtiva && res.data.length > 0) setCampanhaAtiva(res.data[0]);
      else if (campanhaAtiva) {
        const atual = res.data.find((c) => c.id === campanhaAtiva.id);
        if (atual) setCampanhaAtiva(atual);
      }
    }
  };

  const carregarProdutos = async () => {
    const res = await api.pesquisarProdutos(termoBusca);
    if (res.success && res.data) setProdutos(res.data);
  };

  useEffect(() => { carregarCampanhas(); }, []);
  useEffect(() => { carregarProdutos(); }, [termoBusca]);

  const handleExcluir = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente remover esta campanha promocional?')) return;
    await campanhasApi.excluir(id);
    if (campanhaAtiva?.id === id) setCampanhaAtiva(null);
    carregarCampanhas(); carregarProdutos();
  };

  const toggleSelect = (id: string) => {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelecionados(selecionados.length === produtos.length ? [] : produtos.map((p) => p.id));
  };

  const handleVincularSelecionados = async () => {
    if (!campanhaAtiva || selecionados.length === 0) return;
    setProcessandoVinculo(true);
    await campanhasApi.vincularProdutos(campanhaAtiva.id, selecionados);
    setSelecionados([]); setProcessandoVinculo(false);
    carregarCampanhas(); carregarProdutos();
  };

  const handleDesvincularSelecionados = async () => {
    if (selecionados.length === 0) return;
    setProcessandoVinculo(true);
    await campanhasApi.desvincularProdutos(selecionados);
    setSelecionados([]); setProcessandoVinculo(false);
    carregarCampanhas(); carregarProdutos();
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-500" />
            <span>Motor de Campanhas & Promoções em Massa</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure campanhas de desconto ativas para aplicação em tempo real no checkout PDV
          </p>
        </div>
        <button
          onClick={() => { setCampanhaEditando(null); setModalAberto(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Campanhas */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campanhas Criadas ({campanhas.length})</h2>
          {campanhas.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              Nenhuma campanha criada ainda. Clique em "Nova Campanha" para começar.
            </div>
          ) : (
            campanhas.map((c) => {
              const isSelected = campanhaAtiva?.id === c.id;
              const hoje = new Date().toISOString().split('T')[0];
              const expirada = c.data_fim < hoje;
              return (
                <div
                  key={c.id}
                  onClick={() => setCampanhaAtiva(c)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/80 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{c.nome_campanha}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      expirada
                        ? 'bg-zinc-800 text-zinc-400'
                        : c.status === 'ATIVA'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {expirada ? 'ENCERRADA' : c.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 font-bold">
                      {c.tipo_desconto === 'PORCENTAGEM' ? `${c.valor_desconto}% OFF` : `R$ ${Number(c.valor_desconto).toFixed(2)} OFF`}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {c.produtos_count || 0} produtos vinculados
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {c.data_inicio} até {c.data_fim}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCampanhaEditando(c); setModalAberto(true); }}
                        className="p-1 hover:text-white transition"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleExcluir(c.id, e)}
                        className="p-1 hover:text-rose-400 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Coluna Direita: Vinculação de Produtos em Massa */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vincular Produtos em Massa {campanhaAtiva ? `→ [${campanhaAtiva.nome_campanha}]` : ''}
              </h2>
            </div>
            {campanhaAtiva && (
              <div className="flex items-center gap-2">
                <button
                  disabled={selecionados.length === 0 || processandoVinculo}
                  onClick={handleVincularSelecionados}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs shadow-sm transition"
                >
                  Vincular ({selecionados.length})
                </button>
                <button
                  disabled={selecionados.length === 0 || processandoVinculo}
                  onClick={handleDesvincularSelecionados}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold rounded-lg text-xs transition"
                >
                  Remover Promoção
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Pesquisar por nome, código de barras ou marca..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 font-bold"
              >
                {selecionados.length === produtos.length && produtos.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>Todos</span>
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 text-xs">
              {produtos.length === 0 ? (
                <div className="p-6 text-center text-slate-500">Nenhum produto encontrado</div>
              ) : (
                produtos.map((p) => {
                  const isChecked = selecionados.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition ${
                        isChecked ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="shrink-0 text-amber-400">
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-2">
                            <span>{p.descricao}</span>
                            {p.marca && <span className="text-[10px] text-slate-400 font-normal">({p.marca})</span>}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>{p.codigo_barras}</span>
                            {p.em_campanha && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/30">
                                🔥 {p.nome_campanha}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {p.em_campanha && p.preco_promocional ? (
                          <div className="flex flex-col items-end">
                            <span className="line-through text-slate-500 text-[10px] font-mono">
                              R$ {p.preco_original?.toFixed(2) || p.preco_venda.toFixed(2)}
                            </span>
                            <span className="text-emerald-400 font-black font-mono text-sm">
                              R$ {p.preco_promocional.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white font-bold font-mono text-sm">
                            R$ {Number(p.preco_venda).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <CampanhaFormModal
        isOpen={modalAberto}
        campanha={campanhaEditando}
        onClose={() => setModalAberto(false)}
        onSalvo={() => { carregarCampanhas(); carregarProdutos(); }}
      />
    </div>
  );
};
