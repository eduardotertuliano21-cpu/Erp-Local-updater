import React, { useState, useEffect, useRef } from 'react';
import { Scale, Check, X, RefreshCw } from 'lucide-react';
import type { Produto } from '../../types/pdv.js';
import { api } from '../../services/api.js';

interface PesagemAoVivoModalProps {
  isOpen: boolean;
  produto: Produto | null;
  onConfirmar: (peso: number) => void;
  onCancelar: () => void;
}

export const PesagemAoVivoModal: React.FC<PesagemAoVivoModalProps> = ({
  isOpen,
  produto,
  onConfirmar,
  onCancelar,
}) => {
  const [pesoAtual, setPesoAtual] = useState<number>(0);
  const [estavel, setEstavel] = useState<boolean>(false);
  const [portaAtiva, setPortaAtiva] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('Sondando balança do caixa...');
  const [pesoManual, setPesoManual] = useState<string>('');
  const [modoManual, setModoManual] = useState<boolean>(false);
  const pollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen || !produto) {
      setPesoAtual(0);
      setEstavel(false);
      setModoManual(false);
      setPesoManual('');
      return;
    }

    let interval: any = null;
    let ativo = true;

    const sondarBalanca = async () => {
      if (pollingRef.current || modoManual) return;
      pollingRef.current = true;
      try {
        const res = await api.testarBalanca();
        if (!ativo) return;
        const info = (res.data as any) || res;
        if (res.success && typeof info.peso === 'number') {
          setPesoAtual(info.peso);
          setEstavel(Boolean(info.estavel));
          if (info.porta) setPortaAtiva(info.porta);
          setStatusMsg(info.peso > 0 ? '✓ Peso detectado sobre o prato' : 'Coloque o produto na balança...');
        } else {
          setStatusMsg(res.error || info.erro || 'Aguardando balança...');
          if (info.porta) setPortaAtiva(info.porta);
        }
      } catch {
        if (ativo) setStatusMsg('Buscando sinal da balança serial...');
      } finally {
        pollingRef.current = false;
      }
    };

    sondarBalanca();
    interval = setInterval(sondarBalanca, 400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar();
      if (e.key === 'Enter') {
        const pesoFinal = modoManual ? parseFloat(pesoManual.replace(',', '.')) : pesoAtual;
        if (!isNaN(pesoFinal) && pesoFinal > 0) {
          onConfirmar(pesoFinal);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      ativo = false;
      if (interval) clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, produto, modoManual, pesoManual, pesoAtual, onConfirmar, onCancelar]);

  if (!isOpen || !produto) return null;

  const precoUnitario = Number(produto.preco_promocional ?? produto.preco_venda);
  const pesoValido = modoManual ? (parseFloat(pesoManual.replace(',', '.')) || 0) : pesoAtual;
  const subtotalEstimado = parseFloat((pesoValido * precoUnitario).toFixed(2));

  const handleConfirmar = () => {
    if (pesoValido > 0) {
      onConfirmar(pesoValido);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col animate-scaleUp">
        {/* Topo */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-tight">Pesagem ao Vivo no Caixa</h2>
              <p className="text-[10px] text-slate-400">{portaAtiva ? `Conectada em ${portaAtiva}` : 'Balança Serial / USB'}</p>
            </div>
          </div>
          <button onClick={onCancelar} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Produto & Preço */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Item Pesável</span>
            <div className="text-sm font-black text-white uppercase truncate" title={produto.descricao}>
              {produto.descricao}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex justify-between font-mono">
              <span>Preço por Quilo:</span>
              <span className="font-bold text-slate-200">R$ {precoUnitario.toFixed(2)} / KG</span>
            </div>
          </div>

          {/* Visor Digital Centralizado */}
          {!modoManual ? (
            <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-5 text-center shadow-inner relative overflow-hidden">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1 px-1">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${pesoAtual > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {estavel ? 'ESTÁVEL' : 'CAPTURANDO'}
                </span>
                <span>PADRÃO KG</span>
              </div>
              <div className="text-5xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] tabular-nums my-1">
                {pesoAtual.toFixed(3)}
                <span className="text-xl text-emerald-500/70 ml-2 font-sans font-bold">KG</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                <span>{statusMsg}</span>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-slate-300">Digitar Peso Manual (KG):</label>
              <input
                type="text"
                autoFocus
                value={pesoManual}
                onChange={(e) => setPesoManual(e.target.value)}
                placeholder="Ex: 0.750 ou 1.250"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-2xl font-black font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 text-center"
              />
            </div>
          )}

          {/* Subtotal da Pesagem */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-bold uppercase text-[11px]">Subtotal do Item:</span>
            <span className="text-xl font-black font-mono text-emerald-400 tabular-nums">
              R$ {subtotalEstimado.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
            <button
              type="button"
              onClick={() => setModoManual((prev) => !prev)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {modoManual ? '← Voltar à Leitura Serial Automática' : 'Digitar peso manualmente (sem balança)'}
            </button>
            <span>[ENTER] Confirmar | [ESC] Cancelar</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pesoValido <= 0}
            onClick={handleConfirmar}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Peso [ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
