import React, { useState, useEffect } from 'react';
import {
  Package,
  Users,
  WalletCards,
  Warehouse,
  Cpu,
  FileBarChart,
  Sliders,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Scale,
  Wrench,
  Car,
  UtensilsCrossed,
  LayoutGrid,
  Shirt,
  Flame,
  BarChart3,
  Tag,
  ShieldAlert,
  ChefHat,
  Layers,
  Beef,
  Star,
  HelpCircle,
} from 'lucide-react';
import type { ErpTabType } from './ErpLayout.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { ErpSpotlightSearch } from './ErpSpotlightSearch.js';

interface ErpSidebarProps {
  currentTab: ErpTabType;
  onSelectTab: (tab: ErpTabType) => void;
  onVoltarPdv: () => void;
  isOpen: boolean;
  onToggle: () => void;
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
}) => {
  const { isRestaurante, isAssistencia, isVestuario, isAcougue, isAutoPecas } = useBusinessMode();

  const getProductItem = () => {
    if (isRestaurante) return { label: 'Cardápio & Pratos', icon: Utensils };
    if (isVestuario) return { label: 'Roupas & Grade', icon: Shirt };
    if (isAcougue) return { label: 'Cortes & Balança', icon: Scale };
    if (isAutoPecas) return { label: 'Peças & Veículos', icon: Car };
    if (isAssistencia) return { label: 'Peças & Acessórios', icon: ShoppingBag };
    return { label: 'Produtos', icon: Package };
  };

  // 1. Seção FAVORITOS (Fixado no topo)
  const favoritosItems: SidebarNavItem[] = [
    { id: 'RELATORIOS', label: 'Painel & Relatórios', icon: FileBarChart, shortcut: 'F1' },
    { id: 'AJUDA', label: 'Ajuda & Tutoriais', icon: HelpCircle, shortcut: '?' },
  ];

  // 2. Seção OPERAÇÃO DIÁRIA
  const operacaoDiariaItems: SidebarNavItem[] = [
    { id: 'PRODUTOS', ...getProductItem(), shortcut: 'F2' },
    { id: 'PROMOCOES', label: 'Promoções', icon: Flame },
    ...(isRestaurante ? [{ id: 'MESAS' as ErpTabType, label: 'Mesas & Comandas', icon: UtensilsCrossed }] : []),
    ...(isAssistencia ? [{ id: 'ORDENS_SERVICO' as ErpTabType, label: 'Ordens de Serviço', icon: Wrench }] : []),
    {
      id: 'ENTIDADES',
      label: isRestaurante ? 'Garçons & Equipe' : isAssistencia ? 'Técnicos & Clientes' : 'Equipe & Clientes',
      icon: Users,
    },
    { id: 'FINANCEIRO', label: 'Financeiro', icon: WalletCards, shortcut: 'F4' },
    { id: 'ESTOQUE', label: 'Estoque & WMS', icon: Warehouse, shortcut: 'F5' },
    { id: 'COMPRAS_ENTRADA', label: 'Entradas NF (G.E.M.)', icon: Layers },
    ...(isAcougue ? [{ id: 'DESOSSA' as ErpTabType, label: 'Rendimento Desossa', icon: Beef }] : []),
    { id: 'CURVA_ABC', label: 'Curva ABC (BI)', icon: BarChart3 },
  ];

  // 3. Seção GESTÃO AVANÇADA (Retrátil / Dropdown)
  const gestaoAvancadaItems: SidebarNavItem[] = [
    { id: 'AUDITORIA', label: 'Trilha Auditoria', icon: ShieldAlert },
    { id: 'PCP', label: isRestaurante ? 'Ficha Técnica' : 'Produção PCP', icon: Cpu },
    { id: 'ETIQUETAS', label: 'Etiquetas Térmicas', icon: Tag },
    ...(isRestaurante ? [{ id: 'KDS' as ErpTabType, label: 'Monitor KDS', icon: ChefHat }] : []),
    { id: 'CONFIGURACOES', label: 'Configurações', icon: Sliders },
    { id: 'ASSINATURA', label: 'Assinatura', icon: CreditCard },
  ];

  const isAdvancedActive = gestaoAvancadaItems.some((item) => item.id === currentTab);
  const [gestaoAberta, setGestaoAberta] = useState<boolean>(isAdvancedActive);

  useEffect(() => {
    if (isAdvancedActive) setGestaoAberta(true);
  }, [isAdvancedActive]);

  const isTabActive = (tabId: ErpTabType) => {
    if (tabId === 'RELATORIOS' && (currentTab === 'RELATORIOS' || currentTab === 'DASHBOARD')) return true;
    return currentTab === tabId;
  };

  const renderNavButton = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const active = isTabActive(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectTab(item.id)}
        title={!isOpen ? `${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}` : undefined}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
          active
            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
        } ${!isOpen ? 'justify-center px-0' : ''}`}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${!isOpen ? 'justify-center' : ''}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
              active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-sky-400'
            }`}
          />
          {isOpen && <span className="truncate">{item.label}</span>}
        </div>

        {isOpen && item.shortcut && (
          <kbd
            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border shrink-0 transition-colors ${
              active
                ? 'bg-black/25 text-sky-100 border-white/20'
                : 'bg-slate-100 dark:bg-slate-950/90 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 group-hover:text-sky-400 group-hover:border-sky-500/30'
            }`}
          >
            [{item.shortcut}]
          </kbd>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`h-screen bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800/90 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none z-40 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Topo da Sidebar: Branding & Botão de Colapso */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/90 shrink-0">
          {isOpen ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm shadow-sky-500/20 shrink-0">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase block truncate">
                  MENU ERP
                </span>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Enterprise
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                ⚡
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            type="button"
            className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
              !isOpen ? 'hidden' : ''
            }`}
            title={isOpen ? 'Recolher Menu Lateral' : 'Expandir Menu Lateral'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Pesquisa Universal (Estilo Spotlight) Fixa Acima de Favoritos */}
        <div className="px-3 pt-3 pb-1 shrink-0 z-50">
          <ErpSpotlightSearch
            onSelectTab={onSelectTab}
            onVoltarPdv={onVoltarPdv}
            isSidebarOpen={isOpen}
            onExpandSidebar={() => {
              if (!isOpen) onToggle();
            }}
          />
        </div>

        {/* Lista de Navegação Agrupada */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* 1. SEÇÃO FAVORITOS */}
          <div className="space-y-1">
            {isOpen && (
              <div className="px-2.5 pb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-500/90 dark:text-amber-400/90">
                <Star className="w-3 h-3 fill-amber-400/30" />
                <span>Favoritos</span>
              </div>
            )}
            {favoritosItems.map(renderNavButton)}
          </div>

          {/* 2. SEÇÃO OPERAÇÃO DIÁRIA */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
            {isOpen && (
              <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-500 dark:text-sky-400/80">
                Operação Diária
              </div>
            )}
            {operacaoDiariaItems.map(renderNavButton)}
          </div>

          {/* 3. SEÇÃO GESTÃO AVANÇADA (Retrátil / Dropdown) */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/70">
            {isOpen ? (
              <button
                type="button"
                onClick={() => setGestaoAberta((prev) => !prev)}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                <span>Gestão Avançada</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    gestaoAberta ? 'rotate-0 text-sky-400' : '-rotate-90'
                  }`}
                />
              </button>
            ) : null}

            {(gestaoAberta || !isOpen) && (
              <div className="space-y-1 pt-0.5">
                {gestaoAvancadaItems.map(renderNavButton)}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/90 shrink-0">
        <button
          onClick={onToggle}
          type="button"
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          title={isOpen ? 'Recolher Menu' : 'Expandir Menu'}
        >
          {isOpen ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Recolher Menu</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
