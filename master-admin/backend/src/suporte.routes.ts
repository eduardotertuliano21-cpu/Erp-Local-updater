import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster, ChamadoSuporte, MensagemChamado } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';

export const suporteRouter = Router();

function encontrarTenantLoja(chaveLicenca?: string, cnpj?: string, nomeLoja?: string) {
  const chave = String(chaveLicenca || '').trim().toUpperCase();
  const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');
  const nome = String(nomeLoja || '').trim().toUpperCase();

  return dbMock.tenants.find((t) => {
    const tChave = String(t.chaveLicenca || '').trim().toUpperCase();
    const tCnpj = String(t.cnpj || '').replace(/\D/g, '');
    const tFantasia = String(t.nomeFantasia || '').trim().toUpperCase();
    const tRazao = String(t.razaoSocial || '').trim().toUpperCase();

    if (chave && chave !== 'CS-PRO-LOCAL-LICENSE' && tChave === chave) return true;
    if (cnpjLimpo && cnpjLimpo !== '00000000000191' && cnpjLimpo.length >= 11 && tCnpj === cnpjLimpo) return true;
    if (nome && nome !== 'CLICKSTORM PDV' && (tFantasia === nome || tRazao === nome)) return true;
    return false;
  });
}

function pertenceALoja(
  chamado: ChamadoSuporte,
  chaveLicenca?: string,
  cnpj?: string,
  nomeLoja?: string,
  idLocal?: string
): boolean {
  const chave = String(chaveLicenca || '').trim().toUpperCase();
  const cnpjLimpo = String(cnpj || '').replace(/\D/g, '');
  const nome = String(nomeLoja || '').trim().toUpperCase();

  const cChave = String(chamado.chaveLicenca || '').trim().toUpperCase();
  const cCnpj = String(chamado.cnpjLoja || '').replace(/\D/g, '');
  const cNome = String(chamado.nomeLoja || '').trim().toUpperCase();

  if (idLocal && chamado.id === idLocal) return true;
  if (chave && chave !== 'CS-PRO-LOCAL-LICENSE' && cChave === chave) return true;
  if (cnpjLimpo && cnpjLimpo !== '00000000000191' && cnpjLimpo.length >= 11 && cCnpj === cnpjLimpo) return true;
  if (nome && cNome === nome) return true;
  if (chave === 'CS-PRO-LOCAL-LICENSE' && cChave === 'CS-PRO-LOCAL-LICENSE' && (!nome || cNome === nome)) return true;
  return false;
}

function gerarProximoProtocolo(): string {
  const base = 1001 + dbMock.chamados.length;
  return `#${base}`;
}

// ============================================================================
// ROTAS CONSUMIDAS PELO SISTEMA ERP / PDV DAS LOJAS
// ============================================================================

/**
 * POST /api/suporte/loja/abrir
 * Abre um novo Chamado de Suporte (Incidente) ou envia uma Sugestão
 */
suporteRouter.post('/loja/abrir', (req: Request, res: Response) => {
  const {
    id,
    tipo = 'SUPORTE',
    prioridade = 'NORMAL',
    chaveLicenca,
    nomeLoja,
    cnpjLoja,
    ramoLoja,
    versaoSistema,
    solicitanteNome,
    solicitanteContato,
    solicitanteCargo,
    assunto,
    descricao,
  } = req.body || {};

  const textoDescricao = String(descricao || '').trim();
  if (!textoDescricao) {
    return res.status(400).json({
      success: false,
      error: 'Por favor, descreva o chamado ou a sugestão antes de enviar.',
    });
  }

  // Evita duplicação caso o ERP reenvie o mesmo ID durante sincronização offline->online
  if (id) {
    const existente = dbMock.chamados.find((c) => c.id === id);
    if (existente) {
      return res.json({ success: true, data: existente });
    }
  }

  const tenant = encontrarTenantLoja(chaveLicenca, cnpjLoja, nomeLoja);

  const tipoNormalizado: 'SUPORTE' | 'SUGESTAO' =
    String(tipo).toUpperCase() === 'SUGESTAO' ? 'SUGESTAO' : 'SUPORTE';

  const prioNormalizada: 'NORMAL' | 'ALTA' | 'URGENTE' =
    String(prioridade).toUpperCase() === 'URGENTE'
      ? 'URGENTE'
      : String(prioridade).toUpperCase() === 'ALTA'
      ? 'ALTA'
      : 'NORMAL';

  const nomeLojaFinal =
    String(nomeLoja || '').trim() ||
    tenant?.nomeFantasia ||
    tenant?.razaoSocial ||
    'Loja Local ClickStorm';

  const cnpjFinal =
    String(cnpjLoja || '').trim() ||
    tenant?.cnpj ||
    'Não informado';

  const nomePessoaFinal =
    String(solicitanteNome || '').trim() ||
    tenant?.administradorNome ||
    'Operador / Responsável';

  const contatoFinal =
    String(solicitanteContato || '').trim() ||
    tenant?.telefone ||
    tenant?.email ||
    'Não informado';

  const assuntoFinal =
    tipoNormalizado === 'SUGESTAO'
      ? String(assunto || '').trim() || `Sugestão: ${textoDescricao.slice(0, 55)}${textoDescricao.length > 55 ? '...' : ''}`
      : String(assunto || '').trim() || `Incidente: ${textoDescricao.slice(0, 55)}${textoDescricao.length > 55 ? '...' : ''}`;

  const agora = new Date().toISOString();
  const msgInicial: MensagemChamado = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    autor: 'LOJA',
    autorNome: nomePessoaFinal,
    texto: textoDescricao,
    criadoEm: agora,
    lidoPelaLoja: true,
  };

  const novoChamado: ChamadoSuporte = {
    id: id || `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    protocolo: gerarProximoProtocolo(),
    tipo: tipoNormalizado,
    status: 'ABERTO',
    prioridade: prioNormalizada,
    tenantId: tenant?.id,
    chaveLicenca: String(chaveLicenca || tenant?.chaveLicenca || 'CS-PRO-LOCAL-LICENSE').trim(),
    nomeLoja: nomeLojaFinal,
    cnpjLoja: cnpjFinal,
    ramoLoja: String(ramoLoja || tenant?.ramo_atuacao || 'mercado'),
    versaoSistema: String(versaoSistema || tenant?.versaoDesktop || '1.0.0'),
    solicitanteNome: nomePessoaFinal,
    solicitanteContato: contatoFinal,
    solicitanteCargo: String(solicitanteCargo || 'Operador'),
    assunto: assuntoFinal,
    descricao: textoDescricao,
    mensagens: [msgInicial],
    lidoPeloAdmin: false,
    temRespostaNaoLidaLoja: false,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  dbMock.chamados.unshift(novoChamado);
  salvarBancoMaster();

  return res.status(201).json({
    success: true,
    data: novoChamado,
  });
});

/**
 * GET /api/suporte/loja/listar
 * Lista todos os chamados e sugestões daquela loja específica (com as respostas do Admin)
 */
suporteRouter.get('/loja/listar', (req: Request, res: Response) => {
  const chaveLicenca = (req.query.chaveLicenca || req.headers['x-license-key'] || '') as string;
  const cnpj = (req.query.cnpj || req.headers['x-tenant-cnpj'] || '') as string;
  const nomeLoja = (req.query.nomeLoja || req.headers['x-store-name'] || '') as string;

  const lista = dbMock.chamados.filter((c) =>
    pertenceALoja(c, chaveLicenca, cnpj, nomeLoja)
  );

  return res.json({
    success: true,
    data: lista,
  });
});

/**
 * POST /api/suporte/loja/:id/mensagem
 * Permite que o usuário da loja responda de volta dentro de um chamado existente
 */
suporteRouter.post('/loja/:id/mensagem', (req: Request, res: Response) => {
  const { id } = req.params;
  const { texto, autorNome } = req.body || {};

  const msgLimpa = String(texto || '').trim();
  if (!msgLimpa) {
    return res.status(400).json({ success: false, error: 'Digite uma mensagem.' });
  }

  const chamado = dbMock.chamados.find((c) => c.id === id);
  if (!chamado) {
    return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
  }

  const agora = new Date().toISOString();
  const novaMsg: MensagemChamado = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    autor: 'LOJA',
    autorNome: String(autorNome || chamado.solicitanteNome || 'Cliente').trim(),
    texto: msgLimpa,
    criadoEm: agora,
    lidoPelaLoja: true,
  };

  chamado.mensagens.push(novaMsg);
  chamado.lidoPeloAdmin = false;
  chamado.temRespostaNaoLidaLoja = false;
  if (chamado.status === 'RESPONDIDO' || chamado.status === 'RESOLVIDO') {
    chamado.status = 'ABERTO';
  }
  chamado.atualizadoEm = agora;

  salvarBancoMaster();

  return res.json({
    success: true,
    data: chamado,
  });
});

/**
 * POST /api/suporte/loja/:id/marcar-lido
 * Marca as respostas do Admin como lidas pelo cliente na loja
 */
suporteRouter.post('/loja/:id/marcar-lido', (req: Request, res: Response) => {
  const { id } = req.params;
  const chamado = dbMock.chamados.find((c) => c.id === id);
  if (!chamado) {
    return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
  }

  chamado.temRespostaNaoLidaLoja = false;
  chamado.mensagens.forEach((m) => {
    if (m.autor === 'ADMIN') m.lidoPelaLoja = true;
  });
  salvarBancoMaster();

  return res.json({ success: true, data: chamado });
});

// ============================================================================
// ROTAS ADMINISTRATIVAS DO PAINEL MASTER ADMIN (SITE)
// ============================================================================

/**
 * GET /api/suporte/admin/listar
 * Lista todos os chamados e sugestões para o administrador no painel do site
 */
suporteRouter.get('/admin/listar', masterAuthMiddleware, (req: Request, res: Response) => {
  const { tipo, status, busca } = req.query;

  let filtrados = [...dbMock.chamados];

  if (tipo && tipo !== 'TODOS') {
    filtrados = filtrados.filter((c) => c.tipo === String(tipo).toUpperCase());
  }
  if (status && status !== 'TODOS') {
    filtrados = filtrados.filter((c) => c.status === String(status).toUpperCase());
  }
  if (busca && String(busca).trim()) {
    const q = String(busca).toLowerCase().trim();
    filtrados = filtrados.filter(
      (c) =>
        c.protocolo.toLowerCase().includes(q) ||
        c.nomeLoja.toLowerCase().includes(q) ||
        c.cnpjLoja.toLowerCase().includes(q) ||
        c.solicitanteNome.toLowerCase().includes(q) ||
        c.solicitanteContato.toLowerCase().includes(q) ||
        c.assunto.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q)
    );
  }

  const resumo = {
    total: dbMock.chamados.length,
    abertos: dbMock.chamados.filter((c) => c.status === 'ABERTO').length,
    emAndamento: dbMock.chamados.filter((c) => c.status === 'EM_ANDAMENTO').length,
    respondidos: dbMock.chamados.filter((c) => c.status === 'RESPONDIDO').length,
    resolvidos: dbMock.chamados.filter((c) => c.status === 'RESOLVIDO' || c.status === 'FECHADO').length,
    suporteCount: dbMock.chamados.filter((c) => c.tipo === 'SUPORTE').length,
    sugestoesCount: dbMock.chamados.filter((c) => c.tipo === 'SUGESTAO').length,
    naoLidosAdmin: dbMock.chamados.filter((c) => !c.lidoPeloAdmin).length,
  };

  return res.json({
    success: true,
    resumo,
    data: filtrados,
  });
});

/**
 * POST /api/suporte/admin/:id/responder
 * O Administrador responde um chamado ou sugestão e a mensagem vai direto para dentro do sistema da loja
 */
suporteRouter.post('/admin/:id/responder', masterAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { texto, autorNome = 'Suporte ClickStorm', novoStatus } = req.body || {};

  const msgLimpa = String(texto || '').trim();
  if (!msgLimpa) {
    return res.status(400).json({ success: false, error: 'Digite a resposta antes de enviar.' });
  }

  const chamado = dbMock.chamados.find((c) => c.id === id);
  if (!chamado) {
    return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
  }

  const agora = new Date().toISOString();
  const msgAdmin: MensagemChamado = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    autor: 'ADMIN',
    autorNome: String(autorNome || 'Suporte ClickStorm'),
    texto: msgLimpa,
    criadoEm: agora,
    lidoPelaLoja: false,
  };

  chamado.mensagens.push(msgAdmin);
  chamado.lidoPeloAdmin = true;
  chamado.temRespostaNaoLidaLoja = true;
  chamado.status = novoStatus || 'RESPONDIDO';
  chamado.atualizadoEm = agora;

  salvarBancoMaster();

  return res.json({
    success: true,
    mensagem: 'Resposta enviada para o sistema da loja com sucesso!',
    data: chamado,
  });
});

/**
 * PATCH /api/suporte/admin/:id/status
 * Altera status e/ou prioridade do chamado
 */
suporteRouter.patch('/admin/:id/status', masterAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, prioridade, lidoPeloAdmin } = req.body || {};

  const chamado = dbMock.chamados.find((c) => c.id === id);
  if (!chamado) {
    return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
  }

  if (status) chamado.status = status;
  if (prioridade) chamado.prioridade = prioridade;
  if (typeof lidoPeloAdmin === 'boolean') chamado.lidoPeloAdmin = lidoPeloAdmin;
  else chamado.lidoPeloAdmin = true;

  chamado.atualizadoEm = new Date().toISOString();
  salvarBancoMaster();

  return res.json({
    success: true,
    data: chamado,
  });
});

/**
 * DELETE /api/suporte/admin/:id
 * Apaga um chamado ou sugestão permanentemente
 */
suporteRouter.delete('/admin/:id', masterAuthMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = dbMock.chamados.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
  }

  const removido = dbMock.chamados.splice(idx, 1)[0];
  salvarBancoMaster();

  return res.json({
    success: true,
    mensagem: `Registro ${removido.protocolo} excluído com sucesso.`,
  });
});
