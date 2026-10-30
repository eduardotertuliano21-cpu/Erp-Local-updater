import { Router } from 'express';
import { NfeDanfeController } from '../controllers/NfeDanfeController.js';

export function createNfeDanfeRouter(): Router {
  const router = Router();
  const controller = new NfeDanfeController();

  router.post('/nfe-danfe/emitir', controller.emitir);
  router.get('/nfe-danfe/listar', controller.listar);
  router.get('/nfe-danfe/pastas/arvore', controller.listarPastas);
  router.post('/nfe-danfe/pastas/abrir', controller.abrirPasta);
  router.get('/nfe-danfe/:id', controller.obterDetalhes);
  router.post('/nfe-danfe/:id/cancelar', controller.cancelar);

  return router;
}
