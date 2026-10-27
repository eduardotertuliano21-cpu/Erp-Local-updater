import React from 'react';
import { Printer, CheckCircle2 } from 'lucide-react';
import type { StoreSettings } from '../../context/ConfigProvider.js';

interface ImpressaoTabProps {
  formData: StoreSettings;
  setFormData: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

export const ImpressaoTab: React.FC<ImpressaoTabProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4 font-sans select-none">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Printer className="w-4 h-4 text-blue-500" />
          <span>Configuração de Impressão Térmica (ESC/POS)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Defina o modelo da impressora não-fiscal de 80mm/58mm, margens e corte de papel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Impressora Térmica Padrão
          </label>
          <select
            value={formData.impressora_padrao || 'PADRAO_WINDOWS'}
            onChange={(e) => setFormData({ ...formData, impressora_padrao: e.target.value })}
            className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="PADRAO_WINDOWS">Impressora Padrão do Windows (Spooler)</option>
            <option value="EPSON_TM_T20">Epson TM-T20 / TM-T20X (ESC/POS)</option>
            <option value="BEMATECH_MP4200">Bematech MP-4200 TH</option>
            <option value="DARUMA_DR800">Daruma DR800</option>
            <option value="ELGIN_I9">Elgin i9 / Elgin i7</option>
            <option value="GENERICA_80MM">Genérica ESC/POS 80mm</option>
            <option value="GENERICA_58MM">Genérica ESC/POS 58mm (Bobina Estreita)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Margem Superior / Linhas em Branco no Fim
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              min="0"
              max="20"
              value={formData.margem_impressao || 0}
              onChange={(e) => setFormData({ ...formData, margem_impressao: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-mono"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Linhas adicionadas após o cupom para acionamento da guilhotina sem corte no texto
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Status do Driver ESC/POS Direto</span>
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          O ClickStorm possui driver nativo ESC/POS integrado via Spooler do Windows e porta USB direta (RAW Direct Print), eliminando a necessidade de janelas de diálogo do navegador para impressão instantânea de cupons DANFE e comprovantes de caixa.
        </p>
      </div>
    </div>
  );
};
