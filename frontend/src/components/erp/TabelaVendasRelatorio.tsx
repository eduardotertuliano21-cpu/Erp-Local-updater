import React, { useState } from 'react';
import { FileText, ShieldAlert, Zap, Ban, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { ModalCancelarNfce } from './ModalCancelarNfce.js';

interface TabelaVendasRelatorioProps {
  dados: any[];
  loading: boolean;
  onAtualizar: () => void;
  onVerDanfe: (vendaId: string) => void;
}

export const TabelaVendasRelatorio: React.FC<TabelaVendasRelatorioProps> = ({
  dados,
  loading,
  onAtualizar,
  onVerDanfe,
}) => {
  const { config } = useStoreConfig();
  const temModuloNfe = Boolean(config?.modulo_nfe);
  const [vendaParaCancelar, setVendaParaCancelar] = useState<any | null>(null);
  const [emitindoId, setEmitindoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const handleEmitirNfce = async (vendaId: string) => {
    setEmitindoId(vendaId);
    setFeedback(null);
    try {
      const res = await api.emitirNfce(vendaId);
      if (res.success) {
        setFeedback({ tipo: 'ok', texto: 'NFC-e emitida e vinculada com sucesso!' });
        onAtualizar();
      } else {
        setFeedback({ tipo: 'erro', texto: res.error || 'Falha na emissão fiscal.' });
      }
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err?.message || 'Erro de comunicação ao emitir NFC-e.' });
    } finally {
      setEmitindoId(null);
    }
  };

  const handleConfirmarCancelamento = async (motivo: string) => {
    if (!vendaParaCancelar) return;
    const res = await api.cancelarNfce(vendaParaCancelar.id, motivo);
    if (res.success) {
      setFeedback({ tipo: 'ok', texto: `Venda/NFC-e #${vendaParaCancelar.numero_sequencial} cancelada com sucesso!` });
      onAtualizar();
    } else {
      throw new Error(res.error || 'Falha ao cancelar venda/nota');
    }
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 font-bold px-1.5">✕</button>
        </div>
      )}

      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold font-sans">
          <tr>
            <th className="px-4 py-3">Cupom #</th>
            <th className="px-4 py-3">Data/Hora</th>
            <th className="px-4 py-3">Operador</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Tipo Fiscal</th>
            <th className="px-4 py-3">Subtotal</th>
            <th className="px-4 py-3">Desconto</th>
            <th className="px-4 py-3">Total Líquido</th>
            <th className="px-4 py-3 text-right">Ações Fiscais</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
          {loading ? (
            <tr><td colSpan={9} className="text-center py-8 text-slate-400 font-sans">Carregando vendas...</td></tr>
          ) : dados.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-8 text-slate-400 font-sans">Nenhuma venda registrada no filtro selecionado.</td></tr>
          ) : (
            dados.map((v) => {
              const isFiscal = Boolean(v.fiscal_id);
              const isCancelada = v.status === 'CANCELADA' || v.fiscal_status === 'CANCELADA';
              const isEmitindo = emitindoId === v.id;

              return (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    #{v.numero_sequencial}
                    {v.total_itens ? <span className="text-[10px] text-slate-400 font-normal block font-sans">{v.total_itens} itens</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(v.criado_em).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-200">{v.operador_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCancelada ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                      {isCancelada ? 'CANCELADA' : v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    {isFiscal ? (
                      isCancelada ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          <Ban className="w-3 h-3" /> NFC-e Cancelada
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            NFC-e #{v.fiscal_numero} (S{v.fiscal_serie || 1})
                          </span>
                          {v.fiscal_chave && (
                            <span className="block text-[9px] font-mono text-slate-400 truncate max-w-[130px]" title={v.fiscal_chave}>
                              {v.fiscal_chave.slice(0, 16)}...
                            </span>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <FileText className="w-3 h-3 text-amber-500" /> Cupom Não Fiscal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">R$ {Number(v.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400">R$ {Number(v.desconto || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      R$ {Number(v.total_liquido).toFixed(2)}
                    </span>
                    {v.metodos_pagamento && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium block truncate max-w-[140px]" title={v.metodos_pagamento}>
                        💳 {v.metodos_pagamento}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isCancelada && isFiscal && (
                        <button
                          onClick={() => onVerDanfe(v.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded text-[11px] font-bold border border-cyan-200 dark:border-cyan-800 transition"
                          title="Ver Cupom Fiscal DANFE NFC-e"
                        >
                          <Eye className="w-3 h-3" /> Ver DANFE
                        </button>
                      )}

                      {!isCancelada && !isFiscal && (
                        <>
                          {temModuloNfe && (
                            <button
                              onClick={() => handleEmitirNfce(v.id)}
                              disabled={isEmitindo}
                              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded text-[11px] font-extrabold shadow-sm transition disabled:opacity-50"
                              title="Converter em Cupom Fiscal NFC-e"
                            >
                              {isEmitindo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-300" />}
                              Emitir NFC-e
                            </button>
                          )}
                          <button
                            onClick={() => onVerDanfe(v.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition"
                            title="Ver Comprovante Não Fiscal"
                          >
                            <FileText className="w-3 h-3" /> Cupom Não Fiscal
                          </button>
                        </>
                      )}

                      {!isCancelada && (
                        <button
                          onClick={() => setVendaParaCancelar(v)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition"
                          title={isFiscal ? 'Cancelar Cupom Fiscal NFC-e e Estornar Estoque' : 'Cancelar Venda Não Fiscal e Estornar Estoque'}
                        >
                          <Ban className="w-3 h-3" /> {isFiscal ? 'Cancelar Nota' : 'Cancelar'}
                        </button>
                      )}

                      {isCancelada && (
                        <span className="text-[11px] font-bold text-slate-400 italic">Cancelada</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {vendaParaCancelar && (
        <ModalCancelarNfce
          venda={vendaParaCancelar}
          onConfirmar={handleConfirmarCancelamento}
          onFechar={() => setVendaParaCancelar(null)}
        />
      )}
    </div>
  );
};
