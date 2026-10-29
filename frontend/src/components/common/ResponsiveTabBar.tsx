import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Check } from 'lucide-react';

export interface ResponsiveTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface ResponsiveTabBarProps<T extends string = string> {
  tabs: ResponsiveTabItem<T>[];
  activeTab: T;
  onSelectTab: (id: T) => void;
  variant?: 'blue' | 'indigo' | 'sky';
  className?: string;
  rightElement?: React.ReactNode;
  allowWrapOnLarge?: boolean;
}

export function ResponsiveTabBar<T extends string = string>({
  tabs,
  activeTab,
  onSelectTab,
  variant = 'blue',
  className = '',
  rightElement,
}: ResponsiveTabBarProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [hiddenTabIds, setHiddenTabIds] = useState<T[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);

    if (overflow) {
      const containerRect = el.getBoundingClientRect();
      const hidden: T[] = [];
      for (const tab of tabs) {
        const btn = tabRefs.current[tab.id];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          // Considera oculto se mais de 25% do botão estiver fora da área visível
          const hiddenLeft = rect.left < containerRect.left - rect.width * 0.25;
          const hiddenRight = rect.right > containerRect.right + rect.width * 0.25;
          if (hiddenLeft || hiddenRight) {
            hidden.push(tab.id);
          }
        }
      }
      setHiddenTabIds(hidden);
    } else {
      setHiddenTabIds([]);
    }
  }, [tabs]);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => checkScroll());
    ro.observe(el);
    window.addEventListener('resize', checkScroll);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Sempre que a aba ativa mudar, garante que ela esteja visível na barra
  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    if (btn && scrollContainerRef.current) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      setTimeout(checkScroll, 250);
    }
  }, [activeTab, checkScroll]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = Math.max(220, el.clientWidth * 0.55);
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  const getActiveClasses = () => {
    if (variant === 'indigo') {
      return 'bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400/50';
    }
    if (variant === 'sky') {
      return 'bg-sky-500 text-white shadow-md shadow-sky-500/25';
    }
    return 'bg-blue-600 text-white shadow-md shadow-blue-600/25';
  };

  return (
    <div
      className={`relative flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-1.5 rounded-2xl gap-1 shadow-xs max-w-full min-w-0 ${className}`}
    >
      {/* Botão Rolar para Esquerda */}
      {hasOverflow && canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          className="shrink-0 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer z-10"
          title="Rolar abas para a esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Container Rolável de Abas */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex-1 flex items-center gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isSel
                  ? getActiveClasses()
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-white' : ''}`} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSel
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Botão Rolar para Direita */}
      {hasOverflow && canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          className="shrink-0 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer z-10"
          title="Rolar abas para a direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Menu Dropdown "Mais / Todas as Opções" quando houver itens ocultos por tamanho de tela */}
      {hasOverflow && (
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              dropdownOpen || hiddenTabIds.includes(activeTab)
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Ver todas as abas e opções ocultas"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Mais</span>
            {hiddenTabIds.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  dropdownOpen || hiddenTabIds.includes(activeTab)
                    ? 'bg-white/25 text-white'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}
              >
                +{hiddenTabIds.length}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Todas as Seções ({tabs.length})</span>
                {hiddenTabIds.length > 0 && (
                  <span className="text-blue-500 dark:text-blue-400">{hiddenTabIds.length} fora da visão</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isSel = activeTab === tab.id;
                  const isHidden = hiddenTabIds.includes(tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(tab.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {Icon && (
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSel ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          />
                        )}
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isHidden && !isSel && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Oculto
                          </span>
                        )}
                        {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {rightElement && <div className="shrink-0 pl-1 border-l border-slate-200 dark:border-slate-800">{rightElement}</div>}
    </div>
  );
}
