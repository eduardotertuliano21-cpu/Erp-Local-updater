import React from 'react';

export const DoresSection = () => {
  const dores = [
    {
      icone: '⚠️',
      borda: 'border-rose-500/25 hover:border-rose-500/50',
      titulo: 'Internet caiu e a loja parou?',
      descricao:
        'O cliente está com a sacola cheia, o Wi-Fi oscila, a tela começa a girar a bolinha de carregamento e você simplesmente não consegue cobrar. Pânico e constrangimento no caixa.',
    },
    {
      icone: '⏳',
      borda: 'border-amber-500/25 hover:border-amber-500/50',
      titulo: 'Cansado de filas no balcão?',
      descricao:
        'Cada item bipado leva 3 segundos para aparecer na tela. O cliente perde a paciência, o funcionário fica estressado e pessoas na fila desistem e vão embora sem comprar.',
    },
    {
      icone: '🖥️',
      borda: 'border-indigo-500/25 hover:border-indigo-500/50',
      titulo: 'Sistema antigo e travado?',
      descricao:
        'Programas jurássicos com visual de Windows 98, telas poluídas e menus confusos que exigem 3 semanas para treinar um novo operador de caixa. Você não tem tempo a perder.',
    },
  ];

  return (
    <section id="dores" className="py-20 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1600px] w-full mx-auto">
      <div className="text-center max-w-3xl xl:max-w-5xl mx-auto mb-14">
        <span className="text-cyan-400 font-bold text-xs xl:text-sm uppercase tracking-wider">
          Identificação Imediata
        </span>
        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white mt-2 mb-4">
          Você se identifica com algum desses pesadelos?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base xl:text-lg">
          A maioria dos sistemas foi construída nos anos 90 ou depende 100% de uma conexão com a internet que sempre falha no horário de pico.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 xl:gap-8">
        {dores.map((dor, index) => (
          <div key={index} className={`glass-panel p-7 xl:p-10 rounded-2xl ${dor.borda} transition duration-300 flex flex-col justify-start`}>
            <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5 xl:mb-6 text-2xl xl:text-3xl font-bold">
              {dor.icone}
            </div>
            <h3 className="text-xl xl:text-2xl font-bold text-white mb-3">{dor.titulo}</h3>
            <p className="text-slate-300 text-sm xl:text-base leading-relaxed">{dor.descricao}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
