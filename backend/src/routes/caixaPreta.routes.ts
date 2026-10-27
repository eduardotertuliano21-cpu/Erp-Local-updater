import { Router } from 'express';
import { CaixaPretaController } from '../controllers/CaixaPretaController.js';

export function createCaixaPretaRouter(): Router {
  const router = Router();
  const controller = new CaixaPretaController();

  // GET /api/loja/caixa-preta ou /api/caixa-preta
  router.get('/caixa-preta', controller.listarNaoResolvidos);
  router.get('/caixa-preta/todos', controller.listarTodos);
  router.post('/caixa-preta/:id/resolver', controller.marcarResolvido);
  router.post('/caixa-preta/diagnosticar', controller.diagnosticarManual);

  return router;
}
