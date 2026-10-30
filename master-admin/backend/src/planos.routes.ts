import { Router, Request, Response } from 'express';
import { dbMock, Plano, salvarBancoMaster } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';
import { StripeService } from './stripe.service.js';

export const planosRouter = Router();

// Rota pública/desktop: Lista planos ativos para upgrade
planosRouter.get('/publicos', (_req: Request, res: Response) => {
  const ativos = dbMock.planos.filter((p) => p.ativo).map((p) => ({
    ...p,
    preco: p.valorMensal,
    mesesRenovacao: typeof p.mesesRenovacao === 'number' ? p.mesesRenovacao : (p.periodicidade === 'ANUAL' ? 12 : 1),
  }));
  res.json(ativos);
});

// Listar todos os planos (Master Admin)
planosRouter.get('/', masterAuthMiddleware, (_req: Request, res: Response) => {
  const todos = dbMock.planos.map((p) => ({
    ...p,
    preco: p.valorMensal,
    mesesRenovacao: typeof p.mesesRenovacao === 'number' ? p.mesesRenovacao : (p.periodicidade === 'ANUAL' ? 12 : 1),
  }));
  res.json(todos);
});

// Criar ou atualizar plano e sincronizar com o Stripe
planosRouter.post('/', masterAuthMiddleware, async (req: Request, res: Response) => {
  const { nome, descricao, valorMensal, recursos, limiteCaixas, valorMaquinaExtra, periodicidade, mesesRenovacao, slug, moduloNfe } = req.body;

  if (!nome || typeof valorMensal !== 'number') {
    return res.status(400).json({ erro: 'Nome e valor mensal são obrigatórios' });
  }

  const periodCalculada = periodicidade || (nome?.toLowerCase().includes('anual') ? 'ANUAL' : 'MENSAL');

  try {
    let stripeProductId = `prod_local_${Date.now()}`;
    let stripePriceId = `price_local_${Math.round(valorMensal)}_${Date.now().toString().slice(-4)}`;
    try {
      const stripeResult = await StripeService.syncPlanoComStripe({
        nome,
        descricao,
        valorMensal,
        periodicidade: periodCalculada,
      });
      if (stripeResult?.stripeProductId) stripeProductId = stripeResult.stripeProductId;
      if (stripeResult?.stripePriceId) stripePriceId = stripeResult.stripePriceId;
    } catch (stripeErr: any) {
      console.warn('[Planos] Aviso Stripe (usando ID local):', stripeErr.message);
    }

    const nfeAtivo = Boolean(moduloNfe);
    const novoPlano: Plano = {
      id: `plano-${Date.now()}`,
      slug: slug || nome.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      nome,
      descricao: descricao || '',
      valorMensal,
      periodicidade: periodCalculada,
      mesesRenovacao: typeof mesesRenovacao === 'number' ? mesesRenovacao : (periodCalculada === 'ANUAL' ? 12 : 1),
      recursos: Array.isArray(recursos) ? recursos : [],
      limiteCaixas: limiteCaixas || 3,
      valorMaquinaExtra: typeof valorMaquinaExtra === 'number' ? valorMaquinaExtra : 25.00,
      stripeProductId,
      stripePriceId,
      ativo: true,
      moduloNfe: nfeAtivo,
    };

    dbMock.planos.push(novoPlano);
    salvarBancoMaster();
    res.status(201).json({ mensagem: 'Plano criado e sincronizado com sucesso', plano: novoPlano });
  } catch (err: any) {
    res.status(500).json({ erro: 'Falha ao criar plano: ' + err.message });
  }
});

// Atualizar plano existente
planosRouter.put('/:id', masterAuthMiddleware, async (req: Request, res: Response) => {
  const index = dbMock.planos.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Plano não encontrado' });

  const planoAtual = dbMock.planos[index];
  const { nome, descricao, valorMensal, recursos, limiteCaixas, valorMaquinaExtra, periodicidade, mesesRenovacao, ativo, moduloNfe } = req.body;

  try {
    let stripePriceId = planoAtual.stripePriceId || `price_local_${Date.now().toString().slice(-4)}`;
    try {
      const stripeResult = await StripeService.syncPlanoComStripe({
        nome: nome || planoAtual.nome,
        descricao: descricao ?? planoAtual.descricao,
        valorMensal: valorMensal ?? planoAtual.valorMensal,
        periodicidade: periodicidade ?? planoAtual.periodicidade,
        stripeProductId: planoAtual.stripeProductId,
      });
      if (stripeResult?.stripePriceId) stripePriceId = stripeResult.stripePriceId;
    } catch (stripeErr: any) {
      console.warn('[Planos] Aviso ao atualizar no Stripe:', stripeErr.message);
    }

    const novoModuloNfe = moduloNfe !== undefined ? Boolean(moduloNfe) : Boolean(planoAtual.moduloNfe);

    dbMock.planos[index] = {
      ...planoAtual,
      nome: nome || planoAtual.nome,
      descricao: descricao ?? planoAtual.descricao,
      valorMensal: valorMensal ?? planoAtual.valorMensal,
      periodicidade: periodicidade ?? planoAtual.periodicidade,
      mesesRenovacao: typeof mesesRenovacao === 'number' ? mesesRenovacao : (planoAtual.mesesRenovacao ?? (planoAtual.periodicidade === 'ANUAL' ? 12 : 1)),
      recursos: recursos ?? planoAtual.recursos,
      limiteCaixas: limiteCaixas ?? planoAtual.limiteCaixas,
      valorMaquinaExtra: typeof valorMaquinaExtra === 'number' ? valorMaquinaExtra : (planoAtual.valorMaquinaExtra ?? 25.00),
      ativo: ativo ?? planoAtual.ativo,
      stripePriceId,
      moduloNfe: novoModuloNfe,
    };

    // Propaga a habilitação do plano para os clientes vinculados que ainda não possuem override manual divergente
    if (moduloNfe !== undefined) {
      dbMock.tenants.forEach((t) => {
        if (t.planoId === planoAtual.id || t.planoId === planoAtual.slug) {
          t.moduloNfe = novoModuloNfe;
        }
      });
    }

    salvarBancoMaster();
    res.json({ mensagem: 'Plano atualizado com sucesso', plano: dbMock.planos[index] });
  } catch (err: any) {
    res.status(500).json({ erro: 'Erro ao atualizar plano: ' + err.message });
  }
});

// Excluir ou inativar plano
planosRouter.delete('/:id', masterAuthMiddleware, (req: Request, res: Response) => {
  const index = dbMock.planos.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Plano não encontrado' });

  dbMock.planos.splice(index, 1);
  salvarBancoMaster();
  res.json({ sucesso: true, mensagem: 'Plano removido com sucesso' });
});
