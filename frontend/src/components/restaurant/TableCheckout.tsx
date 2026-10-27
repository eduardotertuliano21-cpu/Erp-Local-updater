import React, { useState } from 'react';
import {
  ArrowLeft, Users, Receipt, Plus, Sparkles
} from 'lucide-react';
import type { ItemCarrinho } from '../../types/pdv.js';
import { emitNovoPedido } from '../../services/restaurantSocket.js';

interface TableCheckoutProps {
  mesa: any;
  onVoltar: () => void;
  onFinalizarComanda: (itens: ItemCarrinho[], total: number, incluirServico: boolean) => void;
}

export const TableCheckout: React.FC<TableCheckoutProps> = ({
  mesa,
  onVoltar,
  onFinalizarComanda,
}) => {
  const [itens, setItens] = useState<any[]>(mesa.itens || []);
  const [incluirServico, setIncluirServico] = useState<boolean>(true);
  const [showDividirModal, setShowDividirModal] = useState<boolean>(false);
  const [dividirPessoas, setDividirPessoas] = useState<number>(2);

  // Input de item rápido de balcão
  const [extraNome, setExtraNome] = useState('');
  const [extraPreco, setExtraPreco] = useState('');

  const subtotal = itens.reduce((acc, i) => acc + (i.subtotal || i.preco_unitario * i.quantidade), 0);
  const valorServico = incluirServico ? subtotal * 0.1 : 0;
  const totalGeral = subtotal + valorServico;
  const valorPorPessoa = totalGeral / Math.max(1, dividirPessoas);

  const handleAdicionarExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(extraPreco.replace(',', '.'));
    if (!extraNome.trim() || isNaN(preco) || preco <= 0) return;

    const novoItem = {
      id: crypto.randomUUID(),
      descricao: extraNome.trim(),
      preco_unitario: preco,
      quantidade: 1,
      subtotal: preco,
      observacao: 'Adicionado no Caixa',
    };

    setItens((prev) => [...prev, novoItem]);
    emitNovoPedido({
      mesa_numero: mesa.numero,
      itens: [{ descricao: novoItem.descricao, preco_unitario: preco, quantidade: 1, observacao: 'Balcão Caixa' }],
    });

    setExtraNome('');
    setExtraPreco('');
  };

  const handleFinalizar = () => {
    const itensConvertidos: ItemCarrinho[] = itens.map((i) => ({
      id: i.id || crypto.randomUUID(),
      produto_id: i.produto_id || 'prod_food',
      codigo_barras: `MESA${mesa.numero}`,
      descricao: i.observacao ? `${i.descricao} (${i.observacao})` : i.descricao,
      preco_unitario: i.preco_unitario,
      quantidade: i.quantidade,
      desconto: 0,
      subtotal: i.subtotal || i.preco_unitario * i.quantidade,
    }));

    onFinalizarComanda(itensConvertidos, totalGeral, incluirServico);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-950 text-slate-100 overflow-hidden font-sans p-3 sm:p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Mapa [ESC]</span>
          </button>
          <div className="h-6 w-px bg-white/[0.08]" />
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Fechamento da Mesa #{mesa.numero}</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono">
                {mesa.status}
              </span>
            </h2>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              {mesa.garcom_pin && <span>Atendido por: PIN {mesa.garcom_pin}</span>}
              <span>• Total de itens: {itens.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDividirModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-300 text-xs font-bold transition shadow-sm"
          >
            <Users className="w-4 h-4" />
            <span>Dividir Conta [F9]</span>
          </button>
          <button
            onClick={handleFinalizar}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Finalizar Venda [F10]</span>
          </button>
        </div>
      </div>

      {/* Grid 70/30 */}
      <div className="flex-1 grid grid-cols-10 gap-4 overflow-hidden min-h-0">
        {/* Esquerda: 70% Itens da Mesa */}
        <div className="col-span-7 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden min-h-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Itens Consumidos</span>
            <span className="text-xs font-mono text-slate-400 font-bold">{itens.length} lançamentos</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
            {itens.length === 0 ? (
              <div className="text-center py-16 text-slate-500 font-mono text-xs">Nenhum item lançado</div>
            ) : (
              itens.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col min-w-0 pr-3">
                    <span className="font-extrabold text-sm text-white truncate">{item.descricao}</span>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] mt-0.5">
                      <span>{item.quantidade}x R$ {Number(item.preco_unitario).toFixed(2)}</span>
                      {item.observacao && (
                        <span className="text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded italic">
                          Obs: {item.observacao}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-base text-emerald-400 tabular-nums shrink-0">
                    R$ {Number(item.subtotal || item.preco_unitario * item.quantidade).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Adicionar Extra de Balcão */}
          <form onSubmit={handleAdicionarExtra} className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="+ Adicionar item extra de balcão..."
              value={extraNome}
              onChange={(e) => setExtraNome(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="R$ 0,00"
              value={extraPreco}
              onChange={(e) => setExtraPreco(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white font-mono outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        {/* Direita: 30% Totais e 10% de Serviço */}
        <div className="col-span-3 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl overflow-hidden min-h-0">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Resumo da Conta</div>
              <div className="text-2xl font-black text-white mt-1">Mesa #{mesa.numero}</div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Consumo:</span>
                <span className="text-slate-100 font-bold tabular-nums">R$ {subtotal.toFixed(2)}</span>
              </div>

              {/* Toggle de 10% de taxa de serviço */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Taxa Serviço (10%)</div>
                    <div className="text-[10px] text-slate-400">Gorjeta da equipe</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">R$ {valorServico.toFixed(2)}</span>
                  <input
                    type="checkbox"
                    checked={incluirServico}
                    onChange={(e) => setIncluirServico(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </label>

              {dividirPessoas > 1 && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-[11px] text-blue-300">
                  Dividido em {dividirPessoas} pessoas: <b className="text-white font-bold">R$ {valorPorPessoa.toFixed(2)}</b> cada
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">Total a Pagar</div>
            <div className="text-3xl font-black text-emerald-400 tabular-nums">
              R$ {totalGeral.toFixed(2)}
            </div>

            <button
              onClick={handleFinalizar}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              <Receipt className="w-4 h-4" />
              <span>Receber e Finalizar [F10]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dividir Conta */}
      {showDividirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Dividir Conta entre Clientes</h3>
            <p className="text-xs text-slate-400">Total: R$ {totalGeral.toFixed(2)}</p>

            <div className="flex justify-center gap-2 py-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setDividirPessoas(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold font-mono transition ${
                    dividirPessoas === n ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950 text-slate-300 border border-slate-800'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-sm text-slate-300">
              Valor por pessoa: <span className="text-emerald-400 font-black text-lg">R$ {valorPorPessoa.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowDividirModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
