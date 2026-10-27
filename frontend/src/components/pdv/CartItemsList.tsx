import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ItemCarrinho } from '../../types/pdv.js';
import { ShoppingCart } from 'lucide-react';

interface CartItemsListProps {
  itens: ItemCarrinho[];
  selectedIndex: number;
  onSelectItem: (index: number) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = ({
  itens,
  selectedIndex,
  onSelectItem,
}) => {
  const scrollParentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: itens.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 58,
    overscan: 4,
  });

  useEffect(() => {
    if (itens.length > 0) {
      rowVirtualizer.scrollToIndex(itens.length - 1, { align: 'end' });
    }
  }, [itens.length, rowVirtualizer]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 select-none transition-colors">
      {/* Cabeçalho da Tabela Sutil */}
      <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
        <div className="col-span-1 text-center">Nº</div>
        <div className="col-span-2">CÓDIGO</div>
        <div className="col-span-5">DESCRIÇÃO DO ITEM</div>
        <div className="col-span-1 text-right">QTD</div>
        <div className="col-span-1 text-right">UNIT.</div>
        <div className="col-span-2 text-right">TOTAL</div>
      </div>

      {/* Linhas da Tabela Virtualizadas */}
      <div
        ref={scrollParentRef}
        className="flex-1 overflow-y-auto text-sm relative"
      >
        {itens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
              <ShoppingCart className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhum item lançado no cupom</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              Passe o produto pelo leitor de código de barras ou pesquise na barra de busca acima
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = itens[virtualRow.index];
              const index = virtualRow.index;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(index)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/50 ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-indigo-600 text-slate-900 dark:text-slate-100 font-medium'
                      : 'even:bg-slate-50/70 dark:even:bg-slate-800/30 odd:bg-white dark:odd:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-l-4 border-transparent'
                  }`}
                >
                  <div className="col-span-1 text-center text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="col-span-2 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    {item.codigo_barras}
                  </div>
                  <div className="col-span-5 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                      {item.descricao}
                    </div>
                    {item.marca && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {item.marca} {item.modelo ? `• ${item.modelo}` : ''}
                      </div>
                    )}
                    {(item.tamanho || item.cor || item.em_campanha) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                        {item.em_campanha && item.nome_campanha && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                            🔥 {item.nome_campanha}
                          </span>
                        )}
                        {item.tamanho && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold border border-rose-500/20">
                            TAM: {item.tamanho}
                          </span>
                        )}
                        {item.cor && (
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-600 dark:text-pink-400 font-mono border border-pink-500/20">
                            COR: {item.cor}
                          </span>
                        )}
                      </div>
                    )}
                    {(item.codigo_oem || item.localizacao || item.aplicacao) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                        {item.codigo_oem && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold border border-purple-500/20">
                            OEM: {item.codigo_oem}
                          </span>
                        )}
                        {item.localizacao && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                            📍 {item.localizacao}
                          </span>
                        )}
                        {item.aplicacao && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20 truncate max-w-[220px]">
                            🚗 {item.aplicacao}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-indigo-600 dark:text-indigo-400 font-extrabold text-base tabular-nums">
                    {item.quantidade}
                  </div>
                  <div className="col-span-1 text-right text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                    {item.em_campanha && item.preco_original && item.preco_original > item.preco_unitario ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-slate-400 dark:text-slate-500 text-[10px]">
                          {item.preco_original.toFixed(2)}
                        </span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                          {item.preco_unitario.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      item.preco_unitario.toFixed(2)
                    )}
                  </div>
                  <div className="col-span-2 text-right text-slate-900 dark:text-slate-100 font-black tabular-nums text-base">
                    R$ {item.subtotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
