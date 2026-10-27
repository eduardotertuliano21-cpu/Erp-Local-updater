import React, { useState } from 'react';
import { api } from '../api.js';

export function LoginModal({ onLoginSuccess }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await api.login(login, senha);
      if (res.sucesso) {
        localStorage.setItem('cs_master_token', res.token);
        localStorage.setItem('cs_master_user', JSON.stringify(res.usuario));
        onLoginSuccess(res.usuario);
      } else {
        setErro(res.erro || 'Falha ao autenticar.');
      }
    } catch (err) {
      setErro('Erro de conexão com o servidor Master Admin.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="text-center mb-8 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            ⚡
          </div>
          <h2 className="text-2xl font-extrabold text-white">ClickStorm Master Admin</h2>
          <p className="text-xs text-slate-400 mt-1">Acesso restrito à gestão central na nuvem</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Usuário / Login
            </label>
            <input
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="seu.usuario"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-sm text-white rounded-xl shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {carregando ? 'Autenticando...' : 'Entrar no Painel Master'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-500 font-mono">
          ClickStorm Systems Cloud Security • SSL 256-bit
        </div>
      </div>
    </div>
  );
}
