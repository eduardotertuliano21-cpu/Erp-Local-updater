import React from 'react';

export function Sidebar({ currentTab, setTab, mobileOpen, onClose }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard & MRR', icon: '📊' },
    { id: 'tenants', label: 'Clientes & Lojas', icon: '🏪' },
    { id: 'planos', label: 'Planos & Stripe', icon: '💳' },
    { id: 'transacoes', label: 'Faturas & Webhooks', icon: '🧾' },
    { id: 'usuarios', label: 'Operadores Admin', icon: '👥' },
    { id: 'versionamento', label: 'Versões & Updates', icon: '🚀' },
    { id: 'caixa_preta', label: 'Caixa Preta & IA', icon: '⚡' },
    { id: 'configuracoes', label: 'Configurações Stripe', icon: '⚙️' },
  ];

  const handleSelectTab = (id) => {
    setTab(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-slate-900/95 md:bg-slate-900/80 border-r border-slate-800 flex flex-col justify-between p-3 backdrop-blur shrink-0 transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-cyan-500/20 shrink-0">
              ⚡
            </div>
            <div className="truncate">
              <span className="font-extrabold text-white text-sm tracking-wide">MASTER</span>{' '}
              <span className="text-cyan-400 font-bold text-xs">ADMIN</span>
              <span className="block text-[9px] text-slate-400 font-mono">ClickStorm Cloud</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer text-xs"
            title="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer truncate ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                title={item.label}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="text-cyan-400 font-bold mb-0.5">Nuvem: ONLINE</div>
        <div>Stripe: Ativo</div>
        <div>Sync: v1.0.0</div>
      </div>
    </aside>
  );
}
