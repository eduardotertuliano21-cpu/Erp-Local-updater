import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Wallet, Receipt, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.js';
import { DashboardOverview } from './DashboardOverview.js';
import { RelatoriosTabelas } from './RelatoriosTabelas.js';
import { RelatorioFiltroDatas, type FiltrosRelatorioVendas } from './RelatorioFiltroDatas.js';

export type RelatorioSubTab = 'DASHBOARD' | 'VENDAS' | 'CAIXAS' | 'FISCAL' | 'AUDITORIA';

export const RelatoriosView: React.FC = () => {
  const [subTab, setSubTab] = useState<RelatorioSubTab>('DASHBOARD');
  const [vendas, setVendas] = useState<any[]>([]);
  const [caixas, setCaixas] = useState<any[]>([]);
  const [contingencias, setContingencias] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filtrosVendas, setFiltrosVendas] = useState<FiltrosRelatorioVendas>({
    inicio: '',
    fim: '',
    tipoFiscal: 'TODAS',
    status: 'TODOS',
  });

  const carregarDados = async () => {
    if (subTab === 'DASHBOARD') return;
    setLoading(true);
    if (subTab === 'VENDAS') {
      const res = await api.listarVendasERP(filtrosVendas);
      if (res.success && res.data) setVendas(res.data);
    } else if (subTab === 'CAIXAS') {
      const res = await api.listarCaixasERP();
      if (res.success && res.data) setCaixas(res.data);
    } else if (subTab === 'FISCAL') {
      const res = await api.listarContingenciasERP();
      if (res.success && res.data) setContingencias(res.data);
    } else if (subTab === 'AUDITORIA') {
      const res = await api.listarAuditoriaERP();
      if (res.success && res.data) setAuditoria(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [subTab, filtrosVendas]);

  const opcoes = [
    { id: 'DASHBOARD' as const, label: 'Painel & Gráficos', icon: LayoutDashboard },
    { id: 'VENDAS' as const, label: 'Vendas Detalhadas', icon: ShoppingCart },
    { id: 'CAIXAS' as const, label: 'Fechamentos de Caixa', icon: Wallet },
    { id: 'FISCAL' as const, label: 'Documentos Fiscais', icon: Receipt },
    { id: 'AUDITORIA' as const, label: 'Auditoria & Logs', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 select-none font-sans pb-8">
      {/* Header and Responsive Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-2">
            <span>CENTRAL DE RELATÓRIOS & INTELIGÊNCIA</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe a saúde financeira, vendas e operações fiscais da sua loja em tempo real
          </p>
        </div>

        {/* Selector Buttons com Alto Contraste Visual */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-100 dark:bg-[#080c14] rounded-xl border border-slate-200 dark:border-slate-800/90 shrink-0">
          {opcoes.map((op) => {
            const Icon = op.icon;
            const isAtivo = subTab === op.id;
            return (
              <button
                key={op.id}
                onClick={() => setSubTab(op.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isAtivo
                    ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white shadow-lg shadow-indigo-500/35 ring-1 ring-indigo-400/50 opacity-100'
                    : 'bg-slate-200/40 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 opacity-55 hover:opacity-100 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isAtivo ? 'text-white drop-shadow-xs' : ''}`} />
                <span>{op.label}</span>
              </button>
            );
          })}
          {subTab !== 'DASHBOARD' && (
            <button
              onClick={carregarDados}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 transition"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {subTab === 'DASHBOARD' ? (
        <DashboardOverview />
      ) : (
        <div className="space-y-4">
          {subTab === 'VENDAS' && (
            <RelatorioFiltroDatas
              filtros={filtrosVendas}
              onChange={setFiltrosVendas}
              vendas={vendas}
            />
          )}

          <RelatoriosTabelas
            tipo={subTab}
            dados={
              subTab === 'VENDAS' ? vendas :
              subTab === 'CAIXAS' ? caixas :
              subTab === 'FISCAL' ? contingencias : auditoria
            }
            loading={loading}
            onAtualizar={carregarDados}
          />
        </div>
      )}
    </div>
  );
};
