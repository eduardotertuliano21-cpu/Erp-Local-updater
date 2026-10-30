import React, { useState, useEffect } from 'react';

export const HeroSection = () => {
  const [latency, setLatency] = useState('0.03s');
  const [activeScreen, setActiveScreen] = useState('pdv');

  const screens = [
    {
      id: 'pdv',
      title: 'Frente de Caixa (PDV)',
      icon: '🛒',
      src: '/images/screen-pdv.png',
      badge: 'LATÊNCIA ZERO • OFFLINE',
      desc: 'Caixa moderno com cupom fiscal, atalhos rápidos e suporte a balança e código de barras.',
    },
    {
      id: 'dashboard',
      title: 'Painel & Relatórios',
      icon: '📊',
      src: '/images/screen-dashboard.png',
      badge: 'INDICADORES AO VIVO',
      desc: 'Faturamento em tempo real, tíquete médio, total de pedidos e visão gerencial diária.',
    },
    {
      id: 'produtos',
      title: 'Produtos & Estoque',
      icon: '📦',
      src: '/images/screen-produtos.png',
      badge: 'CATÁLOGO COMPLETO',
      desc: 'Gestão completa com código de barras, controle de estoque físico e precificação.',
    },
    {
      id: 'financeiro',
      title: 'Financeiro & DRE',
      icon: '💰',
      src: '/images/screen-financeiro.png',
      badge: 'FLUXO DE CAIXA',
      desc: 'Contas a pagar e receber, demonstrativo de resultados e fechamento contábil.',
    },
    {
      id: 'ajuda',
      title: 'Central de Ajuda',
      icon: '🛡️',
      src: '/images/screen-ajuda.png',
      badge: 'TUTORIAIS & GUIAS',
      desc: 'Manuais passo a passo organizados por ramo de atividade e pesquisa dinâmica.',
    },
  ];

  const current = screens.find((s) => s.id === activeScreen) || screens[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(`${(0.02 + Math.random() * 0.03).toFixed(2)}s`);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-36 pb-20 md:pt-44 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
      {/* Logo Oficial Central no Topo do Hero */}
      <div className="flex justify-center mb-6">
        <img
          src="/images/logo-clickstorm.png"
          alt="ClickStorm Systems Logo"
          className="h-20 sm:h-28 md:h-32 w-auto object-contain drop-shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:scale-105 transition-transform duration-500"
        />
      </div>

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

      {/* Imagem Conceitual de Alto Impacto do Negócio */}
      <div className="max-w-5xl mx-auto mb-14 relative group">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-amber-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-700"></div>
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl shadow-cyan-950/60">
          <img
            src="/images/hero-commercial.png"
            alt="ClickStorm Systems Terminal de Alta Performance"
            className="w-full h-auto object-cover max-h-[460px] transform group-hover:scale-[1.01] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-6 sm:p-8">
            <div className="text-left max-w-xl">
              <span className="inline-block py-1 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                ⚡ Velocidade & Potência Operacional
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white">
                Frente de Caixa Veloz como um Raio
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Projetado com arquitetura Local-First para que você nunca perca uma venda por instabilidade de rede ou lentidão.
              </p>
            </div>
          </div>
        </div>
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

      {/* Vitrine Visual com Telas Reais do Sistema */}
      <div className="max-w-6xl mx-auto mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Capturas Reais do Sistema em Operação
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
          Veja o ClickStorm por Dentro
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-8">
          Interface moderna, tema escuro profissional e ergonomia pensada para não cansar a vista de quem passa horas no caixa.
        </p>

        {/* Abas Interativas de Telas Reais */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {screens.map((s) => {
            const isSelected = s.id === activeScreen;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScreen(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Moldura de Janela de Aplicativo com a Tela Real */}
        <div className="relative rounded-2xl p-2 bg-gradient-to-b from-slate-700/50 via-slate-900/80 to-slate-950 border border-slate-700/60 shadow-2xl shadow-cyan-950/40">
          {/* Barra Superior da Janela */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 rounded-t-xl border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                ClickStorm ERP & PDV Local — {current.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                {current.badge}
              </span>
            </div>
          </div>

          {/* Imagem Real da Tela */}
          <div className="relative overflow-hidden rounded-b-xl bg-slate-950 aspect-[16/9] group">
            <img
              src={current.src}
              alt={`Tela Real do ClickStorm: ${current.title}`}
              className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-[1.01]"
              loading="lazy"
            />
            {/* Overlay sutil de informação ao passar o mouse */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between text-left">
              <div>
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>{current.icon}</span>
                  <span>{current.title}</span>
                </p>
                <p className="text-[11px] text-slate-300 max-w-lg mt-0.5">
                  {current.desc}
                </p>
              </div>
              <a
                href="https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition shadow-md"
                download
              >
                <span>Instalar Agora</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
