import React, { useState } from 'react';

const FAQS = [
  {
    q: 'E se a internet cair durante o horário de pico da loja?',
    a: 'Nada muda. O ClickStorm foi desenvolvido com tecnologia de execução local. Todas as vendas continuam passando instantaneamente no balcão e são gravadas em segurança no seu computador.'
  },
  {
    q: 'Meu computador é antigo (Core i3/i5 com 4GB). Vai travar?',
    a: 'Não trava. O instalador tem apenas 107MB e consome pouquíssima memória. Ele foi projetado especialmente para funcionar com fluidez máxima em computadores comuns de comércio.'
  },
  {
    q: 'Como funciona a emissão de cupons fiscais (NFC-e)?',
    a: 'Totalmente integrada. Você emite cupons fiscais em 1 clique ou configura para emissão automática após a confirmação do pagamento.'
  },
  {
    q: 'Preciso pagar mensalidades abusivas ou taxas por caixa extra?',
    a: 'Não. Temos planos transparentes, sem pegadinhas ou surpresas no fim do mês. Suporte ágil e atualizações contínuas inclusas.'
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-20 bg-slate-950/90 border-t border-slate-900 px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="max-w-4xl xl:max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-cyan-400 font-semibold text-xs xl:text-sm tracking-wider uppercase">Dúvidas Frequentes</span>
          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white mt-2">
            Perguntas comuns antes de acelerar
          </h2>
        </div>

        <div className="space-y-4 xl:space-y-5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl xl:rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 xl:p-7 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="font-semibold text-slate-100 text-base sm:text-lg xl:text-xl">
                    {faq.q}
                  </span>
                  <span className={`w-8 h-8 xl:w-9 xl:h-9 rounded-full border border-slate-700 flex items-center justify-center shrink-0 text-cyan-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-cyan-950/40' : ''}`}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 xl:px-7 xl:pb-7 text-slate-300 text-sm sm:text-base xl:text-lg leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
