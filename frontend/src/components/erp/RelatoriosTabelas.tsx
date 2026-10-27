import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { TabelaVendasRelatorio } from './TabelaVendasRelatorio.js';

interface RelatoriosTabelasProps {
  tipo: 'VENDAS' | 'CAIXAS' | 'FISCAL' | 'AUDITORIA';
  dados: any[];
  loading: boolean;
  onAtualizar?: () => void;
}

export const RelatoriosTabelas: React.FC<RelatoriosTabelasProps> = ({ tipo, dados, loading, onAtualizar }) => {
  const [danfeModal, setDanfeModal] = useState<string | null>(null);

  const handleVerDanfe = async (vendaId: string) => {
    const res = await api.obterDanfeCupom(vendaId);
    if (res.success && res.data) {
      setDanfeModal(res.data.cupom.textoFormatado);
    } else {
      alert(res.error || 'DANFE não disponível para esta venda.');
    }
  };

  const formatarData = (d?: string | null) => {
    if (!d) return '-';
    try {
      const dataIso = d.includes('T') ? d : d.replace(' ', 'T');
      const parsed = new Date(dataIso);
      return isNaN(parsed.getTime()) ? d : parsed.toLocaleString('pt-BR');
    } catch {
      return d;
    }
  };

  const formatarValor = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {tipo === 'VENDAS' ? (
        <TabelaVendasRelatorio
          dados={dados}
          loading={loading}
          onAtualizar={onAtualizar || (() => {})}
          onVerDanfe={handleVerDanfe}
        />
      ) : (
        <div className="overflow-x-auto">

        {tipo === 'CAIXAS' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold font-sans">
              <tr>
                <th className="px-4 py-3">Caixa #</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Abertura</th>
                <th className="px-4 py-3">Fechamento</th>
                <th className="px-4 py-3">Fundo Inicial</th>
                <th className="px-4 py-3">Saldo Final</th>
                <th className="px-4 py-3">Faturamento</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Carregando caixas...</td></tr>
              ) : dados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-sans">Nenhuma sessão de caixa encontrada.</td></tr>
              ) : (
                dados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">#{c.numero ?? 1}</td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-200">{c.operador || c.operador_abertura || 'Operador'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatarData(c.aberto_em)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatarData(c.fechado_em)}</td>
                    <td className="px-4 py-3 font-mono">{formatarValor(c.saldo_inicial)}</td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {c.saldo_final !== null && c.saldo_final !== undefined
                        ? formatarValor(c.saldo_final)
                        : <span className="text-amber-500 dark:text-amber-400 text-[11px] font-sans font-medium">Em Aberto</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">
                      {formatarValor(c.faturamento_total || 0)}
                      {c.total_vendas > 0 && <span className="text-[10px] text-slate-400 font-sans ml-1">({c.total_vendas} v.)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'ABERTO'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {c.status || 'FECHADO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tipo === 'FISCAL' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold font-sans">
              <tr>
                <th className="px-4 py-3">Série/Número</th>
                <th className="px-4 py-3">Chave de Acesso NFC-e</th>
                <th className="px-4 py-3">Venda ID</th>
                <th className="px-4 py-3">Status SEFAZ</th>
                <th className="px-4 py-3">Data Emissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-sans">Carregando notas...</td></tr>
              ) : dados.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-sans">Nenhum documento em contingência.</td></tr>
              ) : (
                dados.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{f.serie} / {f.numero}</td>
                    <td className="px-4 py-3 text-cyan-600 dark:text-cyan-400 text-[11px] truncate max-w-[200px]">{f.chave_acesso}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[120px]">{f.venda_id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(f.criado_em).toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tipo === 'AUDITORIA' && (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold font-sans">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-sans">Carregando auditoria...</td></tr>
              ) : dados.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 font-sans">Nenhum log de auditoria.</td></tr>
              ) : (
                dados.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(a.criado_em).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 font-sans text-slate-900 dark:text-white font-medium">{a.operador_id}</td>
                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{a.acao}</td>
                    <td className="px-4 py-3 font-sans text-slate-500 dark:text-slate-400">{a.detalhes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

      {danfeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">CUPOM FISCAL DANFE NFC-e</h3>
              <button onClick={() => setDanfeModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>
            <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded font-mono text-[11px] text-emerald-700 dark:text-emerald-400 overflow-auto max-h-96 border border-slate-200 dark:border-slate-800">
              {danfeModal}
            </pre>
            <div className="flex justify-end">
              <button onClick={() => setDanfeModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
