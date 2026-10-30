import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster } from './db.mock.js';
import { tenantSyncAuthMiddleware } from './auth.middleware.js';

export const syncRouter = Router();

function localizarTenant(chaveLicenca?: string, cnpj?: string, nomeLoja?: string) {
  const chave = String(chaveLicenca || '').trim().toUpperCase();
  const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');
  const nome = String(nomeLoja || '').trim().toUpperCase();

  return dbMock.tenants.find((t) => {
    const tChave = String(t.chaveLicenca || '').trim().toUpperCase();
    const tCnpjLimpo = String(t.cnpj || '').replace(/\D/g, '');
    const tFantasia = String(t.nomeFantasia || '').trim().toUpperCase();
    const tRazao = String(t.razaoSocial || '').trim().toUpperCase();

    if (chave && chave !== 'CS-PRO-LOCAL-LICENSE' && tChave === chave) return true;
    if (cnpjLimpo && cnpjLimpo !== '00000000000191' && tCnpjLimpo === cnpjLimpo) return true;
    if (nome && (tFantasia === nome || tRazao === nome)) return true;
    return false;
  });
}

/**
 * POST /api/sync/master-auth
 * Valida credenciais do Master Admin quando o lojista abre o CTRL+F3 no Desktop
 */
syncRouter.post('/master-auth', (req: Request, res: Response) => {
  const { usuario, senha } = req.body;

  const admin = dbMock.usuarios.find(
    (u) => u.login.toLowerCase() === String(usuario || '').trim().toLowerCase() && u.password === senha
  );

  if (admin && admin.ativo) {
    return res.json({
      success: true,
      data: {
        token: 'clickstorm_master_secret_2026',
        usuario: admin.login,
        nome: admin.nome,
        role: admin.role,
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Acesso Mestre negado. Usuário ou senha do Painel Central incorretos.',
  });
});

/**
 * GET /api/sync/license
 * O ERP Desktop consulta periodicamente para validar sua licença e obter dados atualizados pelo Master Admin
 */
syncRouter.get('/license', tenantSyncAuthMiddleware, (req: Request, res: Response) => {
  const { chaveLicenca, cnpj } = (req as any).tenantAuth;
  const nomeLoja = req.headers['x-store-name'] as string | undefined;

  const tenant = localizarTenant(chaveLicenca, cnpj, nomeLoja);

  if (!tenant) {
    return res.status(404).json({
      naoCadastrada: true,
      valida: true,
      status: 'ATIVA',
      mensagem: 'Loja aguardando registro automático na nuvem.',
    });
  }

  tenant.ultimoSyncEm = new Date().toISOString();
  salvarBancoMaster();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = new Date(tenant.dataExpiracao);
  dataVenc.setHours(0, 0, 0, 0);

  const dataLimite = new Date(dataVenc.getTime() + (Number(tenant.diasCarencia || 0) * 24 * 60 * 60 * 1000));
  const diffMs = dataLimite.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const expirada = diasRestantes < 0;

  const statusEfetivo = tenant.statusLicenca === 'BLOQUEADA'
    ? 'BLOQUEADA'
    : expirada
    ? 'INADIMPLENTE'
    : tenant.statusLicenca;

  const planoObj = dbMock.planos.find((p) => p.id === tenant.planoId || p.slug === tenant.planoId) || dbMock.planos[0];
  const moduloNfeAtivo = typeof tenant.moduloNfe === 'boolean' ? tenant.moduloNfe : Boolean(planoObj?.moduloNfe);
  const lim = planoObj?.limiteCaixas || 3;
  const valExtra = planoObj?.valorMaquinaExtra || 25.00;
  const maqTotal = tenant.maquinasContratadas || lim;
  const maqExtras = Math.max(0, maqTotal - lim);
  const extraRec = tenant.valorExtraRecorrente !== undefined ? tenant.valorExtraRecorrente : (maqExtras * valExtra);
  const avulso = tenant.proximaCobrancaExtra?.ativa ? (tenant.proximaCobrancaExtra.valor || 0) : 0;
  const totalMensal = (planoObj?.valorMensal || 99.0) + extraRec + avulso;

  res.json({
    valida: statusEfetivo === 'ATIVA' || statusEfetivo === 'TESTE',
    status: statusEfetivo,
    dataVencimento: tenant.dataExpiracao,
    moduloNfe: moduloNfeAtivo,
    diasRestantes: Math.max(0, diasRestantes),
    diasCarencia: tenant.diasCarencia || 0,
    chaveLicenca: tenant.chaveLicenca,
    razaoSocial: tenant.razaoSocial,
    cnpj: tenant.cnpj,
    planoId: tenant.planoId,
    planoDetalhes: planoObj,
    maquinasContratadas: maqTotal,
    maquinasExtras: maqExtras,
    limiteCaixas: lim,
    valorMaquinaExtra: valExtra,
    valorExtraRecorrente: extraRec,
    proximaCobrancaExtra: tenant.proximaCobrancaExtra || null,
    valorTotalMensalidade: totalMensal,
    ramo_atuacao: tenant.ramo_atuacao || 'mercado',
    whatsappSuporte: '11996773805',
    resetSenha: tenant.resetSenhaPendente,
    atualizacaoPendente: tenant.atualizacaoPendente,
    mensagemBloqueio: statusEfetivo === 'BLOQUEADA'
      ? 'Sistema bloqueado pela administração central. Entre em contato urgente via WhatsApp (11) 99677-3805.'
      : undefined,
    dadosCadastrais: {
      ramo_atuacao: tenant.ramo_atuacao || 'mercado',
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
      logoUrl: tenant.logoUrl,
      administradorNome: tenant.administradorNome,
      administradorLogin: tenant.administradorLogin,
      administradorEmail: tenant.administradorEmail,
      moduloNfe: moduloNfeAtivo,
    },
  });
});

/**
 * POST /api/sync/license-status
 * Chamado pelo CTRL+F3 do desktop para sincronizar bloqueio/desbloqueio bilateral com a nuvem
 */
syncRouter.post('/license-status', (req: Request, res: Response) => {
  const { chaveLicenca, cnpj, nomeLoja, novoStatus, novaDataVencimento } = req.body;

  const tenant = localizarTenant(chaveLicenca, cnpj, nomeLoja);

  if (tenant) {
    if (novoStatus) tenant.statusLicenca = novoStatus;
    if (novaDataVencimento) tenant.dataExpiracao = novaDataVencimento;
    tenant.ultimoSyncEm = new Date().toISOString();
    salvarBancoMaster();

    return res.json({
      sucesso: true,
      mensagem: `Status sincronizado na nuvem como ${tenant.statusLicenca}`,
      tenant,
    });
  }

  res.status(404).json({ sucesso: false, erro: 'Loja não encontrada para atualização de status' });
});

/**
 * POST /api/sync/telemetry
 */
syncRouter.post('/telemetry', tenantSyncAuthMiddleware, (req: Request, res: Response) => {
  const { chaveLicenca, cnpj } = (req as any).tenantAuth;
  const {
    razaoSocial,
    nomeFantasia,
    versaoDesktop,
    administradorNome,
    administradorLogin,
    email,
    telefone,
    endereco,
    cep,
    logradouro,
    numero,
    bairro,
    cidade,
    estado,
    logoUrl,
    origem,
    dataVencimento,
  } = req.body;

  const tenant = localizarTenant(chaveLicenca, cnpj, nomeFantasia || razaoSocial);

  if (tenant) {
    const isUpdate = origem === 'ONBOARDING' || origem === 'SETTINGS' || origem === 'ERP' || origem === 'LOCAL_UPDATE';
    if (razaoSocial && (isUpdate || !tenant.razaoSocial)) tenant.razaoSocial = razaoSocial;
    if (nomeFantasia && (isUpdate || !tenant.nomeFantasia)) tenant.nomeFantasia = nomeFantasia;
    if (versaoDesktop) tenant.versaoDesktop = versaoDesktop;
    if (administradorNome && (isUpdate || !tenant.administradorNome)) tenant.administradorNome = administradorNome;
    if (administradorLogin && (isUpdate || !tenant.administradorLogin)) tenant.administradorLogin = administradorLogin;
    if (email && (isUpdate || !tenant.email)) tenant.email = email;
    if (telefone !== undefined && (isUpdate || !tenant.telefone)) tenant.telefone = telefone;
    if (endereco !== undefined && (isUpdate || !tenant.endereco)) tenant.endereco = endereco;
    if (cep !== undefined && (isUpdate || !tenant.cep)) tenant.cep = cep;
    if (logradouro !== undefined && (isUpdate || !tenant.logradouro)) tenant.logradouro = logradouro;
    if (numero !== undefined && (isUpdate || !tenant.numero)) tenant.numero = numero;
    if (bairro !== undefined && (isUpdate || !tenant.bairro)) tenant.bairro = bairro;
    if (cidade !== undefined && (isUpdate || !tenant.cidade)) tenant.cidade = cidade;
    if (estado !== undefined && (isUpdate || !tenant.estado)) tenant.estado = estado;
    if (logoUrl !== undefined && (isUpdate || !tenant.logoUrl)) tenant.logoUrl = logoUrl;
    if (chaveLicenca && chaveLicenca !== 'CS-PRO-LOCAL-LICENSE') tenant.chaveLicenca = chaveLicenca;
    tenant.ultimoSyncEm = new Date().toISOString();
    salvarBancoMaster();

    return res.json({ sucesso: true, mensagem: 'Dados sincronizados na nuvem', tenant });
  }

  const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');
  const nomeLimpo = String(nomeFantasia || razaoSocial || '').toLowerCase().trim();
  const isDummyPlaceholder =
    nomeLimpo.includes('minha loja') ||
    nomeLimpo === 'clickstorm pdv' ||
    cnpjLimpo === '99888777000166' ||
    cnpjLimpo === '00000000000191' ||
    cnpjLimpo.length < 11;

  if (isDummyPlaceholder || (origem !== 'ONBOARDING' && origem !== 'REGISTER')) {
    return res.status(400).json({ sucesso: false, erro: 'Telemetria ignorada: dados genéricos ou cadastro incompleto.' });
  }

  const chaveGerada =
    chaveLicenca && chaveLicenca !== 'CS-PRO-LOCAL-LICENSE'
      ? chaveLicenca
      : `CS-2026-${(cnpjLimpo.slice(0, 8) || Date.now().toString().slice(-6)).toUpperCase()}`;

  const novoTenant: any = {
    id: `tenant-${Date.now()}`,
    razaoSocial: razaoSocial || nomeFantasia || 'Nova Loja',
    nomeFantasia: nomeFantasia || razaoSocial || 'Nova Loja',
    cnpj: cnpj || '00.000.000/0001-91',
    email: email || 'contato@loja.com.br',
    telefone: telefone || '',
    endereco: endereco || '',
    cep: cep || '',
    logradouro: logradouro || '',
    numero: numero || '',
    bairro: bairro || '',
    cidade: cidade || '',
    estado: estado || '',
    logoUrl: logoUrl || '',
    administradorNome: administradorNome || 'ADMINISTRADOR',
    administradorLogin: administradorLogin || 'ADMIN',
    administradorEmail: email || 'contato@loja.com.br',
    chaveLicenca: chaveGerada,
    planoId: dbMock.planos[0]?.id || 'plano-mensal',
    statusLicenca: 'ATIVA',
    dataExpiracao: dataVencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diasCarencia: 0,
    versaoDesktop: versaoDesktop || '1.0.0',
    ultimoSyncEm: new Date().toISOString(),
    moduloNfe: typeof req.body.moduloNfe === 'boolean' ? req.body.moduloNfe : Boolean(dbMock.planos[0]?.moduloNfe),
  };

  dbMock.tenants.push(novoTenant);
  salvarBancoMaster();
  return res.json({ sucesso: true, mensagem: 'Cliente registrado e telemetria recebida', tenant: novoTenant });
});

syncRouter.post('/ack-atualizacao', (req: Request, res: Response) => {
  const licenseKey = req.headers['x-license-key'];
  const tenant = dbMock.tenants.find((t) => t.chaveLicenca === licenseKey);
  if (tenant) {
    delete tenant.atualizacaoPendente;
    salvarBancoMaster();
  }
  res.json({ sucesso: true });
});

