import React from 'react';

export default function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* CTA Final Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/30 p-8 sm:p-12 lg:p-16 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
          
          <span className="inline-block py-1.5 px-4 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6">
            Instalação em 2 minutos • Sem complicação
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white max-w-3xl mx-auto tracking-tight leading-tight">
            Sua loja merece velocidade.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Assine o ClickStorm hoje.
            </span>
          </h2>

          <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            O cadastro é feito diretamente no sistema na primeira execução. Baixe agora e configure sua loja em menos de 2 minutos na tela de configurações iniciais.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-black bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2.5"
              download
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Baixar Instalador Windows (.exe)</span>
            </a>
            <a
              href="https://wa.me/5511996773805?text=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20o%20ClickStorm%20para%20o%20meu%20com%C3%A9rcio!"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors text-center"
            >
              Falar com Especialista
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span>🛡️ Garantia de satisfação</span>
            <span>⚡ Suporte humanizado</span>
            <span>💻 Roda em qualquer máquina</span>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-900/80 flex flex-col md:flex-row items-center justify-between gap-6 text-xs sm:text-sm">
        <div className="flex items-center space-x-3">
          <img
            src="/images/logo-clickstorm.png"
            alt="ClickStorm Systems Logo"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          />
        </div>

        <p className="text-center md:text-left text-slate-400">
          © {currentYear} ClickStorm Systems. Todos os direitos reservados. CNPJ: 00.000.000/0001-00.
        </p>

        <div className="flex space-x-6 text-slate-400">
          <a href="#solucao" className="hover:text-cyan-400 transition-colors">Tecnologia</a>
          <a href="#nichos" className="hover:text-cyan-400 transition-colors">Segmentos</a>
          <a href="https://wa.me/5511996773805?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20ClickStorm." target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  );
}
