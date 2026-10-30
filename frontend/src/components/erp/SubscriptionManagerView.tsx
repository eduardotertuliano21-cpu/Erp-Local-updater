import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, CreditCard, Sparkles, Check, Plus, Trash2, Star, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { licencaApi, type LicencaStatusDTO } from '../../services/licencaApi.js';
import { stripeSubscriptionApi, type HistoricoAssinaturaItem, type CartaoCredito, type PlanoAssinatura } from '../../services/stripeSubscriptionApi.js';
import { SubscriptionPaymentModal } from '../subscription/SubscriptionPaymentModal.js';
import { CartaoFormModal } from '../subscription/CartaoFormModal.js';
import { SubscriptionHistoryTable } from '../subscription/SubscriptionHistoryTable.js';

export const SubscriptionManagerView: React.FC = () => {
  const [licenca, setLicenca] = useState<LicencaStatusDTO | null>(null);
  const [historico, setHistorico] = useState<HistoricoAssinaturaItem[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([
    { id: 'plano-mensal', nome: 'Plano Mensal', preco: 130.0, periodicidade: 'MENSAL', mesesRenovacao: 1, limiteCaixas: 3, valorMaquinaExtra: 25.0, recursos: ['Até 3 Máquinas Inclusas', 'PDV Frente de Caixa e Retaguarda', 'Emissão Fiscal NFC-e', 'Comandas Mobile'] },
    { id: 'plano-anual', nome: 'Plano Anual', preco: 1300.0, periodicidade: 'ANUAL', mesesRenovacao: 12, limiteCaixas: 3, valorMaquinaExtra: 25.0, recursos: ['Até 3 Máquinas Inclusas', '2 Meses Grátis', 'Backup Nuvem + USB', 'Suporte Prioritário'] }
  ]);
  const [loading, setLoading] = useState(true);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
  const [planoSelecionadoModal, setPlanoSelecionadoModal] = useState<'MENSAL' | 'ANUAL'>('MENSAL');
  const [valorCustomizadoModal, setValorCustomizadoModal] = useState<number | undefined>(undefined);

  const [modalConfirmarCancelamento, setModalConfirmarCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const abrirModalPagamento = (periodicidade: 'MENSAL' | 'ANUAL' = 'MENSAL') => {
    const pl = planos.find(p => p.periodicidade === periodicidade) || planos[0];
    setPlanoSelecionadoModal(periodicidade);
    setValorCustomizadoModal(pl?.preco);
    setModalPagamentoAberto(true);
  };

  const carregarDados = async () => {
    setLoading(true);
    const [resLic, resHist, resCards, resPlanos] = await Promise.all([
      licencaApi.obterStatus(),
      stripeSubscriptionApi.obterHistorico(),
      stripeSubscriptionApi.listarCartoes(),
      stripeSubscriptionApi.obterPlanosDisponiveis(),
    ]);
    if (resLic.success && resLic.data) setLicenca(resLic.data);
    if (resHist.success && resHist.data) setHistorico(resHist.data);
    if (resCards.success && resCards.data) setCartoes(resCards.data);
    if (resPlanos.success && resPlanos.data && resPlanos.data.length > 0) setPlanos(resPlanos.data);
    setLoading(false);
  };

  useEffect(() => { carregarDados(); }, []);

  const handleExcluirCartao = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este cartão salvo?')) return;
    const res = await stripeSubscriptionApi.removerCartao(id);
    if (res.success) setCartoes(prev => prev.filter(c => c.id !== id));
  };

  const handleDefinirPadrao = async (id: string) => {
    const res = await stripeSubscriptionApi.definirCartaoPadrao(id);
    if (res.success) {
      setCartoes(prev => prev.map(c => ({ ...c, padrao: c.id === id ? 1 : 0 })));
    }
  };

  const handleConfirmarCancelamento = async () => {
    setCancelando(true);
    const res = await stripeSubscriptionApi.cancelarRecorrencia();
    setCancelando(false);
    setModalConfirmarCancelamento(false);
    alert(res.data?.mensagem || 'Renovação automática desativada com sucesso.');
    carregarDados();
  };

  const isAtiva = licenca?.valida;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 select-none font-sans transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-wide flex items-center gap-2.5">
            <span>GESTÃO DE ASSINATURA & PLANOS</span>
            <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              PAGAMENTO SEGURO & PIX ATIVO
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gerencie seus cartões de crédito e renove sua assinatura sem burocracia</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalConfirmarCancelamento(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Cancelar renovação automática da assinatura"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Cancelar Renovação Automática</span>
          </button>
          <button
            onClick={() => abrirModalPagamento('MENSAL')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Renovar Assinatura (Pix / Cartão)</span>
          </button>
        </div>
      </div>

      {licenca?.emTolerancia && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-wide">Período de Tolerância Ativo (5 Dias)</div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Sua assinatura venceu em {licenca.dataVencimento}. Restam <strong>{licenca.diasToleranciaRestantes} dia(s) de tolerância</strong> antes do bloqueio definitivo do sistema.
              </p>
            </div>
          </div>
          <button onClick={() => abrirModalPagamento('MENSAL')} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shrink-0 cursor-pointer shadow-sm">
            Regularizar Agora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status do Sistema</div>
          <div className="flex items-center gap-2 pt-1">
            <span className={`w-3 h-3 rounded-full ${isAtiva ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className={`font-black text-base ${isAtiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isAtiva ? 'LICENÇA ATIVA' : 'EXPIRADA / BLOQUEADA'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Assinatura ClickStorm ERP</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Data de Vencimento</span>
          </div>
          <div className="font-black text-lg text-slate-800 dark:text-white font-mono pt-1">{licenca?.dataVencimento || '-'}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Renovação garantida</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /><span>Dias Restantes</span>
          </div>
          <div className="font-black text-lg text-amber-600 dark:text-amber-400 font-mono pt-1">{licenca ? `${licenca.diasRestantes} dias` : '-'}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Sem interrupção de vendas</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Titular da Loja</div>
          <div className="font-bold text-sm text-slate-800 dark:text-white truncate pt-1">{licenca?.razaoSocial || 'Empresa Local'}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{licenca?.cnpj || 'CNPJ não informado'}</div>
        </div>
      </div>

      {/* Cartões de Crédito Cadastrados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
            <CreditCard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /><span>Cartões de Crédito Cadastrados</span>
          </div>
          <button onClick={() => setModalCartaoAberto(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5" /><span>Adicionar Cartão</span>
          </button>
        </div>
        {cartoes.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum cartão cadastrado ainda. Cadastre um cartão para facilitar pagamentos futuros.</p>
            <button onClick={() => setModalCartaoAberto(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /><span>Cadastrar Meu Primeiro Cartão</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cartoes.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-white">{c.bandeira} •••• {c.ultimos_digitos}</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{c.titular_nome}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Val: {String(c.mes_expiracao).padStart(2, '0')}/{c.ano_expiracao}</p>
                  </div>
                  {c.padrao === 1 ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">PRINCIPAL</span>
                  ) : (
                    <button onClick={() => handleDefinirPadrao(c.id)} className="text-[10px] text-slate-400 hover:text-amber-500 flex items-center gap-1 transition cursor-pointer" title="Definir como cartão principal">
                      <Star className="w-3 h-3" /><span>Tornar Padrão</span>
                    </button>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between">
                  <button onClick={() => abrirModalPagamento('MENSAL')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer">Usar para Pagar</button>
                  <button onClick={() => handleExcluirCartao(c.id)} className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Excluir cartão"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Cards Dinâmicos do Servidor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos.filter(p => p.ativo !== false).map((p) => {
          const isAnual = p.periodicidade === 'ANUAL';
          return (
            <div key={p.id} className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden ${isAnual ? 'bg-gradient-to-b from-amber-500/10 via-white to-white dark:via-slate-900 dark:to-slate-900 border-amber-500/40' : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'}`}>
              {isAnual && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /><span>2 MESES GRÁTIS</span>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <span className={`font-black text-base ${isAnual ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>{p.nome}</span>
                  <div className="flex items-center gap-1.5">
                    {(p as any).moduloNfe && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">📄 NF-e / DANFE</span>}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{p.periodicidade || 'MENSAL'}</span>
                  </div>
                </div>
                <div className="mt-3 font-black text-3xl text-slate-900 dark:text-white font-mono">
                  R$ {p.preco.toFixed(2)}<span className="text-xs font-normal text-slate-500 dark:text-slate-400">{isAnual ? ' / ano' : ' / mês'}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Incluso até {p.limiteCaixas ?? 3} máquinas (+ R$ {(p.valorMaquinaExtra ?? 25).toFixed(2)}/máq extra)
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">⏳ Ciclo: {p.mesesRenovacao ?? (isAnual ? 12 : 1)} {(p.mesesRenovacao ?? (isAnual ? 12 : 1)) === 1 ? 'mês' : 'meses'}</div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {(p.recursos || []).map((rec, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${isAnual ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500'}`} />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => { setPlanoSelecionadoModal(isAnual ? 'ANUAL' : 'MENSAL'); setValorCustomizadoModal(p.preco); setModalPagamentoAberto(true); }}
                className={`w-full py-2.5 font-black rounded-xl text-xs transition cursor-pointer ${isAnual ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white'}`}
              >
                Assinar {p.nome}
              </button>
            </div>
          );
        })}
      </div>

      <SubscriptionHistoryTable historico={historico} loading={loading} />
      <SubscriptionPaymentModal isOpen={modalPagamentoAberto} onClose={() => setModalPagamentoAberto(false)} onPaymentSuccess={() => carregarDados()} planoInicial={planoSelecionadoModal} valorCustomizado={valorCustomizadoModal} planosDisponiveis={planos} />
      <CartaoFormModal isOpen={modalCartaoAberto} onClose={() => setModalCartaoAberto(false)} onSuccess={() => carregarDados()} />

      {modalConfirmarCancelamento && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Cancelar Renovação Automática?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Tem certeza? Você continuará tendo acesso até o final do período atual (<strong>{licenca?.dataVencimento || 'vigente'}</strong>). Após isso, o sistema será bloqueado.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarCancelamento(false)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Manter Assinatura
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelamento}
                disabled={cancelando}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-950/40 disabled:opacity-50"
              >
                {cancelando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Sim, Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
