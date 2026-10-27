import React, { useEffect, useState } from 'react';
import type { CaixaStatus } from '../../../types/pdv.js';
import { api } from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.js';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

interface CashStatusModalProps {
  isOpen: boolean;
  caixa: CaixaStatus | null;
  operadorId: string;
  isFechamento?: boolean;
  onClose: () => void;
  onCaixaFechado: () => void;
}

export const CashStatusModal: React.FC<CashStatusModalProps> = ({
  isOpen,
  caixa,
  operadorId,
  isFechamento = false,
  onClose,
  onCaixaFechado,
}) => {
  const { sessaoCaixa, fecharCaixa: fecharSessaoAuth, revalidarCaixa } = useAuth();
  const [totalCalculado, setTotalCalculado] = useState<number>(0);
  const [saldoFinalStr, setSaldoFinalStr] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErro(null);
      setCarregando(true);
      api.obterStatusCaixa().then((res) => {
        if (res.success && res.data) {
          setTotalCalculado(res.data.totalDinheiroCalculado);
          setSaldoFinalStr(res.data.totalDinheiroCalculado.toFixed(2));
        }
        setCarregando(false);
      });
    }
  }, [isOpen]);

  const handleFecharCaixa = async () => {
    if (!caixa) return;
    const saldoFinal = parseFloat(saldoFinalStr.replace(',', '.'));
    if (isNaN(saldoFinal)) {
      setErro('Informe um saldo válido');
      return;
    }

    setCarregando(true);
    try {
      const res = await api.fecharCaixa(caixa.id, saldoFinal, operadorId);
      if (res.success) {
        try {
          if (sessaoCaixa) {
            await fecharSessaoAuth(saldoFinal, 'Fechamento de Caixa PDV');
          }
        } catch {}
        await revalidarCaixa();
        onCaixaFechado();
        onClose();
      } else {
        setErro(res.error || 'Erro ao fechar caixa');
      }
    } finally {
      setCarregando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            {isFechamento ? (
              <XCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-sky-400" />
            )}
            <span>{isFechamento ? 'Fechamento de Caixa' : 'Conferência de Caixa'}</span>
          </div>
          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {caixa ? (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Número do Caixa:</span>
                <span className="text-white font-bold">#{caixa.numero}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Operador de Abertura:</span>
                <span className="text-white font-bold">{caixa.operador_abertura}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fundo Inicial:</span>
                <span className="text-emerald-400 font-bold">R$ {caixa.saldo_inicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Total em Gaveta:</span>
                <span className="text-sky-400 font-black text-sm">R$ {totalCalculado.toFixed(2)}</span>
              </div>
            </div>

            {isFechamento && (
              <div className="pt-2">
                <label htmlFor="saldo-conferido-field" className="text-xs font-bold text-slate-300 block mb-1">
                  Saldo Final Conferido (R$):
                </label>
                <input
                  id="saldo-conferido-field"
                  type="text"
                  value={saldoFinalStr}
                  onChange={(e) => setSaldoFinalStr(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500 text-white font-mono text-lg font-bold px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-sm text-center py-4">Nenhum caixa aberto no momento.</div>
        )}

        {erro && <div className="text-rose-400 text-xs">{erro}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm"
          >
            [ESC] Voltar
          </button>
          {isFechamento && caixa && (
            <button
              type="button"
              disabled={carregando}
              onClick={handleFecharCaixa}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm shadow flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Fechamento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
