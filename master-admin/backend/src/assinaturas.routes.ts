import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { stripe, getStripeInstance } from './stripe.service.js';
import { dbMock, salvarBancoMaster } from './db.mock.js';

export const assinaturasRouter = Router();

function calcularDias(plano: string, meses?: number): number {
  const m = meses && meses > 0 ? meses : (plano === 'ANUAL' ? 12 : 1);
  return m === 12 ? 365 : (m * 30);
}

function estenderDataVencimento(dataAtualStr: string | undefined, dias: number): string {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const base = (dataAtualStr && new Date(dataAtualStr) > hoje) ? new Date(dataAtualStr) : hoje;
  base.setDate(base.getDate() + dias);
  return base.toISOString().split('T')[0];
}

// POST /api/assinaturas/pix - Cria cobrança Pix via Stripe Oficial (Find-or-Create)
assinaturasRouter.post('/pix', async (req: Request, res: Response) => {
  try {
    const { plano = 'MENSAL', valor, mesesRenovacao, chaveLicenca, cnpj, razaoSocial, tenantId, mesReferencia } = req.body || {};
    const tid = String(tenantId || chaveLicenca || cnpj || 'loja_local');
    const mesRef = String(mesReferencia || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
    const valorCobrar = Number(valor) > 0 ? Number(valor) : (plano === 'ANUAL' ? 990.0 : 99.0);
    const meses = Number(mesesRenovacao) || (plano === 'ANUAL' ? 12 : 1);
    const unitAmount = Math.max(100, Math.round(valorCobrar * 100));

    // Find-or-Create: reutiliza intenção aberta na mesma competência (< 1h)
    const pendente = dbMock.pagamentos.find(
      (p: any) => p.tenantId === tid && p.status === 'open' && p.metodoPagamento === 'PIX_STRIPE' && p.mesReferencia === mesRef && (Date.now() - new Date(p.dataPagamento).getTime()) < 3600000
    ) as any;
    if (pendente && pendente.pixCopiaECola) {
      return res.json({
        success: true, pixCopiaECola: pendente.pixCopiaECola, paymentIntentId: pendente.stripeInvoiceId,
        data: { paymentIntentId: pendente.stripeInvoiceId, clientSecret: pendente.clientSecret || '', pixCopiaECola: pendente.pixCopiaECola, pixQrCodeBase64: pendente.pixQrCodeBase64 || '', valor: pendente.valor, plano, mesesRenovacao: meses, expiraEm: new Date(new Date(pendente.dataPagamento).getTime() + 3600000).toISOString() }
      });
    }

    const stripe = getStripeInstance();
    const intent = await stripe.paymentIntents.create({
      amount: unitAmount,
      currency: 'brl',
      payment_method_types: ['pix'],
      payment_method_data: { type: 'pix' },
      confirm: true,
      description: `ClickStorm ERP - Assinatura ${plano} (${razaoSocial || cnpj || 'Loja'})`,
      metadata: {
        tenantId: tid,
        mesReferencia: mesRef,
        plano,
        mesesRenovacao: String(meses),
        chaveLicenca: String(chaveLicenca || ''),
        cnpj: String(cnpj || ''),
        tipo: 'ASSINATURA_CLICKSTORM'
      },
    });

    const nextAction = intent.next_action as any;
    const pixCopiaECola = nextAction?.pix_display_details?.pix_string || nextAction?.pix_display_qr_code?.data || '';

    if (!pixCopiaECola) {
      return res.status(400).json({
        success: false,
        error: 'A API oficial do Stripe não retornou os dados da chave Pix. Verifique se o método Pix está ativo no seu painel Stripe.',
      });
    }

    const qrCodeBase64 = await QRCode.toDataURL(pixCopiaECola, { width: 340, margin: 2 });

    const tenantLoja = dbMock.tenants.find((t) => (chaveLicenca && t.chaveLicenca === chaveLicenca) || (cnpj && t.cnpj === cnpj) || t.id === tid);
    const storeNome = tenantLoja ? (tenantLoja.nomeFantasia || tenantLoja.razaoSocial) : (razaoSocial || (tid !== 'loja_local' ? tid : 'Loja Principal'));

    dbMock.pagamentos.unshift({
      id: `pag_${intent.id}`,
      tenantId: tenantLoja ? tenantLoja.id : tid,
      tenantNome: storeNome,
      cnpj: tenantLoja?.cnpj || cnpj || '',
      stripeInvoiceId: intent.id,
      valor: valorCobrar,
      status: 'open',
      metodoPagamento: 'PIX_STRIPE',
      dataPagamento: new Date().toISOString(),
      tipo: 'ASSINATURA',
      descricao: `Assinatura ClickStorm ${plano} (${mesRef})`,
      mesReferencia: mesRef,
      pixCopiaECola,
      pixQrCodeBase64: qrCodeBase64,
      clientSecret: intent.client_secret || ''
    } as any);
    salvarBancoMaster();

    res.status(201).json({
      success: true, pixCopiaECola, paymentIntentId: intent.id,
      data: { paymentIntentId: intent.id, clientSecret: intent.client_secret || '', pixCopiaECola, pixQrCodeBase64: qrCodeBase64, valor: valorCobrar, plano, mesesRenovacao: meses, expiraEm: new Date(Date.now() + 3600000).toISOString() },
    });
  } catch (err: any) {
    console.error('[Assinaturas] Erro ao gerar Pix oficial Stripe:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Erro ao gerar Pix no Stripe' });
  }
});

// GET /api/assinaturas/pix/:id/status - Checagem de liquidação do Pix
assinaturasRouter.get('/pix/:id/status', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    let pago = false;
    let metadata: any = {};
    let statusStr = 'pending';

    if (!id.startsWith('pi_')) {
      return res.json({ success: true, data: { pago: false, status: 'pending', mensagem: 'Aguardando liquidação...' } });
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(id);
      statusStr = intent.status;
      metadata = intent.metadata || {};
      pago = intent.status === 'succeeded';
    } catch (e: any) {
      console.warn(`[Assinaturas] Consulta Stripe (${e.message})`);
    }

    if (pago) {
      const plano = metadata.plano || 'MENSAL';
      const meses = Number(metadata.mesesRenovacao) || (plano === 'ANUAL' ? 12 : 1);
      const dias = calcularDias(plano, meses);
      const chaveLic = metadata.chaveLicenca;
      const cnpj = metadata.cnpj;
      const tenant = dbMock.tenants.find((t) => (chaveLic && t.chaveLicenca === chaveLic) || (cnpj && t.cnpj === cnpj));

      let novoVencimento = '';
      if (tenant) {
        tenant.dataExpiracao = estenderDataVencimento(tenant.dataExpiracao || tenant.dataVencimento, dias);
        tenant.dataVencimento = tenant.dataExpiracao;
        tenant.statusLicenca = 'ATIVA';
        tenant.diasCarencia = 5;
        novoVencimento = tenant.dataExpiracao;
      }

      const pag = dbMock.pagamentos.find((p) => p.stripeInvoiceId === id);
      if (pag) {
        pag.status = 'paid';
        pag.dataPagamento = new Date().toISOString();
      }
      salvarBancoMaster();

      return res.json({
        success: true,
        data: {
          pago: true,
          status: 'succeeded',
          mensagem: `Pagamento Pix aprovado com sucesso! Licença renovada por +${dias} dias.`,
          novoVencimento,
          diasAdicionados: dias,
          detalhes: { idTransacao: id, plano, dataAprovacao: new Date().toLocaleString('pt-BR') },
        },
      });
    }

    res.json({ success: true, data: { pago: false, status: statusStr, mensagem: 'Aguardando liquidação do Pix pelo banco...' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assinaturas/cartao-intent - Cria Intent para Stripe Elements In-App (Find-or-Create)
assinaturasRouter.post('/cartao-intent', async (req: Request, res: Response) => {
  try {
    const { plano = 'MENSAL', valor, mesesRenovacao, chaveLicenca, cnpj, tenantId, mesReferencia } = req.body || {};
    const tid = String(tenantId || chaveLicenca || cnpj || 'loja_local');
    const mesRef = String(mesReferencia || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
    const valorCobrar = Number(valor) > 0 ? Number(valor) : (plano === 'ANUAL' ? 990.0 : 99.0);
    const meses = Number(mesesRenovacao) || (plano === 'ANUAL' ? 12 : 1);
    const unitAmount = Math.max(100, Math.round(valorCobrar * 100));

    const pendente = dbMock.pagamentos.find(
      (p: any) => p.tenantId === tid && p.status === 'open' && p.metodoPagamento === 'CARTAO' && p.mesReferencia === mesRef && p.clientSecret && (Date.now() - new Date(p.dataPagamento).getTime()) < 3600000
    ) as any;
    if (pendente && pendente.clientSecret) {
      return res.json({ success: true, data: { clientSecret: pendente.clientSecret, paymentIntentId: pendente.stripeInvoiceId, valor: pendente.valor, plano, mesesRenovacao: meses } });
    }

    const intent = await stripe.paymentIntents.create({
      amount: unitAmount, currency: 'brl', payment_method_types: ['card'],
      description: `ClickStorm ERP - Assinatura ${plano} (${mesRef})`,
      metadata: { tenantId: tid, mesReferencia: mesRef, plano, mesesRenovacao: String(meses), chaveLicenca: String(chaveLicenca || ''), cnpj: String(cnpj || '') },
    });

    const tenantLoja = dbMock.tenants.find((t) => (chaveLicenca && t.chaveLicenca === chaveLicenca) || (cnpj && t.cnpj === cnpj) || t.id === tid);
    const storeNome = tenantLoja ? (tenantLoja.nomeFantasia || tenantLoja.razaoSocial) : (tid !== 'loja_local' ? tid : 'Loja Principal');

    dbMock.pagamentos.unshift({
      id: `pag_${intent.id}`,
      tenantId: tenantLoja ? tenantLoja.id : tid,
      tenantNome: storeNome,
      cnpj: tenantLoja?.cnpj || cnpj || '',
      stripeInvoiceId: intent.id,
      valor: valorCobrar,
      status: 'open',
      metodoPagamento: 'CARTAO',
      dataPagamento: new Date().toISOString(),
      tipo: 'ASSINATURA',
      descricao: `Assinatura ClickStorm ${plano} (${mesRef})`,
      mesReferencia: mesRef,
      clientSecret: intent.client_secret || ''
    } as any);
    salvarBancoMaster();

    res.status(201).json({ success: true, data: { clientSecret: intent.client_secret, paymentIntentId: intent.id, valor: valorCobrar, plano, mesesRenovacao: meses } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message || 'Erro ao gerar intent' }); }
});

// POST /api/assinaturas/checkout-cartao - Checkout Stripe oficial (compatibilidade)
assinaturasRouter.post('/checkout-cartao', async (req: Request, res: Response) => {
  try {
    const { plano = 'MENSAL', valor, mesesRenovacao, originUrl, chaveLicenca, cnpj } = req.body || {};
    const valorCobrar = Number(valor) > 0 ? Number(valor) : (plano === 'ANUAL' ? 990.0 : 99.0);
    const unitAmount = Math.max(100, Math.round(valorCobrar * 100));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], mode: 'payment',
      line_items: [{ price_data: { currency: 'brl', product_data: { name: `ClickStorm ERP - Assinatura ${plano}` }, unit_amount: unitAmount }, quantity: 1 }],
      metadata: { plano, mesesRenovacao: String(mesesRenovacao || (plano === 'ANUAL' ? 12 : 1)), chaveLicenca: String(chaveLicenca || ''), cnpj: String(cnpj || '') },
      success_url: `${originUrl || 'https://clickstormsystems.com.br'}/?sucesso_stripe=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl || 'https://clickstormsystems.com.br'}/?cancelado_stripe=1`,
    });
    res.status(201).json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message || 'Erro ao gerar checkout' }); }
});

// GET status de pagamento (PaymentIntent ou Checkout Session)
assinaturasRouter.get(['/checkout-cartao/:id/status', '/cartao-intent/:id/status'], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    let metadata: any = {}, pago = false, statusStr = 'pending';
    if (id.startsWith('pi_')) {
      const intent = await stripe.paymentIntents.retrieve(id);
      statusStr = intent.status; metadata = intent.metadata || {}; pago = intent.status === 'succeeded';
    } else {
      const session = await stripe.checkout.sessions.retrieve(id);
      statusStr = session.payment_status; metadata = session.metadata || {}; pago = session.payment_status === 'paid';
    }
    if (pago) {
      const plano = metadata.plano || 'MENSAL', meses = Number(metadata.mesesRenovacao) || (plano === 'ANUAL' ? 12 : 1), dias = calcularDias(plano, meses);
      const chaveLic = metadata.chaveLicenca, cnpj = metadata.cnpj;
      const tenant = dbMock.tenants.find((t) => (chaveLic && t.chaveLicenca === chaveLic) || (cnpj && t.cnpj === cnpj));
      let novoVencimento = '';
      if (tenant) {
        tenant.dataExpiracao = estenderDataVencimento(tenant.dataExpiracao || tenant.dataVencimento, dias);
        tenant.dataVencimento = tenant.dataExpiracao; tenant.statusLicenca = 'ATIVA'; tenant.diasCarencia = 5;
        novoVencimento = tenant.dataExpiracao;
      }
      salvarBancoMaster();
      return res.json({ success: true, data: { pago: true, status: 'succeeded', mensagem: `Cartão aprovado! +${dias} dias.`, novoVencimento, diasAdicionados: dias } });
    }
    res.json({ success: true, data: { pago: false, status: statusStr } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/assinaturas/cancelar-recorrencia - Cancela renovação recorrente
assinaturasRouter.post('/cancelar-recorrencia', async (req: Request, res: Response) => {
  try {
    const { chaveLicenca, cnpj, subscriptionId } = req.body || {};
    if (subscriptionId) {
      try { await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true }); } catch {}
    }
    const tenant = dbMock.tenants.find((t) => (chaveLicenca && t.chaveLicenca === chaveLicenca) || (cnpj && t.cnpj === cnpj));
    if (tenant) { tenant.recorrenciaAtiva = false; salvarBancoMaster(); }
    res.json({ success: true, mensagem: 'Renovação automática cancelada com sucesso.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/assinaturas/historico - Histórico de pagamentos
assinaturasRouter.get('/historico', (req: Request, res: Response) => {
  try {
    const chaveLic = (req.headers['x-license-key'] as string) || (req.query.chaveLicenca as string);
    const cnpj = (req.headers['x-tenant-cnpj'] as string) || (req.query.cnpj as string);

    const filtrados = dbMock.pagamentos.filter((p) => {
      if (!chaveLic && !cnpj) return true;
      return (chaveLic && p.tenantId === chaveLic) || (cnpj && p.tenantId === cnpj);
    });

    res.json({ success: true, data: filtrados });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
