import React, { useState } from 'react';
import { Hash, Sparkles, ShieldCheck, Check, Save } from 'lucide-react';
import { useStoreConfig, type StoreSettings } from '../../context/ConfigProvider.js';

interface ParametrosNfceSectionProps {
  formData?: StoreSettings;
  setFormData?: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

export const ParametrosNfceSection: React.FC<ParametrosNfceSectionProps> = ({
  formData: propFormData,
  setFormData: propSetFormData,
}) => {
  const { config, atualizarConfig } = useStoreConfig();
  const current = propFormData || config;
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const updateField = (field: keyof StoreSettings, value: any) => {
    if (propSetFormData) {
      propSetFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSalvarDireto = async () => {
    setSalvando(true);
    const ok = await atualizarConfig(current);
    setSalvando(false);
    if (ok) {
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2500);
    }
  };

  const serieAtual = Number(current.serie_nfce) || 1;
  const proxNumeroAtual = Number(current.proximo_numero_nfce) || 1;
  const ambienteAtual = current.comportamento_fiscal_pdv === 'SEMPRE' ? '1' : '2';

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" />
            <span>Parâmetros de Emissão & Numeração da NFC-e</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina a Série fiscal, o Próximo Número a ser emitido e os dados do CSC exigidos pela SEFAZ
          </p>
        </div>
        <button
          type="button"
          onClick={handleSalvarDireto}
          disabled={salvando}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          {sucesso ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{salvando ? 'Salvando...' : sucesso ? 'Parâmetros Salvos!' : 'Salvar Numeração'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Série da NFC-e */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Série da NFC-e
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={999}
              value={serieAtual}
              onChange={(e) => updateField('serie_nfce', Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              placeholder="Ex: 1"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Série fiscal na SEFAZ (padrão 1)</span>
        </div>

        {/* Próximo Número da NFC-e */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Próximo Número NFC-e
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              value={proxNumeroAtual}
              onChange={(e) => updateField('proximo_numero_nfce', Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              placeholder="Ex: 1 ou 1520"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Avança automaticamente a cada venda</span>
        </div>

        {/* Ambiente de Emissão */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Ambiente SEFAZ
          </label>
          <select
            value={ambienteAtual}
            onChange={(e) => updateField('comportamento_fiscal_pdv', e.target.value === '1' ? 'SEMPRE' : 'MANUAL')}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="2">2 - Homologação (Ambiente de Testes)</option>
            <option value="1">1 - Produção (Com Valor Fiscal Real)</option>
          </select>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Modo de transmissão da nota</span>
        </div>

        {/* ID do Token CSC */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            ID do Token CSC
          </label>
          <input
            type="text"
            value={current.id_token_csc || ''}
            onChange={(e) => updateField('id_token_csc', e.target.value.trim())}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            placeholder="Ex: 000001 ou 1"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block">Identificador do CSC na SEFAZ</span>
        </div>
      </div>

      {/* Linha do Token CSC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Código CSC (Token de Segurança do Contribuinte)
          </label>
          <input
            type="text"
            value={current.token_csc || ''}
            onChange={(e) => updateField('token_csc', e.target.value.trim())}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            placeholder="Cole o token CSC alfanumérico fornecido pelo portal da SEFAZ"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block">Necessário para gerar a assinatura do QR-Code oficial</span>
        </div>

        {/* Card de Prévia da Próxima Emissão */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-center text-xs font-mono space-y-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Prévia da Próxima Emissão</span>
          <div className="text-white font-bold text-xs truncate">
            NFC-e Mod 65 • Série {serieAtual} • Nº {String(proxNumeroAtual).padStart(6, '0')}
          </div>
          <span className="text-[10px] text-emerald-400 font-sans flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{ambienteAtual === '1' ? 'Produção Fiscal Ativa' : 'Homologação (Sem Valor)'}</span>
          </span>
        </div>
      </div>

      {/* Nota informativa sobre Nota Fiscal Paulista & CPF */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-300">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-white block">Nota Fiscal Paulista (CPF na Nota) Pronta & Integrada:</span>
          <p className="text-[11px] text-blue-200/80 leading-relaxed">
            O ClickStorm está 100% pronto para emitir cupons com CPF/CNPJ do consumidor. Ao finalizar a venda (ou via atalho do cliente), o CPF informado é validado, injetado na tag oficial <code className="text-white font-mono bg-blue-950/50 px-1 rounded">&lt;dest&gt;&lt;CPF&gt;</code> do XML 4.00 e impresso no cupom térmico DANFE.
          </p>
        </div>
      </div>
    </div>
  );
};
