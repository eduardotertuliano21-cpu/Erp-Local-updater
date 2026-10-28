import React from 'react';
import { Utensils, ShoppingBag, Scale, Car, Wrench, Shirt } from 'lucide-react';
import { useBusinessMode, TENANTS_OPTIONS } from '../../context/BusinessModeContext.js';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  ShoppingBag,
  Scale,
  Car,
  Wrench,
  Shirt,
};

const THEME_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  restaurante: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  mercado: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500/30', dot: 'bg-sky-500' },
  acougue: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  autopecas: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  assistencia: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/30', dot: 'bg-teal-500' },
  roupas: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-500' },
};

export const TenantSelectorDropdown: React.FC = () => {
  const { mode } = useBusinessMode();
  const currentOption = TENANTS_OPTIONS.find((t) => t.id === mode) || TENANTS_OPTIONS[0];
  const IconComponent = ICON_MAP[currentOption.iconName] || ShoppingBag;
  const theme = THEME_MAP[mode] || THEME_MAP.mercado;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme.bg} ${theme.border} ${theme.text} shadow-xs select-none`}
      title={`Área de Atuação Ativa: ${currentOption.label} (${currentOption.sublabel}) • Definida no cadastro inicial e sincronizada com o Painel Admin`}
    >
      <div className="relative flex items-center justify-center">
        <IconComponent className="w-4 h-4 shrink-0" />
        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">ÁREA DE ATUAÇÃO</span>
        <span className="text-xs font-black tracking-tight uppercase whitespace-nowrap mt-0.5">
          {currentOption.label}
        </span>
      </div>
    </div>
  );
};
