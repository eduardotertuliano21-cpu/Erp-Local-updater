import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

export function CobrancaExtraModal({ onClose, onSuccess }) {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [cobrancaCriada, setCobrancaCriada] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api.getTenants('', '', 1)
      .then((res) => {
        const lista = res?.tenants || [];
        setTenants(lista);
        if (lista.length > 0) setSelectedTenantId(lista[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  const sugestoes = [
    'Taxa de Implantação e Treinamento Presencial',
    'Customização e Relatório Personalizado DRE',
    'Terminal de Caixa Extra (Adicional)',
    'Consultoria e Suporte Estendido VIP',
    'Configuração Fiscal e Certificado Digital A1',
  ];

  const handleCriarCobranca = async (e) => {
    e.preventDefault();
    const valNum = parseFloat(valor);
    if (!selectedTenantId || !descricao.trim() || isNaN(valNum) || valNum <= 0) {
      alert('Preencha todos os campos com um valor válido.');
      return;
    }

    setSalvando(true);
    try {
      const res = await api.createCobrancaExtra({
        tenantId: selectedTenantId,
        descricao: descricao.trim(),
        valor: valNum,
      });

      if (res?.sucesso) {
        setCobrancaCriada(res.pagamento);
        if (onSuccess) onSuccess();
      } else {
        alert(res?.erro || 'Erro ao gerar cobrança extra.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao comunicar com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  const copiarLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const getWhatsAppLink = (pag) => {
    const rawTel = pag.telefone ? String(pag.telefone).replace(/\D/g, '') : '';
    const ddi = rawTel.startsWith('55') ? rawTel : `55${rawTel}`;
    const valorFmt = `R$ ${pag.valor.toFixed(2).replace('.', ',')}`;
    const texto = `Olá *${pag.tenantNome}*!\n\nSegue o link para pagamento do serviço contratado:\n📌 *${pag.descricao}*\n💰 *Valor:* ${valorFmt}\n\n👉 Acesse o link seguro para efetuar o pagamento via Pix ou Cartão:\n${pag.linkPagamento || pag.stripeCheckoutUrl}\n\nQualquer dúvida, estamos à disposição!`;
    return `https://wa.me/${ddi}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">💳</span>
              Enviar Cobrança Extra
            </h3>
            <p className="text-xs text-slate-400">Gere faturas avulsas por serviços prestados com checkout Stripe</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {cobrancaCriada ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <p className="font-bold text-sm text-emerald-400 mb-1">✓ Cobrança Gerada com Sucesso!</p>
              <p>A fatura foi registrada e o link seguro de checkout já está disponível.</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Cliente:</span>
                <span className="font-semibold text-white">{cobrancaCriada.tenantNome}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Serviço:</span>
                <span className="font-semibold text-white">{cobrancaCriada.descricao}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Valor:</span>
                <span className="font-black text-emerald-400 text-sm">
                  R$ {cobrancaCriada.valor.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Link de Pagamento Seguro:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={cobrancaCriada.linkPagamento || cobrancaCriada.stripeCheckoutUrl || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => copiarLink(cobrancaCriada.linkPagamento || cobrancaCriada.stripeCheckoutUrl)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white rounded-xl shrink-0 transition"
                >
                  {copiado ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href={getWhatsAppLink(cobrancaCriada)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <span>📲</span> Enviar no WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCriarCobranca} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Cliente / Loja Destino</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.razaoSocial} ({t.cnpj})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Descrição do Serviço Prestado</label>
              <input
                type="text"
                required
                placeholder="Ex: Implantação Presencial ou Módulo Adicional"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sugestoes.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDescricao(sug)}
                    className="text-[10px] px-2 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-slate-300 transition"
                  >
                    + {sug.split(' ')[0]} {sug.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Valor do Serviço (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  placeholder="150.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
              >
                {salvando ? 'Gerando Cobrança...' : 'Gerar Fatura & Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
