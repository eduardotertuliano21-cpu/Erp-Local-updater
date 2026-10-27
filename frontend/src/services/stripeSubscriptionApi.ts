import { getApiBaseUrl } from './api.js';

export interface PixCobrancaData {
  paymentIntentId: string;
  clientSecret: string;
  pixCopiaECola: string;
  pixQrCodeBase64: string;
  valor: number;
  plano: 'MENSAL' | 'ANUAL';
  expiraEm: string;
}

export interface CartaoIntentData {
  clientSecret: string;
  paymentIntentId: string;
  valor: number;
  plano: 'MENSAL' | 'ANUAL';
  mesesRenovacao?: number;
}

export interface PlanoAssinatura {
  id: string;
  nome: string;
  preco: number;
  periodicidade?: 'MENSAL' | 'ANUAL';
  mesesRenovacao?: number;
  limiteCaixas?: number;
  valorMaquinaExtra?: number;
  recursos: string[];
  stripePriceId?: string;
  ativo?: boolean;
}

export interface CheckoutSessaoData {
  url: string;
  sessionId: string;
}

export interface VerificacaoPagamentoResult {
  pago: boolean;
  modo?: string;
  status: string;
  mensagem: string;
  novoVencimento?: string;
  detalhes?: {
    idTransacao?: string;
    valor?: string;
    plano?: string;
    cartao?: string;
    dataAprovacao?: string;
  };
}

export interface HistoricoAssinaturaItem {
  id: string;
  stripe_payment_id?: string;
  stripe_session_id?: string;
  plano: string;
  metodo_pagamento: string;
  valor: number;
  status: string;
  pago_em?: string;
  criado_em: string;
}

export interface CartaoCredito {
  id: string;
  titular_nome: string;
  ultimos_digitos: string;
  bandeira: string;
  mes_expiracao: number;
  ano_expiracao: number;
  padrao: number;
  criado_em: string;
}

async function req<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha de comunicação com o servidor de assinaturas' };
  }
}

export const stripeSubscriptionApi = {
  obterPlanosDisponiveis: () =>
    req<PlanoAssinatura[]>('/assinatura/planos-disponiveis'),

  criarPix: (plano: 'MENSAL' | 'ANUAL', valor?: number, mesesRenovacao?: number) =>
    req<PixCobrancaData>('/assinatura/pix', {
      method: 'POST',
      body: JSON.stringify({ plano, valor, mesesRenovacao }),
    }),

  confirmarPixManual: (paymentIntentId: string, plano: 'MENSAL' | 'ANUAL', valor?: number, mesesRenovacao?: number) =>
    req<VerificacaoPagamentoResult>('/assinatura/confirmar-pix-manual', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, plano, valor, mesesRenovacao }),
    }),

  criarCartao: (plano: 'MENSAL' | 'ANUAL', originUrl?: string, valor?: number) =>
    req<CheckoutSessaoData>('/assinatura/cartao', {
      method: 'POST',
      body: JSON.stringify({
        plano,
        valor,
        originUrl: originUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'),
      }),
    }),

  verificarPix: (paymentIntentId: string) =>
    req<VerificacaoPagamentoResult>(`/assinatura/verificar-pix/${encodeURIComponent(paymentIntentId)}`),

  verificarSessao: (sessionId: string) =>
    req<VerificacaoPagamentoResult>(`/assinatura/verificar-sessao/${encodeURIComponent(sessionId)}`),

  obterHistorico: () =>
    req<HistoricoAssinaturaItem[]>('/assinatura/historico'),

  listarCartoes: () =>
    req<CartaoCredito[]>('/assinatura/cartoes'),

  cadastrarCartao: (dados: {
    numero: string;
    titular: string;
    expMes: number;
    expAno: number;
    cvc: string;
  }) =>
    req<CartaoCredito>('/assinatura/cartoes', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  removerCartao: (id: string) =>
    req<{ success: boolean }>(`/assinatura/cartoes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  definirCartaoPadrao: (id: string) =>
    req<{ success: boolean }>(`/assinatura/cartoes/${encodeURIComponent(id)}/padrao`, {
      method: 'PUT',
    }),

  pagarComCartaoSalvo: (cartaoId: string, plano: 'MENSAL' | 'ANUAL', valor?: number, mesesRenovacao?: number) =>
    req<VerificacaoPagamentoResult>('/assinatura/pagar-cartao-salvo', {
      method: 'POST',
      body: JSON.stringify({ cartaoId, plano, valor, mesesRenovacao }),
    }),

  obterConfig: () =>
    req<{ publishableKey: string; isLive: boolean }>('/assinatura/stripe/config'),

  criarIntentCartao: (plano: 'MENSAL' | 'ANUAL', valor?: number, mesesRenovacao?: number) =>
    req<CartaoIntentData>('/assinatura/cartao-intent', {
      method: 'POST',
      body: JSON.stringify({ plano, valor, mesesRenovacao }),
    }),

  confirmarIntentCartao: (paymentIntentId: string, plano: 'MENSAL' | 'ANUAL' = 'MENSAL', mesesRenovacao?: number) =>
    req<VerificacaoPagamentoResult>('/assinatura/confirmar-cartao-intent', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, plano, mesesRenovacao }),
    }),

  cancelarRecorrencia: () =>
    req<{ sucesso: boolean; mensagem: string }>('/licenca/cancelar', {
      method: 'POST',
    }),
};

export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51TaQ8wBCbgc2QvtDpOLxDKCdGidu6uX4JVxj19juaq6K2zVbeMgKOzxhJnFGLy2PxJTel9HDF4TNuXNihmWRnuQ900KIVMjkth';
