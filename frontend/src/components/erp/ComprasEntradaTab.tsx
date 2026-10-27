import React, { useState, useEffect, useCallback } from 'react';
import type { CompraEntrada } from '../../types/pdv.js';
import { varejoAvancadoApi } from '../../services/varejoAvancadoApi.js';
import { FileText, CheckCircle2, RotateCcw, RefreshCw, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

export const ComprasEntradaTab: React.FC = () => {
  const [compras, setCompras] = useState<CompraEntrada[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregarCompras = useCallback(async () => {
    setCarregando(true);
    setMensagem(null);
    try {
      const res = await varejoAvancadoApi.listarCompras();
      if (res.success && res.data) {
        setCompras(res.data);
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao conectar ao banco local para listar compras' });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCompras();
  }, [carregarCompras]);

  const handleEfetivar = async (compra: CompraEntrada) => {
    setProcessandoId(compra.id);
    setMensagem(null);
    try {
      const res = await varejoAvancadoApi.efetivarCompra(compra.id);
      if (res.success) {
        setMensagem({ tipo: 'ok', texto: `Entrada NF #${compra.numero_nota || compra.id.slice(0, 8)} efetivada com sucesso! Estoque e Financeiro atualizados.` });
        carregarCompras();
      } else {
        setMensagem({ tipo: 'erro', texto: res.error || 'Falha ao efetivar entrada de compra' });
      }
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro inesperado' });
    } finally {
      setProcessandoId(null);
    }
  };

  const handleDesatualizar = async (compra: CompraEntrada) => {
    setProcessandoId(compra.id);
    setMensagem(null);
    try {
      const res = await varejoAvancadoApi.desatualizarCompra(compra.id);
      if (res.success) {
        setMensagem({ tipo: 'ok', texto: `Entrada NF #${compra.numero_nota || compra.id.slice(0, 8)} revertida para rascunho. Estoque e títulos cancelados.` });
        carregarCompras();
      } else {
        setMensagem({ tipo: 'erro', texto: res.error || 'Falha ao reverter entrada' });
      }
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro inesperado' });
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>G.E.M. — Entrada de Mercadorias em 2 Etapas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Importe o XML em modo Rascunho (Draft), faça os vínculos de conversão e só então efetive no estoque e contas a pagar.
          </p>
        </div>
        <button
          type="button"
          onClick={carregarCompras}
          disabled={carregando}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {mensagem && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          mensagem.tipo === 'ok'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {mensagem.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Tabela de Compras */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Número NF / Chave</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Emissão / Data</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {carregando && compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">Carregando entradas de compras...</td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhuma nota de compra encontrada. Importe um arquivo XML de NF-e para iniciar.
                  </td>
                </tr>
              ) : (
                compras.map((c) => {
                  const isEfetivado = c.status === 1;
                  const emProgresso = processandoId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isEfetivado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            EFETIVADA (ESTOQUE OK)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            RASCUNHO (PENDENTE)
                          </span>
                        )}
                      </td>

                      {/* NF / Chave */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>NF {c.numero_nota || 'S/N'}</span>
                          {c.serie && <span className="text-[10px] text-slate-400 font-mono">Sér {c.serie}</span>}
                        </div>
                        {c.chave_nfe && (
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={c.chave_nfe}>
                            {c.chave_nfe}
                          </div>
                        )}
                      </td>

                      {/* Fornecedor */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                          {c.fornecedor_nome || 'Fornecedor Desconhecido'}
                        </div>
                        {c.fornecedor_cnpj && (
                          <div className="font-mono text-[10px] text-slate-400">{c.fornecedor_cnpj}</div>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        {c.data_emissao ? new Date(c.data_emissao).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right font-black font-mono text-slate-900 dark:text-emerald-400 text-sm">
                        R$ {Number(c.valor_total || 0).toFixed(2)}
                      </td>

                      {/* Botões */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {!isEfetivado ? (
                          <button
                            type="button"
                            disabled={emProgresso}
                            onClick={() => handleEfetivar(c)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            title="Alimentar estoque base e gerar Contas a Pagar"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{emProgresso ? 'Efetivando...' : 'Efetivar Entrada'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={emProgresso}
                            onClick={() => handleDesatualizar(c)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Reverter para rascunho, estornando estoque e títulos a pagar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{emProgresso ? 'Revertendo...' : 'Desatualizar'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
