import React, { useState } from 'react';

export const NichosSection = () => {
  const [nichoAtivo, setNichoAtivo] = useState('mercados');

  const nichos = {
    mercados: {
      titulo: 'Mercados, Padarias & Mercearias',
      badge: 'Checkout Ultra Rápido',
      descricao:
        'Acabe com as filas no caixa. Leitura instantânea de códigos de barras, integração nativa com balanças de checkout e emissão de cupom fiscal em milissegundos.',
      itens: [
        'Leitura instantânea de balança (Toledo, Filizola, Elgin) sem delay',
        'Cadastro com múltiplos códigos de barras por produto',
        'Controle rigoroso de fiado e limite de crédito por cliente',
        'Curva ABC e estoque inteligente que avisa antes de faltar',
      ],
      mock: '🛒 Venda de 15 itens bipada em 4 segundos',
      icone: '🛒',
    },
    restaurantes: {
      titulo: 'Restaurantes, Bares & Lanchonetes',
      badge: 'Comanda Móvel & Monitor Cozinha KDS',
      descricao:
        'O garçom anota o pedido no smartphone na mesa e ele cai instantaneamente na tela da cozinha (KDS), tudo conectado pelo Wi-Fi local sem usar internet.',
      itens: [
        'Mapa visual e interativo de mesas com fechamento automático',
        'Divisão de conta por pessoa com 1 clique no balcão',
        'Monitor de Cozinha (KDS) em tempo real por praça',
        'Sem taxa por garçom ou limite de aparelhos conectados',
      ],
      mock: '🍽️ Pedido da Mesa 04 enviado para a cozinha',
      icone: '🍽️',
    },
    assistencias: {
      titulo: 'Oficinas & Assistências Técnicas',
      badge: 'Ordem de Serviço no WhatsApp',
      descricao:
        'Receba o aparelho ou veículo, registre laudos detalhados, imprima etiquetas e envie o orçamento aprovado com aviso de retirada direto no WhatsApp do cliente.',
      itens: [
        'Controle completo de status (Entrada, Laudo, Pronto, Entregue)',
        'Checklist de entrada com peças, fotos e defeito reclamado',
        'Histórico detalhado por cliente, placa ou número de série',
        'Cobrança mista: Mão de obra + Peças aplicadas',
      ],
      mock: '📱 Ordem de Serviço #1042 enviada ao cliente',
      icone: '🔧',
    },
  };

  const dados = nichos[nichoAtivo];

  return (
    <section id="nichos" className="py-20 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1600px] w-full mx-auto">
      <div className="text-center max-w-3xl xl:max-w-5xl mx-auto mb-10">
        <span className="text-cyan-400 font-bold text-xs xl:text-sm uppercase tracking-wider">
          Feito Sob Medida
        </span>
        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white mt-2 mb-4">
          Especializado no Seu Ramo de Negócio
        </h2>
        <p className="text-slate-400 text-sm sm:text-base xl:text-lg">
          Cada comércio possui dores e rotinas únicas. O ClickStorm se molda com perfeição à operação do seu balcão.
        </p>
      </div>

      {/* Tabs Interativas */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => setNichoAtivo('mercados')}
          className={`niche-tab flex items-center gap-2 text-sm xl:text-base px-5 py-3 ${nichoAtivo === 'mercados' ? 'active' : ''}`}
        >
          <span className="text-lg">🛒</span>
          <span>Mercados & Padarias</span>
        </button>
        <button
          type="button"
          onClick={() => setNichoAtivo('restaurantes')}
          className={`niche-tab flex items-center gap-2 text-sm xl:text-base px-5 py-3 ${nichoAtivo === 'restaurantes' ? 'active' : ''}`}
        >
          <span className="text-lg">🍽️</span>
          <span>Restaurantes & Lanchonetes</span>
        </button>
        <button
          type="button"
          onClick={() => setNichoAtivo('assistencias')}
          className={`niche-tab flex items-center gap-2 text-sm xl:text-base px-5 py-3 ${nichoAtivo === 'assistencias' ? 'active' : ''}`}
        >
          <span className="text-lg">🔧</span>
          <span>Oficinas & Assistências</span>
        </button>
      </div>

      {/* Card Dinâmico do Nicho */}
      <div className="glass-panel p-8 sm:p-10 xl:p-14 border-cyan-500/20 max-w-5xl xl:max-w-6xl mx-auto rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row gap-8 xl:gap-12 items-start justify-between">
          <div className="flex-1 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {dados.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white">{dados.titulo}</h3>
            <p className="text-slate-300 text-sm sm:text-base xl:text-lg leading-relaxed">{dados.descricao}</p>
            <ul className="space-y-3 pt-2">
              {dados.itens.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300 text-sm xl:text-base">
                  <span className="feature-check text-cyan-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full md:w-80 xl:w-96 bg-slate-950 p-6 xl:p-8 rounded-2xl border border-white/10 text-center flex flex-col justify-between self-stretch shrink-0">
            <div className="text-cyan-400 font-mono text-xs xl:text-sm uppercase tracking-wider mb-4">Demonstração ao Vivo</div>
            <div className="text-sm xl:text-base font-semibold text-white my-auto p-5 bg-white/5 rounded-xl border border-white/5 leading-snug">
              {dados.mock}
            </div>
            <a
              href={`https://wa.me/5511996773805?text=Ol%C3%A1!%20Tenho%20um%20neg%C3%B3cio%20em%20${encodeURIComponent(dados.titulo)}%20e%20quero%20conhecer%20o%20ClickStorm.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta w-full text-xs xl:text-sm py-3.5 mt-6"
            >
              Testar neste Nicho
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
