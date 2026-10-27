import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApiRouter } from './routes/api.routes.js';
import { createEnterpriseRouter } from './routes/enterprise.routes.js';
import { createBalancaRouter } from './routes/balanca.routes.js';
import { createCaixaPretaRouter } from './routes/caixaPreta.routes.js';
import { ApiResponse } from './types/api.js';
import { ZeroConfService } from './services/ZeroConfService.js';
import { RestaurantController } from './controllers/RestaurantController.js';
import { IMAGENS_DIR, DatabaseConnection, normalizeTenant } from './config/database.js';
import { LOGOS_DIR } from './services/LogoStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(
  zeroConf?: ZeroConfService,
  restaurantController?: RestaurantController
): Express {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*'
  }));

  app.use(express.json({ limit: '10mb' }));

  // Servir imagens locais salvas dos produtos e logomarcas da empresa em diretório seguro
  app.use('/imagens', express.static(IMAGENS_DIR));
  app.use('/assets/logos', express.static(LOGOS_DIR));

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: { status: 'ONLINE', timestamp: new Date().toISOString() },
    };
    res.json(response);
  });

  // Multi-Database Tenant Routing & Context Switching global para todos os endpoints
  app.use((req, _res, next) => {
    const raw = (req.headers['x-tenant'] as string) || (req.query.tenant as string) || (req.headers['x-ramo-atuacao'] as string) || (req.query.ramo as string) || (req.path.startsWith('/api/restaurante') ? 'restaurante' : undefined);
    if (raw) DatabaseConnection.setActiveTenant(normalizeTenant(raw));
    next();
  });

  // Rotas da API
  app.use('/api', createApiRouter(zeroConf, restaurantController));
  app.use('/api/enterprise', createEnterpriseRouter());
  app.use('/api/balanca', createBalancaRouter());
  app.use('/api/loja', createCaixaPretaRouter());
  app.use('/api', createCaixaPretaRouter());

  // Servir frontend compilado em produção (se existir)
  const candidateDirs = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../../frontend/dist')
  ];
  for (const staticDir of candidateDirs) {
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return next();
        }
        res.sendFile(path.join(staticDir, 'index.html'));
      });
      break;
    }
  }

  // Error handler global padronizado
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err);
    const response: ApiResponse = {
      success: false,
      error: err.message || 'Erro inesperado no servidor',
    };
    res.status(500).json(response);
  });

  return app;
}
