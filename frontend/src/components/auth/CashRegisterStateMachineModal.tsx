import React, { useState } from 'react';
import { DollarSign, AlertTriangle, Lock, CheckCircle2, LogOut, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface CashRegisterStateMachineModalProps {
  onSucessoAbertura: () => void;
  caixaAberto?: boolean;
  onIrParaRetaguarda?: () => void;
}

export const CashRegisterStateMachineModal: React.FC<CashRegisterStateMachineModalProps> = ({
  onSucessoAbertura,
  caixaAberto,
  onIrParaRetaguarda,
}) => {
  const { statusCaixa, sessaoCaixa, abrirCaixa, fecharCaixa, logout, exigirAutenticacao } = useAuth();
  const [saldoInicialInput, setSaldoInicialInput] = useState<string>('100.00');
  const [saldoFinalInput, setSaldoFinalInput] = useState<string>('0.00');
  const [observacoes, setObservacoes] = useState<string>('');
  const [carregandoAcao, setCarregandoAcao] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Se já está aberto hoje e o caixa no banco existe, o modal não renderiza
  if (statusCaixa === 'ABERTO_HOJE' && (caixaAberto === undefined || caixaAberto === true)) {
    return null;
  }

  const handleAbrir = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(saldoInicialInput.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      setMensagemErro('Informe um valor de saldo inicial válido (maior ou igual a 0).');
      return;
    }

    setCarregandoAcao(true);
    setMensagemErro(null);
    const ok = await abrirCaixa(valor);
    setCarregandoAcao(false);

    if (ok) {
      onSucessoAbertura();
    } else {
      setMensagemErro('Erro ao abrir caixa no sistema. Tente novamente.');
    }
  };

  const handleFecharAnterior = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(saldoFinalInput.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      setMensagemErro('Informe o valor total apurado no caixa anterior.');
      return;
    }

    setCarregandoAcao(true);
    setMensagemErro(null);
    const ok = await fecharCaixa(valor, observacoes || 'Fechamento diário obrigatório');
    setCarregandoAcao(false);

    if (ok) {
      setMensagemErro(null);
      // Ao fechar, o status mudará para FECHADO, solicitando abertura do novo caixa
    } else {
      setMensagemErro('Erro ao fechar caixa anterior. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
        {statusCaixa === 'FECHAMENTO_PENDENTE' ? (
          /* Cenário C: Caixa de data anterior pendente de fechamento */
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Bloqueio Diário de Segurança
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Fechamento Obrigatório Pendente</h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              Existe um caixa aberto de data anterior (
              <strong className="text-rose-400 font-mono">
                {sessaoCaixa?.data_abertura ? new Date(sessaoCaixa.data_abertura).toLocaleDateString() : 'Anterior'}
              </strong>
              ) que não foi encerrado. Pela regra de fechamento diário, é obrigatório registrar a contagem e fechar o caixa anterior antes de operar hoje.
            </p>

            {mensagemErro && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleFecharAnterior} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Valor Total Conferido na Gaveta (R$)</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={saldoFinalInput}
                    onChange={(e) => setSaldoFinalInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Observações de Encerramento (Opcional)</label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-rose-500 px-3.5 py-2 rounded-xl text-xs text-white outline-none"
                  placeholder="Ex: Turno encerrado com divergência de R$ 0,00"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {onIrParaRetaguarda && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIrParaRetaguarda(); }}
                    className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                    <span>Retaguarda</span>
                  </button>
                )}
                {exigirAutenticacao && (
                  <button
                    type="button"
                    onClick={logout}
                    className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={carregandoAcao}
                  className="flex-[2] py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
                >
                  <span>{carregandoAcao ? 'Fechando...' : 'Conferir e Fechar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Cenário A: Não há caixa aberto -> Abertura de Caixa */
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Frente de Caixa
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Abertura de Caixa Obrigatória</h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para liberar as vendas, informe o valor de <strong>Fundo de Troco (Saldo Inicial)</strong> presente na gaveta para o turno atual.
            </p>

            {mensagemErro && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleAbrir} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Fundo de Troco / Saldo Inicial (R$)</label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={saldoInicialInput}
                    onChange={(e) => setSaldoInicialInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono text-white outline-none"
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                {onIrParaRetaguarda && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIrParaRetaguarda(); }}
                    className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                    <span>Retaguarda (ERP)</span>
                  </button>
                )}
                {exigirAutenticacao && (
                  <button
                    type="button"
                    onClick={logout}
                    className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Trocar</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={carregandoAcao}
                  className="flex-[2] py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{carregandoAcao ? 'Abrindo...' : 'Abrir Caixa e Operar'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
