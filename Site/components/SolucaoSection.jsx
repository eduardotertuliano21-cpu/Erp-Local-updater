import React from 'react';

export const SolucaoSection = () => {
  return (
    <section id="solucao" className="py-20 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1600px] w-full mx-auto">
      <div className="glass-panel p-8 sm:p-12 xl:p-16 rounded-3xl relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-500/30">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-14 items-center">
          <div>
            <span className="text-cyan-400 font-bold text-xs xl:text-sm uppercase tracking-wider">
              A Mágica da Tecnologia Local-First
            </span>
            <h2 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold text-white mt-2 mb-6 leading-tight">
              Processamento 100% no seu PC.<br />Zero Travamentos.
            </h2>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base xl:text-lg">
              Diferente dos sistemas comuns baseados em navegadores que dependem de servidores lentos a cada clique, o ClickStorm processa todas as vendas diretamente no seu computador físico.
            </p>

            <ul className="space-y-4 xl:space-y-5 mb-8">
              <li className="flex items-start gap-3 text-slate-200 text-sm xl:text-base">
                <span className="feature-check mt-0.5">✓</span>
                <span>
                  <strong>Blindagem Total Offline:</strong> Caiu o Wi-Fi da loja ou a operadora de internet parou? O caixa continua vendendo normalmente sem perder nada.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm xl:text-base">
                <span className="feature-check mt-0.5">✓</span>
                <span>
                  <strong>Leveza Extrema:</strong> Roda lisinho naquele computador mais antigo da sua loja (Core i5 antigo com 4GB de RAM). Economize milhares de reais em máquinas.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm xl:text-base">
                <span className="feature-check mt-0.5">✓</span>
                <span>
                  <strong>Treinamento em 5 Minutos:</strong> Interface limpa, moderna e autoexplicativa. Seu operador aprende a passar compras no primeiro dia sem dificuldades.
                </span>
              </li>
            </ul>

            <a
              href="https://wa.me/5511996773805?text=Ol%C3%A1!%20Quero%20blindar%20o%20meu%20caixa%20com%20o%20ClickStorm%20Systems."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta text-sm xl:text-base px-8 py-4"
            >
              Quero Blindar Minha Loja
            </a>
          </div>

          {/* Foto Real da Frente de Caixa em Ação */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-white/5 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-white font-bold">Frente de Caixa em Operação Real</span>
                </div>
                <span className="text-cyan-400 font-bold">LATÊNCIA: 0.02s</span>
              </div>
              <img
                src="/images/screen-pdv.png"
                alt="Frente de Caixa Real do ClickStorm"
                className="w-full h-auto object-cover transition duration-300 group-hover:scale-[1.01]"
                loading="lazy"
              />
              <div className="p-3.5 xl:p-4 bg-slate-950/90 border-t border-white/5 flex items-center justify-between text-xs xl:text-sm text-slate-300">
                <span>✓ Leitor de código de barras bipando em tempo real</span>
                <span className="text-emerald-400 font-bold">100% Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
