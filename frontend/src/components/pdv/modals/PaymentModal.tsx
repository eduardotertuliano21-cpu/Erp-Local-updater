import React, { useState, useEffect, useRef } from 'react';
import type { ItemCarrinho, MetodoPagamento, PagamentoItem } from '../../../types/pdv.js';
import { api } from '../../../services/api.js';
import { useOperacao } from '../../../context/OperacaoContext.js';
import { useStoreConfig } from '../../../context/ConfigProvider.js';
import { ConvenioClienteSelector } from './ConvenioClienteSelector.js';
import { TefPaymentModal } from './TefPaymentModal.js';
import { PaymentMethodGrid, METODOS_BASE, type MetodoOpcao } from './PaymentMethodGrid.js';
import { MultiPaymentSummary } from './MultiPaymentSummary.js';
import { formatarCpfCnpj, validarCpf } from '../../../utils/cpfHelper.js';
import { CheckCircle, AlertCircle, Plus, Users } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  totalPagar: number;
  itens: ItemCarrinho[];
  caixaId: string;
  operadorId: string;
  cpfInicial?: string;
  onClose: () => void;
  onSuccess: (troco: number, vendaId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, totalPagar, itens, caixaId, operadorId, cpfInicial, onClose, onSuccess,
}) => {
  const { config: opConfig } = useOperacao();
  const { featureFlags } = useStoreConfig();
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('DINHEIRO');
  const [valorInputStr, setValorInputStr] = useState<string>('');
  const [cpfCliente, setCpfCliente] = useState<string>('');
  const [clienteConvenio, setClienteConvenio] = useState<any | null>(null);
  const [convenioBloqueado, setConvenioBloqueado] = useState<boolean>(false);
  const [trocoDinheiro, setTrocoDinheiro] = useState<number>(0);
  const [processando, setProcessando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usarTef, setUsarTef] = useState<boolean>(false);
  const [isTefModalOpen, setIsTefModalOpen] = useState<boolean>(false);
  const valorInputRef = useRef<HTMLInputElement>(null);

  const metodos: MetodoOpcao[] = [
    ...METODOS_BASE,
    ...(featureFlags.convenio ? [{ id: 'CONVENIO' as MetodoPagamento, label: '5 - Convênio / Fiado', keyNumber: '5', icon: Users }] : []),
  ];

  const totalLancado = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const restante = Math.max(0, Number((totalPagar - totalLancado).toFixed(2)));

  useEffect(() => {
    if (isOpen) {
      setPagamentos([]);
      setMetodoSelecionado(opConfig.pagamento_padrao || 'DINHEIRO');
      setValorInputStr(totalPagar.toFixed(2));
      setCpfCliente(cpfInicial ? formatarCpfCnpj(cpfInicial) : '');
      setClienteConvenio(null);
      setConvenioBloqueado(false);
      setTrocoDinheiro(0);
      setErro(null);
      setTimeout(() => valorInputRef.current?.select(), 50);
    }
  }, [isOpen, totalPagar, opConfig.pagamento_padrao, cpfInicial]);

  const valorDigitado = parseFloat(valorInputStr.replace(',', '.')) || 0;
  const trocoCalculado = metodoSelecionado === 'DINHEIRO' && valorDigitado > restante ? Number((valorDigitado - restante).toFixed(2)) : 0;
  const trocoTotal = Math.max(trocoDinheiro, trocoCalculado);

  const handleAdicionarPagamento = (overrideValor?: number, overrideMetodo?: MetodoPagamento, detalhes?: string) => {
    const metodo = overrideMetodo || metodoSelecionado;
    const valor = overrideValor !== undefined ? overrideValor : valorDigitado;
    if (valor <= 0) { setErro('Informe um valor de pagamento maior que zero.'); return false; }
    if (metodo === 'CONVENIO') {
      if (!clienteConvenio) { setErro('Selecione um cliente para autorizar o convênio.'); return false; }
      if (convenioBloqueado) { setErro('Limite de crédito insuficiente para o convênio.'); return false; }
    }

    let valorEfetivo = valor;
    if (metodo === 'DINHEIRO' && valor > restante) {
      setTrocoDinheiro(Number((valor - restante).toFixed(2)));
      valorEfetivo = restante;
    } else if (valor > restante) {
      valorEfetivo = restante;
    }

    valorEfetivo = Number(valorEfetivo.toFixed(2));
    const novos = [...pagamentos, { metodo, valor: valorEfetivo, detalhes: detalhes || (metodo === 'CONVENIO' ? `Cliente: ${clienteConvenio.razao_social}` : undefined) }];
    setPagamentos(novos);
    setErro(null);

    const novoTotal = novos.reduce((acc, p) => acc + p.valor, 0);
    const novoRestante = Math.max(0, Number((totalPagar - novoTotal).toFixed(2)));
    setValorInputStr(novoRestante > 0 ? novoRestante.toFixed(2) : '');
    setTimeout(() => valorInputRef.current?.select(), 50);
    return true;
  };

  const handleRemoverPagamento = (index: number) => {
    const novos = pagamentos.filter((_, i) => i !== index);
    setPagamentos(novos);
    const novoTotal = novos.reduce((acc, p) => acc + p.valor, 0);
    const novoRestante = Math.max(0, Number((totalPagar - novoTotal).toFixed(2)));
    setValorInputStr(novoRestante.toFixed(2));
    setTrocoDinheiro(0);
    setErro(null);
  };

  const dispararVendaFinal = async (listaPags: PagamentoItem[], trocoFinal: number) => {
    const docLimpo = cpfCliente.replace(/\D/g, '');
    if (docLimpo.length === 11 && !validarCpf(docLimpo)) {
      setErro('CPF inválido. Corrija o documento antes de emitir para a Nota Fiscal Paulista.');
      return;
    }
    setProcessando(true);
    setErro(null);
    try {
      const res = await api.finalizarVenda({
        caixa_id: caixaId, operador_id: operadorId, cpf_cliente: docLimpo || undefined,
        itens, pagamentos: listaPags, troco: trocoFinal, cliente_id: clienteConvenio?.id, cliente_nome: clienteConvenio?.razao_social,
      } as any);
      if (res.success && res.data) onSuccess(trocoFinal, res.data.id);
      else setErro(res.error || 'Falha ao processar venda');
    } catch (e: any) {
      setErro(e.message || 'Erro inesperado na comunicação');
    } finally {
      setProcessando(false);
    }
  };

  const handleFinalizar = async () => {
    if (restante > 0) {
      if (valorDigitado > 0) {
        if ((metodoSelecionado === 'CARTAO_DEBITO' || metodoSelecionado === 'CARTAO_CREDITO') && usarTef) {
          setIsTefModalOpen(true);
          return;
        }
        let valorEfetivo = valorDigitado;
        let novoTroco = trocoDinheiro;
        if (metodoSelecionado === 'DINHEIRO' && valorDigitado > restante) {
          novoTroco = Number((valorDigitado - restante).toFixed(2));
          valorEfetivo = restante;
        } else if (valorDigitado > restante) {
          valorEfetivo = restante;
        }
        const listaAtualizada = [...pagamentos, { metodo: metodoSelecionado, valor: Number(valorEfetivo.toFixed(2)) }];
        const novoTotal = listaAtualizada.reduce((acc, p) => acc + p.valor, 0);
        if (novoTotal >= totalPagar - 0.001) {
          await dispararVendaFinal(listaAtualizada, novoTroco);
          return;
        } else {
          handleAdicionarPagamento();
          return;
        }
      }
      setErro(`Falta pagar R$ ${restante.toFixed(2)}. Adicione outra forma de pagamento.`);
      return;
    }
    await dispararVendaFinal(pagamentos, trocoTotal);
  };

  const handleTefSuccess = (tef: { nsu: string; bandeira: string; codigoAutorizacao: string }) => {
    setIsTefModalOpen(false);
    handleAdicionarPagamento(valorDigitado, metodoSelecionado, `TEF: ${tef.bandeira} NSU: ${tef.nsu} AUT: ${tef.codigoAutorizacao}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    else if (e.key === 'Enter') { e.preventDefault(); handleFinalizar(); }
    else if (['1', '2', '3', '4', '5'].includes(e.key) && (e.ctrlKey || e.altKey)) {
      e.preventDefault();
      const m = metodos.find((item) => item.keyNumber === e.key);
      if (m) setMetodoSelecionado(m.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div onKeyDown={handleKeyDown} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-surface-900 to-surface-950 border border-white/[0.1] w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <span>Finalização de Pagamento (Múltiplas Formas)</span>
          </h2>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white/[0.06] text-zinc-400 border border-white/[0.08] rounded-lg">ESC</kbd>
        </div>

        <MultiPaymentSummary totalPagar={totalPagar} pagamentos={pagamentos} restante={restante} troco={trocoTotal} onRemover={handleRemoverPagamento} />

        <div className="space-y-1 bg-black/40 px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <label htmlFor="cpf-nota-input" className="text-[11px] font-bold text-zinc-400 whitespace-nowrap">CPF na Nota:</label>
            <input
              id="cpf-nota-input" type="text" value={cpfCliente}
              onChange={(e) => setCpfCliente(formatarCpfCnpj(e.target.value))}
              placeholder="000.000.000-00 (Nota Paulista)"
              className="flex-1 bg-black/60 border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-brand focus:outline-none"
            />
          </div>
          {cpfCliente.replace(/\D/g, '').length === 11 && (
            <span className={`text-[10px] font-bold block ${validarCpf(cpfCliente) ? 'text-emerald-400' : 'text-amber-400'}`}>
              {validarCpf(cpfCliente) ? '✓ CPF Válido para Nota Fiscal Paulista' : '⚠️ Dígito de CPF inválido'}
            </span>
          )}
        </div>

        <PaymentMethodGrid metodos={metodos} metodoSelecionado={metodoSelecionado} onSelect={setMetodoSelecionado} />

        {(metodoSelecionado === 'CARTAO_DEBITO' || metodoSelecionado === 'CARTAO_CREDITO') && (
          <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
            <input type="checkbox" checked={usarTef} onChange={(e) => setUsarTef(e.target.checked)} className="rounded text-brand" />
            <span>Processar via PinPad (TEF Local)</span>
          </label>
        )}

        {metodoSelecionado === 'CONVENIO' && (
          <ConvenioClienteSelector totalPagar={restante} onSelectCliente={(c, bloqueado) => { setClienteConvenio(c); setConvenioBloqueado(bloqueado); }} />
        )}

        {restante > 0 && (
          <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="valor-input" className="text-xs font-bold text-slate-300">
                {pagamentos.length === 0 ? 'Valor a Lançar (R$):' : `Adicionar no ${metodoSelecionado} (R$):`}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="valor-input" ref={valorInputRef} type="text" value={valorInputStr}
                  onChange={(e) => setValorInputStr(e.target.value)}
                  className="w-28 bg-black/60 border border-white/[0.12] focus:border-brand text-right px-2.5 py-1 font-mono text-sm font-bold text-white rounded-lg focus:outline-none tabular-nums"
                />
                <button
                  type="button" onClick={() => handleAdicionarPagamento()}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lançar</span>
                </button>
              </div>
            </div>
            {trocoCalculado > 0 && (
              <div className="text-[11px] text-amber-300 font-mono text-right">
                Troco previsto: <strong className="text-amber-400 font-bold">R$ {trocoCalculado.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {erro && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-2 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold py-2 rounded-xl transition text-xs border border-white/[0.08]">
            [ESC] Cancelar
          </button>
          <button
            type="button" disabled={processando || (metodoSelecionado === 'CONVENIO' && (!clienteConvenio || convenioBloqueado))}
            onClick={handleFinalizar}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl transition text-xs shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 border border-emerald-400/30"
          >
            {processando ? 'Processando...' : restante === 0 ? '[ENTER] Confirmar Venda' : '[ENTER] Lançar / Confirmar'}
          </button>
        </div>
      </div>

      <TefPaymentModal
        isOpen={isTefModalOpen} valor={valorDigitado} tipoCartao={metodoSelecionado === 'CARTAO_CREDITO' ? 'CREDITO' : 'DEBITO'}
        onSuccess={handleTefSuccess} onClose={() => setIsTefModalOpen(false)}
      />
    </div>
  );
};
