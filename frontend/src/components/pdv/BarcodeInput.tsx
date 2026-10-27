import React, { useRef, useEffect, useState } from 'react';
import { Search, CornerDownLeft, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useOperacao } from '../../context/OperacaoContext.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import type { Produto } from '../../types/pdv.js';

interface BarcodeInputProps {
  onScan: (code: string) => void;
  isModalOpen: boolean;
  isCarregando: boolean;
  mensagemStatus: string;
  itensCount?: number;
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({
  onScan,
  isModalOpen,
  isCarregando,
  mensagemStatus,
  itensCount = 0,
}) => {
  const { config } = useOperacao();
  const { isRestaurante } = useBusinessMode();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Produto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Foco no Mount e no Update de itens do carrinho
  useEffect(() => {
    if (!isModalOpen && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isModalOpen, itensCount]);

  // Global Keydown Catcher & Click Catcher
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key && e.key.length === 1) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };
    const handleGlobalClick = () => {
      if (!isModalOpen && inputRef.current) {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && active.tagName !== 'SELECT')) {
          inputRef.current.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [isModalOpen]);

  const parseQuery = (texto: string) => {
    if (texto.includes('*')) {
      const [mult, ...resto] = texto.split('*');
      return { multiplicador: mult.trim(), termo: resto.join('*').trim() };
    }
    return { multiplicador: '', termo: texto.trim() };
  };

  const { multiplicador, termo } = parseQuery(query);
  const isMultiplier = query.includes('*');

  useEffect(() => {
    const { termo: termoDebounced } = parseQuery(debouncedQuery);
    if (!termoDebounced || termoDebounced.length < 2 || /^\d{8,14}$/.test(termoDebounced)) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    let ativo = true;
    api.pesquisarProdutos(termoDebounced)
      .then((res) => {
        if (ativo && res.success && res.data && res.data.length > 0) {
          setResults(res.data.slice(0, 8));
          setIsOpen(true);
          setSelectedIndex(0);
        } else if (ativo) {
          setResults([]);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      })
      .catch(() => {
        if (ativo) { setResults([]); setIsOpen(false); }
      });

    return () => { ativo = false; };
  }, [debouncedQuery]);

  const handleSelectProduct = (prod: Produto) => {
    const codigo = multiplicador ? `${multiplicador}*${prod.codigo_barras || prod.id}` : (prod.codigo_barras || prod.id);
    onScan(codigo);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus({ preventScroll: true });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        handleSelectProduct(results[selectedIndex]);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        onScan(query.trim());
        setQuery('');
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus({ preventScroll: true });
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
      }
    }
  };

  return (
    <div className="relative w-full p-3 select-none">
      <div className="relative flex items-center px-4 h-13 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
        <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
        <input
          id="barcode-field"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!isModalOpen) {
              setTimeout(() => {
                const active = document.activeElement;
                if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && active.tagName !== 'SELECT')) {
                  inputRef.current?.focus({ preventScroll: true });
                }
              }, 20);
            }
          }}
          disabled={isModalOpen || isCarregando}
          placeholder={
            isRestaurante
              ? 'Pesquise o prato ou digite código da comanda...'
              : 'Bipe o código de barras ou digite o nome do produto...'
          }
          className="w-full h-full bg-transparent text-slate-900 dark:text-slate-100 text-base sm:text-lg outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium tracking-tight disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />

        <div className="flex items-center gap-2 shrink-0">
          {isMultiplier && (
            <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded font-mono font-bold">
              QTD: {multiplicador}x
            </span>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xs">
            <span>ENTER</span>
            <CornerDownLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </kbd>
        </div>
      </div>

      {mensagemStatus && (
        <div className="px-3 pt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{mensagemStatus}</span>
          <span className="text-slate-400 dark:text-slate-500 font-mono">Dica: 3*CÓDIGO para multiplicar</span>
        </div>
      )}

      {/* Dropdown de Autocomplete */}
      {isOpen && results.length > 0 && (
        <ul className="absolute left-3 right-3 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 list-none p-0 m-0">
          <li className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{results.length} itens encontrados para "{termo}"</span>
            <span>Use ↑ ↓ e pressione ENTER</span>
          </li>

          {results.map((item, idx) => {
            const isHighlighted = idx === selectedIndex;
            return (
              <li
                key={item.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelectProduct(item)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  isHighlighted
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600 text-slate-900 dark:text-slate-100'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center min-w-0 pr-3 gap-3">
                  {config.exibir_fotos_busca === 1 && (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{item.descricao}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      EAN: {item.codigo_barras || 'S/ COD'}
                      {item.estoque_atual !== undefined && ` • Saldo: ${item.estoque_atual}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    R$ {Number(item.preco_venda || 0).toFixed(2)}
                  </span>
                  {isHighlighted && (
                    <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                      SELECIONAR
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
