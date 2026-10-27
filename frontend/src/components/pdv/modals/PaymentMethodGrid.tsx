import React from 'react';
import type { MetodoPagamento } from '../../../types/pdv.js';
import { DollarSign, QrCode, CreditCard, Wallet } from 'lucide-react';

export interface MetodoOpcao {
  id: MetodoPagamento;
  label: string;
  keyNumber: string;
  icon: any;
}

export const METODOS_BASE: MetodoOpcao[] = [
  { id: 'DINHEIRO', label: '1 - Dinheiro', keyNumber: '1', icon: DollarSign },
  { id: 'PIX', label: '2 - PIX', keyNumber: '2', icon: QrCode },
  { id: 'CARTAO_DEBITO', label: '3 - Cartão Débito', keyNumber: '3', icon: CreditCard },
  { id: 'CARTAO_CREDITO', label: '4 - Cartão Crédito', keyNumber: '4', icon: Wallet },
];

interface PaymentMethodGridProps {
  metodos: MetodoOpcao[];
  metodoSelecionado: MetodoPagamento;
  onSelect: (m: MetodoPagamento) => void;
}

export const PaymentMethodGrid: React.FC<PaymentMethodGridProps> = ({
  metodos,
  metodoSelecionado,
  onSelect,
}) => {
  return (
    <div>
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 font-mono">
        Forma de Pagamento:
      </label>
      <div className="grid grid-cols-2 gap-2">
        {metodos.map((m) => {
          const Icon = m.icon;
          const isSelected = metodoSelecionado === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 font-bold ring-1 ring-blue-500'
                  : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
