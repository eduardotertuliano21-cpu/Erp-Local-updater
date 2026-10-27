import React from 'react';
import { Calendar, Filter, Receipt, FileText, Ban, DollarSign, Layers } from 'lucide-react';

export interface FiltrosRelatorioVendas {
  inicio: string;
  fim: string;
  tipoFiscal: 'TODAS' | 'FISCAL' | 'NAO_FISCAL';
  status: 'TODOS' | 'CONCLUIDA' | 'CANCELADA';
}

interface RelatorioFiltroDatasProps {
  filtros: FiltrosRelatorioVendas;
  onChange: (novosFiltros: FiltrosRelatorioVendas) => void;
  vendas: any[];
}

export const RelatorioFiltroDatas: React.FC<RelatorioFiltroDatasProps> = ({
  filtros,
  onChange,
  vendas,
}) => {
  const setPreset = (dias: number | 'HOJE' | 'MES' | 'TUDO') => {
    const hoje = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (dias === 'HOJE') {
      onChange({ ...filtros, inicio: fmt(hoje), fim: fmt(hoje) });
    } else if (dias === 'MES') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      onChange({ ...filtros, inicio: fmt(primeiroDia), fim: fmt(hoje) });
    } else if (dias === 'TUDO') {
      onChange({ ...filtros, inicio: '', fim: '' });
    } else {
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - dias);
      onChange({ ...filtros, inicio: fmt(dataInicio), fim: fmt(hoje) });
    }
  };

  // Cálculos rápidos dos dados filtrados
  const totalVendas = vendas.length;
  const totalFaturado = vendas
    .filter((v) => v.status === 'CONCLUIDA')
    .reduce((acc, v) => acc + Number(v.total_liquido || 0), 0);
  const totalFiscais = vendas.filter((v) => v.fiscal_id && v.fiscal_status !== 'CANCELADA').length;
  const totalNaoFiscais = vendas.filter((v) => !v.fiscal_id || v.fiscal_status === 'CANCELADA').length;
  const totalCanceladas = vendas.filter((v) => v.status === 'CANCELADA' || v.fiscal_status === 'CANCELADA').length;

  return (
    <div className="space-y-3">
      {/* Barra de Filtros e Seletores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Inputs de Data */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <input
                type="date"
                value={filtros.inicio}
                onChange={(e) => onChange({ ...filtros, inicio: e.target.value })}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                title="Data Inicial"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="date"
                value={filtros.fim}
                onChange={(e) => onChange({ ...filtros, fim: e.target.value })}
                className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                title="Data Final"
              />
            </div>

            {/* Atalhos Rápidos */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreset('HOJE')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => setPreset('MES')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Este Mês
              </button>
              {(filtros.inicio || filtros.fim) && (
                <button
                  type="button"
                  onClick={() => setPreset('TUDO')}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  Limpar Datas
                </button>
              )}
            </div>
          </div>

          {/* Filtros de Tipo Fiscal e Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtros.tipoFiscal}
                onChange={(e) => onChange({ ...filtros, tipoFiscal: e.target.value as any })}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="TODAS">Todos os Tipos Fiscais</option>
                <option value="FISCAL">🟢 Apenas Fiscais (NFC-e)</option>
                <option value="NAO_FISCAL">⚪ Não Fiscais</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <select
                value={filtros.status}
                onChange={(e) => onChange({ ...filtros, status: e.target.value as any })}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="CONCLUIDA">Concluídas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Resumidas do Período Filtrado */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Vendas</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{totalVendas}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturamento</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fiscais (NFC-e)</span>
            <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400">{totalFiscais}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Não Fiscais</span>
            <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">{totalNaoFiscais}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-2.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Canceladas</span>
            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{totalCanceladas}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
