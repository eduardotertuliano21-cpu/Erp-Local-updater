import React, { useState } from 'react';
import { X, Save, User, Shield, CheckSquare, Square } from 'lucide-react';
import type { UsuarioDTO, HierarquiaUsuario, PermissoesUsuario } from '../../types/auth.js';
import { authApi } from '../../services/authApi.js';

interface UsuarioFormModalProps {
  isOpen: boolean;
  usuarioEdicao: UsuarioDTO | null;
  onClose: () => void;
  onSalvo: () => void;
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  isOpen,
  usuarioEdicao,
  onClose,
  onSalvo,
}) => {
  if (!isOpen) return null;

  const [nome, setNome] = useState(usuarioEdicao?.nome || '');
  const [login, setLogin] = useState(usuarioEdicao?.login || '');
  const [senha, setSenha] = useState('');
  const [hierarquia, setHierarquia] = useState<HierarquiaUsuario>(usuarioEdicao?.hierarquia || 'OPERADOR');
  const [ativo, setAtivo] = useState<boolean>(usuarioEdicao ? usuarioEdicao.ativo : true);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({
    pode_cancelar_venda: usuarioEdicao?.permissoes.pode_cancelar_venda || false,
    pode_dar_desconto: usuarioEdicao?.permissoes.pode_dar_desconto || false,
    pode_ver_relatorios: usuarioEdicao?.permissoes.pode_ver_relatorios || false,
    acessa_estoque: usuarioEdicao?.permissoes.acessa_estoque || false,
    acessa_financeiro: usuarioEdicao?.permissoes.acessa_financeiro || false,
    acessa_configuracoes: usuarioEdicao?.permissoes.acessa_configuracoes || false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const togglePermissao = (key: keyof PermissoesUsuario) => {
    setPermissoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !login.trim()) {
      setErro('Nome e login são obrigatórios.');
      return;
    }
    if (!usuarioEdicao && !senha) {
      setErro('A senha é obrigatória para novo usuário.');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      if (usuarioEdicao) {
        const res = await authApi.atualizarUsuario(usuarioEdicao.id, {
          nome,
          login,
          senha: senha || undefined,
          hierarquia,
          ativo,
          permissoes,
        });
        if (!res.success) throw new Error(res.error || 'Falha ao atualizar');
      } else {
        const res = await authApi.criarUsuario({
          nome,
          login,
          senha,
          hierarquia,
          permissoes,
        });
        if (!res.success) throw new Error(res.error || 'Falha ao criar');
      }

      onSalvo();
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar usuário');
    } finally {
      setSalvando(false);
    }
  };

  const listaPermissoes: Array<{ key: keyof PermissoesUsuario; label: string; desc: string }> = [
    { key: 'pode_cancelar_venda', label: 'Pode Cancelar Venda / Item', desc: 'Permite cancelar produtos do carrinho e cupons' },
    { key: 'pode_dar_desconto', label: 'Pode Conceder Descontos', desc: 'Aplica descontos superiores ao limite padrão' },
    { key: 'pode_ver_relatorios', label: 'Ver Relatórios Analíticos', desc: 'Permite visualizar gráficos e faturamento da Retaguarda' },
    { key: 'acessa_estoque', label: 'Acesso a Estoque e Compras', desc: 'Visualiza posição de estoque e importa XML de NF-e' },
    { key: 'acessa_financeiro', label: 'Acesso ao Financeiro e DRE', desc: 'Gerencia títulos a pagar/receber e fluxo de caixa' },
    { key: 'acessa_configuracoes', label: 'Acesso a Configurações', desc: 'Permite alterar configurações gerais do sistema' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {usuarioEdicao ? 'Editar Usuário / Permissões' : 'Novo Usuário do Sistema'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {erro && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Login / Usuário</label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex: carlossilva"
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Senha {usuarioEdicao && <span className="text-[10px] text-slate-400">(Deixe em branco para manter)</span>}
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hierarquia / Perfil</label>
              <select
                value={hierarquia}
                onChange={(e) => setHierarquia(e.target.value as HierarquiaUsuario)}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="OPERADOR">OPERADOR (Frente de Caixa)</option>
                <option value="GERENTE">GERENTE (Acesso Completo)</option>
                <option value="ADMIN">ADMIN (Controle Total Master)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Usuário Ativo (Habilitado para Login)</span>
            </label>
          </div>

          {/* Granular Permissions Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>Permissões Granulares de Acesso</span>
              </label>
              {hierarquia !== 'OPERADOR' && (
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Liberação Total Automática ({hierarquia})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {listaPermissoes.map((p) => {
                const isChecked = hierarquia !== 'OPERADOR' || permissoes[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={hierarquia !== 'OPERADOR'}
                    onClick={() => togglePermissao(p.key)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isChecked
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-100'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    } ${hierarquia !== 'OPERADOR' ? 'opacity-80 cursor-default' : ''}`}
                  >
                    <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{p.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Usuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
