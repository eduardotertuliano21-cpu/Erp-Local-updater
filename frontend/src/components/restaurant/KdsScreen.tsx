import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Play, Check, RefreshCw } from 'lucide-react';
import { enterpriseApi, type KdsPedido } from '../../services/enterpriseApi.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

export const KdsScreen: React.FC = () => {
  const { isRestaurante } = useBusinessMode();
  const isKdsUrl = typeof window !== 'undefined' && (window.location.search.includes('kds=1') || window.location.pathname.startsWith('/kds'));
  const [pedidos, setPedidos] = useState<KdsPedido[]>([]);
  const [tempoAtual, setTempoAtual] = useState(Date.now());

  if (!isRestaurante && !isKdsUrl) return null;

  const carregarPedidos = async () => {
    try {
      const data = await enterpriseApi.listarKds();
      setPedidos(data);
    } catch (err) {
      console.error('Erro ao carregar pedidos do KDS:', err);
    }
  };

  useEffect(() => {
    carregarPedidos();
    const intervalKds = setInterval(carregarPedidos, 3500);
    const intervalTimer = setInterval(() => setTempoAtual(Date.now()), 1000);
    return () => {
      clearInterval(intervalKds);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleAvancar = async (id: string) => {
    try {
      await enterpriseApi.avancarStatusKds(id);
      carregarPedidos();
    } catch (err) {
      console.error('Erro ao avançar pedido KDS:', err);
    }
  };

  const getMinutosDecorridos = (dataIso: string) => {
    const diffMs = Math.max(0, tempoAtual - new Date(dataIso).getTime());
    return Math.floor(diffMs / 60000);
  };

  const getSegundosDecorridos = (dataIso: string) => {
    const diffMs = Math.max(0, tempoAtual - new Date(dataIso).getTime());
    return Math.floor((diffMs % 60000) / 1000);
  };

  const getCardCores = (minutos: number, status: string) => {
    if (status === 'PRONTO') {
      return 'border-emerald-500 bg-emerald-950/20';
    }
    if (minutos >= 10) {
      return 'border-rose-500 bg-rose-950/25 ring-1 ring-rose-500/50 animate-pulse';
    }
    if (minutos >= 5) {
      return 'border-amber-500 bg-amber-950/20';
    }
    return 'border-slate-800 bg-slate-900/90';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col space-y-6 font-sans select-none">
      {/* Header do KDS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold shadow-lg">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>KDS • Monitor de Cozinha Local</span>
              <span className="text-xs font-mono font-bold bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                {pedidos.length} Ativos
              </span>
            </h1>
            <p className="text-xs text-slate-400">Tempo real para Tablets e Telas de Produção na LAN</p>
          </div>
        </div>

        <button
          onClick={carregarPedidos}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 items-start">
        {pedidos.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 flex flex-col items-center gap-3">
            <ChefHat className="w-12 h-12 opacity-30" />
            <span className="text-sm font-semibold">Cozinha sem comandas pendentes no momento.</span>
          </div>
        ) : (
          pedidos.map((ped) => {
            const min = getMinutosDecorridos(ped.criado_em);
            const seg = getSegundosDecorridos(ped.criado_em);
            const itens: Array<{ nome: string; quantidade: number; observacao?: string }> = (() => {
              try { return JSON.parse(ped.itens_json || '[]'); } catch { return []; }
            })();

            return (
              <div
                key={ped.id}
                className={`p-4 rounded-3xl border flex flex-col justify-between space-y-4 shadow-xl transition ${getCardCores(min, ped.status)}`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <div className="text-base font-black text-white">
                        {ped.mesa_numero ? `Mesa #${ped.mesa_numero}` : `Comanda #${ped.comanda_numero || ped.id.slice(-4)}`}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{ped.cliente_nome || ped.origem}</div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className={min >= 10 ? 'text-rose-400' : min >= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                        {String(min).padStart(2, '0')}:{String(seg).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Itens */}
                  <div className="mt-3 space-y-2">
                    {itens.map((it, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-black text-orange-400 text-sm">{it.quantidade}x</span>
                          <div>
                            <span className="font-bold text-white uppercase">{it.nome}</span>
                            {it.observacao && (
                              <div className="text-[10px] text-amber-300 italic">{it.observacao}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {ped.observacoes && (
                      <div className="p-2 bg-slate-950/60 rounded-xl text-[10px] text-slate-400 border border-slate-800/80 mt-2">
                        Obs: {ped.observacoes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ação de Avançar Status */}
                <div className="pt-2 border-t border-slate-800">
                  {ped.status === 'PENDENTE' && (
                    <button
                      onClick={() => handleAvancar(ped.id)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Preparo</span>
                    </button>
                  )}
                  {ped.status === 'PREPARANDO' && (
                    <button
                      onClick={() => handleAvancar(ped.id)}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Prato Pronto</span>
                    </button>
                  )}
                  {ped.status === 'PRONTO' && (
                    <button
                      onClick={() => handleAvancar(ped.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Entregar Pedido</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
