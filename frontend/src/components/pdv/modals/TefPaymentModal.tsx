import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { enterpriseApi } from '../../../services/enterpriseApi.js';

interface TefPaymentModalProps {
  isOpen: boolean;
  valor: number;
  tipoCartao: 'CREDITO' | 'DEBITO' | 'PIX' | 'VOUCHER';
  vendaId?: string;
  onSuccess: (dadosTef: { nsu: string; bandeira: string; codigoAutorizacao: string }) => void;
  onClose: () => void;
}

export const TefPaymentModal: React.FC<TefPaymentModalProps> = ({
  isOpen,
  valor,
  tipoCartao,
  vendaId,
  onSuccess,
  onClose,
}) => {
  const [status, setStatus] = useState<'INICIANDO' | 'PINPAD' | 'APROVADA' | 'ERRO'>('INICIANDO');
  const [mensagem, setMensagem] = useState('Conectando ao PinPad local...');
  const [erro, setErro] = useState<string | null>(null);
  const pollingRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStatus('INICIANDO');
      setErro(null);
      return;
    }

    const iniciar = async () => {
      try {
        setStatus('INICIANDO');
        setMensagem('Enviando requisição para C:\\TEF_DIAL\\REQ...');
        const res = await enterpriseApi.iniciarTef({ valor, tipo_cartao: tipoCartao, venda_id: vendaId });
        setStatus('PINPAD');
        setMensagem('Aguardando cliente inserir/aproximar cartão no PinPad...');

        pollingRef.current = setInterval(async () => {
          try {
            const check = await enterpriseApi.verificarTef(res.transacaoId);
            if (check.status === 'APROVADA') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setStatus('APROVADA');
              setMensagem(`Transação Aprovada! Bandeira: ${check.bandeira || 'CARD'} - NSU: ${check.nsu}`);
              await enterpriseApi.confirmarTef(res.transacaoId);

              setTimeout(() => {
                onSuccess({
                  nsu: check.nsu,
                  bandeira: check.bandeira,
                  codigoAutorizacao: check.codigo_autorizacao,
                });
              }, 1200);
            } else if (check.status === 'CANCELADA' || check.status === 'NEGADA') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setStatus('ERRO');
              setErro('Transação cancelada ou recusada no PinPad');
            }
          } catch {}
        }, 800);
      } catch (err: any) {
        setStatus('ERRO');
        setErro(err.message || 'Falha ao comunicar com driver TEF local');
      }
    };

    iniciar();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100 text-center">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>TEF DIAL/IP LOCAL (PINPAD)</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Visual */}
        <div className="py-4 flex flex-col items-center justify-center space-y-3">
          {status === 'APROVADA' ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : status === 'ERRO' ? (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-10 h-10" />
            </div>
          ) : (
            <div className="relative w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
              <CreditCard className="w-5 h-5 absolute" />
            </div>
          )}

          <div className="text-xl font-black text-white font-mono">
            R$ {valor.toFixed(2)}
          </div>
          <div className="text-xs font-semibold text-slate-300">
            {tipoCartao === 'CREDITO' ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </div>
          <p className="text-xs text-slate-400 max-w-xs">{erro || mensagem}</p>
        </div>

        {/* Rodapé / Ações */}
        <div className="pt-2">
          {status === 'ERRO' ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Fechar e Tentar Outro Meio
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar Transação TEF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
