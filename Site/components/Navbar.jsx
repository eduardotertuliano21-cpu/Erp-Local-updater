import React, { useState } from 'react';

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#07090e]/85 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo Oficial */}
        <a href="#" className="flex items-center gap-3 text-decoration-none group">
          <img
            src="/images/logo-clickstorm.png"
            alt="ClickStorm Systems Logo"
            className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_18px_rgba(6,182,212,0.4)]"
          />
        </a>

        {/* Links Desktop */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-sm font-medium text-slate-300">
          <a href="#dores" className="hover:text-cyan-400 transition">O Fim das Filas</a>
          <a href="#solucao" className="hover:text-cyan-400 transition">Como Funciona</a>
          <a href="#nichos" className="hover:text-cyan-400 transition">Para Sua Loja</a>
          <a href="#recursos" className="hover:text-cyan-400 transition">Recursos</a>
          <a href="#faq" className="hover:text-cyan-400 transition">Dúvidas</a>
        </nav>

        {/* CTA Desktop */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4">
          <a
            href="https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
            download
          >
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Baixar Sistema</span>
          </a>
          <a
            href="https://wa.me/5511996773805?text=Ol%C3%A1!%20Quero%20conhecer%20o%20ClickStorm%20Systems%20para%20minha%20loja."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 border border-slate-700 hover:border-slate-500 rounded-xl transition"
          >
            WhatsApp
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 text-slate-300 hover:text-white"
          aria-label="Alternar Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d1117] border-b border-white/10 px-6 py-4 space-y-3 text-sm animate-fade-in">
          <a href="#dores" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-cyan-400 py-1">O Fim das Filas</a>
          <a href="#solucao" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-cyan-400 py-1">Como Funciona</a>
          <a href="#nichos" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-cyan-400 py-1">Para Sua Loja</a>
          <a href="#recursos" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-cyan-400 py-1">Recursos</a>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-cyan-400 py-1">Dúvidas</a>
          <a
            href="https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold rounded-xl shadow-md text-center mt-2"
            download
          >
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Baixar Instalador Windows</span>
          </a>
          <a
            href="https://wa.me/5511996773805?text=Ol%C3%A1!%20Quero%20conhecer%20o%20ClickStorm%20Systems%20para%20minha%20loja."
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-slate-300 py-2 border border-slate-700 rounded-xl"
          >
            Falar no WhatsApp
          </a>
        </div>
      )}
    </header>
  );
};
