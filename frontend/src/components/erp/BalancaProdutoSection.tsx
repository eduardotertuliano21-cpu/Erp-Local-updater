import React from 'react';
import { Scale, Tag, Activity } from 'lucide-react';

interface BalancaProdutoSectionProps {
  isPesavelCheckout: boolean;
  onChangeIsPesavelCheckout: (v: boolean) => void;
  isPesavelEtiqueta: boolean;
  onChangeIsPesavelEtiqueta: (v: boolean) => void;
  pluBalanca: string;
  onChangePluBalanca: (v: string) => void;
  validadeBalanca: string;
  onChangeValidadeBalanca: (v: string) => void;
}

export const BalancaProdutoSection: React.FC<BalancaProdutoSectionProps> = ({
  isPesavelCheckout,
  onChangeIsPesavelCheckout,
  isPesavelEtiqueta,
  onChangeIsPesavelEtiqueta,
  pluBalanca,
  onChangePluBalanca,
  validadeBalanca,
  onChangeValidadeBalanca,
}) => {
  return (
    <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
        <Scale className="w-4 h-4 text-emerald-400" />
        <span>Automação de Pesagem & Balanças</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Opção 1: Pesagem ao Vivo no Checkout */}
        <label className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          isPesavelCheckout
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={isPesavelCheckout}
              onChange={(e) => onChangeIsPesavelCheckout(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4"
            />
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pesagem ao Vivo no Checkout</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 pl-6 leading-relaxed">
            Ao bipar/selecionar no PDV, o caixa lê o peso automaticamente da balança Serial/USB sem precisar de etiqueta.
          </p>
        </label>

        {/* Opção 2: Pesagem por Etiqueta (Retaguarda / Gôndola) */}
        <label className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          isPesavelEtiqueta
            ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={isPesavelEtiqueta}
              onChange={(e) => onChangeIsPesavelEtiqueta(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer w-4 h-4"
            />
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Pesagem por Etiqueta (MGV / Carga)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 pl-6 leading-relaxed">
            Exporta na carga para balanças de açougue/hortifrúti (Toledo, Filizola, Elgin, Urano) e lê etiquetas com prefixo 2.
          </p>
        </label>
      </div>

      {/* Campos de PLU e Validade se for pesável por etiqueta */}
      {isPesavelEtiqueta && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Código PLU na Balança *
            </label>
            <input
              type="text"
              value={pluBalanca}
              onChange={(e) => onChangePluBalanca(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 101, 201"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Identificador na memória da balança</span>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Validade da Etiqueta (Dias)
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={validadeBalanca}
              onChange={(e) => onChangeValidadeBalanca(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">Dias impressos na etiqueta</span>
          </div>
        </div>
      )}
    </div>
  );
};
