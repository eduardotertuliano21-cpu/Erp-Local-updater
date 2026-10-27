import React, { useState, useEffect } from 'react';

export const HeroSection = () => {
  const [latency, setLatency] = useState('0.03s');

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(`${(0.02 + Math.random() * 0.03).toFixed(2)}s`);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-36 pb-20 md:pt-44 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
      {/* Badge de status offline */}
      <div className="pulse-badge mb-6 mx-auto">
        <span className="pulse-dot"></span>
        Tecnologia Local-First: Funciona Mesmo Sem Internet
      </div>

      {/* Headline de Alta Conversão */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1] mb-6">
        O Sistema de Caixa que <span class="gradient-accent">Nunca Para.</span><br />
        Nem Quando a Internet Cai.
      </h1>

      {/* Subheadline persuasiva */}
      <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        Um PDV ultra rápido e fácil de usar. Pare de perder vendas com sistemas lentos que travam no meio da fila e gerencie sua loja com a tecnologia da nova era.
      </p>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto mb-6">
        <a
          href="https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe"
          className="w-full sm:w-auto px-7 py-4 rounded-2xl font-black text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-xl shadow-cyan-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base group"
          download
        >
          <svg className="w-6 h-6 text-black group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <div className="text-left leading-tight">
            <span className="font-extrabold text-base">Baixar ClickStorm Grátis</span>
            <span className="block text-[11px] font-semibold text-slate-900 opacity-90">Windows 10 / 11 • Versão 1.0.0 (107 MB)</span>
          </div>
        </a>
        <a
          href="https://wa.me/5511996773805?text=Ol%C3%A1!%20Quero%20conhecer%20o%20ClickStorm%20Systems%20para%20minha%20loja."
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full sm:w-auto !py-4 text-sm flex items-center justify-center gap-2"
        >
          <span>Falar no WhatsApp</span>
        </a>
      </div>

      {/* Destaque Informativo: Cadastro Descomplicado Direto no Sistema */}
      <div className="max-w-2xl mx-auto mb-12 p-3.5 sm:p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md flex items-center gap-3.5 text-xs sm:text-sm text-cyan-200 text-left shadow-lg shadow-cyan-950/40">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-lg font-black">
          ⚡
        </div>
        <p className="leading-snug">
          <strong className="text-white font-bold">Sem formulários chatos no site:</strong> o cadastro é feito 100% dentro do sistema! É muito fácil e rápido configurar tudo na nossa <strong>tela de configurações iniciais</strong> em menos de 2 minutos.
        </p>
      </div>

      {/* Card Visual de Prova de Performance */}
      <div className="max-w-4xl mx-auto glass-panel p-5 sm:p-6 text-left border-cyan-500/20 bg-slate-900/60 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-sm text-white">Status da Operação Local:</span>
            <span className="tag-offline">BLINDADO OFFLINE</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Processamento: <strong className="text-cyan-400 font-bold">{latency}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Instalador Leve: <strong className="text-white">107 MB</strong></span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-2.5 rounded-xl bg-white/[0.02]">
            <div className="text-xl sm:text-2xl font-black text-cyan-400">0 ms</div>
            <div className="text-xs text-slate-400 mt-1">Tempo de Espera</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02]">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 mt-1">Operação Contínua</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02]">
            <div className="text-xl sm:text-2xl font-black text-purple-400">4 GB</div>
            <div className="text-xs text-slate-400 mt-1">Roda em PC Antigo</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02]">
            <div className="text-xl sm:text-2xl font-black text-sky-400">1 Clique</div>
            <div className="text-xs text-slate-400 mt-1">Cupom Fiscal NFC-e</div>
          </div>
        </div>
      </div>
    </section>
  );
};
