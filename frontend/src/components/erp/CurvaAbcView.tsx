import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Layers, RefreshCw } from 'lucide-react';
import { enterpriseApi, type CurvaAbcResponse, type CurvaAbcItem } from '../../services/enterpriseApi.js';

export const CurvaAbcView: React.FC = () => {
  const [dados, setDados] = useState<CurvaAbcResponse | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [periodo, setPeriodo] = useState<'HOJE' | '7D' | '30D' | 'TUDO'>('30D');

  const carregarDados = async () => {
    setCarregando(true);
    try {
      let inicio: string | undefined;
      const hoje = new Date();

      if (periodo === 'HOJE') {
        inicio = hoje.toISOString().split('T')[0];
      } else if (periodo === '7D') {
        const d = new Date(hoje);
        d.setDate(d.getDate() - 7);
        inicio = d.toISOString().split('T')[0];
      } else if (periodo === '30D') {
        const d = new Date(hoje);
        d.setDate(d.getDate() - 30);
        inicio = d.toISOString().split('T')[0];
      }

      const res = await enterpriseApi.obterCurvaAbc(inicio);
      if (res.data) setDados(res.data);
    } catch (err) {
      console.error('Erro ao calcular Curva ABC:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-slate-900/60 overflow-y-auto font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Curva ABC de Faturamento (BI Enterprise)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Classificação inteligente de produtos por relevância de receita (Classe A: 80%, B: 15%, C: 5%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['HOJE', '7D', '30D', 'TUDO'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  periodo === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'HOJE' ? 'Hoje' : p === '7D' ? '7 Dias' : p === '30D' ? '30 Dias' : 'Tudo'}
              </button>
            ))}
          </div>

          <button
            onClick={carregarDados}
            disabled={carregando}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cards das Classes A, B, C */}
      {dados && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Faturamento no Período</span>
            <div className="text-xl font-black text-white mt-1">
              R$ {dados.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-2">{dados.totalItensVendidos} unidades vendidas</span>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Classe A (80%)</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-300 mt-1">
              R$ {dados.resumoClasses.classeA.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-500/80 mt-2">
              {dados.resumoClasses.classeA.quantidadeProdutos} produtos • {dados.resumoClasses.classeA.percentual}% receita
            </span>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Classe B (15%)</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-300 mt-1">
              R$ {dados.resumoClasses.classeB.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-amber-500/80 mt-2">
              {dados.resumoClasses.classeB.quantidadeProdutos} produtos • {dados.resumoClasses.classeB.percentual}% receita
            </span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Classe C (5%)</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-black text-slate-200 mt-1">
              R$ {dados.resumoClasses.classeC.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              {dados.resumoClasses.classeC.quantidadeProdutos} produtos • {dados.resumoClasses.classeC.percentual}% receita
            </span>
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4 text-right">Qtd Vendida</th>
                <th className="py-3 px-4 text-right">Faturamento</th>
                <th className="py-3 px-4 text-right">% do Total</th>
                <th className="py-3 px-4 text-right">% Acumulado</th>
                <th className="py-3 px-4 text-center">Classe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {!dados || dados.produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    Nenhuma venda registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                dados.produtos.map((p: CurvaAbcItem, idx: number) => (
                  <tr key={p.produto_id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white truncate max-w-xs">
                      {p.descricao}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{p.quantidade_total}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      R$ {p.faturamento_total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{p.percentual_faturamento}%</td>
                    <td className="py-3 px-4 text-right text-blue-400">{p.percentual_acumulado}%</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.classe === 'A'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : p.classe === 'B'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        Classe {p.classe}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
