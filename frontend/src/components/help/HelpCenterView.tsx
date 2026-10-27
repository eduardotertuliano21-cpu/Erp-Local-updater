import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Keyboard,
  Smartphone,
  Sparkles,
  ArrowRight,
  HelpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CATEGORIAS_AJUDA, type HelpCategoryId, type HelpTutorial } from './helpTypes.js';
import {
  pesquisarTutoriaisInteligente,
  SUGESTOES_DUVIDAS_RAPIDAS,
  TODOS_OS_TUTORIAIS,
} from './helpSearchEngine.js';
import { HelpTutorialDetailModal } from './HelpTutorialDetailModal.js';
import { HelpShortcutsGrid, HelpSatellitesGrid } from './HelpShortcutsAndSatellites.js';
import type { ErpTabType } from '../erp/ErpLayout.js';

interface HelpCenterViewProps {
  onSelectTab?: (tab: ErpTabType) => void;
  onVoltarPdv?: () => void;
  compactMode?: boolean;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  onSelectTab,
  onVoltarPdv,
  compactMode = false,
}) => {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<HelpCategoryId>('TODOS');
  const [abaPrincipal, setAbaPrincipal] = useState<'TUTORIAIS' | 'ATALHOS' | 'SATELITES'>('TUTORIAIS');
  const [tutorialSelecionado, setTutorialSelecionado] = useState<HelpTutorial | null>(null);

  useEffect(() => {
    const tutId = sessionStorage.getItem('cs_help_tutorial_id');
    if (tutId) {
      sessionStorage.removeItem('cs_help_tutorial_id');
      const found = TODOS_OS_TUTORIAIS.find((t) => t.id === tutId);
      if (found) setTutorialSelecionado(found);
    }
  }, []);

  const resultados = useMemo(
    () => pesquisarTutoriaisInteligente(busca, categoriaAtiva),
    [busca, categoriaAtiva]
  );

  const handleNavigate = (destino: ErpTabType | 'PDV') => {
    if (destino === 'PDV') onVoltarPdv?.();
    else onSelectTab?.(destino);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Banner Hero com Pesquisa Inteligente */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1829] to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Central de Ajuda & Tutoriais Inteligente • 100% Offline</span>
          </div>
          {!compactMode && (
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Qual é a sua dúvida hoje? Encontre o passo a passo de qualquer função
            </h1>
          )}
          <p className="text-xs sm:text-sm text-slate-300">
            Pesquise com suas próprias palavras (ex: <span className="text-sky-300 font-semibold">"vender fiado"</span>,{' '}
            <span className="text-sky-300 font-semibold">"importar xml"</span>,{' '}
            <span className="text-sky-300 font-semibold">"balança toledo"</span>,{' '}
            <span className="text-sky-300 font-semibold">"tirar senha"</span>,{' '}
            <span className="text-sky-300 font-semibold">"garçom no celular"</span>).
          </p>

          <div className="relative flex items-center mt-2">
            <Search className="w-5 h-5 text-sky-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                if (abaPrincipal !== 'TUTORIAIS') setAbaPrincipal('TUTORIAIS');
              }}
              placeholder="Digite sua dúvida, nome da função ou tecla de atalho (ex: F5, sangria, certificado A1, desossa)..."
              autoFocus
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-950/90 border border-sky-500/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 text-sm text-white placeholder-slate-400 outline-none shadow-inner transition"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Dúvidas rápidas:</span>
            {SUGESTOES_DUVIDAS_RAPIDAS.slice(0, compactMode ? 6 : 10).map((duvida) => (
              <button
                key={duvida}
                type="button"
                onClick={() => {
                  setBusca(duvida);
                  setCategoriaAtiva('TODOS');
                  setAbaPrincipal('TUTORIAIS');
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/90 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/80 hover:border-sky-500/40 transition cursor-pointer"
              >
                {duvida}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Seletor de Abas Principais */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaPrincipal('TUTORIAIS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              abaPrincipal === 'TUTORIAIS'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tutoriais Passo a Passo ({resultados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal('ATALHOS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              abaPrincipal === 'ATALHOS'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Mapa Completo de Atalhos</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal('SATELITES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              abaPrincipal === 'SATELITES'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Apps no Celular & Cozinha (LAN)</span>
          </button>
        </div>

        {busca && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Exibindo <strong className="text-sky-400">{resultados.length}</strong> resultado(s) para "{busca}"
          </div>
        )}
      </div>

      {abaPrincipal === 'TUTORIAIS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIAS_AJUDA.map((cat) => {
              const active = categoriaAtiva === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-xs'
                      : 'bg-white dark:bg-[#0b1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat.nome}
                </button>
              );
            })}
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhum tutorial encontrado para "{busca}" nesta categoria
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tente pesquisar por palavras mais simples (ex: "caixa", "estoque", "balança", "nota", "mesa", "senha") ou limpar o filtro.
              </p>
              <button
                type="button"
                onClick={() => { setBusca(''); setCategoriaAtiva('TODOS'); }}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Mostrar Todos os Tutoriais
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultados.map(({ tutorial, perguntaCorrespondente }) => {
                const catInfo = CATEGORIAS_AJUDA.find((c) => c.id === tutorial.categoria);
                return (
                  <div
                    key={tutorial.id}
                    onClick={() => setTutorialSelecionado(tutorial)}
                    className="group rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/50 p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-lg hover:shadow-sky-500/5 transition cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {catInfo && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${catInfo.corBadge}`}>
                            {catInfo.nome}
                          </span>
                        )}
                        {tutorial.atalho && (
                          <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700">
                            {tutorial.atalho}
                          </kbd>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-400 transition leading-snug">
                        {tutorial.titulo}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tutorial.resumo}
                      </p>

                      {(perguntaCorrespondente || tutorial.perguntasFrequentes[0]) && (
                        <div className="pt-1 flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>"{perguntaCorrespondente || tutorial.perguntasFrequentes[0]}"</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        {tutorial.passos.length} passos detalhados
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-500 group-hover:translate-x-0.5 transition">
                        <span>Abrir Tutorial Passo a Passo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {abaPrincipal === 'ATALHOS' && <HelpShortcutsGrid />}
      {abaPrincipal === 'SATELITES' && <HelpSatellitesGrid />}

      <HelpTutorialDetailModal
        tutorial={tutorialSelecionado}
        onClose={() => setTutorialSelecionado(null)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};
