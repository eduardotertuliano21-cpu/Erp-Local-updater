import React, { useState } from 'react';
import { X, Sparkles, Shirt, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';

interface GradeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  baseDescricao: string;
  basePreco: string;
  baseMarca?: string;
  baseModelo?: string;
  baseCategoria?: string;
}

const GRADES_PRESETS = {
  LETRAS: ['P', 'M', 'G', 'GG'],
  CALCADOS: ['37', '38', '39', '40', '41', '42'],
  INFANTIL: ['2', '4', '6', '8', '10', '12'],
};

export const GradeGeneratorModal: React.FC<GradeGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  baseDescricao,
  basePreco,
  baseMarca = '',
  baseModelo = '',
  baseCategoria = 'VESTUARIO',
}) => {
  const [tipoGrade, setTipoGrade] = useState<'LETRAS' | 'CALCADOS' | 'INFANTIL'>('LETRAS');
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>(['P', 'M', 'G', 'GG']);
  const [coresTexto, setCoresTexto] = useState('Preto, Branco');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTamanho = (tam: string) => {
    setTamanhosSelecionados((prev) =>
      prev.includes(tam) ? prev.filter((t) => t !== tam) : [...prev, tam]
    );
  };

  const selecionarPreset = (preset: 'LETRAS' | 'CALCADOS' | 'INFANTIL') => {
    setTipoGrade(preset);
    setTamanhosSelecionados(GRADES_PRESETS[preset]);
  };

  const cores = coresTexto
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const totalVariacoes = tamanhosSelecionados.length * (cores.length || 1);

  const handleGerar = async () => {
    if (!baseDescricao.trim()) {
      setErro('Informe a descrição base do produto antes de gerar a grade.');
      return;
    }
    const precoNum = parseFloat(basePreco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setErro('Informe um preço de venda base válido.');
      return;
    }
    if (tamanhosSelecionados.length === 0) {
      setErro('Selecione ao menos um tamanho para a grade.');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      const coresFinal = cores.length > 0 ? cores : [''];
      const timestampBase = Date.now().toString().slice(-6);

      let counter = 1;
      for (const tam of tamanhosSelecionados) {
        for (const cor of coresFinal) {
          const sufixoDesc = [tam ? `TAM ${tam}` : '', cor ? `COR ${cor}` : ''].filter(Boolean).join(' - ');
          const descCompleta = `${baseDescricao.trim().toUpperCase()} [${sufixoDesc}]`;
          const barcodeUnico = `GRD${timestampBase}${String(counter++).padStart(3, '0')}`;

          await api.salvarProduto({
            codigo_barras: barcodeUnico,
            descricao: descCompleta,
            preco_venda: precoNum,
            categoria: baseCategoria || 'VESTUARIO',
            tipo_pdv: 'VAREJO',
            ramo_atuacao: 'varejo',
            unidade_medida: 'UN',
            marca: baseMarca.trim().toUpperCase() || undefined,
            modelo: baseModelo.trim().toUpperCase() || undefined,
            tamanho: tam || undefined,
            cor: cor || undefined,
            ativo: 1,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Falha ao gerar itens da grade');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Gerador de Grade de Variações</h2>
              <p className="text-[10px] text-slate-400">Gera variações em massa (tamanhos x cores) com códigos individuais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {erro && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-slate-300">
            <div className="font-bold text-white truncate">Item Base: {baseDescricao || '(Preencha no formulário)'}</div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Preço Base: R$ {basePreco || '0,00'}</span>
              <span>Marca: {baseMarca || 'Não informada'}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Preset de Tamanhos</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selecionarPreset('LETRAS')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  tipoGrade === 'LETRAS' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                P / M / G / GG
              </button>
              <button
                type="button"
                onClick={() => selecionarPreset('CALCADOS')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  tipoGrade === 'CALCADOS' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Calçados (37 a 42)
              </button>
              <button
                type="button"
                onClick={() => selecionarPreset('INFANTIL')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  tipoGrade === 'INFANTIL' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Infantil (2 a 12)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tamanhos Ativos</label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES_PRESETS[tipoGrade].map((tam) => {
                const ativo = tamanhosSelecionados.includes(tam);
                return (
                  <button
                    key={tam}
                    type="button"
                    onClick={() => toggleTamanho(tam)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                      ativo ? 'bg-rose-500/20 text-rose-300 border-rose-500' : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {ativo && <Check className="w-3 h-3 text-rose-400" />}
                    <span>{tam}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cores (Separadas por vírgula)
            </label>
            <input
              type="text"
              value={coresTexto}
              onChange={(e) => setCoresTexto(e.target.value)}
              placeholder="Ex: Preto, Branco, Azul, Vermelho"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Total de Variações a Criar:</span>
            <span className="font-black text-rose-400 font-mono text-sm">{totalVariacoes} itens</span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGerar}
              disabled={gerando || totalVariacoes === 0}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/30"
            >
              {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Gerar Grade ({totalVariacoes} Itens)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
