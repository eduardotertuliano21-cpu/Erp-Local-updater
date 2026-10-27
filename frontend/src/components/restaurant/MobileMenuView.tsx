import React, { useMemo } from 'react';
import { ArrowLeft, Plus, MessageSquare, Trash2, Send, Tag, Sparkles } from 'lucide-react';
import type { ItemPedidoMobile } from './mobileOrderData.js';
import type { Produto } from '../../types/pdv.js';

interface MobileMenuViewProps {
  mesa?: any;
  garcomNome?: string;
  produtos: Produto[];
  carrinho: ItemPedidoMobile[];
  categoria: string;
  enviando: boolean;
  modoCardapio?: boolean;
  onVoltar: () => void;
  onSelectCategoria: (cat: string) => void;
  onAddItem: (nome: string, preco: number, id?: string) => void;
  onRemoveItem: (index: number) => void;
  onOpenObs: (index: number, texto: string) => void;
  onEnviarPedido: () => void;
}

export const MobileMenuView: React.FC<MobileMenuViewProps> = ({
  mesa,
  garcomNome,
  produtos,
  carrinho,
  categoria,
  enviando,
  modoCardapio = false,
  onVoltar,
  onSelectCategoria,
  onAddItem,
  onRemoveItem,
  onOpenObs,
  onEnviarPedido,
}) => {
  // Categorias dinâmicas extraídas dos produtos cadastrados
  const listaCategorias = useMemo(() => {
    const set = new Set<string>();
    set.add('TODOS');
    for (const p of produtos) {
      if (p.categoria && p.categoria.trim()) {
        set.add(p.categoria.toUpperCase().trim());
      }
    }
    return Array.from(set);
  }, [produtos]);

  const itensFiltrados = produtos.filter((i) => {
    if (categoria === 'TODOS') return true;
    return (i.categoria || 'GERAL').toUpperCase() === categoria;
  });

  const totalCarrinho = carrinho.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto select-none font-sans pb-28">
      {/* Topo / Barra de navegação */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between">
        <button onClick={onVoltar} className="p-2 rounded-xl bg-slate-800 text-slate-300 active:scale-95 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-extrabold text-sm text-white">
            {modoCardapio ? 'Cardápio Digital' : `Mesa #${mesa?.numero ?? ''}`}
          </div>
          <div className="text-[10px] text-amber-400 font-mono">
            {modoCardapio ? 'Visualização de Itens' : garcomNome}
          </div>
        </div>
        <div className="text-right font-mono text-xs text-emerald-400 font-bold">
          {modoCardapio ? `${produtos.length} itens` : `R$ ${(mesa?.subtotal || 0).toFixed(2)}`}
        </div>
      </div>

      {/* Seletor dinâmico de categorias com scroll horizontal */}
      <div className="flex gap-2 p-3 overflow-x-auto bg-slate-900/40 border-b border-slate-800 no-scrollbar">
        {listaCategorias.map((catNome) => {
          const isSel = categoria === catNome;
          return (
            <button
              key={catNome}
              onClick={() => onSelectCategoria(catNome)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                isSel
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {catNome === 'TODOS' ? <Sparkles className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
              <span>{catNome}</span>
            </button>
          );
        })}
      </div>

      {/* Lista de pratos / itens do cardápio */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        {itensFiltrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs font-mono">
            Nenhum produto cadastrado nesta categoria.
          </div>
        ) : (
          itensFiltrados.map((item) => (
            <div
              key={item.id}
              onClick={() => !modoCardapio && onAddItem(item.descricao, item.preco_venda, item.id)}
              className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 transition flex items-center justify-between gap-3 ${
                modoCardapio
                  ? 'hover:border-slate-700'
                  : 'hover:border-slate-700 active:scale-[0.98] cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.foto ? (
                  <img
                    src={`/imagens/${item.foto}`}
                    alt={item.descricao}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                    <Tag className="w-5 h-5 text-slate-600" />
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-sm text-white truncate">{item.descricao}</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    R$ {Number(item.preco_venda).toFixed(2)}
                  </div>
                  {item.categoria && (
                    <span className="text-[10px] text-slate-500 font-medium">{item.categoria}</span>
                  )}
                </div>
              </div>

              {!modoCardapio && (
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 hover:bg-amber-500 hover:text-slate-950 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Carrinho de pedidos da mesa */}
      {!modoCardapio && carrinho.length > 0 && (
        <div className="px-3 pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Itens no Pedido:</div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {carrinho.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="font-bold text-white">{item.quantidade}x {item.descricao}</span>
                  {item.observacao && <span className="block text-[10px] text-amber-300 italic truncate">Obs: {item.observacao}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onOpenObs(idx, item.observacao || '')} className="p-1 rounded-lg text-slate-400 hover:text-amber-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onRemoveItem(idx)} className="p-1 rounded-lg text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão flutuante de envio */}
      {!modoCardapio && carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 max-w-md mx-auto z-40">
          <button
            onClick={onEnviarPedido}
            disabled={enviando}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>{enviando ? 'Enviando Pedido...' : `Enviar Pedido (${totalItens} un • R$ ${totalCarrinho.toFixed(2)})`}</span>
          </button>
        </div>
      )}
    </div>
  );
};
