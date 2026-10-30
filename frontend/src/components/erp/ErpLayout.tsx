import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Sun, Moon,
  RefreshCw, LogOut, AlertTriangle, Keyboard, HelpCircle, Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { useTheme } from '../../context/ThemeContext.js';
import { UpdateModal } from '../common/UpdateModal.js';
import { updateApi, type UpdateInfo } from '../../services/updateApi.js';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { ErpSidebar } from './ErpSidebar.js';
import { TenantSelectorDropdown } from '../pdv/TenantSelectorDropdown.js';

export type ErpTabType =
  | 'DASHBOARD' | 'PRODUTOS' | 'ENTIDADES' | 'FINANCEIRO' | 'ESTOQUE' | 'PCP'
  | 'RELATORIOS' | 'CONFIGURACOES' | 'ASSINATURA' | 'ORDENS_SERVICO' | 'MESAS'
  | 'PROMOCOES' | 'CURVA_ABC' | 'ETIQUETAS' | 'AUDITORIA' | 'KDS'
  | 'COMPRAS_ENTRADA' | 'NFE_DANFE' | 'DESOSSA' | 'AJUDA';

interface ErpLayoutProps {
  currentTab: ErpTabType;
  onSelectTab: (tab: ErpTabType) => void;
  onVoltarPdv: () => void;
  children: React.ReactNode;
}

export const ErpLayout: React.FC<ErpLayoutProps> = ({
  currentTab,
  onSelectTab,
  onVoltarPdv,
  children,
}) => {
  const { config } = useStoreConfig();
  const { isDark, toggleTheme } = useTheme();
  const { usuario, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => localStorage.getItem('clickstorm_sidebar_open') !== 'false');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [versaoApp, setVersaoApp] = useState<string>('1.0.0');
  const [checandoUpdate, setChecandoUpdate] = useState(false);
  const [alertaCert, setAlertaCert] = useState<{ alerta: boolean; dias_restantes?: number; mensagem?: string } | null>(null);

  useEffect(() => {
    updateApi.getAppVersion().then((v) => setVersaoApp(v)).catch(() => {});
    enterpriseApi.obterAlertaVencimento().then((res) => {
      if (res.success && res.data?.alerta) setAlertaCert(res.data);
    }).catch(() => {});
    updateApi.checarAtualizacao().then((info) => {
      setUpdateAvailable(info && info.temAtualizacao ? info : null);
    }).catch(() => {});
    const unsub = updateApi.onUpdateDownloaded(() => setIsUpdateReady(true));
    return () => { if (unsub) unsub(); };
  }, []);

  // Atalhos rápidos de navegação no ERP: F1 (Painel), F2 (Produtos), F4 (Financeiro), F5 (Estoque)
  useEffect(() => {
    const handleErpKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'F1') { e.preventDefault(); onSelectTab('RELATORIOS'); }
      else if (e.key === 'F2') { e.preventDefault(); onSelectTab('PRODUTOS'); }
      else if (e.key === 'F3') { e.preventDefault(); onSelectTab('NFE_DANFE'); }
      else if (e.key === 'F4') { e.preventDefault(); onSelectTab('FINANCEIRO'); }
      else if (e.key === 'F5') { e.preventDefault(); onSelectTab('ESTOQUE'); }
    };
    window.addEventListener('keydown', handleErpKeys);
    return () => window.removeEventListener('keydown', handleErpKeys);
  }, [onSelectTab]);

  const handleChecarUpdateManual = async () => {
    setChecandoUpdate(true);
    try {
      const info = await updateApi.checarAtualizacao();
      setUpdateAvailable(info.temAtualizacao ? info : null);
      setShowUpdateModal(true);
    } catch {
      setShowUpdateModal(true);
    } finally {
      setChecandoUpdate(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('clickstorm_sidebar_open', String(next));
      return next;
    });
  };

  const quickShortcuts = [
    { key: 'F1', label: 'Painel', action: () => onSelectTab('RELATORIOS'), active: currentTab === 'RELATORIOS' || currentTab === 'DASHBOARD' },
    { key: 'F2', label: 'Produtos', action: () => onSelectTab('PRODUTOS'), active: currentTab === 'PRODUTOS' },
    { key: 'F3', label: 'NF-e DANFE', action: () => onSelectTab('NFE_DANFE'), active: currentTab === 'NFE_DANFE' },
    { key: 'F4', label: 'Financeiro', action: () => onSelectTab('FINANCEIRO'), active: currentTab === 'FINANCEIRO' },
    { key: 'F5', label: 'Estoque', action: () => onSelectTab('ESTOQUE'), active: currentTab === 'ESTOQUE' },
    { key: '?', label: 'Ajuda & Tutoriais', action: () => onSelectTab('AJUDA'), active: currentTab === 'AJUDA' },
    { key: 'F11', label: 'Caixa PDV', action: onVoltarPdv, isPdv: true },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden">
      <ErpSidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onVoltarPdv={onVoltarPdv}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="min-h-16 py-2 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/90 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-30 shadow-xs">
          {/* Lado Esquerdo: Botão Menu Mobile, Identidade & Seletor de Nicho */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
              title="Abrir Menu de Navegação"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 shrink-0 min-w-0">
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-9 h-9 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 shadow-xs shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  {config.nome_loja ? config.nome_loja.charAt(0).toUpperCase() : '🏪'}
                </div>
              )}
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase truncate max-w-[140px] lg:max-w-[240px]">
                  {config.nome_loja || 'MINHA LOJA'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 leading-none">
                  <span>RETAGUARDA ERP</span>
                  <span>•</span>
                  <span className="text-[9px] opacity-75">ClickStorm</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <TenantSelectorDropdown />
            </div>
          </div>

          {/* Lado Direito: Ajuda, Versão, Tema, Usuário e Botão Caixa PDV */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => onSelectTab('AJUDA')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border ${
                currentTab === 'AJUDA'
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
              }`}
              title="Abrir Central de Ajuda e Tutoriais Passo a Passo"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Ajuda & Tutoriais</span>
            </button>

            <button
              onClick={handleChecarUpdateManual}
              disabled={checandoUpdate}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                updateAvailable
                  ? (isUpdateReady ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-pulse')
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checandoUpdate ? 'animate-spin text-blue-500' : updateAvailable ? 'text-white' : 'text-emerald-500'}`} />
              <span className="font-mono">v{versaoApp}</span>
              <span className="hidden xl:inline text-[11px]">{updateAvailable ? `(${updateAvailable.tag})` : '• Atualizado'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Alternar Tema Claro/Escuro"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {usuario && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight max-w-[120px] truncate">{usuario.nome}</div>
                  <div className="text-[10px] text-sky-400 font-semibold uppercase">{usuario.hierarquia}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={`Sair / Logout (${usuario.nome})`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={onVoltarPdv}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              title="Voltar para a tela de vendas do caixa (F11)"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CAIXA PDV</span>
              <kbd className="bg-black/25 px-1.5 py-0.5 rounded text-[10px] text-emerald-100 font-mono">F11</kbd>
            </button>
          </div>
        </header>

        {alertaCert && alertaCert.alerta && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{alertaCert.mensagem}</span>
            </div>
            <button onClick={() => onSelectTab('CONFIGURACOES')} className="text-[11px] underline font-bold hover:text-white cursor-pointer">
              Gerenciar Certificados
            </button>
          </div>
        )}

        {/* Widget de Atalhos de Operação Rápida */}
        <div className="px-3 sm:px-6 pt-2 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-950">
          <div className="inline-flex flex-wrap items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-white/90 dark:bg-[#0b1120]/90 border border-slate-200/80 dark:border-slate-800/90 text-[11px] text-slate-500 dark:text-slate-400 shadow-2xs max-w-full">
            <Keyboard className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-0.5" />
            <span className="font-semibold text-slate-600 dark:text-slate-400 mr-1 hidden md:inline">Atalhos Rápidos de Navegação:</span>
            {quickShortcuts.map((sc, idx) => (
              <React.Fragment key={sc.key}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-700">|</span>}
                <button
                  type="button"
                  onClick={sc.action}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                    sc.isPdv ? 'text-emerald-500 hover:bg-emerald-500/10 font-bold' : sc.active ? 'text-sky-400 bg-sky-500/10 font-bold' : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <kbd className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                    sc.isPdv ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : sc.active ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}>{sc.key}</kbd>
                  <span>: {sc.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-auto px-3 sm:px-6 pb-6 pt-2.5 bg-slate-50 dark:bg-slate-950 relative z-0">
          {children}
        </main>
      </div>

      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} initialInfo={updateAvailable} />
    </div>
  );
};
