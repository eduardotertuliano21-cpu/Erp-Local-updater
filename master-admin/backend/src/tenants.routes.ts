import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { dbMock, Tenant, salvarBancoMaster } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';
import { StripeService } from './stripe.service.js';

export const tenantsRouter = Router();

function resolverModuloNfeTenant(t: Tenant): boolean {
  if (typeof t.moduloNfe === 'boolean') return t.moduloNfe;
  const plano = dbMock.planos.find((p) => p.id === t.planoId || p.slug === t.planoId) || dbMock.planos[0];
  return Boolean(plano?.moduloNfe);
}

// Listar todos os tenants com paginação e busca
tenantsRouter.get('/', masterAuthMiddleware, (req: Request, res: Response) => {
  const { busca, status, page = 1, limit = 50 } = req.query;
  let filtrados = dbMock.tenants.map((t) => ({
    ...t,
    moduloNfe: resolverModuloNfeTenant(t),
    senhaPrimeiroAcesso: t.senhaPrimeiroAcesso || '1234',
  }));

  if (busca) {
    const termo = String(busca).toLowerCase();
    filtrados = filtrados.filter(
      (t) =>
        t.razaoSocial.toLowerCase().includes(termo) ||
        t.nomeFantasia.toLowerCase().includes(termo) ||
        t.cnpj.includes(termo) ||
        t.chaveLicenca.toLowerCase().includes(termo)
    );
  }

  if (status) {
    filtrados = filtrados.filter((t) => t.statusLicenca === status);
  }

  const total = filtrados.length;
  const p = Number(page);
  const l = Number(limit);
  const inicio = (p - 1) * l;
  const itens = filtrados.slice(inicio, inicio + l);

  res.json({
    total,
    page: p,
    totalPages: Math.ceil(total / l),
    itens,
  });
});

// Criar nova loja pelo Painel Admin com Chave de Licença e Senha de Primeiro Acesso
tenantsRouter.post('/', masterAuthMiddleware, (req: Request, res: Response) => {
  const dados = req.body || {};
  const cnpjLimpo = String(dados.cnpj || '').replace(/\D/g, '');
  const sufixo = (cnpjLimpo.slice(0, 8) || Date.now().toString().slice(-6)).toUpperCase();
  const chaveLicenca = dados.chaveLicenca?.trim() || `CS-2026-${sufixo}`;
  const senhaInicial = String(dados.senhaPrimeiroAcesso || dados.novaSenha || '1234').trim();
  const hash = crypto.createHash('sha256').update(`cs_salt_${senhaInicial}`).digest('hex');
  const plano = dbMock.planos.find((p) => p.id === dados.planoId || p.slug === dados.planoId) || dbMock.planos[0];
  const loginBase = (dados.administradorLogin || dados.nomeFantasia || dados.razaoSocial || 'admin')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '') || 'admin';

  const novo: Tenant = {
    id: `tenant-${Date.now()}`,
    razaoSocial: dados.razaoSocial || dados.nomeFantasia || 'Nova Loja',
    nomeFantasia: dados.nomeFantasia || dados.razaoSocial || 'Nova Loja',
    cnpj: dados.cnpj || '',
    email: dados.email || dados.administradorEmail || '',
    telefone: dados.telefone || '',
    administradorNome: (dados.administradorNome || 'ADMINISTRADOR').toUpperCase(),
    administradorLogin: loginBase,
    administradorEmail: dados.administradorEmail || dados.email || '',
    cep: dados.cep || '',
    logradouro: dados.logradouro || '',
    numero: dados.numero || '',
    bairro: dados.bairro || '',
    cidade: dados.cidade || '',
    estado: dados.estado || 'SP',
    endereco: [dados.logradouro, dados.numero ? `Nº ${dados.numero}` : '', dados.bairro, dados.cidade ? `${dados.cidade}/${dados.estado || 'SP'}` : ''].filter(Boolean).join(', '),
    chaveLicenca,
    planoId: plano ? plano.id : 'plano-mensal',
    statusLicenca: dados.statusLicenca || 'ATIVA',
    dataExpiracao: dados.dataExpiracao || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diasCarencia: typeof dados.diasCarencia === 'number' ? dados.diasCarencia : 5,
    ramo_atuacao: dados.ramo_atuacao || 'mercado',
    moduloNfe: typeof dados.moduloNfe === 'boolean' ? dados.moduloNfe : Boolean(plano?.moduloNfe),
    senhaPrimeiroAcesso: senhaInicial,
    jaConfigurado: Boolean(dados.nomeFantasia && (dados.cidade || dados.logradouro)),
    resetSenhaPendente: { novaSenhaHash: hash, loginAdmin: loginBase, solicitadoEm: new Date().toISOString() },
  };

  dbMock.tenants.unshift(novo);
  salvarBancoMaster();
  res.status(201).json({ sucesso: true, mensagem: 'Loja criada com Chave de Licença e Senha de Primeiro Acesso!', tenant: novo });
});

// Obter detalhes de um tenant específico
tenantsRouter.get('/:id', masterAuthMiddleware, (req: Request, res: Response) => {
  const tenant = dbMock.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json({ ...tenant, moduloNfe: resolverModuloNfeTenant(tenant), senhaPrimeiroAcesso: tenant.senhaPrimeiroAcesso || '1234' });
});

// Habilitar / Desabilitar Módulo NF-e / DANFE sem alterar plano e sem cobrança adicional
tenantsRouter.patch('/:id/modulo-nfe', masterAuthMiddleware, (req: Request, res: Response) => {
  const tenant = dbMock.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const novoValor = typeof req.body?.moduloNfe === 'boolean' ? req.body.moduloNfe : !resolverModuloNfeTenant(tenant);
  tenant.moduloNfe = novoValor;
  salvarBancoMaster();

  res.json({
    sucesso: true,
    mensagem: `Módulo Fiscal NF-e / DANFE ${novoValor ? 'HABILITADO' : 'DESABILITADO'} para ${tenant.nomeFantasia || tenant.razaoSocial} (sem alteração de plano ou cobrança adicional).`,
    tenant: { ...tenant, moduloNfe: novoValor },
  });
});

// Criar ou atualizar cadastro de cliente pelo Admin
tenantsRouter.put('/:id', masterAuthMiddleware, async (req: Request, res: Response) => {
  const index = dbMock.tenants.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const dados = req.body;
  const atualizado: Tenant = {
    ...dbMock.tenants[index],
    ...dados,
    id: req.params.id,
    moduloNfe: typeof dados.moduloNfe === 'boolean' ? dados.moduloNfe : resolverModuloNfeTenant(dbMock.tenants[index]),
  };

  if (atualizado.logradouro || atualizado.numero || atualizado.bairro || atualizado.cidade) {
    atualizado.endereco = [
      atualizado.logradouro?.trim(),
      atualizado.numero?.trim() ? `Nº ${atualizado.numero.trim()}` : '',
      atualizado.bairro?.trim() ? `Bairro ${atualizado.bairro.trim()}` : '',
      atualizado.cidade?.trim() ? `${atualizado.cidade.trim()}/${atualizado.estado?.trim() || 'SP'}` : '',
      atualizado.cep?.trim() ? `CEP ${atualizado.cep.trim()}` : '',
    ].filter(Boolean).join(', ');
  }

  if (typeof atualizado.maquinasContratadas === 'number') {
    const plano = dbMock.planos.find((p) => p.id === atualizado.planoId || p.slug === atualizado.planoId) || dbMock.planos[0];
    const limite = plano?.limiteCaixas || 3;
    const precoExtra = plano?.valorMaquinaExtra || 25.00;
    atualizado.maquinasExtras = Math.max(0, atualizado.maquinasContratadas - limite);
    atualizado.valorExtraRecorrente = atualizado.maquinasExtras * precoExtra;
  }

  if (atualizado.stripeCustomerId) {
    try {
      await StripeService.upsertCustomer({
        razaoSocial: atualizado.razaoSocial,
        cnpj: atualizado.cnpj,
        email: atualizado.email,
        telefone: atualizado.telefone,
        stripeCustomerId: atualizado.stripeCustomerId,
      });
    } catch (e: any) {
      console.error('[Stripe Sync Warning]:', e.message);
    }
  }

  const senhaInformada = dados.novaSenha || dados.administradorSenha || dados.senhaPrimeiroAcesso;
  if (senhaInformada && String(senhaInformada).trim().length >= 4) {
    const senhaLimpa = String(senhaInformada).trim();
    atualizado.senhaPrimeiroAcesso = senhaLimpa;
    const hash = crypto.createHash('sha256').update(`cs_salt_${senhaLimpa}`).digest('hex');
    atualizado.resetSenhaPendente = {
      novaSenhaHash: hash,
      loginAdmin: (atualizado.administradorLogin || 'admin').trim(),
      solicitadoEm: new Date().toISOString(),
    };
  }
  if (atualizado.nomeFantasia && (atualizado.cidade || atualizado.logradouro || atualizado.endereco)) {
    atualizado.jaConfigurado = true;
  }

  dbMock.tenants[index] = atualizado;
  salvarBancoMaster();
  res.json({ mensagem: 'Cliente atualizado com sucesso', tenant: atualizado });
});

// Ação rápida: Alterar status de licença (Ativar, Bloquear, etc.)
tenantsRouter.patch('/:id/status', masterAuthMiddleware, (req: Request, res: Response) => {
  const { statusLicenca, diasCarencia, dataExpiracao } = req.body;
  const tenant = dbMock.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado' });

  if (statusLicenca) tenant.statusLicenca = statusLicenca;
  if (typeof diasCarencia === 'number') tenant.diasCarencia = diasCarencia;
  if (dataExpiracao) tenant.dataExpiracao = dataExpiracao;
  salvarBancoMaster();

  res.json({ mensagem: 'Status alterado com sucesso', tenant });
});

// Redefinir senha do ERP remotamente
tenantsRouter.post('/:id/reset-senha', masterAuthMiddleware, (req: Request, res: Response) => {
  const tenant = dbMock.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const { novaSenha, loginAdmin } = req.body;
  if (!novaSenha || String(novaSenha).trim().length < 4) {
    return res.status(400).json({ erro: 'A senha deve conter no mínimo 4 caracteres.' });
  }

  const hash = crypto.createHash('sha256').update(`cs_salt_${String(novaSenha).trim()}`).digest('hex');
  tenant.resetSenhaPendente = {
    novaSenhaHash: hash,
    loginAdmin: (loginAdmin || tenant.administradorLogin || 'admin').trim(),
    solicitadoEm: new Date().toISOString(),
  };
  salvarBancoMaster();

  res.json({
    sucesso: true,
    mensagem: 'Comando de reset de senha registrado. O ERP Desktop atualizará na próxima sincronização.',
  });
});

// Forçar atualização do sistema via GitHub remotamente (mesmo na mesma versão)
tenantsRouter.post('/:id/atualizar-sistema', masterAuthMiddleware, (req: Request, res: Response) => {
  const tenant = dbMock.tenants.find((t) => t.id === req.params.id);
  if (!tenant) return res.status(404).json({ erro: 'Cliente não encontrado' });

  tenant.atualizacaoPendente = {
    solicitadoEm: new Date().toISOString(),
    forcarMesmaVersao: true,
  };
  salvarBancoMaster();

  res.json({
    sucesso: true,
    mensagem: `Comando de atualização enviado para ${tenant.nomeFantasia || tenant.razaoSocial}! O ERP baixará do GitHub e reinstalará automaticamente.`,
  });
});

// Excluir cliente
tenantsRouter.delete('/:id', masterAuthMiddleware, (req: Request, res: Response) => {
  const index = dbMock.tenants.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Cliente não encontrado' });
  dbMock.tenants.splice(index, 1);
  salvarBancoMaster();
  res.json({ sucesso: true, mensagem: 'Cliente removido com sucesso' });
});


