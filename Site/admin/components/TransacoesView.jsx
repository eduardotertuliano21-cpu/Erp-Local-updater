import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function TransacoesView() {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [copiadoId, setCopiadoId] = useState(null);

  const carregarTransacoes = () => {
    setLoading(true);
    api.getTransacoes()
      .then((data) => setTransacoes(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const handleBaixar = async (id) => {
    if (!window.confirm('Confirmar baixa manual deste pagamento?')) return;
    try {
      await api.baixarTransacao(id);
      carregarTransacoes();
    } catch (err) {
      console.error(err);
      alert('Erro ao dar baixa manual na transação.');
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja realmente apagar este registro do histórico?')) return;
    try {
      await api.deletarFatura(id);
      setTransacoes((prev) => prev.filter((item) => item.id !== id && item.stripeInvoiceId !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir fatura do histórico.');
    }
  };

  const copiarLink = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const getWhatsAppLink = (t) => {
    const rawTel = t.telefone ? String(t.telefone).replace(/\D/g, '') : '';
    const ddi = rawTel.startsWith('55') ? rawTel : `55${rawTel}`;
    const valorFmt = `R$ ${t.valor.toFixed(2).replace('.', ',')}`;
    const desc = t.descricao || 'Fatura ClickStorm ERP';
    const link = t.linkPagamento || t.stripeCheckoutUrl || `https://checkout.stripe.com/pay/${t.stripeInvoiceId}`;
    const texto = `Olá *${t.tenantNome}*!\n\nSegue o link para pagamento:\n📌 *${desc}*\n💰 *Valor:* ${valorFmt}\n\n👉 Acesse o link seguro para efetuar o pagamento via Pix ou Cartão:\n${link}\n\nQualquer dúvida, estamos à disposição!`;
    return `https://wa.me/${ddi}?text=${encodeURIComponent(texto)}`;
  };

  const filtradas = transacoes.filter((t) => {
    if (filtroTipo === 'ASSINATURA') return t.tipo !== 'SERVICO_EXTRA';
    if (filtroTipo === 'SERVICO_EXTRA') return t.tipo === 'SERVICO_EXTRA';
    return true;
  });

  const totalPago = transacoes
    .filter((t) => t.status === 'paid')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const totalPendente = transacoes
    .filter((t) => t.status === 'open')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Faturas, Cobranças & Stripe</h1>
          <p className="text-sm text-slate-400">Histórico de assinaturas, cobranças avulsas de serviços e conciliação</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          {['TODOS', 'ASSINATURA', 'SERVICO_EXTRA'].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroTipo === tipo
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tipo === 'TODOS' ? 'Todos' : tipo === 'ASSINATURA' ? 'Assinaturas' : 'Serviços Extras'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Recebido</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">R$ {totalPago.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 font-bold uppercase">Cobranças Pendentes</span>
          <div className="text-2xl font-black text-amber-400 mt-1">R$ {totalPendente.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 font-bold uppercase">Total de Registros</span>
          <div className="text-2xl font-black text-white mt-1">{filtradas.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300 min-w-[700px]">
          <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Loja / Cliente</th>
              <th className="p-4">Tipo & Descrição</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Status</th>
              <th className="p-4">Data</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando transações...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma fatura encontrada.</td></tr>
            ) : (
              filtradas.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-bold text-white">{t.tenantNome}</div>
                    <div className="text-xs text-slate-400 font-mono">{t.cnpj}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      t.tipo === 'SERVICO_EXTRA'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {t.tipo === 'SERVICO_EXTRA' ? 'Serviço Extra' : 'Assinatura'}
                    </span>
                    <div className="text-xs text-slate-300 font-medium">{t.descricao || 'Assinatura ERP'}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                      {t.stripeInvoiceId}
                    </div>
                  </td>
                  <td className="p-4 font-black text-white whitespace-nowrap">
                    R$ {Number(t.valor || 0).toFixed(2)}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      t.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : t.status === 'open'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {t.status === 'paid' ? 'PAGO' : t.status === 'open' ? 'PENDENTE' : 'FALHOU'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                    {t.dataPagamento ? new Date(t.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {(t.linkPagamento || t.stripeCheckoutUrl) && (
                        <>
                          <button
                            type="button"
                            onClick={() => copiarLink(t.id, t.linkPagamento || t.stripeCheckoutUrl)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                            title="Copiar Link de Pagamento"
                          >
                            {copiadoId === t.id ? '✓ Copiado' : '📋 Link'}
                          </button>
                          <a
                            href={getWhatsAppLink(t)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs transition"
                            title="Enviar cobrança no WhatsApp"
                          >
                            📲
                          </a>
                        </>
                      )}
                      {t.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleBaixar(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs transition border border-emerald-500/30"
                          title="Confirmar baixa manual"
                        >
                          ✓ Baixar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExcluir(t.id)}
                        className="p-1.5 text-rose-500 hover:text-red-400 hover:bg-rose-500/20 rounded-lg text-xs transition cursor-pointer"
                        title="Excluir fatura"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
