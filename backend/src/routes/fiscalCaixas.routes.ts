import { Router } from 'express';
import { CaixaFiscalController } from '../controllers/CaixaFiscalController.js';
import { ZeroConfService } from '../services/ZeroConfService.js';

export function createFiscalCaixasRouter(zeroConf?: ZeroConfService): Router {
  const router = Router();
  const controller = new CaixaFiscalController(zeroConf);

  router.get('/fiscal/caixas', controller.listarCaixas);
  router.post('/fiscal/caixas', controller.salvarCaixas);
  router.post('/fiscal/caixas/heartbeat', controller.heartbeatTerminal);
  router.post('/terminal/heartbeat', controller.heartbeatTerminal);

  return router;
}
