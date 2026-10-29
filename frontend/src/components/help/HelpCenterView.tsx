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
  BookMarked,
  Compass,
  Filter,
  Layers,
  Star,
} from 'lucide-react';
import {
  CATEGORIAS_AJUDA,
  RAMOS_AJUDA,
  type HelpCategoryId,
  type HelpNichoId,
  type HelpTutorial,
} from './helpTypes.js';
import {
  pesquisarTutoriaisInteligente,
  obterSugestoesPorRamo,
  TODOS_OS_TUTORIAIS,
} from './helpSearchEngine.js';
import { HelpTutorialDetailModal } from './HelpTutorialDetailModal.js';
import {
  HelpShortcutsGrid,
  HelpSatellitesGrid,
  HelpGlossaryGrid,
} from './HelpShortcutsAndSatellites.js';
import { useBusinessMode, type BusinessMode } from '../../context/BusinessModeContext.js';
import type { ErpTabType } from '../erp/ErpLayout.js';

interface HelpCenterViewProps {
  onSelectTab?: (tab: ErpTabType) => void;
  onVoltarPdv?: () => void;
  compactMode?: boolean;
}

type RamoLojaReal = Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS' | 'GERAL'>;

function mapearBusinessModeParaRamoAjuda(mode: BusinessMode): RamoLojaReal {
  switch (mode) {
    case 'restaurante':
      return 'RESTAURANTE';
    case 'acougue':
      return 'ACOUGUE';
    case 'roupas':
      return 'ROUPAS';
    case 'assistencia':
      return 'ASSISTENCIA';
    case 'autopecas':
      return 'AUTOPECAS';
    case 'mercado':
    default:
      return 'MERCADO';
  }
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  onSelectTab,
  onVoltarPdv,
  compactMode = false,
}) => {
  const { mode } = useBusinessMode();
  const ramoAtualLoja = useMemo(() => mapearBusinessModeParaRamoAjuda(mode), [mode]);
  const infoRamoLoja = useMemo(
    () => RAMOS_AJUDA.find((r) => r.id === ramoAtualLoja) || RAMOS_AJUDA[1],
    [ramoAtualLoja]
  );

  const [busca, setBusca] = useState('');
  const [filtroRamo, setFiltroRamo] = useState<HelpNichoId>('MEU_RAMO');
  const [apenasExclusivosRamo, setApenasExclusivosRamo] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<HelpCategoryId>('INICIO');
  const [abaPrincipal, setAbaPrincipal] = useState<
    'TUTORIAIS' | 'GLOSSARIO' | 'ATALHOS' | 'SATELITES'
  >('TUTORIAIS');
  const [tutorialSelecionado, setTutorialSelecionado] = useState<HelpTutorial | null>(null);

  useEffect(() => {
    const tutId = sessionStorage.getItem('cs_help_tutorial_id');
    if (tutId) {
      sessionStorage.removeItem('cs_help_tutorial_id');
      const found = TODOS_OS_TUTORIAIS.find((t) => t.id === tutId);
      if (found) setTutorialSelecionado(found);
    }
  }, []);

  // Quando o usuário clica diretamente em um ramo específico (ex: Restaurante, Açougue),
  // destacamos os recursos daquele ramo sem esconder os gerais a menos que ele peça.
  const ramoEfetivoParaCard = useMemo<RamoLojaReal>(() => {
    if (
      filtroRamo !== 'MEU_RAMO' &&
      filtroRamo !== 'TODOS_RAMOS' &&
      filtroRamo !== 'GERAL'
    ) {
      return filtroRamo;
    }
    return ramoAtualLoja;
  }, [filtroRamo, ramoAtualLoja]);

  const infoRamoDestaque = useMemo(
    () => RAMOS_AJUDA.find((r) => r.id === ramoEfetivoParaCard) || infoRamoLoja,
    [ramoEfetivoParaCard, infoRamoLoja]
  );

  // Sugestões de dúvidas rápidas adaptadas ao ramo selecionado (máximo 5 para não poluir)
  const sugestoesContextuais = useMemo(
    () => obterSugestoesPorRamo(ramoEfetivoParaCard).slice(0, compactMode ? 4 : 5),
    [ramoEfetivoParaCard, compactMode]
  );

  // Resultados principais respeitando categoria e filtro de ramo
  const resultados = useMemo(
    () =>
      pesquisarTutoriaisInteligente(
        busca,
        busca.trim() ? 'TODOS' : categoriaAtiva,
        filtroRamo,
        ramoAtualLoja,
        apenasExclusivosRamo
      ),
    [busca, categoriaAtiva, filtroRamo, ramoAtualLoja, apenasExclusivosRamo]
  );

  // Se o usuário pesquisou algo que pertence a outro ramo (ex: está em Mercado e digitou "desossa" ou "garçom"),
  // buscamos em TODOS_RAMOS para avisar de forma inteligente sem deixá-lo sem resposta.
  const resultadosEmOutrosRamos = useMemo(() => {
    if (!busca.trim() || filtroRamo === 'TODOS_RAMOS') return [];
    const todos = pesquisarTutoriaisInteligente(busca, 'TODOS', 'TODOS_RAMOS', ramoAtualLoja, false);
    const idsAtuais = new Set(resultados.map((r) => r.tutorial.id));
    return todos.filter((r) => !idsAtuais.has(r.tutorial.id)).slice(0, 4);
  }, [busca, filtroRamo, resultados, ramoAtualLoja]);

  // Tutoriais exclusivos do ramo em destaque (para a Visão Geral)
  const tutoriaisExclusivosDoRamo = useMemo(
    () => TODOS_OS_TUTORIAIS.filter((t) => t.ramo === ramoEfetivoParaCard),
    [ramoEfetivoParaCard]
  );

  // Os 4 tutoriais essenciais para quem está começando do zero
  const tutoriaisEssenciaisInicio = useMemo(
    () => TODOS_OS_TUTORIAIS.filter((t) => t.essencialIniciante).slice(0, 4),
    []
  );

  const handleNavigate = (destino: ErpTabType | 'PDV') => {
    if (destino === 'PDV') onVoltarPdv?.();
    else onSelectTab?.(destino);
  };

  const renderCardTutorial = (tutorial: HelpTutorial, perguntaCorrespondente?: string) => {
    const catInfo = CATEGORIAS_AJUDA.find((c) => c.id === tutorial.categoria);
    const rInfo = RAMOS_AJUDA.find((r) => r.id === tutorial.ramo);
    const isExclusivo = tutorial.ramo !== 'GERAL';

    return (
      <div
        key={tutorial.id}
        onClick={() => setTutorialSelecionado(tutorial)}
        className="group rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/60 p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-2xs hover:shadow-lg hover:shadow-sky-500/5 transition cursor-pointer"
      >
        <div className="space-y-2.5">
          {/* Badges superiores: Ramo + Categoria + Atalho */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {rInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    isExclusivo
                      ? rInfo.corBadge
                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                  }`}
                >
                  <span>{rInfo.emoji}</span>
                  <span>{isExclusivo ? `Exclusivo: ${rInfo.nomeCurto}` : 'Todos os Ramos'}</span>
                </span>
              )}
              {catInfo && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.corBadge}`}
                >
                  {catInfo.nome}
                </span>
              )}
            </div>

            {tutorial.atalho && (
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700 shrink-0">
                {tutorial.atalho}
              </kbd>
            )}
          </div>

          {/* Título e Resumo claro */}
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-sky-400 transition leading-snug">
            {tutorial.titulo}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {tutorial.resumo}
          </p>

          {/* Onde encontrar resumido */}
          {tutorial.ondeEncontrar && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{tutorial.ondeEncontrar}</span>
            </div>
          )}

          {/* Pergunta que deu match na busca */}
          {busca.trim() && (perguntaCorrespondente || tutorial.perguntasFrequentes[0]) && (
            <div className="pt-0.5 flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>"{perguntaCorrespondente || tutorial.perguntasFrequentes[0]}"</span>
            </div>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {tutorial.passos.length} passos simples
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-500 group-hover:translate-x-0.5 transition">
            <span>Ver Passo a Passo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  const mostrandoVisaoGeralGuiada =
    abaPrincipal === 'TUTORIAIS' &&
    categoriaAtiva === 'INICIO' &&
    !busca.trim() &&
    !apenasExclusivosRamo;

  return (
    <div className="space-y-5 pb-8">
      {/* 1. CABEÇALHO LIMPO COM PESQUISA INTELIGENTE */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1829] to-slate-900 border border-slate-800 p-4 sm:p-6 shadow-xl">
        <div className="max-w-4xl space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Central de Ajuda Descomplicada • Passo a Passo para Iniciantes</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
              <span>Seu ramo atual:</span>
              <strong className="text-white">
                {infoRamoLoja.emoji} {infoRamoLoja.nomeCurto}
              </strong>
            </div>
          </div>

          {!compactMode && (
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              O que você precisa fazer agora? Digite com suas próprias palavras
            </h1>
          )}

          {/* Barra de Pesquisa */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-sky-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                if (abaPrincipal !== 'TUTORIAIS') setAbaPrincipal('TUTORIAIS');
              }}
              placeholder="Ex: vender fiado, cadastrar fardo, balança toledo, mesa garçom, tirar senha, nota fiscal..."
              autoFocus
              className="w-full pl-12 pr-24 py-3.5 rounded-xl bg-slate-950/90 border border-sky-500/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25 text-sm text-white placeholder-slate-400 outline-none shadow-inner transition"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* 5 Sugestões Rápidas Contextualizadas com o Ramo Atual */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">
              Perguntas comuns ({infoRamoDestaque.nomeCurto}):
            </span>
            {sugestoesContextuais.map((duvida) => (
              <button
                key={duvida}
                type="button"
                onClick={() => {
                  setBusca(duvida);
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

      {/* 2. SELETOR DE RAMO DE ATUAÇÃO (SEPARA O QUE É EXCLUSIVO DE CADA NEGÓCIO) */}
      <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Filtrar Ajuda por Ramo de Atuação:</span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
              (Oculta funções de outros ramos para não confundir você)
            </span>
          </div>

          {filtroRamo !== 'MEU_RAMO' &&
            filtroRamo !== 'TODOS_RAMOS' &&
            filtroRamo !== 'GERAL' && (
              <label className="inline-flex items-center gap-2 text-xs font-bold text-sky-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={apenasExclusivosRamo}
                  onChange={(e) => setApenasExclusivosRamo(e.target.checked)}
                  className="rounded border-slate-600 text-sky-500 focus:ring-sky-500"
                />
                <span>Mostrar apenas funções exclusivas de {infoRamoDestaque.nomeCurto}</span>
              </label>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Botão: Meu Ramo Atual */}
          <button
            type="button"
            onClick={() => {
              setFiltroRamo('MEU_RAMO');
              setApenasExclusivosRamo(false);
              setAbaPrincipal('TUTORIAIS');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
              filtroRamo === 'MEU_RAMO'
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/20'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Meu Ramo ({infoRamoLoja.nomeCurto})</span>
          </button>

          {/* Botões de cada Ramo específico */}
          {RAMOS_AJUDA.filter((r) => r.id !== 'GERAL').map((ramo) => {
            const ativo = filtroRamo === ramo.id;
            return (
              <button
                key={ramo.id}
                type="button"
                onClick={() => {
                  setFiltroRamo(ramo.id);
                  setAbaPrincipal('TUTORIAIS');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  ativo
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/50 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{ramo.emoji}</span>
                <span>{ramo.nomeCurto}</span>
              </button>
            );
          })}

          {/* Botão: Todos os Ramos */}
          <button
            type="button"
            onClick={() => {
              setFiltroRamo('TODOS_RAMOS');
              setApenasExclusivosRamo(false);
              setAbaPrincipal('TUTORIAIS');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filtroRamo === 'TODOS_RAMOS'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/50'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🌐 Todos os Ramos</span>
          </button>
        </div>
      </div>

      {/* 3. CORPO ORGANIZADO: MENU LATERAL (OU ABAS NO COMPACT) + ÁREA DE CONTEÚDO */}
      <div
        className={`grid grid-cols-1 ${
          compactMode ? '' : 'lg:grid-cols-[250px_1fr]'
        } gap-5 items-start`}
      >
        {/* NAVEGAÇÃO DE MÓDULOS E FERRAMENTAS */}
        <aside className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-3 space-y-4">
          {/* Grupo 1: Tutoriais por Assunto */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Guias Passo a Passo
            </div>
            <div
              className={
                compactMode
                  ? 'flex flex-wrap gap-1.5'
                  : 'flex flex-row lg:flex-col flex-wrap gap-1'
              }
            >
              {CATEGORIAS_AJUDA.map((cat) => {
                const ativo =
                  abaPrincipal === 'TUTORIAIS' && !busca.trim() && categoriaAtiva === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setAbaPrincipal('TUTORIAIS');
                      setCategoriaAtiva(cat.id);
                      setBusca('');
                    }}
                    className={`w-auto lg:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between gap-2 ${
                      ativo
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate">{cat.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grupo 2: Consulta Rápida para Leigos */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Consulta Rápida
            </div>
            <div
              className={
                compactMode
                  ? 'flex flex-wrap gap-1.5'
                  : 'flex flex-row lg:flex-col flex-wrap gap-1'
              }
            >
              <button
                type="button"
                onClick={() => setAbaPrincipal('GLOSSARIO')}
                className={`w-auto lg:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  abaPrincipal === 'GLOSSARIO'
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5 shrink-0" />
                <span>Dicionário p/ Iniciantes</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaPrincipal('ATALHOS')}
                className={`w-auto lg:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  abaPrincipal === 'ATALHOS'
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 shrink-0" />
                <span>Teclas de Atalho (F1-F12)</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaPrincipal('SATELITES')}
                className={`w-auto lg:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  abaPrincipal === 'SATELITES'
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>Apps no Celular (Wi-Fi)</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ÁREA PRINCIPAL DE CONTEÚDO */}
        <div className="space-y-6 min-w-0">
          {abaPrincipal === 'GLOSSARIO' && <HelpGlossaryGrid />}
          {abaPrincipal === 'ATALHOS' && <HelpShortcutsGrid />}
          {abaPrincipal === 'SATELITES' && <HelpSatellitesGrid />}

          {abaPrincipal === 'TUTORIAIS' && (
            <>
              {/* MODO 1: VISÃO GERAL GUIADA (NÃO BOMBARDEIA O USUÁRIO COM 29 CARDS DE UMA VEZ) */}
              {mostrandoVisaoGeralGuiada ? (
                <div className="space-y-6">
                  {/* Bloco 1: O que é exclusivo do Ramo selecionado */}
                  <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-400">
                          <span>{infoRamoDestaque.emoji}</span>
                          <span>Guia Especial do Ramo: {infoRamoDestaque.nome}</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          Funções exclusivas pensadas para {infoRamoDestaque.nomeCurto}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {infoRamoDestaque.descricao}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {infoRamoDestaque.recursosExclusivos.map((rec) => (
                          <span
                            key={rec}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${infoRamoDestaque.corBadge}`}
                          >
                            ✓ {rec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {tutoriaisExclusivosDoRamo.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {tutoriaisExclusivosDoRamo.map((t) => renderCardTutorial(t))}
                      </div>
                    )}
                  </div>

                  {/* Bloco 2: Começando do Zero (Os 4 Guias Essenciais para Iniciantes) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Primeiros Passos (Para quem está começando hoje)</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Aprenda o básico de vendas e cadastro em menos de 5 minutos.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {tutoriaisEssenciaisInicio.map((t) => renderCardTutorial(t))}
                    </div>
                  </div>

                  {/* Bloco 3: Explorar por Assunto (Cards de Categoria Limpos) */}
                  <div className="space-y-3">
                    <div className="px-1">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" />
                        <span>Escolha um assunto para ver os tutoriais</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Clique em qualquer tema abaixo para abrir apenas os guias daquele módulo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {CATEGORIAS_AJUDA.filter((c) => c.id !== 'INICIO' && c.id !== 'TODOS').map(
                        (cat) => {
                          const qtd = pesquisarTutoriaisInteligente(
                            '',
                            cat.id,
                            filtroRamo,
                            ramoAtualLoja
                          ).length;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategoriaAtiva(cat.id)}
                              className="p-4 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 text-left space-y-2 transition cursor-pointer group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cat.corBadge}`}
                                >
                                  {cat.nome}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">
                                  {qtd} guia(s)
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {cat.descricao}
                              </p>
                              <div className="text-[11px] font-extrabold text-sky-500 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                                <span>Abrir guias deste tema</span>
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* MODO 2: LISTA DE RESULTADOS DE BUSCA OU CATEGORIA SELECIONADA */
                <div className="space-y-4">
                  {/* Barra de Status do Filtro Atual */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                      {busca.trim() ? (
                        <span>
                          Encontramos <strong className="text-sky-400">{resultados.length}</strong>{' '}
                          tutorial(is) para <strong>"{busca}"</strong>
                        </span>
                      ) : (
                        <span>
                          Exibindo{' '}
                          <strong className="text-sky-400">{resultados.length}</strong>{' '}
                          tutorial(is) em{' '}
                          <strong>
                            {CATEGORIAS_AJUDA.find((c) => c.id === categoriaAtiva)?.nome}
                          </strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBusca('');
                        setCategoriaAtiva('INICIO');
                        setApenasExclusivosRamo(false);
                      }}
                      className="text-xs font-extrabold text-sky-500 hover:text-sky-400 cursor-pointer"
                    >
                      ← Voltar ao Início Rápido
                    </button>
                  </div>

                  {resultados.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                      <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                      <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Nenhum tutorial encontrado para "{busca}" neste filtro de ramo
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Tente usar palavras simples (ex: "fiado", "estoque", "balança", "nota", "mesa", "senha") ou buscar em todos os ramos.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroRamo('TODOS_RAMOS');
                            setApenasExclusivosRamo(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold cursor-pointer"
                        >
                          🌐 Buscar em Todos os Ramos
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBusca('');
                            setCategoriaAtiva('INICIO');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Limpar Pesquisa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resultados.map(({ tutorial, perguntaCorrespondente }) =>
                        renderCardTutorial(tutorial, perguntaCorrespondente)
                      )}
                    </div>
                  )}

                  {/* Dica Inteligente: Resultados encontrados em OUTROS ramos de atuação */}
                  {resultadosEmOutrosRamos.length > 0 && (
                    <div className="rounded-2xl bg-amber-500/5 border border-amber-500/25 p-4 sm:p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-amber-500 dark:text-amber-400">
                          💡 Também encontramos {resultadosEmOutrosRamos.length} guia(s) sobre "{busca}" em outros ramos de atuação:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroRamo('TODOS_RAMOS');
                            setApenasExclusivosRamo(false);
                          }}
                          className="text-xs font-bold text-amber-400 underline cursor-pointer"
                        >
                          Mostrar todos os ramos
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {resultadosEmOutrosRamos.map(({ tutorial, perguntaCorrespondente }) =>
                          renderCardTutorial(tutorial, perguntaCorrespondente)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <HelpTutorialDetailModal
        tutorial={tutorialSelecionado}
        onClose={() => setTutorialSelecionado(null)}
        onNavigate={handleNavigate}
      />
    </div>
  );
};
