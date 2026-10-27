import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Eye, FileText, X } from 'lucide-react';
import { enterpriseApi, type LogAuditoria } from '../../services/enterpriseApi.js';

export const AuditoriaView: React.FC = () => {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroAcao, setFiltroAcao] = useState<string>('');
  const [logSelecionado, setLogSelecionado] = useState<LogAuditoria | null>(null);

  const carregarLogs = async () => {
    setCarregando(true);
    try {
      const data = await enterpriseApi.listarAuditoria(150, filtroAcao || undefined);
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLogs();
  }, [filtroAcao]);

  const getBadgeAcao = (acao: string) => {
    switch (acao) {
      case 'CANCELAMENTO_VENDA':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
      case 'ALTERACAO_PRECO':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'EXCLUSAO_CADASTRO':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'SANGRIA_CAIXA':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'SUPRIMENTO_CAIXA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'FECHAMENTO_CAIXA':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-slate-900/60 overflow-y-auto font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-500" />
            <span>Trilha de Auditoria Enterprise</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro imutável de ações críticas: cancelamentos, alterações de preços e exclusões
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="">Todas as Ações</option>
            <option value="CANCELAMENTO_VENDA">Cancelamento de Venda</option>
            <option value="ALTERACAO_PRECO">Alteração de Preço</option>
            <option value="EXCLUSAO_CADASTRO">Exclusão de Produto</option>
            <option value="SANGRIA_CAIXA">Sangria de Caixa</option>
            <option value="SUPRIMENTO_CAIXA">Suprimento de Caixa</option>
            <option value="FECHAMENTO_CAIXA">Fechamento de Caixa</option>
          </select>

          <button
            onClick={carregarLogs}
            disabled={carregando}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Motivo / Justificativa</th>
                <th className="py-3 px-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    Nenhum log de auditoria encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getBadgeAcao(log.acao)}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans font-medium text-white">
                      {log.usuario_nome || log.usuario_id || 'SISTEMA'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 truncate max-w-xs">
                      {log.motivo || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => setLogSelecionado(log)}
                        className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="Ver dados do log"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Log */}
      {logSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Registro de Auditoria #{logSelecionado.id.slice(-8)}</h3>
              </div>
              <button
                onClick={() => setLogSelecionado(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Ação:</span>
                  <div className="font-bold text-white mt-0.5">{logSelecionado.acao}</div>
                </div>
                <div>
                  <span className="text-slate-500">Data/Hora:</span>
                  <div className="font-mono text-white mt-0.5">
                    {new Date(logSelecionado.criado_em).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Operador:</span>
                  <div className="font-semibold text-white mt-0.5">
                    {logSelecionado.usuario_nome || logSelecionado.usuario_id || 'SISTEMA'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Motivo:</span>
                  <div className="text-white mt-0.5">{logSelecionado.motivo || 'Nenhum motivo informado'}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Carga de Dados (Snapshot JSON):</span>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-blue-300 font-mono overflow-x-auto max-h-56">
                  {logSelecionado.detalhes
                    ? JSON.stringify(JSON.parse(logSelecionado.detalhes), null, 2)
                    : 'Sem detalhes adicionais gravados.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setLogSelecionado(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
