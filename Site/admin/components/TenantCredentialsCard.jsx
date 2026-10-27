import React from 'react';

export function TenantCredentialsCard({ formData, setFormData, onGerarLogin }) {
  return (
    <div className="p-6 bg-slate-900/90 border-2 border-cyan-500/30 rounded-2xl space-y-4 shadow-xl shadow-cyan-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔑</span>
            <span>Credenciais de Acesso ao ERP & PDV da Loja</span>
          </h2>
          <p className="text-xs text-slate-400">
            Altere ou crie o login e senha que a loja utilizará para entrar no sistema
          </p>
        </div>
        {!formData.administradorLogin && (
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg animate-pulse">
            ⚠️ Loja sem Login Definido
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-cyan-400">Login da Loja (Usuário)</label>
            <button
              type="button"
              onClick={onGerarLogin}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              ⚡ Gerar Login
            </button>
          </div>
          <input
            type="text"
            required
            value={formData.administradorLogin}
            onChange={(e) => setFormData({ ...formData, administradorLogin: e.target.value.toLowerCase().replace(/\s/g, '') })}
            placeholder="Ex: lojinhachina"
            className="w-full p-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-sm text-white font-mono font-bold focus:border-cyan-400 outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">Usuário digitado na tela de login do ERP.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Responsável</label>
          <input
            type="text"
            value={formData.administradorNome}
            onChange={(e) => setFormData({ ...formData, administradorNome: e.target.value })}
            placeholder="Ex: Eduardo Silva"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail do Administrador</label>
          <input
            type="email"
            value={formData.administradorEmail}
            onChange={(e) => setFormData({ ...formData, administradorEmail: e.target.value })}
            placeholder="Ex: contato@loja.com"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80">
        <label className="text-xs font-bold text-amber-400 block mb-1">
          Definir / Redefinir Senha do ERP (Opcional)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <input
            type="password"
            value={formData.novaSenha}
            onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
            placeholder="Digite nova senha para o ERP (mín. 4 caracteres)..."
            className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none font-mono"
          />
          <p className="text-[11px] text-slate-400 flex items-center">
            Deixe em branco para manter a senha atual inalterada.
          </p>
        </div>
      </div>
    </div>
  );
}
