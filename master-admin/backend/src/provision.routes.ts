import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster, Tenant } from './db.mock.js';
import { tenantSyncAuthMiddleware } from './auth.middleware.js';

export const provisionRouter = Router();

// GET /api/sync/planos-publicos
provisionRouter.get('/planos-publicos', (_req: Request, res: Response) => {
  const diasTrial = Number(dbMock.configGlobal?.diasTrialNovosClientes ?? 7);
  const planos = dbMock.planos
    .filter((p) => p.ativo)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      descricao: p.descricao,
      valorMensal: p.valorMensal,
      periodicidade: p.periodicidade || 'MENSAL',
      recursos: p.recursos,
      limiteCaixas: p.limiteCaixas,
      stripePriceId: p.stripePriceId,
      moduloNfe: Boolean(p.moduloNfe),
    }));
  res.json({ sucesso: true, planos, diasTrial });
});

// POST /api/sync/validate-license
provisionRouter.post('/validate-license', (req: Request, res: Response) => {
  const { chaveLicenca } = req.body;
  if (!chaveLicenca || !String(chaveLicenca).trim()) {
    return res.status(400).json({ valida: false, erro: 'Chave de licença não informada.' });
  }

  const chaveLimpa = String(chaveLicenca).trim();
  const tenant = dbMock.tenants.find((t) => t.chaveLicenca === chaveLimpa);

  if (!tenant) {
    return res.status(404).json({
      valida: false,
      erro: 'Chave de licença não encontrada no servidor central.',
    });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = new Date(tenant.dataExpiracao);
  dataVenc.setHours(0, 0, 0, 0);
  const expirada = dataVenc.getTime() < hoje.getTime();

  const valida = (tenant.statusLicenca === 'ATIVA' || tenant.statusLicenca === 'TESTE') && !expirada;

  const plano = dbMock.planos.find((p) => p.id === tenant.planoId || p.slug === tenant.planoId) || dbMock.planos[0];
  const moduloNfeAtivo = Boolean(tenant.moduloNfe || plano?.moduloNfe);

  return res.json({
    valida,
    status: tenant.statusLicenca,
    dataVencimento: tenant.dataExpiracao,
    moduloNfe: moduloNfeAtivo,
    tenant: {
      razaoSocial: tenant.razaoSocial,
      nomeFantasia: tenant.nomeFantasia,
      cnpj: tenant.cnpj,
      email: tenant.email,
      telefone: tenant.telefone,
      endereco: tenant.endereco,
      cep: tenant.cep,
      logradouro: tenant.logradouro,
      numero: tenant.numero,
      bairro: tenant.bairro,
      cidade: tenant.cidade,
      estado: tenant.estado,
      planoId: tenant.planoId,
      chaveLicenca: tenant.chaveLicenca,
      ramo_atuacao: tenant.ramo_atuacao || 'mercado',
      moduloNfe: moduloNfeAtivo,
    },
  });
});

// POST /api/sync/register
provisionRouter.post('/register', (req: Request, res: Response) => {
  const { email, telefone, senha, planoSlug, nomeLoja, cnpj, ramo_atuacao, ramoAtuacao, metodoPagamento } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, erro: 'E-mail e senha são obrigatórios.' });
  }

  const plano = dbMock.planos.find((p) => p.slug === planoSlug || p.id === planoSlug) || dbMock.planos[0];
  const sufixo = Date.now().toString().slice(-6);
  const chaveGerada = `CS-TRIAL-${sufixo}`;
  const diasTrial = Number(dbMock.configGlobal?.diasTrialNovosClientes ?? 7);
  const dataExp = new Date(Date.now() + diasTrial * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ramoFinal = ramo_atuacao || ramoAtuacao || (planoSlug === 'restaurante' ? 'restaurante' : 'mercado');
  const metodoEscolhido: 'PIX' | 'CARTAO' = metodoPagamento === 'CARTAO' ? 'CARTAO' : 'PIX';

  const novoTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    razaoSocial: nomeLoja || 'Nova Loja SaaS',
    nomeFantasia: nomeLoja || 'Nova Loja SaaS',
    cnpj: cnpj || '00.000.000/0001-91',
    email: String(email).trim().toLowerCase(),
    telefone: telefone || '',
    administradorNome: (nomeLoja || 'Administrador').toUpperCase(),
    administradorLogin: String(email).split('@')[0].toLowerCase() || 'admin',
    administradorEmail: String(email).trim().toLowerCase(),
    chaveLicenca: chaveGerada,
    planoId: plano ? plano.id : 'plano-1',
    statusLicenca: 'TESTE',
    dataExpiracao: dataExp,
    diasCarencia: 5,
    ramo_atuacao: ramoFinal as any,
    versaoDesktop: '1.0.0',
    ultimoSyncEm: new Date().toISOString(),
    moduloNfe: Boolean(plano?.moduloNfe),
    metodoPagamentoPreferencia: metodoEscolhido,
  };

  dbMock.tenants.push(novoTenant);
  salvarBancoMaster();

  // Se PIX, o cliente usa o período grátis sem nenhum redirecionamento!
  // Se CARTÃO, gera o link do Checkout Stripe para cadastro e cobrança recorrente.
  let checkoutUrl: string | null = null;
  if (metodoEscolhido === 'CARTAO' && plano?.stripePriceId) {
    checkoutUrl = `https://checkout.stripe.com/c/pay/cs_live_${plano.slug}?client_reference_id=${novoTenant.id}`;
  }

  return res.json({
    sucesso: true,
    mensagem: `Conta provisionada com sucesso em modo Teste (${diasTrial} dias grátis).`,
    chaveLicenca: chaveGerada,
    checkoutUrl,
    metodoPagamento: metodoEscolhido,
    diasTrial,
    tenant: novoTenant,
  });
});

// POST /api/sync/ack-reset-senha
provisionRouter.post('/ack-reset-senha', tenantSyncAuthMiddleware, (req: Request, res: Response) => {
  const { chaveLicenca, cnpj } = (req as any).tenantAuth;
  const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');

  const tenant = dbMock.tenants.find((t) => {
    const tCnpjLimpo = String(t.cnpj || '').replace(/\D/g, '');
    if (chaveLicenca && chaveLicenca !== 'CS-PRO-LOCAL-LICENSE' && t.chaveLicenca === chaveLicenca) return true;
    if (cnpjLimpo && cnpjLimpo !== '00000000000191' && tCnpjLimpo === cnpjLimpo) return true;
    return false;
  });

  if (tenant) {
    tenant.resetSenhaPendente = undefined;
    salvarBancoMaster();
    return res.json({ sucesso: true, mensagem: 'Confirmação de reset de senha recebida.' });
  }

  return res.status(404).json({ sucesso: false, erro: 'Tenant não encontrado para ACK.' });
});
