import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart, FolderOpen, Eye, Ban, Search, RefreshCw, FolderTree, FileCode2, FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { nfeDanfeApi } from '../../services/nfeDanfeApi.js';

interface NfeRelatoriosTabProps {
  modoExibicao: 'RELATORIOS' | 'PASTAS';
  onVisualizarNota: (nota: any) => void;
}

export const NfeRelatoriosTab: React.FC<NfeRelatoriosTabProps> = ({ modoExibicao, onVisualizarNota }) => {
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODAS');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [notas, setNotas] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [estruturaPastas, setEstruturaPastas] = useState<{ diretorioRaiz: string; pastas: any[] }>({ diretorioRaiz: '', pastas: [] });

  const [notaParaCancelar, setNotaParaCancelar] = useState<any | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [resLista, resPastas] = await Promise.all([
        nfeDanfeApi.listar({ inicio, fim, status: statusFiltro, q: busca }),
        nfeDanfeApi.listarPastas(),
      ]);
      if (resLista.success && resLista.data) {
        setNotas(resLista.data.notas || []);
        setResumo(resLista.data.resumo || null);
      }
      if (resPastas.success && resPastas.data) {
        setEstruturaPastas(resPastas.data);
      }
    } finally {
      setCarregando(false);
    }
  }, [inicio, fim, statusFiltro, busca]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleVerDanfe = async (id: string) => {
    const res = await nfeDanfeApi.obterDetalhes(id);
    if (res.success && res.data) {
      onVisualizarNota(res.data);
    }
  };

  const handleConfirmarCancelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaParaCancelar || motivoCancelamento.trim().length < 5) return;
    const res = await nfeDanfeApi.cancelar(notaParaCancelar.id, motivoCancelamento.trim());
    if (res.success) {
      setFeedback({ tipo: 'ok', texto: `NF-e Nº ${notaParaCancelar.numero} cancelada e estornada com sucesso!` });
      setNotaParaCancelar(null);
      setMotivoCancelamento('');
      carregarDados();
    } else {
      setFeedback({ tipo: 'erro', texto: res.error || 'Erro ao cancelar NF-e.' });
    }
  };

  if (modoExibicao === 'PASTAS') {
    return (
      <div className="space-y-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span>Organização Automática de Pastas (Ano / Mês / Data)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
              Diretório Raiz Local: <b>{estruturaPastas.diretorioRaiz || 'data/notas_nfe'}</b>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={carregarDados} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button type="button" onClick={() => nfeDanfeApi.abrirPasta(estruturaPastas.diretorioRaiz)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md cursor-pointer">
              <FolderOpen className="w-4 h-4" /> Abrir Pasta Raiz no Computador
            </button>
          </div>
        </div>

        {estruturaPastas.pastas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400">
            Nenhuma pasta de NF-e gerada ainda. Emita sua primeira nota na aba <b>"Emitir Nova NF-e / DANFE"</b> para criar a estrutura <code>Ano / Mês / Data / NumeroNota_NomeCliente</code> automaticamente.
          </div>
        ) : (
          <div className="space-y-3">
            {estruturaPastas.pastas.map((p, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono font-black">
                      📁 Ano {p.ano} / Mês {p.mes} / Data {p.data}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-md">{p.caminhoCompleto}</span>
                  </div>
                  <button type="button" onClick={() => nfeDanfeApi.abrirPasta(p.caminhoCompleto)} className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-amber-500 dark:text-amber-300 font-bold flex items-center gap-1 cursor-pointer">
                    <FolderOpen className="w-3.5 h-3.5" /> Abrir esta Pasta
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {p.arquivos.map((arq: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        {arq.tipo === 'XML' ? <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" /> : <FileText className="w-4 h-4 text-emerald-400 shrink-0" />}
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={arq.nome}>{arq.nome}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{(arq.tamanhoBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      {feedback && (
        <div className={`p-3 rounded-xl font-bold flex items-center justify-between border ${feedback.tipo === 'ok' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'}`}>
          <div className="flex items-center gap-2">
            {feedback.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="px-1.5 cursor-pointer">✕</button>
        </div>
      )}

      {/* KPIs Exclusivos do Relatório de DANFE NF-e */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Faturamento NF-e (DANFE)</span>
          <span className="text-xl font-black text-emerald-500 font-mono mt-1 block">
            R$ {Number(resumo?.valor_total_autorizadas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">Somente notas Modelo 55 ativas</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Notas Emitidas no Período</span>
          <span className="text-xl font-black text-sky-400 font-mono mt-1 block">
            {resumo?.qtd_autorizadas || 0} <span className="text-xs font-normal text-slate-400">autorizadas</span>
          </span>
          <span className="text-[10px] text-rose-400">{resumo?.qtd_canceladas || 0} canceladas</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Impostos Destacados (ICMS + IPI)</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
            R$ {(Number(resumo?.valor_icms_total || 0) + Number(resumo?.valor_ipi_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">ICMS: R$ {Number(resumo?.valor_icms_total || 0).toFixed(2)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Pastas Fiscais no Computador</span>
          <button type="button" onClick={() => nfeDanfeApi.abrirPasta(estruturaPastas.diretorioRaiz)} className="mt-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-300 border border-amber-500/30 font-extrabold flex items-center justify-center gap-1.5 cursor-pointer">
            <FolderOpen className="w-4 h-4" /> Abrir Pasta de Notas
          </button>
        </div>
      </div>

      {/* Barra de Filtros do Relatório DANFE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-end gap-3 shadow-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data Inicial</label>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-mono" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data Final</label>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-mono" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold">
            <option value="TODAS">Todas as Notas</option>
            <option value="AUTORIZADA">Autorizadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Buscar por Cliente / Empresa / Nº da Nota</label>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome do cliente, CNPJ ou número..." className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none" />
          </div>
        </div>
        <button type="button" onClick={carregarDados} className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 cursor-pointer">
          <FileBarChart className="w-3.5 h-3.5" /> Filtrar Relatório
        </button>
      </div>

      {/* Tabela de Notas NF-e / DANFE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-sans text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">NF-e Nº / Série</th>
                <th className="px-4 py-3">Emissão</th>
                <th className="px-4 py-3">Cliente / Empresa Destinatária</th>
                <th className="px-4 py-3">Arquivo Salvo (Ano/Mês/Data)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-right">Ações DANFE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {notas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Nenhuma NF-e / DANFE encontrada para os filtros selecionados.</td></tr>
              ) : (
                notas.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      #{String(n.numero).padStart(6, '0')} <span className="text-[10px] text-slate-400 font-normal">S{n.serie}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(n.emitido_em).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{n.destinatario_nome}</div>
                      <div className="text-[10px] font-mono text-slate-400">{n.destinatario_documento} • {n.natureza_operacao}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold block truncate max-w-[230px]" title={n.caminho_xml}>
                        {n.nome_arquivo_base}.xml
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.status === 'CANCELADA' ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {Number(n.valor_total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => handleVerDanfe(n.id)} className="px-2.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                          <Eye className="w-3 h-3" /> DANFE / XML
                        </button>
                        <button type="button" onClick={() => nfeDanfeApi.abrirPasta(n.caminho_pasta)} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-amber-500 dark:text-amber-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer" title="Abrir pasta Ano/Mês/Data">
                          <FolderOpen className="w-3 h-3" /> Pasta
                        </button>
                        {n.status !== 'CANCELADA' && (
                          <button type="button" onClick={() => setNotaParaCancelar(n)} className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                            <Ban className="w-3 h-3" /> Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cancelar NF-e */}
      {notaParaCancelar && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmarCancelamento} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <h4 className="font-black text-rose-500 text-sm uppercase">Cancelar NF-e Nº {notaParaCancelar.numero} ({notaParaCancelar.destinatario_nome})</h4>
            <textarea required rows={3} value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value)} placeholder="Informe o motivo do cancelamento (mínimo 5 caracteres)..." className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNotaParaCancelar(null)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer">Voltar</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black cursor-pointer">Confirmar Cancelamento</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
