import React, { useState, useMemo } from 'react';
import { Utensils, ShoppingBag, X, Search } from 'lucide-react';
import type { Mesa } from './RestaurantTablesBar.js';

interface RestaurantTablesGridProps {
  mesas: Mesa[];
  mesaAtiva: number | null;
  onSelectMesa: (mesaNumero: number | null, mesa?: Mesa) => void;
  onClose: () => void;
}

export const RestaurantTablesGrid: React.FC<RestaurantTablesGridProps> = ({
  mesas,
  mesaAtiva,
  onSelectMesa,
  onClose,
}) => {
  const [filtro, setFiltro] = useState<'TODAS' | 'LIVRE' | 'OCUPADA'>('TODAS');
  const [busca, setBusca] = useState('');

  const ocupadas = useMemo(() => mesas.filter((m) => m.status !== 'LIVRE'), [mesas]);
  const livres = useMemo(() => mesas.filter((m) => m.status === 'LIVRE'), [mesas]);
  const totalAberto = useMemo(
    () => ocupadas.reduce((acc, m) => acc + (m.subtotal || 0), 0),
    [ocupadas]
  );

  const mesasFiltradas = useMemo(() => {
    return mesas.filter((m) => {
      if (filtro === 'LIVRE' && m.status !== 'LIVRE') return false;
      if (filtro === 'OCUPADA' && m.status === 'LIVRE') return false;
      if (busca.trim()) {
        const query = busca.toLowerCase().trim();
        const numStr = String(m.numero);
        return numStr.includes(query) || `mesa ${numStr}`.includes(query);
      }
      return true;
    });
  }, [mesas, filtro, busca]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Header do Grid Expandido */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Mapa Completo do Salão</span>
              <span className="text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                {mesas.length} Mesas
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clique em qualquer mesa para abrir no caixa e continuar o atendimento
            </p>
          </div>
        </div>

        {/* Filtros e Busca Rápida */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mesa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 w-32 sm:w-40"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setFiltro('TODAS')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'TODAS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todas ({mesas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('OCUPADA')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'OCUPADA'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-amber-500'
              }`}
            >
              Ocupadas ({ocupadas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('LIVRE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'LIVRE'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-500'
              }`}
            >
              Livres ({livres.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Fechar mapa e voltar ao cupom (ESC / F6)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fechar (F6)</span>
          </button>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {/* Card Especial: Venda Balcão */}
          <button
            type="button"
            onClick={() => {
              onSelectMesa(null);
              onClose();
            }}
            className={`p-3 rounded-2xl flex flex-col justify-between items-start text-left transition cursor-pointer border min-h-[110px] ${
              mesaAtiva === null
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Direto
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black">Venda Balcão</div>
              <div className="text-[11px] text-slate-400">Caixa rápido sem mesa</div>
            </div>
          </button>

          {/* Cards das Mesas */}
          {mesasFiltradas.map((m) => {
            const isAtiva = mesaAtiva === m.numero;
            const isOcupada = m.status !== 'LIVRE';
            const subtotal = m.subtotal || 0;
            const qtdItens = m.itens?.length || 0;

            return (
              <button
                key={m.id || m.numero}
                type="button"
                onClick={() => {
                  onSelectMesa(m.numero, m);
                  onClose();
                }}
                className={`p-3 rounded-2xl flex flex-col justify-between items-start text-left transition cursor-pointer border min-h-[110px] relative overflow-hidden group ${
                  isAtiva
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg ring-2 ring-amber-500/60'
                    : isOcupada
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 hover:border-amber-500 hover:shadow-md'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-base font-black font-mono tracking-tight ${isAtiva ? 'text-slate-950' : 'text-slate-900 dark:text-slate-100'}`}>
                    Mesa {String(m.numero).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAtiva
                          ? 'bg-slate-950'
                          : isOcupada
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isAtiva
                          ? 'bg-slate-950 text-amber-400'
                          : isOcupada
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isOcupada ? 'Ocupada' : 'Livre'}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-3">
                  {isOcupada ? (
                    <div>
                      <div className={`text-xs font-semibold ${isAtiva ? 'text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}>
                        {qtdItens > 0 ? `${qtdItens} item(ns)` : 'Em consumo'}
                      </div>
                      <div className={`text-sm font-black font-mono ${isAtiva ? 'text-slate-950' : 'text-amber-600 dark:text-amber-400'}`}>
                        R$ {subtotal.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[11px] text-slate-400">Pronta para novo pedido</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ 0,00</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rodapé informativo do Grid */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Livres: <strong>{livres.length}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Ocupadas: <strong>{ocupadas.length}</strong></span>
          </span>
        </div>
        {ocupadas.length > 0 && (
          <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
            Total em Aberto no Salão: R$ {totalAberto.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantTablesGrid;
