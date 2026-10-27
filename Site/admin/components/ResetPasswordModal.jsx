import React, { useState } from 'react';

export function ResetPasswordModal({ tenant, onClose, onConfirm }) {
  const [loginAdmin, setLoginAdmin] = useState(tenant?.administradorLogin || 'admin');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!novaSenha || novaSenha.trim().length < 4) {
      setErro('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(novaSenha.trim(), loginAdmin.trim());
      onClose();
    } catch (err) {
      setErro(err?.message || 'Erro ao solicitar redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔐</span> Redefinir Senha do ERP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Loja: <span className="text-cyan-400 font-semibold">{tenant.nomeFantasia || tenant.razaoSocial}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg cursor-pointer">✕</button>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          Esta nova senha será enviada e replicada automaticamente em todos os bancos de dados (.sqlite) do terminal Desktop do cliente na próxima sincronização (polling de 10s).
        </div>

        {erro && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Login do Administrador</label>
            <input
              type="text"
              value={loginAdmin}
              onChange={(e) => setLoginAdmin(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Nova Senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              placeholder="Digite a nova senha"
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              placeholder="Repita a nova senha"
              required
              minLength={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Gravando...' : 'Aplicar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
