import React, { useState } from 'react';
import { AlertTriangle, X, Ban, Loader2 } from 'lucide-react';

interface ModalCancelarNfceProps {
  venda: any;
  onConfirmar: (motivo: string) => Promise<void>;
  onFechar: () => void;
}

export const ModalCancelarNfce: React.FC<ModalCancelarNfceProps> = ({
  venda,
  onConfirmar,
  onFechar,
}) => {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 5) {
      setErro('A justificativa de cancelamento deve ter pelo menos 5 caracteres.');
      return;
    }
    setSubmitting(true);
    setErro(null);
    try {
      await onConfirmar(motivo.trim());
      onFechar();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao processar o cancelamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm tracking-wide uppercase">Cancelar Documento / Venda</h3>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
          <p className="font-bold">Atenção: Esta ação é definitiva e irreversível.</p>
          <p className="opacity-90">
            Venda #{venda?.numero_sequencial} • Total: R$ {Number(venda?.total_liquido || 0).toFixed(2)}
            {venda?.fiscal_numero && ` • NFC-e nº ${venda.fiscal_numero} (Série ${venda.fiscal_serie || 1})`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motivo do Cancelamento <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Erro no lançamento de itens, desistência do cliente..."
              rows={3}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Mínimo de 5 caracteres.</span>
          </div>

          {erro && (
            <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              <span>Confirmar Cancelamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
