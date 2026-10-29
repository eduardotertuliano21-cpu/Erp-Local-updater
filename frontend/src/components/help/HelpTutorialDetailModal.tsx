import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Keyboard,
  Sparkles,
  BookOpen,
  Compass,
  Wrench,
  MessageCircleQuestion,
} from 'lucide-react';
import type { HelpTutorial } from './helpTypes.js';
import { CATEGORIAS_AJUDA, RAMOS_AJUDA } from './helpTypes.js';
import type { ErpTabType } from '../erp/ErpLayout.js';

interface HelpTutorialDetailModalProps {
  tutorial: HelpTutorial | null;
  onClose: () => void;
  onNavigate?: (destino: ErpTabType | 'PDV') => void;
}

export const HelpTutorialDetailModal: React.FC<HelpTutorialDetailModalProps> = ({
  tutorial,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    if (!tutorial) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tutorial, onClose]);

  if (!tutorial) return null;

  const catInfo = CATEGORIAS_AJUDA.find((c) => c.id === tutorial.categoria);
  const ramoInfo = RAMOS_AJUDA.find((r) => r.id === tutorial.ramo);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Tutorial */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-900/60 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {ramoInfo && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${ramoInfo.corBadge}`}
                >
                  <span>{ramoInfo.emoji}</span>
                  <span>
                    {tutorial.ramo === 'GERAL'
                      ? 'Serve para Todos os Ramos'
                      : `Exclusivo: ${ramoInfo.nome}`}
                  </span>
                </span>
              )}
              {catInfo && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${catInfo.corBadge}`}>
                  {catInfo.nome}
                </span>
              )}
              {tutorial.atalho && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-sky-300 border border-slate-300 dark:border-slate-700">
                  <Keyboard className="w-3 h-3" />
                  Atalho: {tutorial.atalho}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {tutorial.titulo}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {tutorial.resumo}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
            title="Fechar tutorial (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Rolável com Explicação Leiga, Caminho e Passo a Passo */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Onde encontrar no sistema (Caminho Visual) */}
          {tutorial.ondeEncontrar && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Onde clicar no sistema:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-sky-300">
                    {tutorial.ondeEncontrar}
                  </span>
                </div>
              </div>

              {tutorial.abaDestino && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    const dest = tutorial.abaDestino!;
                    onClose();
                    onNavigate(dest);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 border border-sky-500/30 transition cursor-pointer shrink-0"
                >
                  <span>Abrir tela agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Explicação em Palavras Simples para Iniciantes */}
          {tutorial.explicacaoLeigo && (
            <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/25 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <MessageCircleQuestion className="w-4 h-4 shrink-0" />
                <span>Em palavras simples (Para quem está começando)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {tutorial.explicacaoLeigo}
              </p>
            </div>
          )}

          {/* Passo a Passo Numerado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <BookOpen className="w-4 h-4 text-sky-500" />
              <span>Passo a Passo Completo ({tutorial.passos.length} etapas fáceis)</span>
            </div>

            <div className="space-y-3">
              {tutorial.passos.map((passo, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/90 flex gap-3.5 items-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    {index + 1}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {passo.titulo.replace(/^\d+\.\s*/, '')}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {passo.descricao}
                    </p>
                    {passo.destaque && (
                      <div className="mt-2 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2 font-semibold">
                        <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <span>{passo.destaque}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Problemas Comuns & Como Resolver (Troubleshooting para leigos) */}
          {tutorial.problemasComuns && tutorial.problemasComuns.length > 0 && (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <Wrench className="w-4 h-4 shrink-0" />
                <span>Deu alguma dúvida ou erro? Veja como resolver na hora:</span>
              </div>
              <div className="space-y-2.5">
                {tutorial.problemasComuns.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/90 border border-rose-500/15 space-y-1"
                  >
                    <div className="text-xs font-extrabold text-slate-900 dark:text-rose-300">
                      ❓ {item.problema}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      ✅ <strong>Solução:</strong> {item.solucao}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dicas de Especialista */}
          {tutorial.dicas.length > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Dicas Práticas para o Dia a Dia</span>
              </div>
              {tutorial.dicas.map((dica, i) => (
                <p key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{dica}</span>
                </p>
              ))}
            </div>
          )}

          {/* Perguntas que este guia responde */}
          {tutorial.perguntasFrequentes.length > 0 && (
            <div className="rounded-xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Perguntas frequentes respondidas neste guia:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tutorial.perguntasFrequentes.map((perg, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400"
                  >
                    "{perg}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Botão de Ação Direta */}
        <div className="p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            [ESC] Voltar para a Central de Ajuda
          </button>

          {tutorial.abaDestino && onNavigate && (
            <button
              type="button"
              onClick={() => {
                const dest = tutorial.abaDestino!;
                onClose();
                onNavigate(dest);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              <span>{tutorial.labelBotaoDestino || 'Ir para esta Função Agora'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
