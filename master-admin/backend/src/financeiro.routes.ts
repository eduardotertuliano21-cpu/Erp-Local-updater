import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';
import { StripeService } from './stripe.service.js';

export const financeiroRouter = Router();

// Métricas de alto nível (MRR, Total de clientes, inadimplência)
financeiroRouter.get('/metricas', masterAuthMiddleware, (_req: Request, res: Response) => {
  const tenants = dbMock.tenants;

  const ativos = tenants.filter((t) => t.statusLicenca === 'ATIVA');
  const inadimplentes = tenants.filter((t) => t.statusLicenca === 'INADIMPLENTE');
  const bloqueados = tenants.filter((t) => t.statusLicenca === 'BLOQUEADA');

  // Cálculo do MRR (Monthly Recurring Revenue)
  const mrr = ativos.reduce((acc, tenant) => {
    const plano = dbMock.planos.find((p) => p.id === tenant.planoId);
    return acc + (plano ? plano.valorMensal : 0);
  }, 0);

  res.json({
    mrr: Number(mrr.toFixed(2)),
    totalClientes: tenants.length,
    ativosCount: ativos.length,
    inadimplentesCount: inadimplentes.length,
    bloqueadosCount: bloqueados.length,
  });
});

// Lista de transações/pagamentos
financeiroRouter.get('/transacoes', masterAuthMiddleware, (_req: Request, res: Response) => {
  const lista = dbMock.pagamentos.map((pag: any) => {
    const tenant = dbMock.tenants.find((t) =>
      t.id === pag.tenantId ||
      t.cnpj === pag.tenantId ||
      t.chaveLicenca === pag.tenantId ||
      (pag.cnpj && t.cnpj === pag.cnpj) ||
      (pag.chaveLicenca && t.chaveLicenca === pag.chaveLicenca) ||
      (t.stripeCustomerId && t.stripeCustomerId === pag.tenantId) ||
      (t.razaoSocial && t.razaoSocial.toLowerCase() === String(pag.tenantId).toLowerCase()) ||
      (t.nomeFantasia && t.nomeFantasia.toLowerCase() === String(pag.tenantId).toLowerCase())
    );

    const resolvedNome = tenant
      ? (tenant.nomeFantasia || tenant.razaoSocial || tenant.id)
      : (pag.tenantNome && pag.tenantNome !== 'Desconhecido'
          ? pag.tenantNome
          : (pag.tenantId && pag.tenantId !== 'loja_local' ? pag.tenantId : 'Loja Principal'));

    return {
      ...pag,
      tenantNome: resolvedNome,
      cnpj: tenant?.cnpj || pag.cnpj || '',
      telefone: tenant?.telefone || pag.telefone || '',
    };
  });

  // Ordena por data decrescente
  lista.sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime());

  res.json(lista);
});

// Emitir Cobrança Extra avulsa por serviço contratado
financeiroRouter.post('/cobranca-extra', masterAuthMiddleware, async (req: Request, res: Response) => {
  const { tenantId, descricao, valor, metodoPagamento } = req.body;

  if (!tenantId || !descricao || typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos. Tenant, descrição e valor positivo são obrigatórios.' });
  }

  const tenant = dbMock.tenants.find((t) => t.id === tenantId);
  if (!tenant) {
    return res.status(404).json({ erro: 'Cliente não encontrado no sistema.' });
  }

  const pagamentoId = `pag-extra-${Date.now()}`;

  // Gera checkout no Stripe ou link inteligente de cobrança
  const checkout = await StripeService.criarCheckoutCobrancaExtra({
    tenantId: tenant.id,
    clienteNome: tenant.razaoSocial,
    email: tenant.email,
    telefone: tenant.telefone,
    descricao,
    valor,
    pagamentoId,
  });

  const novoPagamento = {
    id: pagamentoId,
    tenantId: tenant.id,
    stripeInvoiceId: checkout.id,
    valor: Number(valor),
    status: 'open' as const,
    metodoPagamento: metodoPagamento || 'Stripe / Pix / Cartão',
    dataPagamento: new Date().toISOString(),
    tipo: 'SERVICO_EXTRA' as const,
    descricao,
    stripeCheckoutUrl: checkout.url,
    linkPagamento: checkout.url,
  };

  dbMock.pagamentos.unshift(novoPagamento);
  salvarBancoMaster();

  res.status(201).json({
    sucesso: true,
    mensagem: 'Cobrança extra gerada com sucesso!',
    pagamento: {
      ...novoPagamento,
      tenantNome: tenant.razaoSocial,
      cnpj: tenant.cnpj,
      telefone: tenant.telefone,
    },
    checkoutUrl: checkout.url,
  });
});

// Baixar pagamento manualmente (ex: Pix direto ou dinheiro)
financeiroRouter.patch('/transacoes/:id/baixar', masterAuthMiddleware, (req: Request, res: Response) => {
  const index = dbMock.pagamentos.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Transação não encontrada.' });

  dbMock.pagamentos[index].status = 'paid';
  dbMock.pagamentos[index].dataPagamento = new Date().toISOString();
  salvarBancoMaster();

  res.json({
    sucesso: true,
    mensagem: 'Pagamento baixado manualmente com sucesso!',
    pagamento: dbMock.pagamentos[index],
  });
});

// Excluir fatura / cobrança (suporta tanto /faturas/:id quanto /transacoes/:id)
financeiroRouter.delete(['/faturas/:id', '/transacoes/:id'], masterAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = dbMock.pagamentos.findIndex(
    (p: any) => p.id === id || p.paymentIntentId === id || p.stripeInvoiceId === id
  );
  if (index === -1) {
    return res.status(404).json({ success: false, erro: 'Fatura não encontrada.' });
  }

  dbMock.pagamentos.splice(index, 1);
  salvarBancoMaster();

  return res.json({ success: true, message: 'Fatura removida com sucesso', sucesso: true, mensagem: 'Fatura removida com sucesso' });
});
