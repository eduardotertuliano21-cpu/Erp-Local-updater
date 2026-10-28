import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';

export const configRouter = Router();

// GET /api/admin/config - Retorna configurações globais (chaves Stripe e Período de Avaliação)
configRouter.get('/', masterAuthMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      stripeSecretKey: dbMock.configGlobal?.stripeSecretKey || '',
      stripePublicKey: dbMock.configGlobal?.stripePublicKey || '',
      diasTrialNovosClientes: Number(dbMock.configGlobal?.diasTrialNovosClientes ?? 7),
    },
  });
});

// GET /api/admin/config/public - Retorna apenas chave pública e dias trial
configRouter.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    stripePublicKey: dbMock.configGlobal?.stripePublicKey || process.env.STRIPE_PUBLIC_KEY || '',
    diasTrialNovosClientes: Number(dbMock.configGlobal?.diasTrialNovosClientes ?? 7),
  });
});

// PUT /api/admin/config - Atualiza configurações globais
configRouter.put('/', masterAuthMiddleware, (req: Request, res: Response) => {
  const { stripeSecretKey, stripePublicKey, diasTrialNovosClientes } = req.body || {};

  if (!dbMock.configGlobal) {
    dbMock.configGlobal = {
      stripeSecretKey: '',
      stripePublicKey: '',
      diasTrialNovosClientes: 7,
    };
  }

  if (typeof stripeSecretKey === 'string' && stripeSecretKey.trim()) {
    dbMock.configGlobal.stripeSecretKey = stripeSecretKey.trim();
  }

  if (typeof stripePublicKey === 'string' && stripePublicKey.trim()) {
    dbMock.configGlobal.stripePublicKey = stripePublicKey.trim();
  }

  if (diasTrialNovosClientes !== undefined && !isNaN(Number(diasTrialNovosClientes))) {
    dbMock.configGlobal.diasTrialNovosClientes = Math.max(0, parseInt(diasTrialNovosClientes, 10));
  }

  salvarBancoMaster();

  res.json({
    success: true,
    mensagem: 'Configurações atualizadas com sucesso!',
    data: {
      stripeSecretKey: dbMock.configGlobal.stripeSecretKey,
      stripePublicKey: dbMock.configGlobal.stripePublicKey,
      diasTrialNovosClientes: dbMock.configGlobal.diasTrialNovosClientes,
    },
  });
});
