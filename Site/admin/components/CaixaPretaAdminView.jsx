import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export function CaixaPretaAdminView() {
  const [erros, setErros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [lojaUrl, setLojaUrl] = useState('');
  const [textoSimulacao, setTextoSimulacao] = useState('Rejeição 539: Duplicidade de NFC-e com diferença na Chave de Acesso');

  const carregarErros = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await api.getCaixaPreta(lojaUrl, 50);
      if (res && Array.isArray(res.erros)) {
        setErros(res.erros);
      } else {
        setErros([]);
      }
    } catch (e) {
      setStatusMsg('Não foi possível conectar ao endpoint da Caixa Preta desta loja.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarErros();
  }, []);

  const handleResolver = async (id) => {
    try {
      const res = await api.resolverErroCaixaPreta(id, lojaUrl);
      if (res && res.success) {
        setErros((prev) => prev.filter((item) => item.id !== id));
        setStatusMsg(`✓ Ocorrência #${id} resolvida na máquina do cliente!`);
      }
    } catch {
      setStatusMsg('Erro ao comunicar resolução.');
    }
  };

  const handleTestarIa = async () => {
    if (!textoSimulacao.trim()) return;
    setSimulando(true);
    try {
      const res = await api.testarDiagnosticoIa('REJEICAO_SEFAZ', textoSimulacao.trim(), lojaUrl);
      if (res && res.success) {
        setStatusMsg('⚡ Diagnóstico Groq / Llama executado e gravado na Caixa Preta com sucesso!');
        carregarErros();
      }
    } catch {
      setStatusMsg('Falha ao processar teste com a IA.');
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg font-black text-white tracking-wide">
              Caixa Preta & Diagnóstico IA (Llama / Groq)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Zero Tokens Normal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento de falhas fiscais (SEFAZ) e exceções de hardware registradas diretamente no SQLite dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={lojaUrl}
            onChange={(e) => setLojaUrl(e.target.value)}
            placeholder="URL da Loja (vazio = local/nuvem)"
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:border-cyan-500 focus:outline-none w-56"
          />
          <button
            onClick={carregarErros}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Buscando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
          {statusMsg}
        </div>
      )}

      {/* Caixa de Teste de Diagnóstico */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Testar Diagnóstico Inteligente Groq Llama (max_tokens: 80):</span>
          <span className="text-slate-500 text-[11px] font-mono">Custo: R$ 0,00</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={textoSimulacao}
            onChange={(e) => setTextoSimulacao(e.target.value)}
            placeholder="Digite ou cole um erro fiscal/técnico..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleTestarIa}
            disabled={simulando}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
          >
            {simulando ? 'Analisando...' : '⚡ Testar IA'}
          </button>
        </div>
      </div>

      {/* Lista de Registros */}
      {erros.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-2">
          <span className="text-3xl">✅</span>
          <p className="font-bold text-white text-sm">Caixa Preta sem ocorrências pendentes</p>
          <p className="text-xs text-slate-400">
            Nenhuma rejeição fiscal ativa aguardando intervenção. Operações 100% saudáveis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {erros.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-rose-950/70 hover:border-rose-900 rounded-2xl p-4 space-y-3 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-black">
                    {item.tipo_evento}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    #{item.id} • {item.timestamp}
                  </span>
                </div>
                <button
                  onClick={() => handleResolver(item.id)}
                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ✓ Marcar Resolvido
                </button>
              </div>

              {/* Diagnóstico da IA */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <span>⚡ Solução Sugerida pela IA (Llama / Groq):</span>
                </div>
                <p className="text-white font-medium text-xs leading-relaxed">
                  {item.diagnostico_ia}
                </p>
              </div>

              {/* Código Bruto */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
                <span className="text-slate-600 block text-[9px] uppercase font-bold mb-0.5">Payload Original / SEFAZ</span>
                {item.codigo_original}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
