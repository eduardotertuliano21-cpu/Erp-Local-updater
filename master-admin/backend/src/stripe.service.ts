import Stripe from 'stripe';
import { dbMock } from './db.mock.js';

let cachedKey = '';
let cachedStripeInstance: Stripe | null = null;

export function getStripeInstance(): Stripe {
  const key = dbMock?.configGlobal?.stripeSecretKey || process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_clickstorm';
  if (cachedStripeInstance && cachedKey === key) {
    return cachedStripeInstance;
  }
  cachedKey = key;
  cachedStripeInstance = new Stripe(key, {
    apiVersion: '2023-10-16' as any,
    typescript: true,
  });
  return cachedStripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export class StripeService {
  /**
   * Sincroniza plano local com Produto e Preço no Stripe
   */
  static async syncPlanoComStripe(plano: {
    id?: string;
    nome: string;
    descricao?: string;
    valorMensal: number;
    periodicidade?: 'MENSAL' | 'ANUAL';
    stripeProductId?: string;
  }) {
    let productId = plano.stripeProductId;
    try {
      if (!productId) {
        const product = await stripe.products.create({
          name: plano.nome,
          description: plano.descricao || `Plano ClickStorm: ${plano.nome}`,
        });
        productId = product.id;
      } else {
        await stripe.products.update(productId, {
          name: plano.nome,
          description: plano.descricao,
        });
      }

      // Cria novo preço no Stripe (preços são imutáveis no Stripe)
      const unitAmount = Math.max(100, Math.round(plano.valorMensal * 100));
      const interval: 'year' | 'month' = plano.periodicidade === 'ANUAL' ? 'year' : 'month';
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency: 'brl',
        recurring: { interval },
      });

      return {
        stripeProductId: productId,
        stripePriceId: price.id,
      };
    } catch (err: any) {
      console.warn(`[StripeService] Aviso ao sincronizar com Stripe (${err.message}). Usando fallback mock local.`);
      return {
        stripeProductId: productId || `prod_local_${Date.now()}`,
        stripePriceId: `price_local_${Math.round(plano.valorMensal)}_${Date.now().toString().slice(-4)}`,
      };
    }
  }

  /**
   * Cria ou atualiza Customer no Stripe
   */
  static async upsertCustomer(tenant: {
    razaoSocial: string;
    cnpj: string;
    email: string;
    telefone?: string;
    stripeCustomerId?: string;
  }) {
    try {
      if (tenant.stripeCustomerId) {
        return await stripe.customers.update(tenant.stripeCustomerId, {
          name: tenant.razaoSocial,
          email: tenant.email,
          phone: tenant.telefone,
          metadata: { cnpj: tenant.cnpj },
        });
      }

      return await stripe.customers.create({
        name: tenant.razaoSocial,
        email: tenant.email,
        phone: tenant.telefone,
        metadata: { cnpj: tenant.cnpj },
      });
    } catch (err: any) {
      console.warn(`[StripeService] Erro ao sincronizar customer (${err.message}). Gerando mock ID.`);
      return { id: tenant.stripeCustomerId || `cus_mock_${Date.now()}` } as any;
    }
  }

  /**
   * Cria assinatura no Stripe para o lojista
   */
  static async createSubscription(customerId: string, priceId: string) {
    try {
      return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
    } catch (err: any) {
      console.warn(`[StripeService] Erro ao criar subscription no Stripe (${err.message}).`);
      return { id: `sub_mock_${Date.now()}`, status: 'active' } as any;
    }
  }

  /**
   * Cria sessão de checkout avulso para Cobrança Extra de Serviços
   */
  static async criarCheckoutCobrancaExtra(dados: {
    tenantId: string;
    clienteNome: string;
    email?: string;
    telefone?: string;
    descricao: string;
    valor: number;
    pagamentoId: string;
  }): Promise<{ url: string; id: string }> {
    const unitAmount = Math.max(100, Math.round(dados.valor * 100));
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'boleto'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: dados.descricao,
                description: `Serviço ClickStorm ERP para: ${dados.clienteNome}`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: dados.email || undefined,
        client_reference_id: dados.pagamentoId,
        metadata: {
          tenantId: dados.tenantId,
          pagamentoId: dados.pagamentoId,
          tipo: 'SERVICO_EXTRA',
          descricao: dados.descricao,
        },
        success_url: 'https://clickstorm.com.br/admin?cobranca=sucesso',
        cancel_url: 'https://clickstorm.com.br/admin?cobranca=cancelada',
      });

      return {
        url: session.url || `https://checkout.stripe.com/pay/${session.id}`,
        id: session.id,
      };
    } catch (err: any) {
      console.warn(`[StripeService] Stripe Checkout indisponível (${err.message}). Gerando link seguro simulado.`);
      const hash = `cs_pay_${dados.pagamentoId}_${Math.round(dados.valor)}`;
      return {
        url: `https://checkout.stripe.com/c/pay/${hash}`,
        id: `cs_${Date.now()}`,
      };
    }
  }
}
