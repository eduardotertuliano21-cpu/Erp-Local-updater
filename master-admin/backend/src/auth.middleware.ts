import { Request, Response, NextFunction } from 'express';

const MASTER_ADMIN_SECRET = process.env.MASTER_ADMIN_SECRET || 'clickstorm_master_secret_2026';

export function masterAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-admin-key'];

  if (apiKey === MASTER_ADMIN_SECRET || authHeader === `Bearer ${MASTER_ADMIN_SECRET}`) {
    return next();
  }

  return res.status(401).json({
    erro: 'Não autorizado. Acesso exclusivo do Master Admin ClickStorm.',
  });
}

/**
 * Middleware para autenticação do Sync originado pelo ERP Desktop
 */
export function tenantSyncAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const chaveLicenca = req.headers['x-license-key'] as string;
  const cnpj = req.headers['x-tenant-cnpj'] as string;

  if (!chaveLicenca && !cnpj) {
    return res.status(401).json({
      erro: 'Credenciais de sincronização não fornecidas (x-license-key obrigatório)',
    });
  }

  (req as any).tenantAuth = { chaveLicenca, cnpj };
  next();
}
