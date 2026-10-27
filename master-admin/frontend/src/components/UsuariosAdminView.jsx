import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function UsuariosAdminView() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [novoUser, setNovoUser] = useState({ login: '', senha: '', nome: '', role: 'SUPORTE' });
  const [erro, setErro] = useState('');

  const carregarUsuarios = () => {
    setLoading(true);
    api.getUsuarios()
      .then((data) => setUsuarios(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleCriar = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const res = await api.createUsuario(novoUser);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setShowModal(false);
        setNovoUser({ login: '', senha: '', nome: '', role: 'SUPORTE' });
        carregarUsuarios();
      }
    } catch (err) {
      setErro('Erro de conexão ao criar usuário');
    }
  };

  const handleToggle = async (id) => {
    await api.toggleUsuarioStatus(id);
    carregarUsuarios();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Usuários com Acesso Master</h1>
          <p className="text-sm text-slate-400">Usuários autorizados a acessar este Painel e o Terminal CTRL+F3 do PDV</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-cyan-500/20"
        >
          + Novo Usuário Admin
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Login</th>
              <th className="p-4">Perfil / Cargo</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando operadores...</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-bold text-white">{u.nome}</td>
                  <td className="p-4 font-mono text-cyan-400 text-xs">{u.login}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      u.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {u.ativo ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.login !== 'eduardo.tertuliano21' && (
                      <button
                        onClick={() => handleToggle(u.id)}
                        className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Criar Novo Operador Master</h3>
            {erro && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">{erro}</div>}
            <form onSubmit={handleCriar} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={novoUser.nome}
                  onChange={(e) => setNovoUser({ ...novoUser, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Login / Usuário</label>
                  <input
                    type="text"
                    required
                    value={novoUser.login}
                    onChange={(e) => setNovoUser({ ...novoUser, login: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Perfil</label>
                  <select
                    value={novoUser.role}
                    onChange={(e) => setNovoUser({ ...novoUser, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="SUPORTE">Suporte</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="MASTER_ADMIN">Master Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Senha Provisória</label>
                <input
                  type="password"
                  required
                  value={novoUser.senha}
                  onChange={(e) => setNovoUser({ ...novoUser, senha: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-sm text-white rounded-xl">Criar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
