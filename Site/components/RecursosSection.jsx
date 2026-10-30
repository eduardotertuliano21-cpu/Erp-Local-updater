import React from 'react';
import { GrowthChart } from './GrowthChart.jsx';

export const RecursosSection = () => {
  const recursos = [
    {
      titulo: 'Emissão de NFC-e Rápida',
      descricao: 'Emita cupons fiscais homologados sem travas. Se a internet oscilar, o sistema guarda a nota e autoriza automaticamente depois.',
      icone: '🧾',
    },
    {
      titulo: 'Maquininha Integrada (TEF)',
      descricao: 'O valor da venda vai direto para o visor da maquininha de cartão. Zero risco de erro de digitação do operador de caixa.',
      icone: '💳',
    },
    {
      titulo: 'Curva ABC de Vendas',
      descricao: 'Descubra em segundos os produtos que geram 80% do seu lucro. Não deixe seu dinheiro parado em estoque que não gira.',
      icone: '📊',
    },
    {
      titulo: 'Controle de Fiado & Convênio',
      descricao: 'Defina limites de crédito por cliente, emita extratos claros de cobrança e feche o mês com total prestação de contas.',
      icone: '🤝',
    },
  ];

  return (
    <section id="recursos" className="py-20 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1600px] w-full mx-auto">
      <div className="text-center max-w-3xl xl:max-w-5xl mx-auto mb-14">
        <span className="text-cyan-400 font-bold text-xs xl:text-sm uppercase tracking-wider">
          Confiança & Recursos Rápidos
        </span>
        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white mt-2 mb-4">
          Tudo que sua Loja Precisa em um Só Lugar
        </h2>
        <p className="text-slate-400 text-sm sm:text-base xl:text-lg">
          Chega de pagar mensalidades separadas para vários programas. O ClickStorm entrega o controle completo do caixa ao estoque.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 xl:gap-14 items-center">
        {/* Lista de Checklist */}
        <div className="space-y-4 xl:space-y-5">
          {recursos.map((rec, idx) => (
            <div key={idx} className="glass-panel p-5 xl:p-6 border-white/5 hover:border-cyan-500/30 flex items-start gap-4 xl:gap-5 rounded-2xl transition duration-300">
              <div className="w-11 h-11 xl:w-13 xl:h-13 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl xl:text-2xl flex-shrink-0">
                {rec.icone}
              </div>
              <div>
                <h3 className="text-base xl:text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>{rec.titulo}</span>
                  <span className="text-emerald-400 text-xs xl:text-sm font-mono font-bold">✓ Incluso</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm xl:text-base leading-relaxed">{rec.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico Dinâmico de Crescimento de Vendas */}
        <div className="w-full">
          <GrowthChart />
        </div>
      </div>
    </section>
  );
};
