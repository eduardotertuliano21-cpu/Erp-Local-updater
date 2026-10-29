import React from 'react';
import { CheckCircle2, X, ChefHat, UtensilsCrossed } from 'lucide-react';

export interface PedidoProntoItem {
  id: string;
  mesa_numero?: number;
  comanda_numero?: number;
  cliente_nome?: string;
  origem?: string;
  status: string;
  observacoes?: string;
  itens_json?: string;
  criado_em?: string;
  atualizado_em?: string;
}

interface MobileProntosModalProps {
  isOpen: boolean;
  prontos: PedidoProntoItem[];
  onClose: () => void;
  onEntregar: (id: string) => void;
}

export function playReadyChime(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Primeiro tom (Mi5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tom (Sol#5 - 830.61Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.12);
    gain2.gain.setValueAtTime(0.28, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {}
}

export const MobileProntosModal: React.FC<MobileProntosModalProps> = ({
  isOpen,
  prontos,
  onClose,
  onEntregar,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans select-none">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Pratos Prontos na Cozinha</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-slate-950">
                  {prontos.length}
                </span>
              </div>
              <p className="text-[11px] text-emerald-300">Finalizados pela cozinha aguardando entrega</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Pratos Prontos */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {prontos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <UtensilsCrossed className="w-8 h-8 opacity-40" />
              <span className="text-xs font-semibold">Nenhum prato aguardando entrega no momento.</span>
            </div>
          ) : (
            prontos.map((ped) => {
              const itens: Array<{ nome: string; quantidade: number; observacao?: string }> = (() => {
                try { return JSON.parse(ped.itens_json || '[]'); } catch { return []; }
              })();

              return (
                <div
                  key={ped.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-lg space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-base font-black text-white">
                        {ped.mesa_numero ? `Mesa #${ped.mesa_numero}` : `Comanda #${ped.comanda_numero || ped.id.slice(-4)}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
                      PRONTO PARA ENTREGA
                    </span>
                  </div>

                  {/* Itens */}
                  <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                    {itens.map((it, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-200">
                        <span className="font-mono font-bold text-emerald-400">{it.quantidade}x</span>
                        <div className="flex-1">
                          <span className="font-semibold">{it.nome}</span>
                          {it.observacao && (
                            <div className="text-[10px] text-amber-300 italic">{it.observacao}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {ped.observacoes && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        {ped.observacoes}
                      </div>
                    )}
                  </div>

                  {/* Botão Entregar */}
                  <button
                    onClick={() => onEntregar(ped.id)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Entrega na Mesa</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
