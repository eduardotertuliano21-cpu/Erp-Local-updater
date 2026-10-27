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
  const { nome, descricao, valorMensal, recursos, limiteCaixas, valorMaquinaExtra, periodicidade, mesesRenovacao, slug } = req.body;

  if (!nome || typeof valorMensal !== 'number') {
    return res.status(400).json({ erro: 'Nome e valor mensal são obrigatórios' });
  }

  const periodCalculada = periodicidade || (nome?.toLowerCase().includes('anual') ? 'ANUAL' : 'MENSAL');

  try {
    const stripeResult = await StripeService.syncPlanoComStripe({
      nome,
      descricao,
      valorMensal,
      periodicidade: periodCalculada,
    });

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
      stripeProductId: stripeResult.stripeProductId,
      stripePriceId: stripeResult.stripePriceId,
      ativo: true,
    };

    dbMock.planos.push(novoPlano);
    salvarBancoMaster();
    res.status(201).json({ mensagem: 'Plano criado e sincronizado com Stripe', plano: novoPlano });
  } catch (err: any) {
    res.status(500).json({ erro: 'Falha ao sincronizar com Stripe: ' + err.message });
  }
});

// Atualizar plano existente
planosRouter.put('/:id', masterAuthMiddleware, async (req: Request, res: Response) => {
  const index = dbMock.planos.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ erro: 'Plano não encontrado' });

  const planoAtual = dbMock.planos[index];
  const { nome, descricao, valorMensal, recursos, limiteCaixas, valorMaquinaExtra, periodicidade, mesesRenovacao, ativo } = req.body;

  try {
    const stripeResult = await StripeService.syncPlanoComStripe({
      nome: nome || planoAtual.nome,
      descricao: descricao ?? planoAtual.descricao,
      valorMensal: valorMensal ?? planoAtual.valorMensal,
      periodicidade: periodicidade ?? planoAtual.periodicidade,
      stripeProductId: planoAtual.stripeProductId,
    });

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
      stripePriceId: stripeResult.stripePriceId,
    };

    salvarBancoMaster();
    res.json({ mensagem: 'Plano atualizado com sucesso no Stripe', plano: dbMock.planos[index] });
  } catch (err: any) {
    res.status(500).json({ erro: 'Erro ao atualizar no Stripe: ' + err.message });
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
