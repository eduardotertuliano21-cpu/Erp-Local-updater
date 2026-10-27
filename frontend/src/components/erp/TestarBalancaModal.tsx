import React, { useState, useEffect, useRef } from 'react';
import { X, Scale, RefreshCw, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { api } from '../../services/api.js';

interface TestarBalancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloPadrao?: string;
  portaPadrao?: string;
}

export const TestarBalancaModal: React.FC<TestarBalancaModalProps> = ({
  isOpen,
  onClose,
  modeloPadrao = 'TOLEDO',
  portaPadrao = 'AUTO',
}) => {
  const [peso, setPeso] = useState<number | null>(null);
  const [portaAtiva, setPortaAtiva] = useState<string>('');
  const [modeloAtivo, setModeloAtivo] = useState<string>(modeloPadrao);
  const [estavel, setEstavel] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [homologada, setHomologada] = useState<boolean>(false);
  const [leiturasSucesso, setLeiturasSucesso] = useState<number>(0);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setPeso(null);
      setErro(null);
      setHomologada(false);
      setLeiturasSucesso(0);
      return;
    }

    let intervalId: any = null;
    let cancelado = false;

    const sondar = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await api.testarBalanca(modeloPadrao, portaPadrao);
        if (cancelado) return;

        const info = (res.data as any) || res;
        const sucesso = Boolean(res.success ?? info.sucesso);

        if (sucesso && typeof info.peso === 'number') {
          setPeso(info.peso);
          setPortaAtiva(info.porta || portaPadrao);
          setModeloAtivo(info.modelo || modeloPadrao);
          setEstavel(Boolean(info.estavel));
          setErro(null);
          setHomologada(true);
          setLeiturasSucesso((prev) => prev + 1);
        } else {
          setErro(res.error || info.erro || 'Aguardando comunicação com a balança serial...');
          if (info.porta) setPortaAtiva(info.porta);
        }
      } catch (err: any) {
        if (!cancelado) {
          setErro(err.message || 'Falha na requisição de diagnóstico da balança');
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    sondar();
    intervalId = setInterval(sondar, 500);

    return () => {
      cancelado = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, modeloPadrao, portaPadrao]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col animate-scaleUp">
        {/* Topo do Modal */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>Diagnóstico de Balança de Checkout</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Plug & Play
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Leitura contínua em tempo real (Porta Serial / USB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Diagnóstico */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-xs text-slate-300 font-medium">
              ⚖️ Coloque um peso ou produto sobre o prato da balança para verificar a leitura em tempo real...
            </p>
          </div>

          {/* Display Digital Estilo VFD / LED de Checkout */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-inner flex flex-col items-center justify-center">
            {/* Linhas de fundo e efeito de visor */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

            <div className="w-full flex items-center justify-between mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${homologada ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{homologada ? 'SINAL SERIAL ATIVO' : 'PROCURANDO TRAMA'}</span>
              </div>
              <div className="flex items-center gap-2">
                {estavel && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    ESTÁVEL
                  </span>
                )}
                <span>BR: 9600/2400</span>
              </div>
            </div>

            {/* Numerais do Display */}
            <div className="py-2 text-center">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] tabular-nums">
                {peso !== null ? peso.toFixed(3) : '---.---'}
                <span className="text-2xl text-emerald-500/70 ml-2 font-sans font-bold">kg</span>
              </div>
            </div>

            {/* Informações da Conexão */}
            <div className="w-full pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Modelo: <strong className="text-slate-200">{modeloAtivo}</strong></span>
              </div>
              <div>
                <span>Porta: <strong className="text-emerald-400">{portaAtiva || 'AUTO-SCAN'}</strong></span>
              </div>
            </div>
          </div>

          {/* Selo Homologado Dinâmico ou Alerta */}
          {homologada ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-emerald-300">🟢 Balança Operacional e Homologada!</div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">
                  Comunicação serial estável ({leiturasSucesso} pacotes decodificados com sucesso).
                </div>
              </div>
            </div>
          ) : erro ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Aguardando resposta da balança...</p>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">{erro}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Sondando portas seriais ativas do computador...</span>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Polling ativo a cada 500ms
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            Concluir Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
