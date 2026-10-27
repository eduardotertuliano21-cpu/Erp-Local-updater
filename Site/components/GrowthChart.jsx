import React, { useState, useEffect } from 'react';

export const GrowthChart = () => {
  const [activeView, setActiveView] = useState('clickstorm');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const timer = setTimeout(() => setProgress(100), 100);
    return () => clearTimeout(timer);
  }, [activeView]);

  const meses = [
    { mes: 'Mês 1', comum: 35, clickstorm: 48, labelComum: 'R$ 42k', labelClick: 'R$ 58k' },
    { mes: 'Mês 2', comum: 38, clickstorm: 65, labelComum: 'R$ 45k', labelClick: 'R$ 78k' },
    { mes: 'Mês 3', comum: 34, clickstorm: 82, labelComum: 'R$ 41k', labelClick: 'R$ 98k' },
    { mes: 'Mês 4', comum: 40, clickstorm: 95, labelComum: 'R$ 48k', labelClick: 'R$ 115k' },
  ];

  const isClick = activeView === 'clickstorm';

  return (
    <div className="glass-panel p-6 sm:p-7 border-cyan-500/30 bg-slate-900/90 shadow-2xl relative overflow-hidden">
      {/* Header do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Simulação de Desempenho Real
          </span>
          <h4 className="text-lg font-extrabold text-white">Crescimento de Faturamento no Balcão</h4>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveView('comum')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              !isClick ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sistema Antigo
          </button>
          <button
            type="button"
            onClick={() => setActiveView('clickstorm')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              isClick ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ ClickStorm
          </button>
        </div>
      </div>

      {/* Destaque Numérico */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[11px] text-slate-400 block">Vendas Finalizadas</span>
          <div className="text-xl sm:text-2xl font-black mt-0.5 text-white flex items-center gap-1.5">
            {isClick ? '+38.4%' : 'Oscilando'}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isClick ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isClick ? '↑ Alta' : '↓ Queda'}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
          <span className="text-[11px] text-slate-400 block">Vendas Perdidas na Queda de Net</span>
          <div className="text-xl sm:text-2xl font-black mt-0.5 flex items-center gap-1.5">
            <span className={isClick ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
              {isClick ? '0 Vendas' : 'Até R$ 1.800/mês'}
            </span>
          </div>
        </div>
      </div>

      {/* Área das Barras Animadas */}
      <div className="h-52 flex items-end justify-between gap-3 sm:gap-6 pt-4 pb-2 px-2 border-b border-white/10">
        {meses.map((item, idx) => {
          const altura = isClick ? item.clickstorm : item.comum;
          const valorFormatado = isClick ? item.labelClick : item.labelComum;
          const alturaAnimada = progress > 0 ? `${altura}%` : '4%';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-mono font-bold mb-1.5 transition-all text-slate-300 opacity-80 group-hover:opacity-100">
                {valorFormatado}
              </span>
              <div className="w-full max-w-[46px] bg-slate-950 rounded-t-xl h-full flex items-end p-1 border border-white/5">
                <div
                  style={{ height: alturaAnimada }}
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-lg ${
                    isClick
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-cyan-500/30'
                      : 'bg-gradient-to-t from-rose-800 to-rose-500/70 shadow-rose-500/10'
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 mt-2 font-mono">{item.mes}</span>
            </div>
          );
        })}
      </div>

      {/* Rodapé do Gráfico com Conclusão */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Sem fila • Foco no lucro</span>
        </div>
        <span className="text-slate-500 font-mono text-[10px]">Taxa de resposta &lt; 0.03s</span>
      </div>
    </div>
  );
};
