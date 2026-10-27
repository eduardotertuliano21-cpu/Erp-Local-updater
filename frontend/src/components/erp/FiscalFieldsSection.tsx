import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FiscalFieldsSectionProps {
  ncm: string;
  onChangeNcm: (val: string) => void;
  cest: string;
  onChangeCest: (val: string) => void;
  cfop: string;
  onChangeCfop: (val: string) => void;
  cstCsosn: string;
  onChangeCstCsosn: (val: string) => void;
  origem: number;
  onChangeOrigem: (val: number) => void;
  aliquotaIcms: string;
  onChangeAliquotaIcms: (val: string) => void;
}

export const FiscalFieldsSection: React.FC<FiscalFieldsSectionProps> = ({
  ncm,
  onChangeNcm,
  cest,
  onChangeCest,
  cfop,
  onChangeCfop,
  cstCsosn,
  onChangeCstCsosn,
  origem,
  onChangeOrigem,
  aliquotaIcms,
  onChangeAliquotaIcms,
}) => {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs pb-1 border-b border-slate-800">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Parâmetros Fiscais (NFC-e / SPED / SEFAZ)</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">NCM (8 Dígitos) *</label>
          <input
            type="text"
            maxLength={8}
            value={ncm}
            onChange={(e) => onChangeNcm(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Ex: 22021000"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">CEST (Subst. Tributária)</label>
          <input
            type="text"
            maxLength={7}
            value={cest}
            onChange={(e) => onChangeCest(e.target.value.replace(/\D/g, '').slice(0, 7))}
            placeholder="Ex: 0300700"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">CFOP *</label>
          <input
            type="text"
            maxLength={4}
            value={cfop}
            onChange={(e) => onChangeCfop(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="5102"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">CST / CSOSN ICMS *</label>
          <select
            value={cstCsosn}
            onChange={(e) => onChangeCstCsosn(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="102">102 - Tributada pelo SN s/ crédito</option>
            <option value="101">101 - Tributada pelo SN c/ crédito</option>
            <option value="500">500 - ICMS Cobrado ant. por ST</option>
            <option value="900">900 - Outros (Simples Nacional)</option>
            <option value="00">00 - Tributada Integralmente (Normal)</option>
            <option value="60">60 - Cobrado ant. por ST (Normal)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Origem da Mercadoria</label>
          <select
            value={origem}
            onChange={(e) => onChangeOrigem(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value={0}>0 - Nacional</option>
            <option value={1}>1 - Estrangeira (Importação direta)</option>
            <option value={2}>2 - Estrangeira (Adquirida no mercado int.)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Alíquota ICMS (%)</label>
          <input
            type="text"
            value={aliquotaIcms}
            onChange={(e) => onChangeAliquotaIcms(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
