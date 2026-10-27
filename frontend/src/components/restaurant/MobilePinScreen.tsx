import React from 'react';
import { UtensilsCrossed, BookOpen, LogIn, Delete } from 'lucide-react';

interface MobilePinScreenProps {
  pin: string;
  erro?: string | null;
  loading?: boolean;
  onDigit: (d: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmitPin: () => void;
  onVerCardapio: () => void;
}

export const MobilePinScreen: React.FC<MobilePinScreenProps> = ({
  pin,
  erro,
  loading,
  onDigit,
  onClear,
  onBackspace,
  onSubmitPin,
  onVerCardapio,
}) => {
  const dotsArray = Array.from({ length: Math.min(6, Math.max(4, pin.length)) }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-5 max-w-md mx-auto select-none font-sans">
      <div className="text-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Comanda & Cardápio Mobile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Digite a senha de garçom ou explore o cardápio digital
        </p>

        {/* Indicador visual de dígitos preenchidos */}
        <div className="flex justify-center items-center gap-2.5 my-5">
          {dotsArray.map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                pin.length > i
                  ? 'bg-amber-400 border-amber-400 scale-110 shadow-lg shadow-amber-400/40'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {loading && (
          <div className="text-xs text-amber-400 font-mono animate-pulse">
            Verificando credenciais...
          </div>
        )}

        {erro && !loading && (
          <div className="px-3 py-1.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 font-bold inline-block animate-shake max-w-xs">
            {erro}
          </div>
        )}
      </div>

      {/* Teclado numérico */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button
              key={k}
              type="button"
              disabled={loading}
              onClick={() => onDigit(k)}
              className="h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xl font-bold active:scale-95 transition flex items-center justify-center text-slate-200 disabled:opacity-40 shadow-sm"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={onClear}
            className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-bold text-slate-400 active:scale-95 transition flex items-center justify-center hover:text-white"
          >
            LIMPAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onDigit('0')}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xl font-bold active:scale-95 transition flex items-center justify-center text-slate-200 disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onBackspace}
            className="h-14 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 active:scale-95 transition flex items-center justify-center hover:text-white"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botão de Entrar (para PINs de 4 a 8 dígitos) */}
        <button
          type="button"
          disabled={loading || pin.length < 4}
          onClick={onSubmitPin}
          className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-98 ${
            pin.length >= 4 && !loading
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Acessando...' : 'Acessar Comanda'}</span>
        </button>

        {/* Botão de Acesso Livre ao Cardápio Digital */}
        <button
          type="button"
          onClick={onVerCardapio}
          className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Ver Cardápio Digital (Visualização)</span>
        </button>
      </div>
    </div>
  );
};
