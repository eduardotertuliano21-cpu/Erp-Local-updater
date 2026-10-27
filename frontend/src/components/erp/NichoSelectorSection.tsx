import React from 'react';
import { LISTA_NICHOS } from './settingsNichoData.js';
import type { NichoSegmento } from '../../context/ConfigProvider.js';
import { Check, Sparkles } from 'lucide-react';

interface NichoSelectorSectionProps {
  currentSegment: NichoSegmento;
  onSelect: (nicho: NichoSegmento) => void;
}

export const NichoSelectorSection: React.FC<NichoSelectorSectionProps> = ({ currentSegment, onSelect }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-white mb-1">Selecione o Nicho de Mercado da Loja</h2>
        <p className="text-xs text-slate-400">O PDV e o catálogo adaptam seus recursos e telas dinamicamente</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {LISTA_NICHOS.map((n) => {
          const Icon = n.icon;
          const isSelected = currentSegment === n.id;
          return (
            <div
              key={n.id}
              onClick={() => onSelect(n.id)}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{n.nome}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{n.tag}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{n.desc}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                {isSelected ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isSelected ? 'Nicho Ativo' : 'Ativar Nicho'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
