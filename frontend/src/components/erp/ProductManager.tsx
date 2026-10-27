import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Produto } from '../../types/pdv.js';
import { api } from '../../services/api.js';
import { produtoApi } from '../../services/produtoApi.js';
import { ProdutoFormModal } from './ProdutoFormModal.js';
import { ProductTableRow } from './ProductTableRow.js';
import { MultiplosCodigosModal } from './MultiplosCodigosModal.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { exportarCardapioParaPdf } from '../../utils/exportarCardapio.js';
import { Plus, Search, ShoppingBag, UtensilsCrossed, FileDown, Loader2, CheckCircle2, Scale } from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { isRestaurante, isMercado } = useBusinessMode();
  const { config } = useStoreConfig();
  const modoRestaurante = isRestaurante;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'BALANCA'>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoCodigos, setProdutoCodigos] = useState<Produto | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<Produto | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [feedbackPdf, setFeedbackPdf] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const carregarProdutos = async (termo = '') => {
    setLoading(true);
    const res = await api.pesquisarProdutos(termo, 'admin');
    if (res.success && res.data) setProdutos(res.data);
    setLoading(false);
  };

  useEffect(() => { carregarProdutos(''); }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarProdutos(busca);
  };

  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    const res = await produtoApi.excluir(itemParaExcluir.id);
    if (res.success) {
      setProdutos((prev) => prev.filter((p) => p.id !== itemParaExcluir.id));
      setItemParaExcluir(null);
    }
  };

  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    setFeedbackPdf(null);
    const res = await exportarCardapioParaPdf(produtos, config.nome_loja || 'ClickStorm Restaurante');
    setExportandoPdf(false);
    if (res.sucesso) {
      setFeedbackPdf(res.mensagem || 'Cardápio gerado com sucesso!');
      setTimeout(() => setFeedbackPdf(null), 5000);
    } else {
      alert(res.erro || 'Falha ao exportar PDF');
    }
  };

  const produtosFiltrados = produtos.filter((p) => {
    if (filtroTipo === 'BALANCA') {
      const isBalanca = p.pesavel === 1 || p.unidade_medida === 'KG' || Boolean(p.codigo_balanca);
      if (!isBalanca) return false;
    }
    if (filtroCategoria !== 'TODAS') {
      const cat = (p.categoria || 'GERAL').toUpperCase();
      if (cat !== filtroCategoria) return false;
    }
    return true;
  });

  const rowVirtualizer = useVirtualizer({
    count: produtosFiltrados.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 5,
  });

  const handleEditar = useCallback((p: Produto) => {
    setProdutoEditando(p);
    setModalAberto(true);
  }, []);

  const handleExcluir = useCallback((p: Produto) => {
    setItemParaExcluir(p);
  }, []);

  const categoriasUnicas = Array.from(new Set(produtos.map((p) => (p.categoria || 'GERAL').toUpperCase())));

  return (
    <div className="max-w-7xl mx-auto space-y-4 select-none font-sans">
      {feedbackPdf && (
        <div className="p-3 bg-emerald-600 border border-emerald-400 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{feedbackPdf}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-2.5">
            {modoRestaurante ? (
              <><UtensilsCrossed className="w-6 h-6 text-amber-500" /><span>CARDÁPIO & PRATOS DO RESTAURANTE</span></>
            ) : (
              <><ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /><span>CATÁLOGO DE PRODUTOS {isMercado ? 'DO MERCADO' : '& ESTOQUE'}</span></>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {modoRestaurante ? 'Gerencie pratos, fotos, bebidas e preços para garçons e mesas' : 'Cadastre produtos com código de barras, fotos, balança Toledo e estoque'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {modoRestaurante ? (
            <button
              onClick={handleExportarPdf}
              disabled={exportandoPdf}
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Gera o cardápio em PDF offline na sua Área de Trabalho"
            >
              {exportandoPdf ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <FileDown className="w-4 h-4 text-amber-500" />}
              <span>{exportandoPdf ? 'Gerando...' : 'Exportar Cardápio (PDF)'}</span>
            </button>
          ) : (
            <a
              href="/api/configuracoes/carga-balanca/toledo-mgv"
              download="ITENSMGV.TXT"
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              title="Exporta o arquivo ITENSMGV.TXT para carga das balanças Toledo MGV"
            >
              <Scale className="w-4 h-4 text-emerald-200" />
              <span>Carga Balança (MGV Toledo)</span>
            </a>
          )}

          <button
            onClick={() => { setProdutoEditando(null); setModalAberto(true); }}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer ${
              modoRestaurante ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25' : 'bg-brand hover:bg-brand-hover shadow-brand/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{modoRestaurante ? '+ Novo Item' : '+ Novo Produto'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <form onSubmit={handleBuscar} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por descrição ou código..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition">
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2">
          {!modoRestaurante && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setFiltroTipo('TODOS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  filtroTipo === 'TODOS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                Todos ({produtos.length})
              </button>
              <button
                onClick={() => setFiltroTipo('BALANCA')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  filtroTipo === 'BALANCA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Balança (Pesáveis)</span>
              </button>
            </div>
          )}

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="TODAS">Todas Categorias</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Virtualizada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div ref={parentRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Item / Foto</th>
                <th className="px-4 py-3">{modoRestaurante ? 'Tipo PDV' : 'Tipo / Balança'}</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">UN</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Carregando catálogo...</td></tr>
              ) : produtosFiltrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Nenhum produto cadastrado com esses filtros.</td></tr>
              ) : (
                <>
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}>
                      <td colSpan={8} style={{ padding: 0, border: 'none' }} />
                    </tr>
                  )}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <ProductTableRow
                      key={produtosFiltrados[virtualRow.index].id}
                      produto={produtosFiltrados[virtualRow.index]}
                      onEdit={handleEditar}
                      onDelete={handleExcluir}
                      onGerenciarCodigos={setProdutoCodigos}
                    />
                  ))}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr style={{
                      height: `${Math.max(0, rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0))}px`
                    }}>
                      <td colSpan={8} style={{ padding: 0, border: 'none' }} />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Excluir Item?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tem certeza que deseja excluir <strong>{itemParaExcluir.descricao}</strong>?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setItemParaExcluir(null)} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition">Cancelar</button>
              <button onClick={handleConfirmarExclusao} className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      <ProdutoFormModal
        isOpen={modalAberto}
        produtoEditando={produtoEditando}
        tipoInicial={modoRestaurante ? 'RESTAURANTE' : 'VAREJO'}
        onClose={() => setModalAberto(false)}
        onSalvo={() => carregarProdutos(busca)}
      />

      <MultiplosCodigosModal
        isOpen={produtoCodigos !== null}
        produto={produtoCodigos}
        onClose={() => setProdutoCodigos(null)}
      />
    </div>
  );
};
