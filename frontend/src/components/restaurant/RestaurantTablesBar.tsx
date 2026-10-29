import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Utensils, ShoppingBag, QrCode, RefreshCw, LayoutGrid, X, ChefHat, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { subscribeToMesas } from '../../services/restaurantSocket.js';

export interface Mesa {
  id?: string;
  numero: number;
  status: 'LIVRE' | 'OCUPADA' | 'FECHANDO' | string;
  subtotal: number;
  itens?: any[];
  pedidos?: any[];
}

interface RestaurantTablesBarProps {
  mesaAtiva: number | null;
  isMapExpanded: boolean;
  onToggleExpandMap: () => void;
  onSelectMesa: (mesaNumero: number | null, mesa?: Mesa) => void;
  onAbrirQrModal: (tipo?: 'mobile' | 'kds') => void;
  onMesasChange?: (mesas: Mesa[]) => void;
}

export const RestaurantTablesBar: React.FC<RestaurantTablesBarProps> = ({
  mesaAtiva,
  isMapExpanded,
  onToggleExpandMap,
  onSelectMesa,
  onAbrirQrModal,
  onMesasChange,
}) => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollHoriz = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  const carregarMesas = async () => {
    try {
      setCarregando(true);
      const res = await api.obterMesasRestaurante();
      if (res.success && res.data) {
        setMesas(res.data);
        onMesasChange?.(res.data);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMesas();
    const unsubscribe = subscribeToMesas(
      (todas) => {
        if (todas?.length) {
          setMesas(todas);
          onMesasChange?.(todas);
        }
      },
      (atualizada) => {
        setMesas((prev) => {
          const next = prev.map((m) => (m.numero === atualizada.numero ? atualizada : m));
          onMesasChange?.(next);
          return next;
        });
      }
    );
    return () => unsubscribe();
  }, []);

  const totalOcupadas = mesas.filter((m) => m.status !== 'LIVRE').length;
  const totalLivres = mesas.filter((m) => m.status === 'LIVRE').length;
  const faturamentoAberto = mesas
    .filter((m) => m.status !== 'LIVRE')
    .reduce((acc, m) => acc + (m.subtotal || 0), 0);

  // Acesso Rápido Inteligente: Prioriza Balcão -> Mesas Ocupadas -> Mesas Livres
  const mesasPriorizadas = useMemo(() => {
    const ocupadas = mesas.filter((m) => m.status !== 'LIVRE').sort((a, b) => a.numero - b.numero);
    const livres = mesas.filter((m) => m.status === 'LIVRE').sort((a, b) => a.numero - b.numero);
    return [...ocupadas, ...livres];
  }, [mesas]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-3 shrink-0 flex flex-col gap-2">
      {/* Topo da barra: Resumo, Expandir Mapa e QR Garçom */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            <span>Mesas</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              ({totalLivres} livres • {totalOcupadas} ocupadas)
            </span>
            {totalOcupadas > 0 && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                R$ {faturamentoAberto.toFixed(2)} aberto
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={carregarMesas}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Atualizar Status das Mesas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          </button>

          {/* Botão Ver Todas (F6) / Fechar Mapa */}
          <button
            type="button"
            onClick={onToggleExpandMap}
            className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg text-[11px] transition shadow-xs active:scale-95 cursor-pointer ${
              isMapExpanded
                ? 'bg-rose-500 hover:bg-rose-400 text-white ring-2 ring-rose-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-500/20'
            }`}
            title="Alternar entre Cupom e Mapa Completo de Mesas (F6)"
          >
            {isMapExpanded ? <X className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            <span>{isMapExpanded ? 'Fechar Mapa (F6)' : 'Ver Todas (F6)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onAbrirQrModal('mobile')}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold rounded-lg text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
            title="Conectar Comanda Mobile de Garçons"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">QR Garçom</span>
          </button>

          <button
            type="button"
            onClick={() => onAbrirQrModal('kds')}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-lg text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
            title="Conectar Monitor de Cozinha (KDS)"
          >
            <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">QR Cozinha</span>
          </button>
        </div>
      </div>

      {/* Grade Horizontal Rolável de Mesas com Filtro Inteligente e Botões de Navegação */}
      <div className="flex items-center gap-1.5 min-w-0">
        {mesas.length > 3 && (
          <button
            type="button"
            onClick={() => scrollHoriz('left')}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition cursor-pointer"
            title="Rolar mesas para a esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0"
        >
        {/* Opção 1: Balcão / Venda Direta */}
        <button
          type="button"
          onClick={() => onSelectMesa(null)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            mesaAtiva === null
              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-500/50'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Venda Balcão</span>
        </button>

        {/* Mesas Ordenadas (Ocupadas Primeiro) */}
        {mesasPriorizadas.map((m) => {
          const isAtiva = mesaAtiva === m.numero;
          const isOcupada = m.status !== 'LIVRE';

          return (
            <button
              key={m.id || m.numero}
              type="button"
              onClick={() => onSelectMesa(m.numero, m)}
              className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-xs transition shrink-0 min-w-[94px] cursor-pointer ${
                isAtiva
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-500/50'
                  : isOcupada
                  ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-slate-100 hover:border-amber-500'
                  : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-black text-xs font-mono">
                  Mesa {String(m.numero).padStart(2, '0')}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAtiva
                      ? 'bg-slate-950'
                      : isOcupada
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
              </div>
              <div className="text-[10px] mt-0.5 font-semibold truncate w-full">
                {isOcupada ? (
                  <span className={isAtiva ? 'text-slate-900 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold font-mono'}>
                    R$ {m.subtotal.toFixed(2)}
                  </span>
                ) : (
                  <span className={isAtiva ? 'text-slate-800' : 'text-slate-400'}>
                    Livre
                  </span>
                )}
              </div>
            </button>
          );
        })}

          {/* Botão Final de Expansão da Lista */}
          <button
            type="button"
            onClick={onToggleExpandMap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700"
            title="Ver mapa completo com todas as mesas (F6)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ver Todas ({mesas.length})</span>
          </button>
        </div>
        {mesas.length > 3 && (
          <button
            type="button"
            onClick={() => scrollHoriz('right')}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition cursor-pointer"
            title="Rolar mesas para a direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
