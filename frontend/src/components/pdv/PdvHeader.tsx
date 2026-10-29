import React from 'react';
import { Monitor, Settings, Sun, Moon } from 'lucide-react';
import { TenantSelectorDropdown } from './TenantSelectorDropdown.js';

interface PdvHeaderProps {
  nomeLoja?: string;
  slogan?: string;
  logoUrl?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onAbrirRetaguarda: () => void;
  onAbrirConfig: () => void;
}

export const PdvHeader: React.FC<PdvHeaderProps> = ({
  nomeLoja,
  slogan,
  logoUrl,
  isDark,
  onToggleTheme,
  onAbrirRetaguarda,
  onAbrirConfig,
}) => {
  return (
    <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-white dark:bg-slate-900 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 shadow-xs shrink-0"
          />
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-sm shrink-0">
            {nomeLoja ? nomeLoja.charAt(0).toUpperCase() : '🏪'}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl xl:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight uppercase truncate">
            {nomeLoja || 'MINHA LOJA'}
          </h1>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate block">
            {slogan || 'Terminal de Vendas Frente de Caixa'}
          </span>
        </div>
      </div>

      {/* Atalhos Rápidos no Topo do Cupom */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
        <TenantSelectorDropdown />

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
          title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        <button
          onClick={onAbrirRetaguarda}
          type="button"
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Retaguarda (F11)</span>
        </button>

        <button
          onClick={onAbrirConfig}
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
          title="Configurações (F3)"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
