import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, X, BookOpen } from 'lucide-react';
import { api } from '../../services/api.js';
import type { ErpTabType } from './ErpLayout.js';
import type { Produto } from '../../types/pdv.js';
import { FUNCOES_SISTEMA, type FuncaoAtalho } from './spotlightConstants.js';
import { pesquisarTutoriaisInteligente } from '../help/helpSearchEngine.js';

interface ErpSpotlightSearchProps {
  onSelectTab: (tab: ErpTabType) => void;
  onVoltarPdv: () => void;
  isSidebarOpen?: boolean;
  onExpandSidebar?: () => void;
}

export const ErpSpotlightSearch: React.FC<ErpSpotlightSearchProps> = ({
  onSelectTab,
  onVoltarPdv,
  isSidebarOpen = true,
  onExpandSidebar,
}) => {
  const [termo, setTermo] = useState(''), [aberto, setAberto] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]), [clientes, setClientes] = useState<any[]>([]), [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null), containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!isSidebarOpen && onExpandSidebar) {
          onExpandSidebar();
          setTimeout(() => { inputRef.current?.focus(); setAberto(true); }, 80);
        } else {
          inputRef.current?.focus(); setAberto(true);
        }
      } else if (e.key === 'Escape' && aberto) {
        setAberto(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, isSidebarOpen, onExpandSidebar]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = termo.trim();
    if (q.length < 2) { setProdutos([]); setClientes([]); return; }
    const timer = setTimeout(async () => {
      setCarregando(true);
      try {
        const [resProd, resCli] = await Promise.all([api.pesquisarProdutos(q), api.listarEntidades('', q)]);
        setProdutos(resProd.success && Array.isArray(resProd.data) ? resProd.data.slice(0, 4) : []);
        setClientes(resCli.success && Array.isArray(resCli.data) ? resCli.data.slice(0, 4) : []);
      } catch {
        setProdutos([]); setClientes([]);
      } finally { setCarregando(false); }
    }, 180);
    return () => clearTimeout(timer);
  }, [termo]);

  const funcoesFiltradas = FUNCOES_SISTEMA.filter((f) => {
    if (!termo.trim()) return true;
    const t = termo.toLowerCase();
    return f.titulo.toLowerCase().includes(t) || f.subtitulo.toLowerCase().includes(t) || (f.atalho && f.atalho.toLowerCase().includes(t));
  }).slice(0, termo.trim() ? 5 : 6);

  const tutoriaisEncontrados = termo.trim().length >= 2 ? pesquisarTutoriaisInteligente(termo).slice(0, 3) : [];

  const executarAcaoFuncao = (item: FuncaoAtalho) => {
    if (item.id === 'PDV') onVoltarPdv();
    else onSelectTab(item.id);
    setAberto(false);
    setTermo('');
  };

  if (!isSidebarOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          onExpandSidebar?.();
          setTimeout(() => { inputRef.current?.focus(); setAberto(true); }, 80);
        }}
        title="Buscar funções, tutoriais, produtos ou clientes (Ctrl + K)"
        className="w-full flex items-center justify-center py-2.5 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition cursor-pointer"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0f172a] border transition-all duration-200 ${
          aberto ? 'border-sky-500/80 ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10' : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${aberto ? 'text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
        <input
          ref={inputRef}
          type="text"
          value={termo}
          onFocus={() => setAberto(true)}
          onChange={(e) => { setTermo(e.target.value); if (!aberto) setAberto(true); }}
          placeholder="Buscar ou tirar dúvida... (Ctrl+K)"
          className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-w-0"
        />
        {termo ? (
          <button type="button" onClick={() => { setTermo(''); inputRef.current?.focus(); }} className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded shadow-2xs shrink-0">
            Ctrl+K
          </kbd>
        )}
      </div>

      {aberto && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[75vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Seção 1: Funções & Navegação Rápida */}
          <div className="p-2">
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>{termo.trim() ? 'Funções Encontradas' : 'Acesso Rápido & Módulos'}</span>
              <span>Navegação</span>
            </div>
            {funcoesFiltradas.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">Nenhuma função correspondente.</div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {funcoesFiltradas.map((fn) => {
                  const Icon = fn.icon;
                  const isPdv = fn.id === 'PDV';
                  return (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => executarAcaoFuncao(fn)}
                      className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isPdv ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-400 transition truncate">{fn.titulo}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{fn.subtitulo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {fn.atalho && (
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {fn.atalho}
                          </kbd>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção 2: Tutoriais de Ajuda Inteligente */}
          {tutoriaisEncontrados.length > 0 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center justify-between">
                <span>Tutoriais Passo a Passo (Como Usar)</span>
                <span>Ajuda</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {tutoriaisEncontrados.map(({ tutorial }) => (
                  <button
                    key={tutorial.id}
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('cs_help_tutorial_id', tutorial.id);
                      onSelectTab('AJUDA');
                      setAberto(false);
                      setTermo('');
                    }}
                    className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-400 transition truncate">{tutorial.titulo}</div>
                        <div className="text-[10px] text-slate-400 truncate">{tutorial.resumo}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seção 3: Produtos Encontrados */}
          {termo.trim().length >= 2 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                <span>Produtos no Catálogo</span>
                {carregando && <span className="text-[10px] text-slate-400 animate-pulse">Buscando...</span>}
              </div>
              {produtos.length === 0 && !carregando ? (
                <div className="px-3 py-2 text-xs text-slate-500">Nenhum produto encontrado para "{termo}".</div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {produtos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelectTab('PRODUTOS'); setAberto(false); }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.descricao}</div>
                        <div className="text-[10px] text-slate-400 font-mono">EAN: {p.codigo_barras} • Estoque: {p.estoque_atual} {p.unidade_medida}</div>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono shrink-0">R$ {Number(p.preco_venda || 0).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seção 4: Clientes / Equipe Encontrados */}
          {termo.trim().length >= 2 && (
            <div className="p-2">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Clientes & Entidades</div>
              {clientes.length === 0 && !carregando ? (
                <div className="px-3 py-2 text-xs text-slate-500">Nenhum cliente encontrado para "{termo}".</div>
              ) : (
                <div className="space-y-0.5 mt-1">
                  {clientes.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onSelectTab('ENTIDADES'); setAberto(false); }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{c.nome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.documento || 'Sem doc'} {c.telefone ? `• ${c.telefone}` : ''}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">{c.tipo || 'CLIENTE'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
