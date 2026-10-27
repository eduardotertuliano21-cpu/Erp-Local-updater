import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export function ConfiguracoesView() {
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    setLoading(true);
    try {
      const res = await api.getConfig();
      if (res.success && res.data) {
        setStripeSecretKey(res.data.stripeSecretKey || '');
        setStripePublicKey(res.data.stripePublicKey || '');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      const res = await api.updateConfig({
        stripeSecretKey: stripeSecretKey.trim(),
        stripePublicKey: stripePublicKey.trim(),
      });
      if (res.success) {
        setMensagem({ tipo: 'sucesso', texto: res.mensagem || 'Chaves do Stripe salvas e ativadas com sucesso!' });
      } else {
        setMensagem({ tipo: 'erro', texto: res.error || 'Falha ao salvar configurações.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão com o servidor Master.' });
    } finally {
      setSalvando(false);
    }
  };

  const isLiveSecret = stripeSecretKey.startsWith('sk_live_');
  const isLivePublic = stripePublicKey.startsWith('pk_live_');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Configurações de Gateway e Stripe
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie as credenciais oficiais da Stripe para processamento de Pix dinâmico e Cartão de Crédito in-app.
          </p>
        </div>
        <button
          onClick={carregarConfig}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition"
        >
          🔄 Recarregar
        </button>
      </div>

      {mensagem && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{mensagem.tipo === 'sucesso' ? '✅' : '⚠️'}</span>
          <span>{mensagem.texto}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Carregando credenciais do Stripe...
        </div>
      ) : (
        <form onSubmit={handleSalvar} className="space-y-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">💳</span> Credenciais Stripe API (Produção ou Teste)
            </h3>

            {/* Chave Secreta */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Stripe Secret Key (sk_live_... / sk_test_...)
                </label>
                {stripeSecretKey && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isLiveSecret
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isLiveSecret ? 'PRODUÇÃO ATIVA' : 'MODO TESTE'}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="sk_live_51TaQ8wBCbgc2QvtD..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Utilizada pelo backend central para criar cobranças Pix dinâmicas oficiais e Payment Intents de cartão.
              </p>
            </div>

            {/* Chave Pública */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Stripe Publishable Key (pk_live_... / pk_test_...)
                </label>
                {stripePublicKey && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isLivePublic
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isLivePublic ? 'PRODUÇÃO ATIVA' : 'MODO TESTE'}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={stripePublicKey}
                onChange={(e) => setStripePublicKey(e.target.value)}
                placeholder="pk_live_51TaQ8wBCbgc2QvtD..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Utilizada pelo Stripe Elements no frontend para renderização do formulário seguro de cartão.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </div>

          {/* Dicas e Instruções BACEN / Stripe */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-2 text-xs text-slate-400">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>💡</span> Informações Importantes:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>
                <strong>Pix Oficial:</strong> Para que o Pix funcione, certifique-se de que o método Pix está ativo no seu Dashboard da Stripe em <span className="font-mono text-cyan-400">Configurações &gt; Métodos de Pagamento</span>.
              </li>
              <li>
                <strong>Erradicação de Pix Manual:</strong> O sistema não utiliza QR codes estáticos manuais; cada transação gera uma chave copia-e-cola única oficial no BACEN via Stripe.
              </li>
              <li>
                <strong>Persistência:</strong> As chaves salvas aqui são gravadas no arquivo central de dados da nuvem e permanecem ativas mesmo após reinicialização do servidor.
              </li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
}
