import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api.js';
import { ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';

interface CashMovementModalProps {
  isOpen: boolean;
  tipo: 'SANGRIA' | 'SUPRIMENTO';
  caixaId: string;
  operadorId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  tipo,
  caixaId,
  operadorId,
  onClose,
  onSuccess,
}) => {
  const [valorStr, setValorStr] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValorStr('');
      setMotivo('');
      setErro(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSalvar = async () => {
    const valor = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setErro('Informe um valor válido maior que zero');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const res = await api.movimentarCaixa(caixaId, operadorId, tipo, valor, motivo);
      if (res.success) {
        onSuccess(`${tipo} de R$ ${valor.toFixed(2)} registrada`);
        onClose();
      } else {
        setErro(res.error || 'Erro ao registrar movimentação');
      }
    } catch (e: any) {
      setErro(e.message || 'Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSalvar();
    }
  };

  if (!isOpen) return null;

  const isSangria = tipo === 'SANGRIA';
  const Icon = isSangria ? ArrowDownCircle : ArrowUpCircle;
  const titleColor = isSangria ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className={`flex items-center gap-2 font-bold text-lg ${titleColor}`}>
            <Icon className="w-5 h-5" />
            <span>{isSangria ? 'Sangria de Caixa (Retirada)' : 'Suprimento de Caixa (Entrada)'}</span>
          </div>
          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="movimento-valor-field" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Valor (R$):
            </label>
            <input
              id="movimento-valor-field"
              ref={inputRef}
              type="text"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              placeholder="0,00"
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold px-4 py-2 rounded-xl focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="movimento-motivo-field" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Motivo / Observação:
            </label>
            <input
              id="movimento-motivo-field"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Pagamento de fornecedor, troco extra..."
              className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-4 py-2 rounded-xl focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {erro && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-sm"
          >
            [ESC] Cancelar
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvar}
            className={`flex-1 text-white font-bold py-2.5 rounded-xl text-sm shadow ${
              isSangria ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {salvando ? 'Salvando...' : '[ENTER] Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
