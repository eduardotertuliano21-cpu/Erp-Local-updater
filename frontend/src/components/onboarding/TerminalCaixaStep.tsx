import React from 'react';
import { Monitor, Server, CheckCircle2, Settings2 } from 'lucide-react';

interface TerminalCaixaStepProps {
  nomeLoja: string;
  cnpj: string;
  segmento: string;
  servidorOrigem: string;
  numeroCaixa: string;
  setNumeroCaixa: (val: string) => void;
  moduloNfe: boolean;
  onConfirmar: (e: React.FormEvent) => void;
  onConfigurarManual: () => void;
}

const CAIXAS_RAPIDOS = ['01', '02', '03', '04', '05', '06'];

export const TerminalCaixaStep: React.FC<TerminalCaixaStepProps> = ({
  nomeLoja,
  cnpj,
  segmento,
  servidorOrigem,
  numeroCaixa,
  setNumeroCaixa,
  moduloNfe,
  onConfirmar,
  onConfigurarManual,
}) => {
  return (
    <form id="passo-caixa-form" onSubmit={onConfirmar} className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black text-emerald-300 uppercase tracking-wide">
            Configurações Puxadas do Servidor Automaticamente!
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            Identificamos que sua loja já possui um servidor configurado. Todos os parâmetros fiscais, dados da empresa, nicho e credenciais foram sincronizados.
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="truncate">{nomeLoja || 'LOJA SINCRONIZADA'}</span>
          </div>
          <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            {servidorOrigem}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
          <div>
            <span className="text-slate-500 block text-[10px]">CNPJ / Doc</span>
            <span className="text-slate-200 font-mono font-semibold">{cnpj || 'ISENTO'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Ramo / Nicho</span>
            <span className="text-slate-200 font-bold uppercase">{segmento || 'GERAL'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Módulo NF-e</span>
            <span className={moduloNfe ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {moduloNfe ? 'Habilitado' : 'Padrão PDV'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-blue-400" />
          <label className="text-xs font-black text-white uppercase tracking-wide">
            Qual é o Número deste Caixa? *
          </label>
        </div>
        <p className="text-[11px] text-slate-400">
          Esta é a única configuração necessária para iniciar este terminal. Escolha ou digite o número do caixa:
        </p>

        <div className="grid grid-cols-6 gap-2">
          {CAIXAS_RAPIDOS.map((num) => {
            const ativo = numeroCaixa.padStart(2, '0') === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setNumeroCaixa(num)}
                className={`py-2.5 rounded-xl font-mono text-xs font-black border transition cursor-pointer ${
                  ativo
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                CX {num}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Ou digite outro número:</span>
          <input
            type="text"
            maxLength={3}
            required
            value={numeroCaixa}
            onChange={(e) => setNumeroCaixa(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="02"
            className="w-24 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-1.5 text-center font-mono text-sm font-black text-amber-300 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onConfigurarManual}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Revisar configurações completas da loja</span>
        </button>
      </div>
    </form>
  );
};
