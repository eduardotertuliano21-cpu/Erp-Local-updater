import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { TituloFormModal } from './TituloFormModal.js';

export const FinanceiroView: React.FC = () => {
  const [subTab, setSubTab] = useState<'TITULOS' | 'DRE'>('TITULOS');
  const [tipoFiltro, setTipoFiltro] = useState<'PAGAR' | 'RECEBER' | ''>('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [titulos, setTitulos] = useState<any[]>([]);
  const [totais, setTotais] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalNovo, setModalNovo] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    const [resTitulos, resTotais, resDre] = await Promise.all([
      api.listarTitulosFinanceiros(tipoFiltro, statusFiltro),
      api.obterTotaisFinanceiro(),
      api.obterDRE(),
    ]);

    if (resTitulos.success && resTitulos.data) setTitulos(resTitulos.data);
    if (resTotais.success && resTotais.data) setTotais(resTotais.data);
    if (resDre.success && resDre.data) setDre(resDre.data);
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [tipoFiltro, statusFiltro]);

  const handleLiquidar = async (id: string, valor: number) => {
    if (window.confirm(`Confirmar baixa/liquidação deste título no valor de R$ ${valor.toFixed(2)}?`)) {
      const res = await api.liquidarTituloFinanceiro(id, valor);
      if (res.success) carregarDados();
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">A Pagar Pendente</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            R$ {Number(totais?.totalPagarPendente || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">A Receber Pendente</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            R$ {Number(totais?.totalReceberPendente || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pago no Mês</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            R$ {Number(totais?.totalPagoMes || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">Recebido no Mês</div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
            R$ {Number(totais?.totalRecebidoMes || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Navigation Subtabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSubTab('TITULOS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              subTab === 'TITULOS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            Contas a Pagar & Receber
          </button>
          <button
            onClick={() => setSubTab('DRE')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              subTab === 'DRE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            DRE Gerencial
          </button>
        </div>

        {subTab === 'TITULOS' && (
          <div className="flex items-center gap-2">
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="">TODOS OS TIPOS</option>
              <option value="PAGAR">A PAGAR</option>
              <option value="RECEBER">A RECEBER</option>
            </select>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
            >
              <option value="">TODOS STATUS</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="PAGO">PAGO</option>
            </select>
            <button
              onClick={() => setModalNovo(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              + Novo Lançamento
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {subTab === 'TITULOS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Carregando...</td></tr>
                ) : titulos.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Nenhum título encontrado.</td></tr>
                ) : (
                  titulos.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.tipo === 'PAGAR' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{t.vencimento}</td>
                      <td className="px-4 py-3 font-sans font-medium text-slate-900 dark:text-white">{t.entidade_nome}</td>
                      <td className="px-4 py-3 font-sans text-slate-500 dark:text-slate-400">{t.descricao}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.categoria}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">R$ {Number(t.valor).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'PAGO' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        {t.status !== 'PAGO' && (
                          <button
                            onClick={() => handleLiquidar(t.id, t.valor)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                          >
                            Dar Baixa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRE Gerencial View */}
      {subTab === 'DRE' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-wide border-b border-slate-200 dark:border-slate-800 pb-3">
            DEMONSTRATIVO DE RESULTADOS DO EXERCÍCIO (DRE GERENCIAL)
          </h2>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-700 dark:text-slate-300 font-bold">(+) RECEITA BRUTA DE VENDAS</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {Number(dre?.receitaBruta || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 text-rose-600 dark:text-rose-400">
              <span>(-) Descontos Concedidos em Cupom</span>
              <span>R$ {Number(dre?.descontosVenda || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-3 rounded">
              <span>(=) RECEITA LÍQUIDA DE VENDAS</span>
              <span>R$ {Number(dre?.receitaLiquida || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80 text-amber-600 dark:text-amber-400">
              <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
              <span>R$ {Number(dre?.custoMercadorias || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800 font-bold text-cyan-600 dark:text-cyan-400 bg-slate-50 dark:bg-slate-950 px-3 rounded">
              <span>(=) LUCRO BRUTO OPERACIONAL</span>
              <span>R$ {Number(dre?.lucroBruto || 0).toFixed(2)}</span>
            </div>
            <div className="py-2 space-y-1">
              <div className="text-slate-500 dark:text-slate-400 font-bold">(-) Despesas Operacionais Pagas:</div>
              {dre?.despesasOperacionais && Object.entries(dre.despesasOperacionais).map(([cat, val]) => (
                <div key={cat} className="flex justify-between pl-4 text-slate-600 dark:text-slate-400">
                  <span>• {cat}</span>
                  <span>R$ {Number(val).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pl-4 font-bold text-rose-600 dark:text-rose-400 pt-1">
                <span>Total Despesas</span>
                <span>R$ {Number(dre?.totalDespesas || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-slate-200 dark:border-slate-700 text-sm font-black bg-indigo-50 dark:bg-indigo-950/40 px-3 rounded text-indigo-900 dark:text-indigo-200">
              <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span className={Number(dre?.resultadoLiquido || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                R$ {Number(dre?.resultadoLiquido || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento */}
      <TituloFormModal
        isOpen={modalNovo}
        onClose={() => setModalNovo(false)}
        onSalvo={carregarDados}
      />
    </div>
  );
};
