import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';

interface StripeCardPaymentFormProps {
  valor: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel?: () => void;
}

export const StripeCardPaymentForm: React.FC<StripeCardPaymentFormProps> = ({ valor, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessando(true);
    setErro(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        setErro(result.error.message || 'Cartão recusado ou dados inválidos. Verifique e tente novamente.');
        setProcessando(false);
        return;
      }

      if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        onSuccess(result.paymentIntent.id);
      } else {
        setErro('Status do pagamento: ' + (result.paymentIntent?.status || 'pendente'));
      }
    } catch (err: any) {
      setErro(err.message || 'Ocorreu um erro inesperado ao processar o cartão.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 select-none">
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {erro && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs text-center">
          {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processando}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {processando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Processando com Criptografia de Ponta a Ponta...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-emerald-300" />
            <span>Confirmar Pagamento Seguro (R$ {valor.toFixed(2)})</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Tokenizado diretamente via Stripe Elements • Nenhum dado toca no servidor local</span>
      </div>
    </form>
  );
};
