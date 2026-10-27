import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardView } from './components/DashboardView.jsx';
import { TenantsView } from './components/TenantsView.jsx';
import { PlanosView } from './components/PlanosView.jsx';
import { TransacoesView } from './components/TransacoesView.jsx';
import { UsuariosAdminView } from './components/UsuariosAdminView.jsx';
import { VersionamentoView } from './components/VersionamentoView.jsx';
import { ConfiguracoesView } from './components/ConfiguracoesView.jsx';
import { CaixaPretaAdminView } from './components/CaixaPretaAdminView.jsx';
import { LoginModal } from './components/LoginModal.jsx';

export default function AdminPanel() {
  const [currentTab, setTab] = useState('tenants');
  const [usuario, setUsuario] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem('cs_master_user');
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo));
      } catch (e) {
        localStorage.removeItem('cs_master_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cs_master_token');
    localStorage.removeItem('cs_master_user');
    setUsuario(null);
  };

  if (!usuario) {
    return <LoginModal onLoginSuccess={(u) => setUsuario(u)} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative">
      {/* Backdrop para fechar Drawer Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Lateral Compacta */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header Superior Responsivo */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botão Hambúrguer Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Abrir Menu de Navegação"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs font-mono text-slate-400 truncate">
                <span className="hidden sm:inline">Master Admin Cloud Engine • </span>Conectado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-300 shrink-0">
            <span className="px-2.5 sm:px-3 py-1 bg-slate-800/90 border border-slate-700/80 rounded-full max-w-[140px] sm:max-w-none truncate text-xs">
              🔑 {usuario.nome}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 transition hover:underline cursor-pointer"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Conteúdo com Scroll Livre e Total Encaixe de Tela */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="w-full max-w-full">
            {currentTab === 'dashboard' && <DashboardView />}
            {currentTab === 'tenants' && <TenantsView />}
            {currentTab === 'planos' && <PlanosView />}
            {currentTab === 'transacoes' && <TransacoesView />}
            {currentTab === 'usuarios' && <UsuariosAdminView />}
            {currentTab === 'versionamento' && <VersionamentoView />}
            {currentTab === 'caixa_preta' && <CaixaPretaAdminView />}
            {currentTab === 'configuracoes' && <ConfiguracoesView />}
          </div>
        </main>
      </div>
    </div>
  );
}
