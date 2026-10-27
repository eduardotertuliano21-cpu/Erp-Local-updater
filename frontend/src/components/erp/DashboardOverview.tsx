import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  Percent, QrCode, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api.js';
import { CORES_ABC, DADOS_VAZIOS_DASHBOARD } from './dashboardMockData.js';
import { useTheme } from '../../context/ThemeContext.js';
import { DashboardFiltroDatas, type FiltrosDashboard } from './DashboardFiltroDatas.js';

export const DashboardOverview: React.FC = () => {
  const { isDark } = useTheme();
  const [dados, setDados] = useState<typeof DADOS_VAZIOS_DASHBOARD>(DADOS_VAZIOS_DASHBOARD);
  const [carregando, setCarregando] = useState(false);
  const hojeStr = new Date().toISOString().slice(0, 10);
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ inicio: hojeStr, fim: hojeStr });

  const carregarDashboard = async () => {
    setCarregando(true);
    try {
      const res = await api.obterDashboardOverview(filtros);
      if (res.success && res.data && res.data.kpisTopo) {
        setDados({
          kpisTopo: res.data.kpisTopo,
          eletrocardiograma7Dias: res.data.eletrocardiograma7Dias || [],
          mapaCalor: res.data.mapaCalor || [],
          curvaAbc: res.data.curvaAbc || [],
          movimentacoesCriticas: res.data.movimentacoesCriticas || [],
        });
      }
    } catch {
      // Mantém dados vazios se não responder
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDashboard(); }, [filtros]);

  const totalCupons = dados.kpisTopo.totalCuponsHoje || 0;
  const compOntem = dados.kpisTopo.comparativoOntemPct || 0;
  const ehHoje = filtros.inicio === hojeStr && filtros.fim === hojeStr;

  const kpis = [
    {
      titulo: ehHoje ? 'Faturamento Hoje' : 'Faturamento do Período',
      valor: `R$ ${(dados.kpisTopo.faturamentoHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: totalCupons === 0 ? 'Nenhum cupom no período' : `${totalCupons} cupons emitidos`,
      tendencia: compOntem >= 0 ? `+${compOntem}%` : `${compOntem}%`,
      positivo: compOntem >= 0,
      icon: DollarSign,
      cor: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    },
    {
      titulo: 'Ticket Médio',
      valor: `R$ ${(dados.kpisTopo.ticketMedioHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: totalCupons > 0 ? 'Média por venda no período' : 'Sem vendas no período',
      tendencia: totalCupons > 0 ? 'Ativo' : '0.0%',
      positivo: true,
      icon: Receipt,
      cor: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    },
    {
      titulo: 'Margem de Lucro Bruto',
      valor: `${(dados.kpisTopo.margemLucroBrutoPct || 0).toFixed(1)}%`,
      sub: 'Sobre o faturamento líquido',
      tendencia: 'Margem',
      positivo: true,
      icon: Percent,
      cor: 'text-purple-600 dark:text-purple-400',
      bgIcon: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
    },
    {
      titulo: 'Participação Pix (%)',
      valor: `${(dados.kpisTopo.participacaoPixPct || 0).toFixed(1)}%`,
      sub: 'Do total arrecadado no período',
      tendencia: 'Pix',
      positivo: true,
      icon: QrCode,
      cor: 'text-amber-600 dark:text-amber-400',
      bgIcon: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E2E8F0',
    color: isDark ? '#F8FAFC' : '#0F172A',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const temVendasPeriodo = dados.eletrocardiograma7Dias.some((d) => d.faturamento > 0);
  const temMapaCalor = dados.mapaCalor.some((m) => m.vendas > 0);
  const temCurvaAbc = dados.curvaAbc.length > 0;

  return (
    <div className="space-y-4">
      {/* Barra de Filtro de Datas Interativa */}
      <DashboardFiltroDatas
        filtros={filtros}
        onChange={setFiltros}
        onAtualizar={carregarDashboard}
        loading={carregando}
      />

      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{k.titulo}</span>
                <div className={`p-2 rounded-xl border ${k.bgIcon} ${k.cor}`}><Icon className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono tabular-nums">{k.valor}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 truncate">{k.sub}</span>
                <span className={`flex items-center font-bold font-mono ${k.positivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {k.positivo ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}{k.tendencia}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico 1: Eletrocardiograma de Vendas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Evolução de Vendas no Período</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Curva de faturamento e cupons emitidos</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
            {ehHoje ? 'Por Horário' : 'Por Dia'}
          </span>
        </div>
        <div className="h-64 w-full">
          {temVendasPeriodo ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dados.eletrocardiograma7Dias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#F1F5F9'} vertical={false} />
                <XAxis dataKey="label" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Faturamento']} />
                <Area type="monotone" dataKey="faturamento" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#gradFat)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhuma venda registrada para o período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Mapa de Calor + Curva ABC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Horários de Pico (Concentração)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribuição de vendas ao longo das faixas horárias</p>
          </div>
          <div className="h-56 w-full">
            {temMapaCalor ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.mapaCalor} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#F1F5F9'} vertical={false} />
                  <XAxis dataKey="faixa" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [name === 'faturamento' ? `R$ ${Number(v).toFixed(2)}` : v, name === 'faturamento' ? 'Faturamento' : 'Vendas']} />
                  <Bar dataKey="vendas" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                Sem registros de horários para o período selecionado.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Curva ABC (Top Produtos)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Produtos com maior volume financeiro no período</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {temCurvaAbc ? (
              <>
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dados.curvaAbc} innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="total">
                        {dados.curvaAbc.map((_, idx) => (<Cell key={`cell-${idx}`} fill={CORES_ABC[idx % CORES_ABC.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full text-xs">
                  {dados.curvaAbc.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CORES_ABC[idx % CORES_ABC.length] }} />
                        <span className="truncate text-[11px] font-medium">{item.nome}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">{item.percentual}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10 w-full text-slate-400 dark:text-slate-500 text-xs">
                Nenhum item vendido para compor a Curva ABC no período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auditoria & Ocorrências Críticas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Auditoria & Ocorrências Críticas</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Rastreabilidade no período selecionado</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="pb-2">Tipo</th><th className="pb-2">Descrição</th><th className="pb-2">Operador</th><th className="pb-2">Data/Hora</th><th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {dados.movimentacoesCriticas.length > 0 ? (
                dados.movimentacoesCriticas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.tipo === 'CANCELAMENTO' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' :
                        m.tipo === 'SANGRIA' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' :
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                      }`}>{m.tipo}</span>
                    </td>
                    <td className="py-2.5 font-sans text-slate-800 dark:text-white text-xs">{m.descricao}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 text-xs">{m.operador_id}</td>
                    <td className="py-2.5 text-slate-400 dark:text-slate-500 text-xs">{m.criado_em}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white text-xs">R$ {Number(m.valor).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs font-sans">
                    Nenhuma ocorrência crítica (sangria, cancelamento ou suprimento) no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
