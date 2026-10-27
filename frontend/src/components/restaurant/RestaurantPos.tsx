import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, QrCode, Monitor, ShoppingCart } from 'lucide-react';
import { subscribeToMesas, emitLiberaMesa } from '../../services/restaurantSocket.js';
import { QrCodeModal } from './QrCodeModal.js';
import { TableCheckout } from './TableCheckout.js';
import type { ItemCarrinho } from '../../types/pdv.js';
import { api } from '../../services/api.js';

interface RestaurantPosProps {
  onFinalizarVendaMesa: (itens: ItemCarrinho[], total: number, mesaNumero: number) => void;
  onVoltarBalcao?: () => void;
  onAbrirRetaguarda?: () => void;
}

export const RestaurantPos: React.FC<RestaurantPosProps> = ({
  onFinalizarVendaMesa,
  onVoltarBalcao,
  onAbrirRetaguarda,
}) => {
  const [mesas, setMesas] = useState<any[]>([]);
  const [mesaSelecionada, setMesaSelecionada] = useState<any | null>(null);
  const [filtro, setFiltro] = useState<'TODAS' | 'LIVRE' | 'OCUPADA'>('TODAS');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  useEffect(() => {
    api.obterMesasRestaurante().then((res) => {
      if (res.success && res.data?.length) setMesas(res.data);
    });

    const unsubscribe = subscribeToMesas(
      (todas) => { if (todas?.length) setMesas(todas); },
      (atualizada) => {
        setMesas((prev) => prev.map((m) => (m.numero === atualizada.numero ? atualizada : m)));
        if (mesaSelecionada && mesaSelecionada.numero === atualizada.numero) {
          setMesaSelecionada(atualizada);
        }
      }
    );
    return () => unsubscribe();
  }, [mesaSelecionada]);

  // Se uma mesa estiver aberta para conferência/fechamento, renderiza a Visão 2
  if (mesaSelecionada) {
    return (
      <TableCheckout
        mesa={mesaSelecionada}
        onVoltar={() => setMesaSelecionada(null)}
        onFinalizarComanda={(itens, total) => {
          const numMesa = mesaSelecionada.numero;
          emitLiberaMesa(numMesa);
          setMesaSelecionada(null);
          onFinalizarVendaMesa(itens, total, numMesa);
        }}
      />
    );
  }

  const livres = mesas.filter((m) => m.status === 'LIVRE').length;
  const ocupadas = mesas.filter((m) => m.status !== 'LIVRE').length;
  const totalFaturamentoAberto = mesas
    .filter((m) => m.status !== 'LIVRE')
    .reduce((acc, m) => acc + (m.subtotal || 0), 0);

  const mesasFiltradas = mesas.filter((m) => {
    if (filtro === 'LIVRE') return m.status === 'LIVRE';
    if (filtro === 'OCUPADA') return m.status !== 'LIVRE';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-950 text-slate-100 overflow-hidden font-sans p-3 sm:p-5 select-none">
      {/* Top Header do Salão de Mesas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.08] mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 border border-amber-400/30">
            <UtensilsCrossed className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Gestão de Mesas & Atendimento</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                TEMPO REAL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Sincronização instantânea com comandas mobile de garçons via Wi-Fi local
            </p>
          </div>
        </div>

        {/* Indicadores Executivos e Botão Conectar Garçom */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">{livres} Livres</span>
            </div>
            <div className="text-white/20">•</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-300">{ocupadas} Ocupadas</span>
            </div>
            <div className="text-white/20">•</div>
            <div className="text-amber-400 font-bold">
              R$ {totalFaturamentoAberto.toFixed(2)} aberto
            </div>
          </div>

          {onVoltarBalcao && (
            <button
              onClick={onVoltarBalcao}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 active:scale-95 cursor-pointer"
              title="Alternar para Venda Balcão (F6)"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              <span>Venda Balcão (F6)</span>
            </button>
          )}

          {onAbrirRetaguarda && (
            <button
              onClick={onAbrirRetaguarda}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition border border-slate-700 active:scale-95 cursor-pointer"
              title="Acessar Retaguarda ERP (F11)"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Retaguarda (F11)</span>
            </button>
          )}

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Conectar Garçom (QR Code)</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          {(['TODAS', 'LIVRE', 'OCUPADA'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filtro === f
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f === 'TODAS' ? `Todas (${mesas.length})` : f === 'LIVRE' ? `Livres (${livres})` : `Ocupadas (${ocupadas})`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Clique na mesa ocupada para conferir ou fechar a conta
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pb-6">
        {mesasFiltradas.map((m) => {
          const isOcupada = m.status === 'OCUPADA' || m.status === 'FECHANDO';
          return (
            <div
              key={m.id}
              onClick={() => setMesaSelecionada(m)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between h-36 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
                isOcupada
                  ? 'bg-gradient-to-b from-rose-950/40 to-slate-900/90 border-rose-500/40 hover:border-rose-400 shadow-lg shadow-rose-950/30'
                  : 'bg-gradient-to-b from-slate-900/60 to-slate-950/80 border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {/* Status Indicator Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isOcupada ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' : 'bg-emerald-500/40'
                }`}
              />

              <div className="flex items-center justify-between">
                <span className="font-black text-lg text-white">Mesa {m.numero}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                    isOcupada
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="mt-2">
                <div className="text-base font-black font-mono tabular-nums text-slate-100">
                  {m.subtotal > 0 ? (
                    <span className="text-emerald-400">R$ {m.subtotal.toFixed(2)}</span>
                  ) : (
                    <span className="text-slate-500 text-xs">Mesa Livre</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
                  <span>{m.itens?.length || 0} itens</span>
                  {m.garcom_pin && <span className="text-amber-300 text-[10px]">PIN {m.garcom_pin}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <QrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
};
