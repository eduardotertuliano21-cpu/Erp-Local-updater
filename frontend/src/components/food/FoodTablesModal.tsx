import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Users, Receipt, Printer, X, Sparkles } from 'lucide-react';
import type { ItemCarrinho } from '../../types/pdv.js';
import { api } from '../../services/api.js';
import { subscribeToMesas, emitLiberaMesa } from '../../services/restaurantSocket.js';

interface FoodTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarregarMesaNoCaixa: (itens: ItemCarrinho[], identificador: string) => void;
}

export const FoodTablesModal: React.FC<FoodTablesModalProps> = ({
  isOpen,
  onClose,
  onCarregarMesaNoCaixa,
}) => {
  const [mesas, setMesas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'LIVRE' | 'OCUPADA' | 'FECHANDO'>('TODAS');
  const [selecionadaNumero, setSelecionadaNumero] = useState<number | null>(null);
  const [incluirServico, setIncluirServico] = useState<boolean>(true);
  const [dividirPessoas, setDividirPessoas] = useState<number>(1);
  const [cozinhaEnviada, setCozinhaEnviada] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    api.obterMesasRestaurante().then((res) => {
      if (res.success && res.data?.length) setMesas(res.data);
    });
    const unsub = subscribeToMesas(
      (todas) => { if (todas?.length) setMesas(todas); },
      (atual) => setMesas((prev) => prev.map((m) => (m.numero === atual.numero ? atual : m)))
    );
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const mesaSelecionada = mesas.find((m) => m.numero === selecionadaNumero) ||
    mesas.find((m) => m.status !== 'LIVRE') ||
    mesas[0] || { numero: 1, status: 'LIVRE', itens: [], subtotal: 0, pessoas: 0 };

  const subtotalMesa = Number(mesaSelecionada.subtotal || 0);
  const valorServico = incluirServico ? subtotalMesa * 0.1 : 0;
  const totalMesa = subtotalMesa + valorServico;
  const valorPorPessoa = totalMesa / Math.max(1, dividirPessoas);
  const mesasFiltradas = mesas.filter((m) => filtro === 'TODAS' || m.status === filtro);

  const handleTransferirParaCaixa = () => {
    if (!mesaSelecionada.itens?.length) return;
    const nomeMesa = `Mesa ${mesaSelecionada.numero}`;

    const itensCarrinho: ItemCarrinho[] = mesaSelecionada.itens.map((it: any) => ({
      id: it.id || crypto.randomUUID(),
      produto_id: it.produto_id || 'prod_mesa',
      codigo_barras: 'MESA-' + mesaSelecionada.numero,
      descricao: it.descricao,
      preco_unitario: Number(it.preco_unitario),
      quantidade: Number(it.quantidade),
      desconto: 0,
      subtotal: Number(it.subtotal || (it.preco_unitario * it.quantidade)),
      observacao: it.observacao,
    }));

    if (incluirServico && valorServico > 0) {
      itensCarrinho.push({
        id: crypto.randomUUID(),
        produto_id: 'taxa_servico',
        codigo_barras: 'SERV-10',
        descricao: 'TAXA DE SERVIÇO GARÇOM (10%)',
        preco_unitario: valorServico,
        quantidade: 1,
        desconto: 0,
        subtotal: valorServico,
      });
    }

    emitLiberaMesa(mesaSelecionada.numero);
    onCarregarMesaNoCaixa(itensCarrinho, nomeMesa);
    onClose();
  };

  const getStatusColor = (st: string) => {
    if (st === 'LIVRE') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (st === 'OCUPADA') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Gestão de Mesas & Comandas</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">PDV ONLINE</span>
              </h2>
              <p className="text-xs text-slate-400">Sincronizado ao vivo com o salão e celular dos garçons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {(['TODAS', 'LIVRE', 'OCUPADA', 'FECHANDO'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltro(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    filtro === st ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st === 'TODAS' ? 'Todas as Mesas' : st}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mesasFiltradas.map((m) => {
                const isSelected = m.numero === mesaSelecionada.numero;
                return (
                  <div
                    key={m.numero}
                    onClick={() => setSelecionadaNumero(m.numero)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between h-28 ${
                      isSelected ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">Mesa {m.numero}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusColor(m.status)}`}>{m.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span>{m.pessoas || 0}</span></div>
                      <div className="font-bold text-slate-200">{m.subtotal > 0 ? `R$ ${Number(m.subtotal).toFixed(2)}` : 'Vazia'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-slate-950/40 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Mesa #{mesaSelecionada.numero}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {mesaSelecionada.status === 'LIVRE' ? 'Mesa Disponível' : `${mesaSelecionada.itens?.length || 0} itens consumidos`}
                  </div>
                </div>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${getStatusColor(mesaSelecionada.status)}`}>{mesaSelecionada.status}</span>
              </div>

              <div className="py-3 space-y-2 max-h-48 overflow-y-auto">
                {(!mesaSelecionada.itens || mesaSelecionada.itens.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">Nenhum item lançado nesta mesa</div>
                ) : (
                  mesaSelecionada.itens.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                      <div>
                        <div className="font-bold text-white truncate max-w-[180px]">{item.descricao}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.quantidade}x R$ {Number(item.preco_unitario).toFixed(2)}
                          {item.observacao && <span className="text-amber-400 ml-1">({item.observacao})</span>}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400">R$ {Number(item.subtotal || item.preco_unitario * item.quantidade).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>

              {mesaSelecionada.itens?.length > 0 && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Subtotal Consumo:</span><span className="font-bold">R$ {subtotalMesa.toFixed(2)}</span>
                  </div>
                  <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-800">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Taxa de Serviço Garçom (10%):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">R$ {valorServico.toFixed(2)}</span>
                      <input type="checkbox" checked={incluirServico} onChange={(e) => setIncluirServico(e.target.checked)} className="rounded border-slate-700 text-amber-500" />
                    </div>
                  </label>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-white font-bold text-sm">
                    <span>Total da Mesa:</span><span className="text-emerald-400 font-black">R$ {totalMesa.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Dividir entre pessoas:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <button key={n} type="button" onClick={() => setDividirPessoas(n)} className={`w-6 h-6 rounded-lg text-xs font-bold font-mono ${dividirPessoas === n ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  {dividirPessoas > 1 && (
                    <div className="text-right text-xs text-amber-300 font-bold">R$ {valorPorPessoa.toFixed(2)} por pessoa ({dividirPessoas}x)</div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="button"
                onClick={() => { setCozinhaEnviada(true); setTimeout(() => setCozinhaEnviada(false), 2000); }}
                disabled={!mesaSelecionada.itens?.length}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>{cozinhaEnviada ? '✓ Pedido Enviado para Cozinha!' : 'Imprimir Ticket Cozinha'}</span>
              </button>
              <button
                type="button"
                onClick={handleTransferirParaCaixa}
                disabled={!mesaSelecionada.itens?.length}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Receipt className="w-4 h-4" />
                <span>Lançar no Caixa / Fechar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
