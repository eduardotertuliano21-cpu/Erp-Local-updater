import React, { useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface FiscalDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  diagnostico: string;
  erroOriginal?: string;
}

export const FiscalDiagnosticModal: React.FC<FiscalDiagnosticModalProps> = ({
  isOpen,
  onClose,
  titulo = 'Alerta Fiscal SEFAZ',
  diagnostico,
  erroOriginal,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{titulo}</h3>
              <p className="text-[11px] text-slate-400">Notificação Automática do PDV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Diagnóstico IA */}
        <div className="p-4 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400 uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>Diagnóstico do Assistente ClickStorm (IA)</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 leading-relaxed">
            {diagnostico}
          </p>
        </div>

        {/* Detalhe técnico resumido */}
        {erroOriginal && (
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 break-all max-h-20 overflow-y-auto">
            <span className="text-slate-600 block text-[9px] uppercase font-bold">Código Técnico</span>
            {erroOriginal}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Entendi / Continuar (ENTER)</span>
        </button>
      </div>
    </div>
  );
};
