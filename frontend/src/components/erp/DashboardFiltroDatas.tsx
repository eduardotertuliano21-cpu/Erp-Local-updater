import React from 'react';
import { Calendar, RefreshCw, Filter, Sparkles } from 'lucide-react';

export interface FiltrosDashboard {
  inicio: string;
  fim: string;
}

interface DashboardFiltroDatasProps {
  filtros: FiltrosDashboard;
  onChange: (novos: FiltrosDashboard) => void;
  onAtualizar: () => void;
  loading: boolean;
}

export const DashboardFiltroDatas: React.FC<DashboardFiltroDatasProps> = ({
  filtros,
  onChange,
  onAtualizar,
  loading,
}) => {
  const formatarDataIso = (d: Date) => d.toISOString().slice(0, 10);

  const aplicarPreset = (tipo: 'HOJE' | 'ONTEM' | '7DIAS' | '30DIAS' | 'ESTE_MES' | 'TUDO') => {
    const hoje = new Date();
    const hojeStr = formatarDataIso(hoje);

    if (tipo === 'HOJE') {
      onChange({ inicio: hojeStr, fim: hojeStr });
    } else if (tipo === 'ONTEM') {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = formatarDataIso(ontem);
      onChange({ inicio: ontemStr, fim: ontemStr });
    } else if (tipo === '7DIAS') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      onChange({ inicio: formatarDataIso(d), fim: hojeStr });
    } else if (tipo === '30DIAS') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      onChange({ inicio: formatarDataIso(d), fim: hojeStr });
    } else if (tipo === 'ESTE_MES') {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      onChange({ inicio: formatarDataIso(d), fim: hojeStr });
    } else if (tipo === 'TUDO') {
      onChange({ inicio: '', fim: '' });
    }
  };

  const isPresetAtivo = (tipo: string) => {
    const hoje = formatarDataIso(new Date());
    if (tipo === 'HOJE') return filtros.inicio === hoje && filtros.fim === hoje;
    if (tipo === 'TUDO') return !filtros.inicio && !filtros.fim;
    return false;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Título & Badge de Período Ativo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/80">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Filtro Temporal do Painel
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-2.5 h-2.5" />
                {filtros.inicio && filtros.fim
                  ? filtros.inicio === filtros.fim
                    ? `Dia ${filtros.inicio.split('-').reverse().join('/')}`
                    : `${filtros.inicio.split('-').reverse().join('/')} até ${filtros.fim.split('-').reverse().join('/')}`
                  : 'Histórico Completo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personalize o período de análise para recalcular KPIs, gráficos e horários de pico
            </p>
          </div>
        </div>

        {/* Botão de Atualização Manual */}
        <button
          onClick={onAtualizar}
          disabled={loading}
          className="self-end lg:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition cursor-pointer disabled:opacity-50"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {/* Presets Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => aplicarPreset('HOJE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isPresetAtivo('HOJE')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('ONTEM')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('7DIAS')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            7 Dias
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('30DIAS')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            30 Dias
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('ESTE_MES')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Este Mês
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset('TUDO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              isPresetAtivo('TUDO')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todo Histórico
          </button>
        </div>

        {/* Inputs de Data Customizada */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filtros.inicio}
              onChange={(e) => onChange({ ...filtros, inicio: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-mono text-xs outline-hidden cursor-pointer"
            />
          </div>
          <span className="text-slate-400 text-xs font-medium">até</span>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filtros.fim}
              onChange={(e) => onChange({ ...filtros, fim: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-mono text-xs outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
