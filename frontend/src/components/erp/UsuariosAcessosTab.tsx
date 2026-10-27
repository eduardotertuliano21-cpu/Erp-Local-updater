import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Check, X, Users } from 'lucide-react';
import type { UsuarioDTO } from '../../types/auth.js';
import { authApi } from '../../services/authApi.js';
import { UsuarioFormModal } from './UsuarioFormModal.js';

export const UsuariosAcessosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioDTO | null>(null);

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const res = await authApi.listarUsuarios();
      if (res.success && res.data) {
        setUsuarios(res.data.filter((u) => u.id !== 'admin_virtual' && u.login !== 'admin_virtual'));
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleNovo = () => {
    setUsuarioEdicao(null);
    setModalAberto(true);
  };

  const handleEditar = (u: UsuarioDTO) => {
    setUsuarioEdicao(u);
    setModalAberto(true);
  };

  const handleExcluir = async (u: UsuarioDTO) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário '${u.nome}'?`)) return;
    const res = await authApi.excluirUsuario(u.id);
    if (res.success) {
      carregarUsuarios();
    } else {
      alert(res.error || 'Erro ao excluir usuário');
    }
  };

  const badgeHierarquia = (hierarquia: string) => {
    switch (hierarquia) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'GERENTE':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Gestão de Usuários e Permissões Granulares (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre operadores, defina privilégios individuais de desconto, cancelamento e acesso a módulos
          </p>
        </div>
        <button
          onClick={handleNovo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Usuário</th>
              <th className="py-3 px-4 font-semibold">Login</th>
              <th className="py-3 px-4 font-semibold">Hierarquia</th>
              <th className="py-3 px-4 font-semibold">Permissões Extras</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  {carregando ? 'Carregando usuários...' : 'Nenhum usuário cadastrado'}
                </td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const perms = u.permissoes;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {u.nome}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      @{u.login}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeHierarquia(u.hierarquia)}`}>
                        {u.hierarquia}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.hierarquia !== 'OPERADOR' ? (
                        <span className="text-[11px] text-slate-400 italic">Controle Gerencial Total</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {perms.pode_cancelar_venda && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                              Canc. Venda
                            </span>
                          )}
                          {perms.pode_dar_desconto && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                              Desconto
                            </span>
                          )}
                          {perms.pode_ver_relatorios && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">
                              Relatórios
                            </span>
                          )}
                          {perms.acessa_estoque && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                              Estoque
                            </span>
                          )}
                          {!perms.pode_cancelar_venda && !perms.pode_dar_desconto && !perms.pode_ver_relatorios && !perms.acessa_estoque && (
                            <span className="text-[11px] text-slate-400">Padrão PDV</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.ativo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.ativo ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditar(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExcluir(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <UsuarioFormModal
        isOpen={modalAberto}
        usuarioEdicao={usuarioEdicao}
        onClose={() => setModalAberto(false)}
        onSalvo={carregarUsuarios}
      />
    </div>
  );
};
