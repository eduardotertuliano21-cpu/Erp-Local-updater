import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, Users, WalletCards, Warehouse, Cpu, FileBarChart, Sliders, CreditCard,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Utensils, ShoppingBag, Scale,
  Wrench, Car, UtensilsCrossed, LayoutGrid, Shirt, Flame, BarChart3, Tag, ShieldAlert,
  ChefHat, Layers, Beef, Star, HelpCircle, X, FileCheck2,
} from 'lucide-react';
import type { ErpTabType } from './ErpLayout.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { ErpSpotlightSearch } from './ErpSpotlightSearch.js';

interface ErpSidebarProps {
  currentTab: ErpTabType;
  onSelectTab: (tab: ErpTabType) => void;
  onVoltarPdv: () => void;
  isOpen: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarNavItem {
  id: ErpTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

export const ErpSidebar: React.FC<ErpSidebarProps> = ({
  currentTab,
  onSelectTab,
  onVoltarPdv,
  isOpen,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { isRestaurante, isAssistencia, isVestuario, isAcougue, isAutoPecas } = useBusinessMode();
  const { config } = useStoreConfig();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const getProductItem = () => {
    if (isRestaurante) return { label: 'Cardápio & Pratos', icon: Utensils };
    if (isVestuario) return { label: 'Roupas & Grade', icon: Shirt };
    if (isAcougue) return { label: 'Cortes & Balança', icon: Scale };
    if (isAutoPecas) return { label: 'Peças & Veículos', icon: Car };
    if (isAssistencia) return { label: 'Peças & Acessórios', icon: ShoppingBag };
    return { label: 'Produtos', icon: Package };
  };

  const favoritosItems: SidebarNavItem[] = [
    { id: 'RELATORIOS', label: 'Painel & Relatórios', icon: FileBarChart, shortcut: 'F1' },
    ...(config?.modulo_nfe ? [{ id: 'NFE_DANFE' as ErpTabType, label: 'NF-e & DANFE (A4)', icon: FileCheck2, shortcut: 'F3' }] : []),
    { id: 'AJUDA', label: 'Ajuda & Tutoriais', icon: HelpCircle, shortcut: '?' },
  ];

  const operacaoDiariaItems: SidebarNavItem[] = [
    { id: 'PRODUTOS', ...getProductItem(), shortcut: 'F2' },
    { id: 'PROMOCOES', label: 'Promoções', icon: Flame },
    ...(isRestaurante ? [{ id: 'MESAS' as ErpTabType, label: 'Mesas & Comandas', icon: UtensilsCrossed }] : []),
    ...(isAssistencia ? [{ id: 'ORDENS_SERVICO' as ErpTabType, label: 'Ordens de Serviço', icon: Wrench }] : []),
    { id: 'ENTIDADES', label: isRestaurante ? 'Garçons & Equipe' : isAssistencia ? 'Técnicos & Clientes' : 'Equipe & Clientes', icon: Users },
    { id: 'FINANCEIRO', label: 'Financeiro', icon: WalletCards, shortcut: 'F4' },
    { id: 'ESTOQUE', label: 'Estoque & WMS', icon: Warehouse, shortcut: 'F5' },
    { id: 'COMPRAS_ENTRADA', label: 'Entradas NF (G.E.M.)', icon: Layers },
    ...(isAcougue ? [{ id: 'DESOSSA' as ErpTabType, label: 'Rendimento Desossa', icon: Beef }] : []),
    { id: 'CURVA_ABC', label: 'Curva ABC (BI)', icon: BarChart3 },
  ];

  const gestaoAvancadaItems: SidebarNavItem[] = [
    { id: 'AUDITORIA', label: 'Trilha Auditoria', icon: ShieldAlert },
    { id: 'PCP', label: isRestaurante ? 'Ficha Técnica' : 'Produção PCP', icon: Cpu },
    { id: 'ETIQUETAS', label: 'Etiquetas Térmicas', icon: Tag },
    ...(isRestaurante ? [{ id: 'KDS' as ErpTabType, label: 'Monitor KDS', icon: ChefHat }] : []),
    { id: 'CONFIGURACOES', label: 'Configurações', icon: Sliders },
    { id: 'ASSINATURA', label: 'Assinatura', icon: CreditCard },
  ];

  const isAdvancedActive = gestaoAvancadaItems.some((item) => item.id === currentTab);
  const [gestaoAberta, setGestaoAberta] = useState<boolean>(() => localStorage.getItem('clickstorm_gestao_aberta') !== 'false');

  useEffect(() => {
    if (isAdvancedActive) setGestaoAberta(true);
  }, [isAdvancedActive]);

  const toggleGestaoAberta = () => {
    setGestaoAberta((prev) => {
      const next = !prev;
      localStorage.setItem('clickstorm_gestao_aberta', String(next));
      return next;
    });
  };

  const checkNavScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 6);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 6);
  }, []);

  useEffect(() => {
    checkNavScroll();
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => checkNavScroll());
    ro.observe(el);
    window.addEventListener('resize', checkNavScroll);
    return () => { ro.disconnect(); window.removeEventListener('resize', checkNavScroll); };
  }, [checkNavScroll, gestaoAberta, isOpen, mobileOpen]);

  const scrollNav = (dir: 'up' | 'down') => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ top: dir === 'up' ? -180 : 180, behavior: 'smooth' });
    setTimeout(checkNavScroll, 250);
  };

  const isTabActive = (tabId: ErpTabType) => (tabId === 'RELATORIOS' && (currentTab === 'RELATORIOS' || currentTab === 'DASHBOARD')) || currentTab === tabId;

  const handleItemClick = (id: ErpTabType) => {
    onSelectTab(id);
    if (mobileOpen && onCloseMobile) onCloseMobile();
  };

  const expanded = isOpen || mobileOpen;

  const renderNavButton = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const active = isTabActive(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleItemClick(item.id)}
        title={!expanded ? `${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}` : undefined}
        className={`relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
          active
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
        } ${!expanded ? 'justify-center px-0' : ''}`}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${!expanded ? 'justify-center' : ''}`}>
          <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-sky-400'}`} />
          {expanded && <span className="truncate">{item.label}</span>}
        </div>
        {expanded && item.shortcut && (
          <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border shrink-0 transition-colors ${active ? 'bg-black/25 text-sky-100 border-white/20' : 'bg-slate-100 dark:bg-slate-950/90 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 group-hover:text-sky-400 group-hover:border-sky-500/30'}`}>
            [{item.shortcut}]
          </kbd>
        )}
      </button>
    );
  };

  return (
    <>
      {mobileOpen && <div onClick={onCloseMobile} className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200" />}

      <aside className={`h-screen bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800/90 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none z-50 ${mobileOpen ? 'fixed inset-y-0 left-0 w-68 shadow-2xl flex' : `hidden md:flex ${isOpen ? 'w-64' : 'w-20'}`}`}>
        <div className="flex flex-col min-h-0 flex-1">
          <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/90 shrink-0">
            {expanded ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-sky-500/20 shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase block truncate">MENU ERP</span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Enterprise</span>
                </div>
              </div>
            ) : (
              <button type="button" onClick={onToggle} className="w-full flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer group" title="Expandir Menu Lateral">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            )}

            {mobileOpen ? (
              <button onClick={onCloseMobile} type="button" className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer md:hidden" title="Fechar Menu">
                <X className="w-4 h-4" />
              </button>
            ) : (
              expanded && (
                <button onClick={onToggle} type="button" className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="Recolher Menu Lateral">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          <div className="px-3 pt-3 pb-1 shrink-0 z-50">
            <ErpSpotlightSearch
              onSelectTab={(tab) => { onSelectTab(tab); if (mobileOpen && onCloseMobile) onCloseMobile(); }}
              onVoltarPdv={onVoltarPdv}
              isSidebarOpen={expanded}
              onExpandSidebar={() => { if (!expanded) onToggle(); }}
            />
          </div>

          {canScrollUp && (
            <button type="button" onClick={() => scrollNav('up')} className="mx-3 mt-1 py-1 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer shrink-0">
              <ChevronUp className="w-3.5 h-3.5" />
              {expanded && <span>Itens acima</span>}
            </button>
          )}

          <nav ref={navRef} onScroll={checkNavScroll} className="p-3 space-y-3.5 overflow-y-auto flex-1">
            <div className="space-y-1">
              {expanded && (
                <div className="px-2.5 pb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-500/90 dark:text-amber-400/90">
                  <Star className="w-3 h-3 fill-amber-400/30" />
                  <span>Favoritos</span>
                </div>
              )}
              {favoritosItems.map(renderNavButton)}
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              {expanded && <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-500 dark:text-sky-400/80">Operação Diária</div>}
              {operacaoDiariaItems.map(renderNavButton)}
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              {expanded && (
                <button type="button" onClick={toggleGestaoAberta} className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition cursor-pointer">
                  <span>Gestão Avançada ({gestaoAvancadaItems.length})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${gestaoAberta ? 'rotate-0 text-sky-400' : '-rotate-90'}`} />
                </button>
              )}
              {(gestaoAberta || !expanded) && <div className="space-y-1 pt-0.5">{gestaoAvancadaItems.map(renderNavButton)}</div>}
            </div>
          </nav>

          {canScrollDown && (
            <button type="button" onClick={() => scrollNav('down')} className="mx-3 mb-1.5 py-1.5 px-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-600 dark:text-sky-300 text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 animate-pulse">
              <ChevronDown className="w-3.5 h-3.5" />
              {expanded && <span>Ver mais itens abaixo</span>}
            </button>
          )}
        </div>

        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/90 shrink-0 hidden md:block">
          <button onClick={onToggle} type="button" className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer" title={isOpen ? 'Recolher Menu' : 'Expandir Menu'}>
            {isOpen ? (<><ChevronLeft className="w-4 h-4" /><span className="text-[11px]">Recolher Menu</span></>) : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
