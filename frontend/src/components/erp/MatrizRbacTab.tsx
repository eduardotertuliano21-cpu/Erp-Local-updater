import React, { useState, useEffect } from 'react';
import { enterpriseApi, type PermissaoHierarquia } from '../../services/enterpriseApi.js';
import { Shield, Check, CheckCircle2, Lock, Unlock, KeyRound, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

const ACOES_LABELS: Record<keyof Omit<PermissaoHierarquia, 'hierarquia'>, string> = {
  cancelar_venda: 'Cancelar Venda no PDV',
  aplicar_desconto: 'Conceder Desconto Manual',
  abrir_gaveta: 'Abrir Gaveta sem Venda',
  ver_relatorios: 'Visualizar Relatórios Financeiros',
  acessa_estoque: 'Ajustar e Cadastrar Estoque',
  acessa_financeiro: 'Movimentar Títulos a Pagar/Receber',
  acessa_configuracoes: 'Acessar Configurações do Sistema',
};

export const MatrizRbacTab: React.FC = () => {
  const { exigirAutenticacao, setExigirAutenticacao } = useAuth();
  const [estrito, setEstrito] = useState(false);
  const [matriz, setMatriz] = useState<PermissaoHierarquia[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('Configurações de Permissões salvas com sucesso!');

  const carregar = async () => {
    try {
      const res = await enterpriseApi.obterMatrizRbac();
      if (res.success && res.data) {
        setEstrito(res.data.estrito);
        setMatriz(res.data.matriz);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleToggleEstrito = async () => {
    const novoValor = !estrito;
    setEstrito(novoValor);
    await enterpriseApi.alterarModoEstritoRbac(novoValor);
    setMsgSucesso(novoValor ? 'Modo Estrito ATIVADO com sucesso!' : 'Modo Estrito DESATIVADO!');
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const handleToggleExigirAuth = async () => {
    const novoValor = !exigirAutenticacao;
    await setExigirAutenticacao(novoValor);
    setMsgSucesso(novoValor ? 'Login e Senha agora são OBRIGATÓRIOS no início!' : 'Modo Porteira Aberta ATIVADO (Bypass total de login)!');
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3500);
  };

  const handleTogglePermissao = (hierarquia: 'ADMIN' | 'GERENTE' | 'OPERADOR', campo: keyof Omit<PermissaoHierarquia, 'hierarquia'>) => {
    if (hierarquia === 'ADMIN') return; // Admin sempre possui tudo

    setMatriz((prev) =>
      prev.map((item) => {
        if (item.hierarquia === hierarquia) {
          return { ...item, [campo]: !item[campo] };
        }
        return item;
      })
    );
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await enterpriseApi.salvarMatrizRbac(matriz);
      setMsgSucesso('Matriz de Permissões atualizada com sucesso!');
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Controle de Acesso, Senhas & Permissões (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure autenticação de usuários, bloqueios de segurança e permissões por hierarquia.
          </p>
        </div>

        {/* Toggles Superiores */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Porteira Aberta / Exigir Login */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className={`w-4 h-4 ${exigirAutenticacao ? 'text-blue-400' : 'text-amber-400'}`} />
              <div>
                <div className="text-xs font-bold text-white">Exigir Senha / Login</div>
                <div className="text-[10px] text-slate-400">
                  {exigirAutenticacao ? 'Obrigatório no Boot' : 'Porteira Aberta (Livre)'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleExigirAuth}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer ${
                exigirAutenticacao ? 'bg-blue-600' : 'bg-amber-600/70'
              }`}
              title="Ativar/Desativar obrigatoriedade de login no arranque"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  exigirAutenticacao ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle Modo Estrito */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              {estrito ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
              <div>
                <div className="text-xs font-bold text-white">Controle Estrito</div>
                <div className="text-[10px] text-slate-400">
                  {estrito ? 'Validar Permissões' : 'Livre (Sem Bloqueios)'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleEstrito}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer ${
                estrito ? 'bg-amber-600' : 'bg-slate-700'
              }`}
              title="Exigir validação rígida de permissões e supervisor"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  estrito ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {!exigirAutenticacao ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Modo Porteira Aberta Ativado: </span>
            <span>
              O sistema pula a tela de login ao iniciar e concede privilégios de Administrador automaticamente. Ideal para uso exclusivo do proprietário sem necessidade de digitar senha a cada inicialização.
            </span>
          </div>
        </div>
      ) : !estrito ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Modo Flexível Desbloqueado: </span>
            <span>
              Operadores autenticados podem navegar sem barreiras. Para ativar a exigência de autorização do supervisor e bloqueio estrito de relatórios/estoque, ative o switch de "Controle Estrito".
            </span>
          </div>
        </div>
      ) : null}

      {sucesso && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{msgSucesso}</span>
        </div>
      )}

      {/* Grid Matriz de Permissões */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Operação / Recurso</th>
                <th className="p-4 font-semibold text-center w-32 text-indigo-300">ADMIN</th>
                <th className="p-4 font-semibold text-center w-32 text-amber-300">GERENTE</th>
                <th className="p-4 font-semibold text-center w-32 text-emerald-300">OPERADOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(Object.keys(ACOES_LABELS) as Array<keyof typeof ACOES_LABELS>).map((chave) => {
                const gerPerm = matriz.find((m) => m.hierarquia === 'GERENTE');
                const opPerm = matriz.find((m) => m.hierarquia === 'OPERADOR');

                return (
                  <tr key={chave} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-200 font-medium">{ACOES_LABELS[chave]}</td>

                    {/* ADMIN (Sempre permitido) */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold">
                        <Check className="w-4 h-4" />
                      </span>
                    </td>

                    {/* GERENTE */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(gerPerm ? gerPerm[chave] : true)}
                        onChange={() => handleTogglePermissao('GERENTE', chave)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* OPERADOR */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(opPerm ? opPerm[chave] : true)}
                        onChange={() => handleTogglePermissao('OPERADOR', chave)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-950"
          >
            <Check className="w-4 h-4" />
            <span>{salvando ? 'Salvando...' : 'Salvar Matriz de Permissões'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
