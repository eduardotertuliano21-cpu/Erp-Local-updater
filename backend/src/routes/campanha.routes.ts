import { Router } from 'express';
import { CampanhaRepository } from '../repositories/CampanhaRepository.js';
import { CampanhaController } from '../controllers/CampanhaController.js';

export function createCampanhaRouter(): Router {
  const router = Router();
  const repo = new CampanhaRepository();
  const controller = new CampanhaController(repo);

  router.get('/campanhas', controller.listar);
  router.get('/campanhas/:id', controller.obter);
  router.post('/campanhas', controller.salvar);
  router.delete('/campanhas/:id', controller.excluir);
  router.post('/campanhas/:id/produtos', controller.vincularProdutos);
  router.post('/campanhas/desvincular-produtos', controller.desvincularProdutos);
  router.get('/campanhas/:id/produtos', controller.listarProdutos);

  return router;
}
