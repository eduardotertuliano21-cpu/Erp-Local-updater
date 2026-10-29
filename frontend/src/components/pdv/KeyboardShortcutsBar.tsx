import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, Keyboard } from 'lucide-react';
import { updateApi, type UpdateInfo } from '../../services/updateApi.js';
import { UpdateModal } from '../common/UpdateModal.js';

interface ShortcutItem {
  key: string;
  label: string;
  action: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'default';
}

interface KeyboardShortcutsBarProps {
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsBar: React.FC<KeyboardShortcutsBarProps> = ({ shortcuts }) => {
  const [versaoApp, setVersaoApp] = useState<string>('1.0.8');
  const [checandoUpdate, setChecandoUpdate] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    updateApi.getAppVersion().then((v) => setVersaoApp(v)).catch(() => {});
    updateApi.checarAtualizacao().then((info) => {
      if (info && info.temAtualizacao) setUpdateAvailable(info);
    }).catch(() => {});
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);

    if (overflow) {
      const containerRect = el.getBoundingClientRect();
      const hidden: string[] = [];
      for (const sc of shortcuts) {
        const btn = itemRefs.current[sc.key];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.left < containerRect.left - rect.width * 0.25 || rect.right > containerRect.right + rect.width * 0.25) {
            hidden.push(sc.key);
          }
        }
      }
      setHiddenKeys(hidden);
    } else {
      setHiddenKeys([]);
    }
  }, [shortcuts]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => checkScroll());
    ro.observe(el);
    window.addEventListener('resize', checkScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(200, el.clientWidth * 0.5);
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  const handleChecarUpdate = async () => {
    setChecandoUpdate(true);
    try {
      const info = await updateApi.checarAtualizacao();
      setUpdateAvailable(info?.temAtualizacao ? info : null);
    } catch {
    } finally {
      setChecandoUpdate(false);
      setShowUpdateModal(true);
    }
  };

  const getShortcutStyles = (variant?: ShortcutItem['variant']) => {
    let badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600';
    let btnStyle = 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';

    if (variant === 'primary') {
      badgeStyle = 'bg-emerald-600 text-white border-emerald-600 font-black';
      btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-bold';
    } else if (variant === 'danger') {
      badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 group-hover:bg-rose-600 group-hover:text-white border-slate-300 dark:border-slate-600';
      btnStyle = 'group bg-slate-100 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-900 dark:text-slate-100 hover:text-rose-800 dark:hover:text-rose-300 border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800';
    } else if (variant === 'warning') {
      badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 group-hover:bg-amber-600 group-hover:text-white border-slate-300 dark:border-slate-600';
      btnStyle = 'group bg-slate-100 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-900 dark:text-slate-100 hover:text-amber-900 dark:hover:text-amber-200 border-slate-300 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800';
    }
    return { badgeStyle, btnStyle };
  };

  return (
    <>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 shrink-0 z-20 select-none shadow-sm transition-colors flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasOverflow && canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              className="shrink-0 p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Rolar atalhos para a esquerda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0 flex-1"
          >
            {shortcuts.map((sc) => {
              const { badgeStyle, btnStyle } = getShortcutStyles(sc.variant);
              return (
                <button
                  key={sc.key}
                  ref={(el) => {
                    itemRefs.current[sc.key] = el;
                  }}
                  onClick={sc.action}
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors focus:outline-none shrink-0 cursor-pointer ${btnStyle}`}
                >
                  <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-black rounded border shadow-xs transition-colors ${badgeStyle}`}>
                    {sc.key}
                  </kbd>
                  <span className="whitespace-nowrap font-bold text-slate-800 dark:text-slate-100">
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>

          {hasOverflow && canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              className="shrink-0 p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Rolar atalhos para a direita"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {hasOverflow && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  menuOpen
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Ver todos os atalhos de teclado"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mais</span>
                {hiddenKeys.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-blue-500/20 text-blue-600 dark:text-blue-300">
                    +{hiddenKeys.length}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                      <span>Todos os Atalhos do PDV</span>
                    </span>
                    {hiddenKeys.length > 0 && (
                      <span className="text-[10px] text-amber-500">{hiddenKeys.length} ocultos na barra</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                    {shortcuts.map((sc) => {
                      const { badgeStyle, btnStyle } = getShortcutStyles(sc.variant);
                      const isHidden = hiddenKeys.includes(sc.key);
                      return (
                        <button
                          key={sc.key}
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            sc.action();
                          }}
                          className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-black rounded border shrink-0 ${badgeStyle}`}>
                              {sc.key}
                            </kbd>
                            <span className="truncate font-bold">{sc.label}</span>
                          </div>
                          {isHidden && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Oculto na barra horizontal" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indicador de Versão e Checagem de Atualização */}
        <button
          onClick={handleChecarUpdate}
          disabled={checandoUpdate}
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors shrink-0 cursor-pointer font-medium ${
            updateAvailable
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-bold animate-pulse'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={updateAvailable ? `Nova versão ${updateAvailable.tag} pronta!` : `ClickStorm v${versaoApp} • Clique para checar atualizações`}
        >
          <RefreshCw className={`w-3 h-3 ${checandoUpdate ? 'animate-spin text-blue-500' : updateAvailable ? 'text-white' : 'text-emerald-500'}`} />
          <span className="font-mono text-[11px] font-bold">v{versaoApp}</span>
          <span className="hidden md:inline text-[10px] text-slate-500 dark:text-slate-400">
            {updateAvailable ? '• Atualizar' : '• Atualizado'}
          </span>
        </button>
      </footer>

      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
    </>
  );
};
