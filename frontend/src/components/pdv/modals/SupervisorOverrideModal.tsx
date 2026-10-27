import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, KeyRound, ScanBarcode, X, Loader2, AlertCircle } from 'lucide-react';
import { varejoAvancadoApi } from '../../../services/varejoAvancadoApi.js';

interface SupervisorOverrideModalProps {
  isOpen: boolean;
  motivo: string;
  acaoDescricao?: string;
  onClose: () => void;
  onAutorizado: (token: string, supervisorNome: string) => void;
}

export const SupervisorOverrideModal: React.FC<SupervisorOverrideModalProps> = ({
  isOpen,
  motivo,
  acaoDescricao,
  onClose,
  onAutorizado,
}) => {
  const [pinOuCracha, setPinOuCracha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinOuCracha('');
      setErro(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinOuCracha.trim()) {
      setErro('Digite a senha ou bipe o crachá do supervisor');
      return;
    }

    setLoading(true);
    setErro(null);

    const operadorId = localStorage.getItem('clickstorm_user_id') || 'OPERADOR_CAIXA';
    const res = await varejoAvancadoApi.autorizarSupervisor(pinOuCracha.trim(), motivo, operadorId);

    setLoading(false);
    if (res.success && res.data?.autorizado) {
      onAutorizado(res.data.tokenAutorizacao || 'TOKEN_OVERRIDE', res.data.supervisor?.nome || 'Supervisor');
      onClose();
    } else {
      setErro(res.error || 'Credencial não autorizada. Apenas Gerentes ou Supervisores podem liberar.');
      setPinOuCracha('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-100 space-y-4">
        {/* Header com Alerta de Segurança */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide text-white uppercase">Autorização Necessária</h2>
              <p className="text-[11px] text-amber-400/90 font-medium">Supervisor / Gerente Override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Motivo do Bloqueio */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ação Restrita Solicitada:</span>
          <p className="text-xs font-semibold text-amber-200">{motivo}</p>
          {acaoDescricao && <p className="text-[11px] text-slate-400">{acaoDescricao}</p>}
        </div>

        {erro && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{erro}</span>
          </div>
        )}

        {/* Input de Senha ou Crachá */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-amber-400" /> Senha do Supervisor ou Bipe do Crachá:</span>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><ScanBarcode className="w-3 h-3" /> Scanner Ativo</span>
            </label>
            <input
              ref={inputRef}
              type="password"
              value={pinOuCracha}
              onChange={(e) => setPinOuCracha(e.target.value)}
              placeholder="Digite o PIN ou passe o crachá..."
              autoComplete="off"
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 text-white px-3.5 py-2.5 rounded-xl outline-none font-mono text-sm tracking-widest placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Liberar Ação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
