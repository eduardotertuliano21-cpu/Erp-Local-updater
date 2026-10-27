import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Sparkles, Cpu } from 'lucide-react';
import { masterAdminApi } from '../../services/masterAdminApi.js';

interface CaixaPretaItem {
  id: number;
  timestamp: string;
  tipo_evento: string;
  codigo_original: string;
  diagnostico_ia: string;
  resolvido: number;
}

export const CaixaPretaTab: React.FC = () => {
  const [erros, setErros] = useState<CaixaPretaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [msgStatus, setMsgStatus] = useState<string | null>(null);
  const [textoSimulacao, setTextoSimulacao] = useState('Rejeição 539: Duplicidade de NFC-e com diferença na Chave de Acesso [chNFe:3526010000000000]');

  const carregar = async () => {
    setLoading(true);
    setMsgStatus(null);
    const res = await masterAdminApi.obterCaixaPreta(50);
    setLoading(false);
    if (res.success && Array.isArray(res.erros)) {
      setErros(res.erros);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleResolver = async (id: number) => {
    const res = await masterAdminApi.resolverErroCaixaPreta(id);
    if (res.success) {
      setErros((prev) => prev.filter((item) => item.id !== id));
      setMsgStatus(`Erro #${id} marcado como resolvido na Caixa Preta!`);
    }
  };

  const handleTestarSimulacao = async () => {
    if (!textoSimulacao.trim()) return;
    setSimulando(true);
    const res = await masterAdminApi.testarDiagnosticoIa('REJEICAO_SEFAZ', textoSimulacao.trim());
    setSimulando(false);
    if (res.success && res.registro) {
      setMsgStatus(`⚡ Diagnóstico gerado com sucesso via IA!`);
      carregar();
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-white text-sm flex items-center gap-2">
              <span>Caixa Preta & Diagnóstico IA</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Llama 3.1 / Groq
              </span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              {erros.length} ocorrência(s) pendente(s) • Custo zero de tokens em vendas aprovadas
            </p>
          </div>
        </div>
        <button
          onClick={carregar}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1 cursor-pointer"
          title="Recarregar Caixa Preta"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span className="text-[11px] font-bold">Atualizar</span>
        </button>
      </div>

      {msgStatus && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{msgStatus}</span>
        </div>
      )}

      {/* Caixa de Simulação de Erro / Teste ao Vivo da IA */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Testar Diagnóstico Inteligente Groq:</span>
          </span>
          <span className="text-slate-500 font-mono text-[10px]">max_tokens: 80</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={textoSimulacao}
            onChange={(e) => setTextoSimulacao(e.target.value)}
            placeholder="Cole uma rejeição da SEFAZ para testar..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-slate-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleTestarSimulacao}
            disabled={simulando}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${simulando ? 'animate-spin' : ''}`} />
            <span>{simulando ? 'Analisando...' : 'Diagnosticar'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Erros Pendentes */}
      {erros.length === 0 ? (
        <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 space-y-1">
          <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
          <p className="font-bold text-slate-300">Caixa Preta sem falhas pendentes</p>
          <p className="text-[11px]">Nenhuma rejeição fiscal ou erro técnico não resolvido registrado.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {erros.map((erro) => (
            <div
              key={erro.id}
              className="p-3 bg-slate-950 rounded-2xl border border-rose-950/70 hover:border-rose-900/90 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {erro.tipo_evento}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    #{erro.id} • {erro.timestamp}
                  </span>
                </div>
                <button
                  onClick={() => handleResolver(erro.id)}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Marcar Resolvido</span>
                </button>
              </div>

              {/* Diagnóstico da IA */}
              <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl space-y-1">
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Solução Sugerida (IA Llama):</span>
                </div>
                <p className="text-white font-medium text-xs leading-relaxed">
                  {erro.diagnostico_ia}
                </p>
              </div>

              {/* Código Original Bruto */}
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 break-all">
                <span className="text-slate-600 block text-[9px] uppercase font-bold">Log Técnico Bruto</span>
                {erro.codigo_original}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
