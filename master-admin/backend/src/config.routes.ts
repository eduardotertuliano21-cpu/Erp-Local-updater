import { Router, Request, Response } from 'express';
import { dbMock, salvarBancoMaster } from './db.mock.js';
import { masterAuthMiddleware } from './auth.middleware.js';

export const configRouter = Router();

// GET /api/admin/config - Retorna configurações globais (chaves Stripe)
configRouter.get('/', masterAuthMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      stripeSecretKey: dbMock.configGlobal?.stripeSecretKey || '',
      stripePublicKey: dbMock.configGlobal?.stripePublicKey || '',
    },
  });
});

// GET /api/admin/config/public - Retorna apenas chave pública (pode ser consumida por apps)
configRouter.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    stripePublicKey: dbMock.configGlobal?.stripePublicKey || process.env.STRIPE_PUBLIC_KEY || '',
  });
});

// PUT /api/admin/config - Atualiza configurações globais
configRouter.put('/', masterAuthMiddleware, (req: Request, res: Response) => {
  const { stripeSecretKey, stripePublicKey } = req.body || {};

  if (!dbMock.configGlobal) {
    dbMock.configGlobal = {
      stripeSecretKey: '',
      stripePublicKey: '',
    };
  }

  if (typeof stripeSecretKey === 'string' && stripeSecretKey.trim()) {
    dbMock.configGlobal.stripeSecretKey = stripeSecretKey.trim();
  }

  if (typeof stripePublicKey === 'string' && stripePublicKey.trim()) {
    dbMock.configGlobal.stripePublicKey = stripePublicKey.trim();
  }

  salvarBancoMaster();

  res.json({
    success: true,
    mensagem: 'Configurações do Stripe atualizadas com sucesso!',
    data: {
      stripeSecretKey: dbMock.configGlobal.stripeSecretKey,
      stripePublicKey: dbMock.configGlobal.stripePublicKey,
    },
  });
});
