import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Produto } from '../../../types/pdv.js';
import { api } from '../../../services/api.js';
import { Search, CornerDownLeft, X } from 'lucide-react';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (barcode: string) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [termo, setTermo] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollParentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: produtos.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 62,
    overscan: 4,
  });

  useEffect(() => {
    if (isOpen) {
      setTermo('');
      setSelectedIndex(0);
      carregarProdutos('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const carregarProdutos = async (query: string) => {
    setCarregando(true);
    try {
      const res = await api.pesquisarProdutos(query);
      if (res.success && res.data) {
        setProdutos(res.data);
        setSelectedIndex(0);
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTermo(val);
    carregarProdutos(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, produtos.length - 1);
        rowVirtualizer.scrollToIndex(next, { align: 'auto' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        rowVirtualizer.scrollToIndex(next, { align: 'auto' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (produtos[selectedIndex]) {
        onSelectProduct(produtos[selectedIndex].codigo_barras);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Search className="w-4 h-4" />
            </div>
            <span>Pesquisar Catálogo (F2)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={termo}
            onChange={handleInputChange}
            placeholder="Digite nome, SKU ou código de barras..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white px-4 py-3 rounded-xl outline-none text-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
          />
        </div>

        <div
          ref={scrollParentRef}
          className="h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 text-xs"
        >
          {carregando ? (
            <div className="p-8 text-center text-slate-400">Buscando no banco local SQLite...</div>
          ) : produtos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhum produto encontrado no catálogo</div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const p = produtos[virtualRow.index];
                const isSelected = virtualRow.index === selectedIndex;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p.codigo_barras);
                      onClose();
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/60 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-slate-900 dark:text-white border-l-4 border-blue-600'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{p.descricao}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                        <span>EAN: {p.codigo_barras}</span>
                        <span>•</span>
                        <span>UN: {p.unidade_medida}</span>
                        {p.sku && <span>• SKU: {p.sku}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white font-bold text-sm tabular-nums">
                        R$ {p.preco_venda.toFixed(2)}
                      </span>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 justify-end mt-0.5 font-bold">
                          <span>Enter seleciona</span>
                          <CornerDownLeft className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
