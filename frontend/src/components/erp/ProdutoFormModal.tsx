import React, { useState, useEffect } from 'react';
import type { Produto } from '../../types/pdv.js';
import { api } from '../../services/api.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { FotoUploadSection } from './FotoUploadSection.js';
import { VestuarioFields } from './VestuarioFields.js';
import { GradeGeneratorModal } from './GradeGeneratorModal.js';
import { FiscalFieldsSection } from './FiscalFieldsSection.js';
import { BalancaProdutoSection } from './BalancaProdutoSection.js';

interface ProdutoFormModalProps {
  isOpen: boolean;
  produtoEditando?: Produto | null;
  tipoInicial?: 'VAREJO' | 'RESTAURANTE';
  onClose: () => void;
  onSalvo: () => void;
}

export const ProdutoFormModal: React.FC<ProdutoFormModalProps> = ({
  isOpen,
  produtoEditando,
  tipoInicial = 'VAREJO',
  onClose,
  onSalvo,
}) => {
  const { isVestuario, isRestaurante, isAutoPecas, isAssistencia } = useBusinessMode();

  const categoriasNicho = isRestaurante
    ? ['PRATOS', 'BEBIDAS', 'PORÇÕES', 'SOBREMESAS', 'COMBOS', 'GERAL']
    : isVestuario
    ? ['VESTUARIO', 'CALÇADOS', 'ACESSÓRIOS', 'MASCULINO', 'FEMININO', 'INFANTIL', 'GERAL']
    : isAutoPecas
    ? ['PEÇAS MECÂNICAS', 'ELÉTRICA', 'SUSPENSÃO', 'ACESSÓRIOS', 'FLUIDOS', 'GERAL']
    : isAssistencia
    ? ['SERVIÇOS', 'PEÇAS DE REPOSIÇÃO', 'ACESSÓRIOS', 'PERIFÉRICOS', 'GERAL']
    : ['MERCEARIA', 'HORTIFRÚTI', 'AÇOUGUE & FRIOS', 'BEBIDAS', 'PADARIA', 'LIMPEZA', 'HIGIENE', 'GERAL'];

  const [codigoBarras, setCodigoBarras] = useState(''), [sku, setSku] = useState(''), [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(categoriasNicho[0]), [precoVenda, setPrecoVenda] = useState(''), [unidadeMedida, setUnidadeMedida] = useState('UN');
  const [isPesavelCheckout, setIsPesavelCheckout] = useState(false);
  const [isPesavelEtiqueta, setIsPesavelEtiqueta] = useState(false), [pluBalanca, setPluBalanca] = useState(''), [validadeBalanca, setValidadeBalanca] = useState('5');
  const [ncm, setNcm] = useState('00000000'), [cest, setCest] = useState(''), [cfop, setCfop] = useState('5102');
  const [cstCsosn, setCstCsosn] = useState('102'), [origem, setOrigem] = useState(0), [aliquotaIcms, setAliquotaIcms] = useState('0');
  const [ativo, setAtivo] = useState(true), [foto, setFoto] = useState<string | null>(null), [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [marca, setMarca] = useState(''), [modelo, setModelo] = useState(''), [tamanho, setTamanho] = useState(''), [cor, setCor] = useState('');
  const [modalGradeAberto, setModalGradeAberto] = useState(false), [salvando, setSalvando] = useState(false), [erro, setErro] = useState<string | null>(null);

  const gerarCodigoAuto = () => setCodigoBarras(String(Math.floor(100 + Math.random() * 900)));

  useEffect(() => {
    if (produtoEditando) {
      setCodigoBarras(produtoEditando.codigo_barras);
      setSku(produtoEditando.sku || '');
      setDescricao(produtoEditando.descricao);
      setCategoria(produtoEditando.categoria || categoriasNicho[0]);
      setPrecoVenda(produtoEditando.preco_venda.toString());
      setUnidadeMedida(produtoEditando.unidade_medida || 'UN');
      setIsPesavelCheckout(Boolean(produtoEditando.is_pesavel_checkout));
      setIsPesavelEtiqueta(Boolean(produtoEditando.is_pesavel_etiqueta || produtoEditando.pesavel));
      setPluBalanca(produtoEditando.plu_balanca ? String(produtoEditando.plu_balanca) : (produtoEditando.codigo_balanca || ''));
      setValidadeBalanca(produtoEditando.validade_balanca ? String(produtoEditando.validade_balanca) : '5');
      setNcm(produtoEditando.ncm || '00000000');
      setCest(produtoEditando.cest || '');
      setCfop(produtoEditando.cfop || '5102');
      setCstCsosn(produtoEditando.cst_csosn || '102');
      setOrigem(produtoEditando.origem ?? 0);
      setAliquotaIcms((produtoEditando.aliquota_icms || 0).toString());
      setAtivo(produtoEditando.ativo !== 0);
      setFoto(produtoEditando.foto || null);
      setPreviewFoto(produtoEditando.foto ? `/imagens/${produtoEditando.foto}` : null);
      setMarca(produtoEditando.marca || ''); setModelo(produtoEditando.modelo || '');
      setTamanho(produtoEditando.tamanho || ''); setCor(produtoEditando.cor || '');
    } else {
      if (isRestaurante || tipoInicial === 'RESTAURANTE') gerarCodigoAuto(); else setCodigoBarras('');
      setSku(''); setDescricao(''); setCategoria(categoriasNicho[0]); setPrecoVenda(''); setUnidadeMedida('UN');
      setIsPesavelCheckout(false); setIsPesavelEtiqueta(false); setPluBalanca(''); setValidadeBalanca('5');
      setNcm('00000000'); setCest(''); setCfop('5102'); setCstCsosn('102'); setOrigem(0); setAliquotaIcms('0');
      setAtivo(true); setFoto(null); setPreviewFoto(null); setMarca(''); setModelo(''); setTamanho(''); setCor('');
    }
    setErro(null);
  }, [produtoEditando, tipoInicial, isVestuario, isRestaurante, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    const preco = parseFloat(precoVenda.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) {
      setErro('Informe um preço de venda válido maior que zero.');
      return;
    }
    if (!codigoBarras.trim() || !descricao.trim()) {
      setErro('Código e descrição são obrigatórios.');
      return;
    }

    setSalvando(true);
    try {
      const tipoFinal = (isRestaurante || tipoInicial === 'RESTAURANTE') ? 'RESTAURANTE' : 'VAREJO';
      const ramoFinal: 'varejo' | 'restaurante' = isRestaurante ? 'restaurante' : 'varejo';
      const payload: Partial<Produto> = {
        id: produtoEditando?.id,
        codigo_barras: codigoBarras.trim(),
        sku: sku.trim() || undefined,
        descricao: descricao.trim().toUpperCase(),
        categoria: categoria.trim().toUpperCase(),
        tipo_pdv: tipoFinal,
        ramo_atuacao: ramoFinal,
        preco_venda: preco,
        unidade_medida: unidadeMedida.trim().toUpperCase(),
        pesavel: isPesavelEtiqueta ? 1 : 0,
        is_pesavel_checkout: isPesavelCheckout ? 1 : 0,
        is_pesavel_etiqueta: isPesavelEtiqueta ? 1 : 0,
        plu_balanca: pluBalanca.trim() ? parseInt(pluBalanca.trim(), 10) : undefined,
        codigo_balanca: isPesavelEtiqueta ? (pluBalanca.trim() || undefined) : undefined,
        validade_balanca: isPesavelEtiqueta ? (parseInt(validadeBalanca, 10) || 5) : 5,
        ncm: ncm.trim() || '00000000',
        cest: cest.trim() || undefined,
        cfop: cfop.trim() || '5102',
        cst_csosn: cstCsosn.trim() || '102',
        origem,
        aliquota_icms: parseFloat(aliquotaIcms.replace(',', '.')) || 0,
        ativo: ativo ? 1 : 0,
        foto: foto || undefined,
        marca: isVestuario ? (marca.trim().toUpperCase() || undefined) : undefined,
        modelo: isVestuario ? (modelo.trim().toUpperCase() || undefined) : undefined,
        tamanho: isVestuario ? (tamanho.trim().toUpperCase() || undefined) : undefined,
        cor: isVestuario ? (cor.trim().toUpperCase() || undefined) : undefined,
      };

      const res = await api.salvarProduto(payload);
      if (res.success) {
        onSalvo();
        onClose();
      } else {
        setErro(res.error || 'Erro ao salvar produto');
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span>{isRestaurante ? '🍽️' : isVestuario ? '👕' : '📦'}</span>
            <span>{produtoEditando ? 'EDITAR ITEM' : (isRestaurante ? 'NOVO ITEM DO CARDÁPIO' : isVestuario ? 'NOVO ITEM DE VESTUÁRIO' : 'NOVO PRODUTO NO CATÁLOGO')}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {erro && <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200">{erro}</div>}

          <FotoUploadSection
            foto={foto}
            previewFoto={previewFoto}
            onFotoUploaded={(nome, base64) => { setFoto(nome); setPreviewFoto(base64); }}
            onFotoRemoved={() => { setFoto(null); setPreviewFoto(null); }}
            onError={(msg) => setErro(msg)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">{isRestaurante ? 'Código do Item *' : 'Código de Barras *'}</label>
                <button type="button" onClick={gerarCodigoAuto} className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer">Gerar Código</button>
              </div>
              <input type="text" required value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Ex: 101 ou EAN" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">SKU / Ref. Interna</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder={isVestuario ? 'Ex: VEST-01' : isRestaurante ? 'Ex: PRATO-01' : 'Ex: PROD-101'} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Descrição / Nome do Produto *</label>
            <input type="text" required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={isRestaurante ? 'Ex: X-BURGER ESPECIAL / SUCO DE LARANJA' : isVestuario ? 'Ex: CAMISETA OVERSIZED VINTAGE' : 'Ex: ARROZ TIPO 1 5KG / REFRIGERANTE 2L'} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none uppercase" />
          </div>

          {isVestuario && (
            <VestuarioFields
              marca={marca} onChangeMarca={setMarca}
              modelo={modelo} onChangeModelo={setModelo}
              tamanho={tamanho} onChangeTamanho={setTamanho}
              cor={cor} onChangeCor={setCor}
              onAbrirGeradorGrade={() => setModalGradeAberto(true)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:border-indigo-500 focus:outline-none">
                {categoriasNicho.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unidade de Medida</label>
              <select value={unidadeMedida} onChange={(e) => setUnidadeMedida(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white">
                <option value="UN">UN - Unidade</option>
                <option value="KG">KG - Quilo</option>
                <option value="PC">PC - Peça</option>
                <option value="CX">CX - Caixa</option>
                <option value="L">L - Litro</option>
                {isVestuario && <option value="PAR">PAR - Par (Calçados)</option>}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Preço Venda (R$) *</label>
              <input type="text" required value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          {!isRestaurante && (
            <BalancaProdutoSection
              isPesavelCheckout={isPesavelCheckout}
              onChangeIsPesavelCheckout={(v) => {
                setIsPesavelCheckout(v);
                if (v && unidadeMedida === 'UN') setUnidadeMedida('KG');
              }}
              isPesavelEtiqueta={isPesavelEtiqueta}
              onChangeIsPesavelEtiqueta={(v) => {
                setIsPesavelEtiqueta(v);
                if (v && unidadeMedida === 'UN') setUnidadeMedida('KG');
              }}
              pluBalanca={pluBalanca}
              onChangePluBalanca={setPluBalanca}
              validadeBalanca={validadeBalanca}
              onChangeValidadeBalanca={setValidadeBalanca}
            />
          )}

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-300">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700" />
              <span>Ativo para Venda no PDV</span>
            </label>
          </div>

          <FiscalFieldsSection
            ncm={ncm} onChangeNcm={setNcm}
            cest={cest} onChangeCest={setCest}
            cfop={cfop} onChangeCfop={setCfop}
            cstCsosn={cstCsosn} onChangeCstCsosn={setCstCsosn}
            origem={origem} onChangeOrigem={setOrigem}
            aliquotaIcms={aliquotaIcms} onChangeAliquotaIcms={setAliquotaIcms}
          />

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-black transition shadow-lg shadow-indigo-600/30 cursor-pointer">
              {salvando ? 'Salvando...' : 'Salvar Item'}
            </button>
          </div>
        </form>
      </div>

      {isVestuario && (
        <GradeGeneratorModal
          isOpen={modalGradeAberto}
          onClose={() => setModalGradeAberto(false)}
          onSuccess={() => { onSalvo(); onClose(); }}
          baseDescricao={descricao}
          basePreco={precoVenda}
          baseMarca={marca}
          baseModelo={modelo}
          baseCategoria={categoria}
        />
      )}
    </div>
  );
};
