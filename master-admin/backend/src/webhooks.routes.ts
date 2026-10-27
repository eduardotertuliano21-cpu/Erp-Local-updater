import { Router, Request, Response } from 'express';
import { stripe } from './stripe.service.js';
import { dbMock, salvarBancoMaster } from './db.mock.js';

export const webhooksRouter = Router();

// Healthcheck do Webhook (útil para testes manuais no navegador ou curl)
webhooksRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    endpoint: '/api/webhook',
    message: 'Stripe Webhook Listener ativo e aguardando eventos.',
    timestamp: new Date().toISOString(),
  });
});

// Processador unificado de eventos do Stripe
const processarEventoStripe = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any = req.body;

  // Se houver secret configurado, faz a validação criptográfica da assinatura
  if (webhookSecret && sig) {
    try {
      const raw = (req as any).rawBody || req.body;
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook Signature Error]:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  console.log(`[Stripe Webhook Received]: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const metadata = intent.metadata || {};
      const tenantId = metadata.tenantId || metadata.chaveLicenca || metadata.cnpj;
      const tenant = dbMock.tenants.find(
        (t) => (tenantId && (t.id === tenantId || t.chaveLicenca === tenantId || t.cnpj === tenantId)) ||
               (intent.customer && t.stripeCustomerId === intent.customer)
      );

      if (tenant) {
        tenant.statusLicenca = 'ATIVA';
        const plano = metadata.plano || 'MENSAL';
        const meses = Number(metadata.mesesRenovacao) || (plano === 'ANUAL' ? 12 : 1);
        const dataVenc = new Date(tenant.dataExpiracao ? new Date(tenant.dataExpiracao).getTime() : Date.now());
        const baseTime = dataVenc.getTime() > Date.now() ? dataVenc.getTime() : Date.now();
        const novoVenc = new Date(baseTime + (meses === 12 ? 365 : 30) * 24 * 60 * 60 * 1000);
        tenant.dataExpiracao = novoVenc.toISOString().split('T')[0];
        tenant.dataVencimento = tenant.dataExpiracao;
        tenant.diasCarencia = 5;

        const pag = dbMock.pagamentos.find((p) => p.stripeInvoiceId === intent.id);
        if (pag) {
          pag.status = 'paid';
          pag.dataPagamento = new Date().toISOString();
          if (tenant) {
            pag.tenantId = tenant.id;
            (pag as any).tenantNome = tenant.nomeFantasia || tenant.razaoSocial;
            (pag as any).cnpj = tenant.cnpj;
          }
        } else {
          dbMock.pagamentos.unshift({
            id: `pag_${intent.id}`,
            tenantId: tenant ? tenant.id : (tenantId || 'Loja Principal'),
            tenantNome: tenant ? (tenant.nomeFantasia || tenant.razaoSocial) : 'Loja Principal',
            cnpj: tenant ? tenant.cnpj : '',
            stripeInvoiceId: intent.id,
            valor: (intent.amount_received || intent.amount || 0) / 100,
            status: 'paid',
            metodoPagamento: intent.payment_method_types?.[0]?.toUpperCase() || 'STRIPE',
            dataPagamento: new Date().toISOString(),
            tipo: 'ASSINATURA',
            descricao: `Assinatura ClickStorm ${plano} (${metadata.mesReferencia || ''})`,
          } as any);
        }
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Webhook ativou tenant ${tenant.cnpj} até ${tenant.dataExpiracao}!`);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const tenant = dbMock.tenants.find(
        (t) => t.stripeCustomerId === customerId || (invoice.customer_email && t.email === invoice.customer_email)
      );

      if (tenant) {
        tenant.statusLicenca = 'ATIVA';
        if (!tenant.stripeCustomerId && customerId) tenant.stripeCustomerId = customerId;
        const plano = dbMock.planos.find((p) => p.id === tenant.planoId);
        const meses = plano?.mesesRenovacao ?? (plano?.periodicidade === 'ANUAL' || tenant.planoId?.includes('anual') ? 12 : 1);
        const dataVenc = new Date();
        dataVenc.setMonth(dataVenc.getMonth() + meses);
        tenant.dataExpiracao = dataVenc.toISOString().split('T')[0];
        tenant.diasCarencia = 0;

        dbMock.pagamentos.push({
          id: `pag-${Date.now()}`,
          tenantId: tenant.id,
          stripeInvoiceId: invoice.id,
          valor: (invoice.amount_paid || 0) / 100,
          status: 'paid',
          metodoPagamento: 'cartao',
          dataPagamento: new Date().toISOString(),
          tipo: 'ASSINATURA',
          descricao: `Assinatura ${plano?.nome || (meses === 12 ? 'Anual' : 'Mensal')} ClickStorm ERP`,
        });
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Tenant ${tenant.cnpj} (${tenant.razaoSocial}) renovado com sucesso!`);
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object;
      const pagamentoId = session.client_reference_id || session.metadata?.pagamentoId;
      const pag = dbMock.pagamentos.find((p) => p.id === pagamentoId || p.stripeInvoiceId === session.id);

      if (pag) {
        pag.status = 'paid';
        pag.dataPagamento = new Date().toISOString();
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Cobrança extra/avulsa ${pag.id} marcada como PAGO.`);
      }

      // Se for ativação de plano via checkout
      const tenantRef = dbMock.tenants.find(
        (t) => t.id === session.client_reference_id || (session.customer_email && t.email === session.customer_email)
      );
      if (tenantRef) {
        tenantRef.statusLicenca = 'ATIVA';
        if (session.customer) tenantRef.stripeCustomerId = session.customer;
        if (session.subscription) tenantRef.stripeSubscriptionId = session.subscription;
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Tenant ${tenantRef.cnpj} ativado via Checkout Session!`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const tenant = dbMock.tenants.find((t) => t.stripeCustomerId === customerId);

      if (tenant) {
        tenant.statusLicenca = 'INADIMPLENTE';
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Falha no pagamento do Tenant ${tenant.cnpj}. Marcado como INADIMPLENTE.`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const tenant = dbMock.tenants.find((t) => t.stripeCustomerId === customerId);

      if (tenant) {
        tenant.statusLicenca = 'BLOQUEADA';
        salvarBancoMaster();
        console.log(`[Stripe Sync]: Assinatura cancelada. Tenant ${tenant.cnpj} BLOQUEADO.`);
      }
      break;
    }
  }

  res.json({ received: true });
};

// Responde tanto no endpoint raiz /api/webhook quanto /api/webhooks e /stripe
webhooksRouter.post('/', processarEventoStripe);
webhooksRouter.post('/stripe', processarEventoStripe);
