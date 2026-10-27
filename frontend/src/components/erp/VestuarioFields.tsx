import React from 'react';
import { Shirt, Sparkles, Tag } from 'lucide-react';

interface VestuarioFieldsProps {
  marca: string;
  onChangeMarca: (val: string) => void;
  modelo: string;
  onChangeModelo: (val: string) => void;
  tamanho: string;
  onChangeTamanho: (val: string) => void;
  cor: string;
  onChangeCor: (val: string) => void;
  onAbrirGeradorGrade?: () => void;
}

const TAMANHOS_RAPIDOS = ['P', 'M', 'G', 'GG', 'XG', '36', '38', '40', '42', '44', 'ÚNICO'];

export const VestuarioFields: React.FC<VestuarioFieldsProps> = ({
  marca,
  onChangeMarca,
  modelo,
  onChangeModelo,
  tamanho,
  onChangeTamanho,
  cor,
  onChangeCor,
  onAbrirGeradorGrade,
}) => {
  return (
    <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <Shirt className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Atributos de Vestuário & Calçados</span>
              <span className="text-[10px] text-slate-400 font-normal font-sans">(Campos Opcionais)</span>
            </h3>
            <p className="text-[10px] text-slate-400">Preencha conforme a necessidade. Itens de tamanho único ou sem marca podem ser salvos normalmente.</p>
          </div>
        </div>

        {onAbrirGeradorGrade && (
          <button
            type="button"
            onClick={onAbrirGeradorGrade}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>⚡ Gerar Grade (P, M, G...)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Marca</label>
          <input
            type="text"
            value={marca}
            onChange={(e) => onChangeMarca(e.target.value)}
            placeholder="Ex: Nike, Adidas, Reserva..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Modelo / Linha</label>
          <input
            type="text"
            value={modelo}
            onChange={(e) => onChangeModelo(e.target.value)}
            placeholder="Ex: Dry-Fit, Slim, Air Max..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Tamanho</label>
          <input
            type="text"
            value={tamanho}
            onChange={(e) => onChangeTamanho(e.target.value)}
            placeholder="Ex: M, 42, Único..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Cor</label>
          <input
            type="text"
            value={cor}
            onChange={(e) => onChangeCor(e.target.value)}
            placeholder="Ex: Preto, Azul Marinho..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:border-rose-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Sugestões Rápidas de Tamanho */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
          <Tag className="w-3 h-3" /> Tamanhos Rápidos:
        </span>
        {TAMANHOS_RAPIDOS.map((tam) => (
          <button
            key={tam}
            type="button"
            onClick={() => onChangeTamanho(tam)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
              tamanho.toUpperCase() === tam
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tam}
          </button>
        ))}
      </div>
    </div>
  );
};
