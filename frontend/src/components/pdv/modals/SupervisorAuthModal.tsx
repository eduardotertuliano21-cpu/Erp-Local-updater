import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api.js';
import { ShieldAlert, KeyRound, ScanBarcode, AlertCircle, CheckCircle, X } from 'lucide-react';

interface SupervisorAuthModalProps {
  isOpen: boolean;
  motivo: string;
  operadorId: string;
  onClose: () => void;
  onAutorizado: (supervisorNome: string) => void;
}

export const SupervisorAuthModal: React.FC<SupervisorAuthModalProps> = ({
  isOpen,
  motivo,
  operadorId,
  onClose,
  onAutorizado,
}) => {
  const [pinOuCracha, setPinOuCracha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [validando, setValidando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinOuCracha('');
      setErro(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const handleConfirmar = async () => {
    if (!pinOuCracha.trim()) {
      setErro('Digite a senha ou bipe o crachá do supervisor');
      return;
    }

    setValidando(true);
    setErro(null);

    try {
      const res = await api.autorizarSupervisor(pinOuCracha.trim(), motivo, operadorId);
      if (res.success && res.data && res.data.autorizado) {
        onAutorizado(res.data.supervisor?.nome || 'Supervisor');
        onClose();
      } else {
        setErro(res.error || 'Credencial não autorizada. Senha ou crachá inválido.');
        setPinOuCracha('');
        inputRef.current?.focus();
      }
    } catch (e: any) {
      setErro(e.message || 'Erro ao validar autorização');
    } finally {
      setValidando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmar();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
    >
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-black text-base tracking-wide">
            <ShieldAlert className="w-5 h-5 animate-pulse text-amber-400" />
            <span>Autorização Necessária</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950/80 border border-amber-500/20 p-3 rounded-xl text-xs space-y-1">
          <span className="font-bold uppercase tracking-wider block text-slate-400 text-[10px]">
            Operação Restrita no Caixa:
          </span>
          <p className="font-semibold text-amber-300 text-sm">{motivo}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="supervisor-input-field" className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-amber-400" /> Senha ou Bipe do Crachá:</span>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><ScanBarcode className="w-3 h-3" /> Leitor Ativo</span>
          </label>
          <input
            id="supervisor-input-field"
            ref={inputRef}
            type="password"
            value={pinOuCracha}
            onChange={(e) => setPinOuCracha(e.target.value)}
            placeholder="Digite o PIN ou passe o crachá..."
            autoComplete="off"
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-base tracking-widest text-center py-2.5 rounded-xl outline-none transition shadow-inner placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-600"
          />
        </div>

        {erro && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{erro}</span>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            [ESC] Cancelar
          </button>
          <button
            type="button"
            disabled={validando}
            onClick={handleConfirmar}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{validando ? 'Validando...' : '[ENTER] Liberar Ação'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
