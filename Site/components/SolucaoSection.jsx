import React from 'react';

export const SolucaoSection = () => {
  return (
    <section id="solucao" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="glass-panel p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-cyan-500/30">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">
              A Mágica da Tecnologia Local-First
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-6">
              Processamento 100% no seu PC.<br />Zero Travamentos.
            </h2>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
              Diferente dos sistemas comuns baseados em navegadores que dependem de servidores lentos a cada clique, o ClickStorm processa todas as vendas diretamente no seu computador físico.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <span className="feature-check mt-0.5">✓</span>
                <span>
                  <strong>Blindagem Total Offline:</strong> Caiu o Wi-Fi da loja ou a operadora de internet parou? O caixa continua vendendo normalmente sem perder nada.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <span className="feature-check mt-0.5">✓</span>
                <span>
                  <strong>Leveza Extrema:</strong> Roda lisinho naquele computador mais antigo da sua loja (Core i5 antigo com 4GB de RAM). Economize milhares de reais em máquinas.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm">
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
              className="btn-cta"
            >
              Quero Blindar Minha Loja
            </a>
          </div>

          {/* Terminal / Mock Visual */}
          <div className="bg-black/70 p-6 rounded-2xl border border-white/10 font-mono text-xs text-slate-300 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>TERMINAL CLICKSTORM // PDV ATIVO</span>
              </div>
              <span className="text-emerald-400 font-bold">LATÊNCIA: 0.02s</span>
            </div>
            <div className="text-slate-400">&gt; Produto Bipado: [7891000100103] Refrigerante 2L</div>
            <div className="text-cyan-300 font-semibold">&gt; Resposta do Caixa: Instantânea (R$ 8,50)</div>
            <div className="text-slate-400">&gt; Forma de Pagamento: Cartão Débito / TEF Integrado</div>
            <div className="text-emerald-400">&gt; Impressão do Cupom: Autorizada em 0.04s.</div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-300 font-sans text-xs mt-4">
              ✓ 15 produtos adicionados e finalizados em apenas <strong>12 segundos</strong>.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
