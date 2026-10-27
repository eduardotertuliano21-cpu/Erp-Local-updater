import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext.js';
import {
  Palette,
  Store,
  Sparkles,
  Upload,
  Check,
  RotateCcw,
  X,
  Trash2,
} from 'lucide-react';

interface VisualCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEGMENTOS_PRESETS = [
  { id: 'MERCADO', nome: 'Supermercado / Mercearia', cor: '#10b981', slogan: 'Preço baixo e qualidade todo dia' },
  { id: 'ACOUGUE', nome: 'Açougue & Carnes', cor: '#ef4444', slogan: 'Carnes nobres e cortes selecionados' },
  { id: 'PADARIA', nome: 'Padaria & Cafeteria', cor: '#f59e0b', slogan: 'Pães artesanais e café fresco' },
  { id: 'FARMACIA', nome: 'Farmácia & Drogaria', cor: '#06b6d4', slogan: 'Cuidando da sua saúde com carinho' },
  { id: 'BOUTIQUE', nome: 'Moda & Boutique', cor: '#ec4899', slogan: 'Estilo exclusivo e tendências' },
  { id: 'AUTOPECAS', nome: 'Autopeças & Materiais', cor: '#f97316', slogan: 'Ferramentas, peças e acabamento' },
  { id: 'TECH', nome: 'Tech & Informática', cor: '#8b5cf6', slogan: 'Alta tecnologia e periféricos' },
  { id: 'GERAL', nome: 'Varejo Pro Padrão', cor: '#0ea5e9', slogan: 'Frente de Caixa de Alta Performance' },
];

export const VisualCustomizerModal: React.FC<VisualCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { config, atualizarConfig } = useTheme();

  const [nomeLoja, setNomeLoja] = useState(config.nome_loja);
  const [slogan, setSlogan] = useState(config.slogan || '');
  const [corPrimaria, setCorPrimaria] = useState(config.cor_primaria);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(config.logo_url);
  const [segmento, setSegmento] = useState<string>(config.segmento || 'GERAL');
  const [temaVisual, setTemaVisual] = useState<'OBSIDIAN' | 'OLED' | 'ALTO_CONTRASTE'>(config.tema_visual || 'OBSIDIAN');
  const [densidade, setDensidade] = useState<'COMPACTO' | 'PADRAO' | 'CONFORTAVEL'>(config.densidade || 'PADRAO');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNomeLoja(config.nome_loja);
      setSlogan(config.slogan || '');
      setCorPrimaria(config.cor_primaria);
      setLogoUrl(config.logo_url);
      setSegmento(config.segmento || 'GERAL');
      setTemaVisual(config.tema_visual || 'OBSIDIAN');
      setDensidade(config.densidade || 'PADRAO');
      setSucesso(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSelectSegmento = (seg: typeof SEGMENTOS_PRESETS[0]) => {
    setSegmento(seg.id);
    setCorPrimaria(seg.cor);
    if (!slogan || slogan === config.slogan) {
      setSlogan(seg.slogan);
    }
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    const ok = await atualizarConfig({
      nome_loja: nomeLoja,
      slogan,
      cor_primaria: corPrimaria,
      logo_url: logoUrl,
      segmento,
      tema_visual: temaVisual,
      densidade,
    });
    setSalvando(false);
    if (ok) {
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-surface-900 to-surface-950 border border-white/[0.1] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shadow-glow-brand">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Personalização Visual do PDV</h2>
              <p className="text-xs text-zinc-400">Configure a identidade da sua loja, cores e densidade de tela</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Presets por Segmento */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Nicho / Segmento do Estabelecimento (Ajuste Rápido)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEGMENTOS_PRESETS.map((seg) => {
                const isSelected = segmento === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => handleSelectSegmento(seg)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/40 shadow-inner ring-1 ring-white/20'
                        : 'bg-black/30 border-white/[0.06] hover:bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: seg.cor }} />
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-bold text-white text-[11px] leading-tight">{seg.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Marca e Logotipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Nome do Estabelecimento *</label>
                <input
                  type="text"
                  value={nomeLoja}
                  onChange={(e) => setNomeLoja(e.target.value)}
                  placeholder="Ex: Açougue e Mercearia Progresso"
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-brand rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Slogan ou Subtítulo</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Qualidade e o melhor atendimento"
                  className="w-full bg-black/40 border border-white/[0.1] focus:border-brand rounded-xl px-3.5 py-2.5 text-zinc-300 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Logotipo da Loja */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Logotipo (PNG, SVG ou JPG)</label>
              <div className="p-3 bg-black/30 border border-white/[0.08] rounded-xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Store className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" onChange={handleUploadLogo} id="customizer-logo-upload" className="hidden" />
                    <label htmlFor="customizer-logo-upload" className="cursor-pointer px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-lg text-xs font-semibold border border-white/[0.12] inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-brand" />
                      <span>{logoUrl ? 'Trocar Logo' : 'Enviar Logo'}</span>
                    </label>
                    {logoUrl && (
                      <button type="button" onClick={() => setLogoUrl(undefined)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 transition" title="Remover Logo">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500">Exibido no painel de 30% e topo do PDV</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Seletor Livre de Cor e Estilo de Superfície */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Cor Primária Personalizada</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="w-10 h-10 bg-transparent border-0 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                  className="w-32 bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 font-mono text-xs text-white uppercase"
                />
                <span className="text-[10px] text-zinc-500">Dita cor de botões e destaques</span>
              </div>
            </div>

            {/* Densidade */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Densidade da Tela</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['COMPACTO', 'PADRAO', 'CONFORTAVEL'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensidade(d)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition text-center ${
                      densidade === d
                        ? 'bg-brand/20 border-brand text-white'
                        : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d === 'COMPACTO' ? 'Compacto (14-15")' : d === 'PADRAO' ? 'Padrão' : 'Amplo (Touch)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/[0.08] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setNomeLoja('CLICKSTORM PDV');
              setSlogan('Automação Comercial de Alta Performance');
              setCorPrimaria('#0ea5e9');
              setLogoUrl(undefined);
              setSegmento('GERAL');
              setTemaVisual('OBSIDIAN');
              setDensidade('PADRAO');
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition border border-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={handleSalvar}
              className="px-6 py-2 bg-gradient-to-r from-brand to-brand-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 transition flex items-center gap-1.5 border border-white/10"
            >
              {sucesso ? <Check className="w-4 h-4 text-white" /> : null}
              <span>{salvando ? 'Salvando...' : sucesso ? 'Aplicado!' : 'Salvar e Aplicar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
