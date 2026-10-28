import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CreditCard, Copy, Check, X, Sparkles, CheckCircle2, ShieldCheck, Loader2, Printer } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { stripeSubscriptionApi, STRIPE_PUBLISHABLE_KEY, type PlanoAssinatura } from '../../services/stripeSubscriptionApi.js';
import { StripeCardPaymentForm } from './StripeCardPaymentForm.js';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (novoVencimento?: string) => void;
  planoInicial?: 'MENSAL' | 'ANUAL';
  valorCustomizado?: number;
  planosDisponiveis?: PlanoAssinatura[];
}

export const SubscriptionPaymentModal: React.FC<SubscriptionPaymentModalProps> = ({
  isOpen, onClose, onPaymentSuccess, planoInicial = 'MENSAL', valorCustomizado, planosDisponiveis,
}) => {
  const [plano, setPlano] = useState<'MENSAL' | 'ANUAL'>(planoInicial);
  const [metodo, setMetodo] = useState<'PIX' | 'CARTAO'>('PIX');
  const [pixString, setPixString] = useState<string>('');
  const [intentId, setIntentId] = useState<string>('');
  const [loadingPix, setLoadingPix] = useState<boolean>(false);
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string>('');
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [gerandoCardIntent, setGerandoCardIntent] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [pagoComSucesso, setPagoComSucesso] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [detalhesSucesso, setDetalhesSucesso] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [overrideValor, setOverrideValor] = useState<number | undefined>(valorCustomizado);
  const [planosInternos, setPlanosInternos] = useState<PlanoAssinatura[]>(planosDisponiveis || []);

  useEffect(() => {
    if (planosDisponiveis && planosDisponiveis.length > 0) {
      setPlanosInternos(planosDisponiveis);
    } else {
      stripeSubscriptionApi.obterPlanosDisponiveis().then((res) => {
        if (res.success && res.data && res.data.length > 0) setPlanosInternos(res.data);
      });
    }
  }, [planosDisponiveis, isOpen]);

  useEffect(() => {
    setPlano(planoInicial);
    setOverrideValor(valorCustomizado);
  }, [planoInicial, valorCustomizado, isOpen]);

  const planoMensal = planosInternos.find((p) => p.periodicidade === 'MENSAL');
  const planoAnual = planosInternos.find((p) => p.periodicidade === 'ANUAL');
  const precoMensalPadrao = planoMensal?.preco ?? 130.0;
  const precoAnualPadrao = planoAnual?.preco ?? 1300.0;
  const valorFinal = (overrideValor && plano === planoInicial) ? overrideValor : (plano === 'MENSAL' ? precoMensalPadrao : precoAnualPadrao);
  const mesesRenovacaoAtuais = plano === 'MENSAL' ? (planoMensal?.mesesRenovacao ?? 1) : (planoAnual?.mesesRenovacao ?? 12);

  const pollingRef = useRef<any>(null);
  const limparPolling = () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };

  useEffect(() => () => limparPolling(), []);

  const aplicarSucesso = (msg: string, detalhes?: any, vencimento?: string) => {
    limparPolling();
    setPagoComSucesso(true);
    setMsgSucesso(msg);
    setDetalhesSucesso(detalhes || null);
    onPaymentSuccess?.(vencimento);
  };

  const gerarCobrancaPix = async (planoEscolhido = plano, valorCobrar = valorFinal) => {
    limparPolling();
    setLoadingPix(true);
    setPixString('');
    setIntentId('');
    setPixQrCodeBase64('');
    setErro(null);
    setPagoComSucesso(false);

    const res = await stripeSubscriptionApi.criarPix(planoEscolhido, valorCobrar, mesesRenovacaoAtuais);
    setLoadingPix(false);
    if (res.success && res.data) {
      const dynamicPix = res.data.pixCopiaECola || (res as any).pixCopiaECola || '';
      const dynamicIntentId = res.data.paymentIntentId || (res as any).paymentIntentId || '';
      setPixString(dynamicPix);
      setIntentId(dynamicIntentId);
      setPixQrCodeBase64(res.data.pixQrCodeBase64 || '');

      pollingRef.current = setInterval(async () => {
        const check = await stripeSubscriptionApi.verificarPix(dynamicIntentId);
        if (check.success && check.data?.pago) {
          aplicarSucesso(check.data.mensagem || 'Pagamento confirmado!', check.data.detalhes, check.data.novoVencimento);
        }
      }, 10000);
    } else {
      setErro(res.error || 'Falha ao gerar cobrança Pix');
    }
  };

  const iniciarCardIntent = async (planoEscolhido: 'MENSAL' | 'ANUAL', valorCobrar?: number) => {
    limparPolling();
    setGerandoCardIntent(true);
    setCardClientSecret(null);
    setErro(null);
    setPagoComSucesso(false);

    const res = await stripeSubscriptionApi.criarIntentCartao(planoEscolhido, valorCobrar, mesesRenovacaoAtuais);
    setGerandoCardIntent(false);
    if (res.success && res.data?.clientSecret) {
      setCardClientSecret(res.data.clientSecret);
    } else {
      setErro(res.error || 'Não foi possível carregar o formulário seguro de pagamento.');
    }
  };

  const handleCardSuccess = async (paymentIntentId: string) => {
    setErro(null);
    const res = await stripeSubscriptionApi.confirmarIntentCartao(paymentIntentId, plano, mesesRenovacaoAtuais);
    if (res.success && res.data) {
      aplicarSucesso(res.data.mensagem || 'Pagamento com Cartão Aprovado!', res.data.detalhes, res.data.novoVencimento);
    } else {
      aplicarSucesso('Pagamento aprovado com sucesso!', { idTransacao: paymentIntentId, plano }, undefined);
    }
  };

  const handleImprimirFaturaPix = () => {
    if (!pixString) return;
    const w = window.open('', '_blank', 'width=750,height=900');
    if (!w) return;
    w.document.write(`<html><head><title>Fatura Pix ClickStorm</title><style>body{font-family:sans-serif;padding:30px;color:#0f172a}.box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin:20px 0}.qr{width:240px;height:240px;margin:0 auto;display:block}.code{font-family:monospace;font-size:11px;word-break:break-all;background:#e2e8f0;padding:10px;border-radius:6px;margin-top:15px;text-align:left}</style></head><body><h2>CLICKSTORM SISTEMAS ERP & PDV</h2><p>Fatura de Assinatura • Pagamento via Pix Oficial</p><hr/><p><strong>Plano:</strong> ${plano} (${mesesRenovacaoAtuais} mês/meses) | <strong>Valor:</strong> R$ ${valorFinal.toFixed(2)}</p><p><strong>Identificador:</strong> ${intentId}</p><div class="box"><h3>Escaneie o QR Code no App do seu Banco:</h3><img class="qr" src="${pixQrCodeBase64}" /><div class="code">${pixString}</div></div><script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
  };

  useEffect(() => {
    if (isOpen) {
      if (metodo === 'PIX' && !pagoComSucesso) gerarCobrancaPix(plano, valorFinal);
      if (metodo === 'CARTAO' && !pagoComSucesso) iniciarCardIntent(plano, valorFinal);
    } else {
      limparPolling();
      setPagoComSucesso(false);
    }
  }, [isOpen, plano, metodo, valorFinal]);

  const handleCopiarPix = () => {
    if (!pixString) return;
    navigator.clipboard.writeText(pixString);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Assinatura ClickStorm ERP</h2>
              <p className="text-[10px] text-slate-400 font-mono">Processamento Seguro Oficial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {pagoComSucesso ? (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                  ✓ LICENÇA LIBERADA AUTOMATICAMENTE
                </span>
                <h3 className="text-base font-black text-white pt-1">Pagamento Reconhecido com Sucesso!</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">{msgSucesso}</p>
              {detalhesSucesso && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-left max-w-sm mx-auto space-y-1 shadow-inner">
                  <div className="flex justify-between text-slate-400"><span>Status Retorno:</span> <span className="text-emerald-400 font-bold">SUCCEEDED</span></div>
                  <div className="flex justify-between text-slate-400"><span>Valor / Plano:</span> <span className="text-white font-bold">{detalhesSucesso.valor || `R$ ${valorFinal.toFixed(2)}`} ({detalhesSucesso.plano || plano})</span></div>
                  <div className="flex justify-between text-slate-400"><span>ID Transação:</span> <span className="text-slate-300 truncate max-w-[170px]">{detalhesSucesso.idTransacao || intentId}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Data/Hora:</span> <span className="text-slate-300">{detalhesSucesso.dataAprovacao || new Date().toLocaleString()}</span></div>
                </div>
              )}
              <button onClick={onClose} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition cursor-pointer">
                Concluir & Acessar Sistema
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div onClick={() => { setPlano('MENSAL'); if (planoInicial !== 'MENSAL') setOverrideValor(undefined); }} className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${plano === 'MENSAL' ? 'border-indigo-500 bg-indigo-600/10 ring-2 ring-indigo-500/40' : 'border-slate-800 bg-slate-950/40'}`}>
                  <div className="font-bold text-xs text-slate-300">{planoMensal?.nome || 'Plano Mensal'}</div>
                  <div className="mt-1 font-black text-lg text-white font-mono">
                    R$ {(plano === 'MENSAL' && overrideValor ? overrideValor : precoMensalPadrao).toFixed(2)}
                    <span className="text-xs font-normal text-slate-400">/mês</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Ciclo {planoMensal?.mesesRenovacao ?? 1} mês • {planoMensal?.limiteCaixas || 3} máqs</div>
                </div>
                <div onClick={() => { setPlano('ANUAL'); if (planoInicial !== 'ANUAL') setOverrideValor(undefined); }} className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between relative overflow-hidden ${plano === 'ANUAL' ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40' : 'border-slate-800 bg-slate-950/40'}`}>
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px]">2 MESES OFF</div>
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /><span>{planoAnual?.nome || 'Plano Anual'}</span></div>
                  <div className="mt-1 font-black text-lg text-white font-mono">
                    R$ {(plano === 'ANUAL' && overrideValor ? overrideValor : precoAnualPadrao).toFixed(2)}
                    <span className="text-xs font-normal text-slate-400">/ano</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold">Ciclo {planoAnual?.mesesRenovacao ?? 12} meses • {planoAnual?.limiteCaixas || 3} máqs</div>
                </div>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button type="button" onClick={() => setMetodo('PIX')} className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${metodo === 'PIX' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <QrCode className="w-4 h-4" /><span>Pix Instantâneo (QR Code)</span>
                </button>
                <button type="button" onClick={() => setMetodo('CARTAO')} className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${metodo === 'CARTAO' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <CreditCard className="w-4 h-4" /><span>Cartão de Crédito (In-App)</span>
                </button>
              </div>

              {erro && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs text-center">{erro}</div>}

              {metodo === 'PIX' ? (
                <div className="space-y-3">
                  {loadingPix ? (
                    <div className="py-8 text-center space-y-2"><Loader2 className="w-7 h-7 animate-spin text-indigo-400 mx-auto" /><div className="text-xs text-slate-400">Gerando cobrança Pix dinâmica...</div></div>
                  ) : pixString ? (
                    <div className="flex flex-col items-center space-y-3">
                      {pixQrCodeBase64 ? (
                        <div className="p-2.5 bg-white rounded-2xl shadow-xl border border-slate-700">
                          <img src={pixQrCodeBase64} alt="QR Code Pix" className="w-40 h-40 object-contain" />
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                          <QrCode className="w-32 h-32 text-indigo-400 mx-auto" />
                        </div>
                      )}
                      <div className="w-full flex gap-2">
                        <input type="text" readOnly value={pixString} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 truncate" />
                        <button type="button" onClick={handleCopiarPix} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shrink-0">
                          {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}<span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <div className="w-full flex items-center justify-between gap-2 pt-1">
                        <button type="button" onClick={handleImprimirFaturaPix} className="flex-1 py-2 px-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-950/80 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <Printer className="w-4 h-4 text-slate-400" /><span>Imprimir / Gerar PDF</span>
                        </button>
                        <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Aguardando Pix...</span>
                        </div>
                      </div>
                      <div className="w-full p-2.5 bg-indigo-950/60 border border-indigo-800/70 rounded-xl text-left text-[10px] text-slate-300 leading-tight space-y-1 shadow-inner">
                        <div><strong className="text-emerald-400">⚡ Liberação Automática:</strong> Você pode fechar esta tela. O sistema será liberado em segundo plano assim que o banco confirmar o pagamento.</div>
                        <div><strong className="text-indigo-300">💡 No app bancário:</strong> Escolha <strong className="text-white">"Pix Copia e Cola"</strong> ou aponte a câmera para ler o QR Code.</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {gerandoCardIntent ? (
                    <div className="py-10 text-center space-y-2">
                      <Loader2 className="w-7 h-7 animate-spin text-emerald-400 mx-auto" />
                      <div className="text-xs text-slate-300 font-bold">Conectando ao ambiente seguro de pagamento...</div>
                      <div className="text-[10px] text-slate-500">Criptografia bancária de ponta a ponta ativa</div>
                    </div>
                  ) : cardClientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: cardClientSecret,
                        appearance: { theme: 'night', variables: { colorPrimary: '#10b981', colorBackground: '#020617', colorText: '#f8fafc', colorDanger: '#f43f5e', borderRadius: '12px' } },
                      }}
                    >
                      <StripeCardPaymentForm valor={valorFinal} onSuccess={handleCardSuccess} />
                    </Elements>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Não foi possível carregar o formulário de cartão. Tente alternar para Pix ou recarregar a janela.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
