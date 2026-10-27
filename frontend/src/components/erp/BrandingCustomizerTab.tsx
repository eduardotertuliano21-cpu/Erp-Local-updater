import React, { useState, useRef } from 'react';
import { Upload, Trash2, RotateCcw, Sparkles, Check, ShoppingCart, LayoutDashboard, Plus, ArrowRight } from 'lucide-react';
import { api, formatarLogoUrl } from '../../services/api.js';

interface BrandingCustomizerTabProps {
  nomeLoja: string;
  logoUrl?: string;
  corPrimaria: string;
  onChangeNome: (nome: string) => void;
  onChangeLogo: (url?: string) => void;
  onChangeCor: (cor: string) => void;
  onRestaurarPadrao: () => void;
}

const PALETA = [
  { nome: 'Esmeralda', cor: '#10b981' },
  { nome: 'Azul Pro', cor: '#0ea5e9' },
  { nome: 'Índigo', cor: '#6366f1' },
  { nome: 'Roxo Tech', cor: '#8b5cf6' },
  { nome: 'Âmbar', cor: '#f59e0b' },
  { nome: 'Rubi', cor: '#ef4444' },
  { nome: 'Boutique', cor: '#ec4899' },
  { nome: 'Slate', cor: '#334155' },
];

function extrairCorLogo(dataUrl: string, cb: (hex: string) => void) {
  const img = new Image();
  img.onload = () => {
    try {
      const cvs = document.createElement('canvas');
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      cvs.width = cvs.height = 32;
      ctx.drawImage(img, 0, 0, 32, 32);
      const { data } = ctx.getImageData(0, 0, 32, 32);
      let rT = 0, gT = 0, bT = 0, cnt = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const br = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (br > 235 || br < 25) continue;
        rT += data[i]; gT += data[i + 1]; bT += data[i + 2]; cnt++;
      }
      if (cnt > 0) {
        const hex = `#${((1 << 24) + (Math.round(rT / cnt) << 16) + (Math.round(gT / cnt) << 8) + Math.round(bT / cnt)).toString(16).slice(1)}`;
        cb(hex);
      }
    } catch { /* fallback silencioso */ }
  };
  img.src = dataUrl;
}

export const BrandingCustomizerTab: React.FC<BrandingCustomizerTabProps> = ({
  nomeLoja,
  logoUrl,
  corPrimaria,
  onChangeNome,
  onChangeLogo,
  onChangeCor,
  onRestaurarPadrao,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [corSugerida, setCorSugerida] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rdr = new FileReader();
    rdr.onload = async (evt) => {
      const res = evt.target?.result as string;
      const ext = file.name.split('.').pop() || 'png';
      try {
        const up = await api.uploadLogo(res, ext);
        if (up.success && up.data?.url) {
          onChangeLogo(up.data.url);
        } else {
          onChangeLogo(res);
        }
      } catch {
        onChangeLogo(res);
      }
      extrairCorLogo(res, (hex) => {
        onChangeCor(hex);
        setCorSugerida(true);
      });
    };
    rdr.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>Personalização White-Label da Marca</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Zero Config
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina o logotipo e a cor única da sua empresa. Os botões e abas se adaptam automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={onRestaurarPadrao}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome Comercial da Loja *
            </label>
            <input
              type="text"
              value={nomeLoja}
              onChange={(e) => onChangeNome(e.target.value)}
              placeholder="Ex: Supermercado Estrela"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Logotipo da Loja
            </label>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {logoUrl ? (
                  <img src={formatarLogoUrl(logoUrl)} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-white" style={{ backgroundColor: corPrimaria }}>
                    {nomeLoja ? nomeLoja.charAt(0).toUpperCase() : '🏪'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span>{logoUrl ? 'Trocar Logo' : 'Enviar Logo'}</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => onChangeLogo(undefined)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Remover logotipo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">PNG, SVG ou JPG (extração automática de cor)</p>
              </div>
            </div>
            {corSugerida && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Cor predominante do logo aplicada com sucesso!</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Cor Principal da Marca (Single Brand Color)
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => onChangeCor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
              />
              <input
                type="text"
                value={corPrimaria}
                onChange={(e) => onChangeCor(e.target.value)}
                className="w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-900 dark:text-white uppercase font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400">Substitui botões F10 e abas ativas</span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PALETA.map((item) => (
                <button
                  key={item.cor}
                  type="button"
                  onClick={() => onChangeCor(item.cor)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                    corPrimaria.toLowerCase() === item.cor.toLowerCase()
                      ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-blue-500'
                      : 'border-white dark:border-slate-900'
                  }`}
                  style={{ backgroundColor: item.cor }}
                  title={item.nome}
                >
                  {corPrimaria.toLowerCase() === item.cor.toLowerCase() && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview em Tempo Real */}
        <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Preview em Tempo Real</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Teste antes de salvar</span>
          </div>

          {/* Miniatura PDV */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: corPrimaria }}>
                  {logoUrl ? <img src={formatarLogoUrl(logoUrl)} alt="" className="w-full h-full object-contain p-0.5" /> : '🏪'}
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[150px]">
                  {nomeLoja || 'Minha Loja'}
                </span>
              </div>
              <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">PDV 70/30</span>
            </div>

            <div className="grid grid-cols-12 gap-2 text-[10px]">
              <div className="col-span-7 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[8px] text-slate-400 font-mono">CUPOM FISCAL</div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200"><span>Refri Lata</span><span>R$ 6,00</span></div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200"><span>Pão Francês</span><span>R$ 14,00</span></div>
              </div>
              <div className="col-span-5 flex flex-col justify-between gap-1">
                <div className="bg-slate-900 text-emerald-400 p-1.5 rounded-lg text-center shadow-inner">
                  <div className="text-[8px] font-bold text-slate-400">TOTAL A PAGAR</div>
                  <div className="text-sm font-black tabular-nums">R$ 20,00</div>
                </div>
                <button type="button" style={{ backgroundColor: corPrimaria }} className="w-full py-1.5 text-white font-black text-[10px] rounded-lg shadow-sm flex items-center justify-center gap-1">
                  <span>[F10] FINALIZAR</span><ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Miniatura Retaguarda */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{nomeLoja || 'Minha Loja'} (ERP)</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">powered by ClickStorm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ backgroundColor: corPrimaria }} className="px-2 py-0.5 text-white text-[9px] font-bold rounded-md shadow-xs flex items-center gap-1">
                <ShoppingCart className="w-2.5 h-2.5" /><span>Vendas (Ativa)</span>
              </div>
              <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-medium rounded-md">Estoque</div>
              <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-medium rounded-md">Financeiro</div>
              <button type="button" style={{ backgroundColor: corPrimaria }} className="ml-auto px-2 py-0.5 text-white text-[9px] font-bold rounded-md flex items-center gap-1">
                <Plus className="w-2.5 h-2.5" /><span>Novo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
