import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { EntidadeFormModal } from './EntidadeFormModal.js';
import { GarcomFormModal } from './GarcomFormModal.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { UserCheck, Users, Plus, Search, Utensils, ShieldCheck } from 'lucide-react';

export const EntidadesView: React.FC = () => {
  const { isRestaurante } = useBusinessMode();
  const modoRestaurante = isRestaurante;

  const [entidades, setEntidades] = useState<any[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<string>(modoRestaurante ? 'GARCOM' : '');
  const [termoBusca, setTermoBusca] = useState<string>(''), [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false), [entidadeEditando, setEntidadeEditando] = useState<any | null>(null);
  const [garcomModalAberto, setGarcomModalAberto] = useState(false), [garcomEditando, setGarcomEditando] = useState<any | null>(null);
  const [tipoInicial, setTipoInicial] = useState<'CLIENTE' | 'FORNECEDOR' | 'TRANSPORTADORA' | 'FUNCIONARIO'>('CLIENTE');

  const carregarEntidades = async () => {
    setLoading(true);
    const tipoApi = tipoFiltro === 'GARCOM' ? 'FUNCIONARIO' : tipoFiltro;
    const res = await api.listarEntidades(tipoApi, termoBusca);
    if (res.success && res.data) {
      if (tipoFiltro === 'GARCOM') {
        setEntidades(res.data.filter((e: any) => e.cargo === 'GARCOM'));
      } else {
        setEntidades(res.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarEntidades();
  }, [tipoFiltro]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarEntidades();
  };

  const handleNovoGarcom = () => { setGarcomEditando(null); setGarcomModalAberto(true); };
  const handleNovoFuncionario = () => { setTipoInicial('FUNCIONARIO'); setEntidadeEditando(null); setModalAberto(true); };
  const handleNovaEntidade = () => { setTipoInicial('CLIENTE'); setEntidadeEditando(null); setModalAberto(true); };

  const handleEditar = (entidade: any) => {
    if (entidade.cargo === 'GARCOM') {
      setGarcomEditando(entidade);
      setGarcomModalAberto(true);
      return;
    }
    setTipoInicial(entidade.tipo || 'CLIENTE');
    setEntidadeEditando(entidade);
    setModalAberto(true);
  };

  const getCargoBadge = (cargo?: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      GARCOM: { label: 'GARÇOM', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      SUPERVISOR: { label: 'SUPERVISOR', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      GERENTE: { label: 'GERENTE', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
      OPERADOR_CAIXA: { label: 'OPERADOR CAIXA', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      ESTOQUISTA: { label: 'ESTOQUISTA', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    };
    const item = map[cargo || ''] || { label: cargo || 'VENDEDOR', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.cls}`}>{item.label}</span>;
  };

  const isFiltroFuncionario = tipoFiltro === 'FUNCIONARIO' || tipoFiltro === 'GARCOM';

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>{modoRestaurante ? 'EQUIPE, GARÇONS & ATENDENTES' : 'PESSOAS, EQUIPE & CLIENTES'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {modoRestaurante
              ? 'Cadastro de Garçons com PIN de acesso ao celular, Operadores de Caixa e Fornecedores'
              : 'Gestão de Funcionários, Operadores de Caixa, Clientes e Fornecedores'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {modoRestaurante && (
            <button
              onClick={handleNovoGarcom}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Utensils className="w-4 h-4" />
              <span>+ Novo Garçom</span>
            </button>
          )}

          <button
            onClick={handleNovoFuncionario}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95 border border-indigo-400/30"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Novo Colaborador</span>
          </button>

          <button
            onClick={handleNovaEntidade}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Cliente/Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Rápidos & Busca */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            ...(modoRestaurante ? [{ id: 'GARCOM', label: '🍽️ GARÇONS & ATENDENTES' }] : []),
            { id: '', label: 'TODOS' },
            { id: 'FUNCIONARIO', label: '👔 FUNCIONÁRIOS' },
            { id: 'CLIENTE', label: 'CLIENTES' },
            { id: 'FORNECEDOR', label: 'FORNECEDORES' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTipoFiltro(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                tipoFiltro === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleBuscar} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por nome, matrícula ou CPF..."
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition">
            Buscar
          </button>
        </form>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Tipo / Perfil</th>
                <th className="px-4 py-3">Nome / Colaborador</th>
                <th className="px-4 py-3">Matrícula / CPF</th>
                {isFiltroFuncionario ? (
                  <>
                    <th className="px-4 py-3">PIN Acesso</th>
                    <th className="px-4 py-3">Comissão</th>
                    <th className="px-4 py-3">Limite Desc.</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Limite Crédito</th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Carregando entidades...</td></tr>
              ) : entidades.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Nenhum registro encontrado.</td></tr>
              ) : (
                entidades.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-sans">
                      {e.tipo === 'FUNCIONARIO' ? (
                        getCargoBadge(e.cargo)
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {e.tipo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {e.tipo === 'FUNCIONARIO' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      <span>{e.razao_social}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {e.tipo === 'FUNCIONARIO' && e.matricula ? (
                        <span className="text-amber-600 dark:text-amber-400 font-mono">[{e.matricula}] {e.cpf_cnpj}</span>
                      ) : (
                        e.cpf_cnpj
                      )}
                    </td>

                    {isFiltroFuncionario ? (
                      <>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">
                          <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-zinc-300">
                            {e.pin ? `PIN: ${e.pin}` : '1234'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {Number(e.comissao_percentual || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-bold">
                          {Number(e.limite_desconto || 0).toFixed(1)}%
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {e.telefone ? (
                            <span className="flex items-center gap-1.5">
                              <span>{e.telefone}</span>
                              {e.telefone.replace(/\D/g, '') && (
                                <a
                                  href={`https://wa.me/55${e.telefone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-500 hover:text-emerald-400 text-xs font-bold"
                                  title="Conversar no WhatsApp"
                                >
                                  💬
                                </a>
                              )}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.email || '-'}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                          <div>R$ {Number(e.limite_credito || 0).toFixed(2)}</div>
                          {Number(e.saldo_devedor || 0) > 0 && (
                            <div className="text-[10px] text-rose-500 font-bold">Devendo: R$ {Number(e.saldo_devedor).toFixed(2)}</div>
                          )}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => handleEditar(e)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EntidadeFormModal
        isOpen={modalAberto}
        entidadeEditando={entidadeEditando}
        tipoInicial={tipoInicial}
        onClose={() => setModalAberto(false)}
        onSalvo={carregarEntidades}
      />

      <GarcomFormModal
        isOpen={garcomModalAberto}
        garcomEditando={garcomEditando}
        onClose={() => setGarcomModalAberto(false)}
        onSalvo={carregarEntidades}
      />
    </div>
  );
};
