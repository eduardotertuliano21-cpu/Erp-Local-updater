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
    <section id="recursos" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
          Confiança & Recursos Rápidos
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4">
          Tudo que sua Loja Precisa em um Só Lugar
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Chega de pagar mensalidades separadas para vários programas. O ClickStorm entrega o controle completo do caixa ao estoque.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Lista de Checklist */}
        <div className="space-y-4">
          {recursos.map((rec, idx) => (
            <div key={idx} className="glass-panel p-5 border-white/5 hover:border-cyan-500/30 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {rec.icone}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <span>{rec.titulo}</span>
                  <span className="text-emerald-400 text-xs font-mono font-bold">✓ Incluso</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{rec.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico Dinâmico de Crescimento de Vendas */}
        <div>
          <GrowthChart />
        </div>
      </div>
    </section>
  );
};
