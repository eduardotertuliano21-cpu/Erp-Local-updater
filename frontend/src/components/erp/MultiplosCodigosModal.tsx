import React, { useState, useEffect, useCallback } from 'react';
import type { Produto } from '../../types/pdv.js';
import { varejoAvancadoApi } from '../../services/varejoAvancadoApi.js';
import { Barcode, Plus, Trash2, X, PackageCheck } from 'lucide-react';

interface MultiplosCodigosModalProps {
  isOpen: boolean;
  produto: Produto | null;
  onClose: () => void;
}

export const MultiplosCodigosModal: React.FC<MultiplosCodigosModalProps> = ({
  isOpen,
  produto,
  onClose,
}) => {
  const [codigos, setCodigos] = useState<any[]>([]);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [unidade, setUnidade] = useState('FD');
  const [fatorEntrada, setFatorEntrada] = useState<number>(12);
  const [fatorSaida, setFatorSaida] = useState<number>(12);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!produto?.id) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await varejoAvancadoApi.listarCodigosPorProduto(produto.id);
      if (res.success && res.data) {
        setCodigos(res.data);
      }
    } catch {
      setErro('Erro ao carregar códigos adicionais');
    } finally {
      setCarregando(false);
    }
  }, [produto?.id]);

  useEffect(() => {
    if (isOpen && produto?.id) {
      carregar();
      setNovoCodigo('');
      setUnidade('FD');
      setFatorEntrada(12);
      setFatorSaida(12);
    }
  }, [isOpen, produto?.id, carregar]);

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto?.id || !novoCodigo.trim()) return;
    setErro(null);

    const res = await varejoAvancadoApi.adicionarCodigoBarras(produto.id, {
      codigo_barras: novoCodigo.trim(),
      unidade_medida: unidade.trim() || 'FD',
      fator_entrada: Number(fatorEntrada) || 1,
      fator_saida: Number(fatorSaida) || 1,
    });

    if (res.success) {
      setNovoCodigo('');
      carregar();
    } else {
      setErro(res.error || 'Erro ao vincular código de barras');
    }
  };

  const handleRemover = async (id: string) => {
    const res = await varejoAvancadoApi.removerCodigoBarras(id);
    if (res.success) {
      carregar();
    } else {
      setErro(res.error || 'Erro ao remover código');
    }
  };

  if (!isOpen || !produto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Múltiplos Códigos & Fatores de Conversão (WMS)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {produto.descricao} • Código Principal: <span className="font-mono font-bold">{produto.codigo_barras}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {erro}
            </div>
          )}

          {/* Form to add */}
          <form onSubmit={handleAdicionar} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-indigo-500" />
              <span>Cadastrar Novo Código de Embalagem (ex: Fardo, Caixa, Pacote)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Código de Barras Embalagem
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 7891000100999"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Unidade
                </label>
                <input
                  type="text"
                  required
                  placeholder="FD, CX"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Fator Conversão
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={fatorSaida}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 1;
                    setFatorSaida(v);
                    setFatorEntrada(v);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Vincular Código
              </button>
            </div>
          </form>

          {/* List of existing barcodes */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              Códigos Alternativos Cadastrados ({codigos.length})
            </div>

            {carregando ? (
              <div className="text-center py-6 text-xs text-slate-500">Carregando códigos...</div>
            ) : codigos.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Nenhum código alternativo cadastrado para este produto.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {codigos.map((c) => (
                  <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3">
                      <Barcode className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">{c.codigo_barras}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Embalagem: {c.unidade_medida}</span>
                          <span>•</span>
                          <span>Entrada NF: <strong>x{c.fator_entrada}</strong></span>
                          <span>•</span>
                          <span>Saída PDV: <strong>x{c.fator_saida}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemover(c.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Excluir código"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
