import { Router } from 'express';
import { BalancaController } from '../controllers/BalancaController.js';

export function createBalancaRouter(): Router {
  const router = Router();
  const controller = new BalancaController();

  router.get('/testar', controller.testar);
  router.get('/status', controller.obterStatus);
  router.get('/portas', controller.listarPortas);
  router.post('/config', controller.salvarConfig);
  router.post('/exportar-carga', controller.exportarCarga);
  router.get('/diretorios-carga', controller.obterDiretoriosCarga);
  router.get('/exportar-mgv', controller.downloadCargaMgv);

  return router;
}
