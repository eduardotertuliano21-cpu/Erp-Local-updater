import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { varejoAvancadoApi } from '../../services/varejoAvancadoApi.js';
import type { Produto, DesossaRecord } from '../../types/pdv.js';
import { Beef, Plus, Trash2, CheckCircle2, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

interface ItemCorteInput {
  produto_id: string;
  descricao: string;
  peso_kg: number;
}

export const DesossaAcougueTab: React.FC = () => {
  const { isAcougue } = useBusinessMode();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [historico, setHistorico] = useState<DesossaRecord[]>([]);
  const [origemProdutoId, setOrigemProdutoId] = useState('');
  const [origemPeso, setOrigemPeso] = useState<number>(50);
  const [origemCustoKg, setOrigemCustoKg] = useState<number>(25);
  const [cortes, setCortes] = useState<ItemCorteInput[]>([
    { produto_id: '', descricao: 'Picanha', peso_kg: 8 },
    { produto_id: '', descricao: 'Alcatra', peso_kg: 15 },
    { produto_id: '', descricao: 'Contra-filé', peso_kg: 12 },
    { produto_id: '', descricao: 'Carne Moída', peso_kg: 10 },
    { produto_id: '', descricao: 'Osso / Sebo / Quebra', peso_kg: 5 },
  ]);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  if (!isAcougue) return null;

  const carregarDados = useCallback(async () => {
    try {
      const [resProd, resHist] = await Promise.all([
        api.pesquisarProdutos('', 'admin'),
        varejoAvancadoApi.listarDesossas(20),
      ]);
      if (resProd.success && resProd.data) setProdutos(resProd.data);
      if (resHist.success && resHist.data) setHistorico(resHist.data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar catálogo para desossa' });
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const custoTotalOrigem = origemPeso * origemCustoKg;
  const pesoTotalCortes = cortes.reduce((acc, c) => acc + (Number(c.peso_kg) || 0), 0);
  const quebraKg = Math.max(0, origemPeso - pesoTotalCortes);
  const quebraPercentual = origemPeso > 0 ? (quebraKg / origemPeso) * 100 : 0;

  const handleAdicionarCorte = () => setCortes((prev) => [...prev, { produto_id: '', descricao: '', peso_kg: 1 }]);
  const handleRemoverCorte = (idx: number) => setCortes((prev) => prev.filter((_, i) => i !== idx));
  const handleAtualizarCorte = (idx: number, campo: keyof ItemCorteInput, valor: any) => {
    setCortes((prev) => prev.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)));
  };

  const handleExecutar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origemProdutoId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione a peça matriz de origem' });
      return;
    }
    if (pesoTotalCortes <= 0) {
      setMensagem({ tipo: 'erro', texto: 'Informe os cortes obtidos e seus respectivos pesos' });
      return;
    }

    setProcessando(true);
    setMensagem(null);
    const prodOrigem = produtos.find((p) => p.id === origemProdutoId);
    try {
      const res = await varejoAvancadoApi.processarDesossa({
        produto_origem_id: origemProdutoId,
        produto_origem_nome: prodOrigem?.descricao || 'Peça Matriz',
        peso_origem: origemPeso,
        custo_origem_total: custoTotalOrigem,
        cortes: cortes.filter((c) => c.peso_kg > 0).map((c) => ({
          produto_destino_id: c.produto_id || '',
          descricao: c.descricao || 'Corte Derivado',
          peso: Number(c.peso_kg),
        })),
      });

      if (res.success) {
        setMensagem({ tipo: 'ok', texto: 'Desossa processada! Estoque da peça matriz baixado e cortes adicionados com rateio de CMV.' });
        carregarDados();
      } else {
        setMensagem({ tipo: 'erro', texto: res.error || 'Falha ao processar transformação' });
      }
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro inesperado' });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Beef className="w-6 h-6 text-rose-500" />
            <span>Rendimento de Desossa & Transformação de Carnes</span>
            <span className="text-xs font-mono font-normal text-slate-400">({historico.length} registros)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Módulo exclusivo de Açougue: dê baixa na carcaça/quarto bovino e distribua o peso e custo exato entre os cortes nobres.
          </p>
        </div>
        <button
          type="button"
          onClick={carregarDados}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${processando ? 'animate-spin' : ''}`} />
          Atualizar
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

      {/* Form de Transformação */}
      <form onSubmit={handleExecutar} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Painel Esquerdo: Matriz Origem */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Scale className="w-4 h-4 text-rose-500" />
            <span>Peça Matriz de Origem</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Produto Matriz (Carcaça / Traseiro / Dianteiro)
            </label>
            <select
              value={origemProdutoId}
              onChange={(e) => setOrigemProdutoId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:border-rose-500"
              required
            >
              <option value="">Selecione uma peça do catálogo...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descricao} ({p.codigo_barras})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Peso Bruto (KG)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={origemPeso}
                onChange={(e) => setOrigemPeso(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Custo Médio / KG (R$)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={origemCustoKg}
                onChange={(e) => setOrigemCustoKg(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Custo Total Matriz:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {custoTotalOrigem.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Peso Total Desossado:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{pesoTotalCortes.toFixed(2)} KG</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-amber-600 dark:text-amber-400">Quebra / Desperdício:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{quebraKg.toFixed(2)} KG ({quebraPercentual.toFixed(1)}%)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processando}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Beef className="w-4 h-4" />
            <span>{processando ? 'Processando Desossa...' : 'Efetivar Rendimento de Desossa'}</span>
          </button>
        </div>

        {/* Painel Direito: Cortes Derivados */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              Cortes Derivados & Rateio de CMV
            </div>
            <button
              type="button"
              onClick={handleAdicionarCorte}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Corte
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {cortes.map((corte, idx) => {
              const perc = pesoTotalCortes > 0 ? ((corte.peso_kg || 0) / pesoTotalCortes) * 100 : 0;
              const custoRateado = custoTotalOrigem * (perc / 100);

              return (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Nome do corte (ex: Picanha)"
                      value={corte.descricao}
                      onChange={(e) => handleAtualizarCorte(idx, 'descricao', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                      required
                    />
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="KG"
                        value={corte.peso_kg}
                        onChange={(e) => handleAtualizarCorte(idx, 'peso_kg', Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        required
                      />
                      <span className="text-[10px] font-bold text-slate-400">KG</span>
                    </div>
                  </div>

                  <div className="col-span-3 text-right">
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{perc.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">R$ {custoRateado.toFixed(2)}</div>
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoverCorte(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                      title="Remover corte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
