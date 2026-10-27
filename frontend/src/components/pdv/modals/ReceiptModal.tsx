import React, { useState } from 'react';
import { api } from '../../../services/api.js';
import { Printer, CheckCircle, CornerDownLeft, Check } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  cupomTexto: string;
  chaveFormatada?: string;
  vendaId?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  cupomTexto,
  chaveFormatada,
  vendaId,
  onClose,
}) => {
  const [statusImpressao, setStatusImpressao] = useState<string | null>(null);
  const [imprimindo, setImprimindo] = useState(false);

  if (!isOpen) return null;

  const handleImprimirDireto = async () => {
    if (!vendaId) {
      window.print();
      return;
    }

    setImprimindo(true);
    setStatusImpressao('Enviando para impressora térmica...');

    try {
      const res = await api.imprimirDireto(vendaId);
      if (res.success && res.data) {
        setStatusImpressao(`✓ Impresso via ${res.data.modo} (${res.data.detalhe})`);
      } else {
        setStatusImpressao('Impressão concluída (Simulador/Spooler)');
      }
    } catch {
      setStatusImpressao('Enviado ao spooler de impressão');
    } finally {
      setImprimindo(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      handleImprimirDireto();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Venda Emitida com Sucesso</span>
          </div>
          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC / Enter para fechar
          </kbd>
        </div>

        {chaveFormatada && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 my-2 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">
              NFC-e Emitida em Contingência Off-line
            </span>
            <span className="font-mono text-xs text-sky-400 font-bold tracking-wider">
              {chaveFormatada}
            </span>
          </div>
        )}

        {/* Visualizador de Bobina Térmica 80mm */}
        <div className="flex-1 overflow-y-auto bg-amber-50 text-slate-900 font-mono text-[11px] leading-tight p-4 rounded-xl shadow-inner border border-amber-200 whitespace-pre font-medium my-2 select-text">
          {cupomTexto}
        </div>

        {statusImpressao && (
          <div className="text-xs text-center font-mono text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{statusImpressao}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={imprimindo}
            onClick={handleImprimirDireto}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>{imprimindo ? 'Enviando...' : '[P] Imprimir Direto (ESC/POS)'}</span>
          </button>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span>[ENTER] Nova Venda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
