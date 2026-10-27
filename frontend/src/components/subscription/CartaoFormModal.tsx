import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck, Loader2, User } from 'lucide-react';
import { stripeSubscriptionApi, type CartaoCredito } from '../../services/stripeSubscriptionApi.js';

interface CartaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cartao: CartaoCredito) => void;
}

export const CartaoFormModal: React.FC<CartaoFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [expMes, setExpMes] = useState('');
  const [expAno, setExpAno] = useState('');
  const [cvc, setCvc] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatarNumero = (valor: string) => {
    const limpo = valor.replace(/\D/g, '').slice(0, 16);
    return limpo.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const numLimpo = numero.replace(/\D/g, '');
    if (numLimpo.length < 13) {
      setErro('Informe um número de cartão válido.');
      return;
    }
    if (!titular.trim() || titular.trim().length < 3) {
      setErro('Informe o nome completo impresso no cartão.');
      return;
    }
    const mesNum = parseInt(expMes, 10);
    const anoNum = parseInt(expAno, 10);
    if (!mesNum || mesNum < 1 || mesNum > 12) {
      setErro('Mês de validade inválido (01 a 12).');
      return;
    }
    if (!anoNum || anoNum < 24 || (anoNum > 100 && anoNum < 2024)) {
      setErro('Ano de validade inválido.');
      return;
    }
    if (!cvc.trim() || cvc.trim().length < 3) {
      setErro('Informe o código de segurança (CVC).');
      return;
    }

    setSalvando(true);
    const res = await stripeSubscriptionApi.cadastrarCartao({
      numero: numLimpo,
      titular: titular.trim().toUpperCase(),
      expMes: mesNum,
      expAno: anoNum < 100 ? 2000 + anoNum : anoNum,
      cvc: cvc.trim(),
    });
    setSalvando(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setErro(res.error || 'Falha ao salvar cartão.');
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Novo Cartão de Crédito</h2>
              <p className="text-[10px] text-slate-400">Dados criptografados e protegidos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {erro && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">NÚMERO DO CARTÃO</label>
            <div className="relative">
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={numero}
                onChange={(e) => setNumero(formatarNumero(e.target.value))}
                maxLength={19}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm pl-9 focus:border-indigo-500 focus:outline-none"
                required
              />
              <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">NOME IMPRESSO NO CARTÃO</label>
            <div className="relative">
              <input
                type="text"
                placeholder="NOME COMO NO CARTÃO"
                value={titular}
                onChange={(e) => setTitular(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs pl-9 focus:border-indigo-500 focus:outline-none tracking-wider"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">MÊS</label>
              <input
                type="text"
                placeholder="MM (ex: 08)"
                value={expMes}
                onChange={(e) => setExpMes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                maxLength={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono text-center text-xs focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">ANO</label>
              <input
                type="text"
                placeholder="AA (ex: 28)"
                value={expAno}
                onChange={(e) => setExpAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono text-center text-xs focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">CVC / CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white font-mono text-center text-xs focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{salvando ? 'Salvando...' : 'Salvar Cartão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
