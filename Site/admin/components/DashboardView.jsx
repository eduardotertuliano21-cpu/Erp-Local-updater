import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function DashboardView() {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = () => {
      api.getMetricas()
        .then((data) => setMetricas(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    };
    carregar();
    const timer = setInterval(carregar, 8000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="text-slate-400 p-8 animate-pulse">Carregando métricas da nuvem...</div>;
  }

  const cards = [
    {
      titulo: 'MRR (Receita Recorrente)',
      valor: `R$ ${metricas?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'Faturamento mensal recorrente',
      cor: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      titulo: 'Clientes Ativos',
      valor: metricas?.ativosCount || 0,
      sub: 'Lojas sincronizando normalmente',
      cor: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
    {
      titulo: 'Inadimplentes (Stripe)',
      valor: metricas?.inadimplentesCount || 0,
      sub: 'Falha no pagamento de fatura',
      cor: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      titulo: 'Licenças Bloqueadas',
      valor: metricas?.bloqueadosCount || 0,
      sub: 'Assinaturas canceladas',
      cor: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard de Controle Central</h1>
          <p className="text-sm text-slate-400">Visão em tempo real das assinaturas e sincronização dos PDVs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-2xl bg-slate-900/60 border ${card.border} backdrop-blur`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.titulo}</span>
              <span className={`w-3 h-3 rounded-full ${card.bg}`} />
            </div>
            <div className={`text-3xl font-black ${card.cor} tracking-tight`}>{card.valor}</div>
            <div className="text-xs text-slate-500 mt-2">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-2">⚡ Protocolo de Automação de Inadimplência</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Quando o webhook <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded">invoice.payment_failed</code> é disparado pelo Stripe, o status do lojista é atualizado na hora para <strong className="text-amber-400">INADIMPLENTE</strong>. No próximo ciclo de sincronização do aplicativo Desktop Electron, o sistema local recebe a notificação e bloqueia o PDV automaticamente após os dias de carência.
        </p>
      </div>
    </div>
  );
}
