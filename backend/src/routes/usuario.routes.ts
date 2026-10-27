import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController.js';

export function createUsuarioRouter(): Router {
  const router = Router();
  const controller = new UsuarioController();

  // Autenticação e Sessão
  router.post('/login', controller.login);
  router.get('/validar-caixa/:usuarioId', controller.validarStatusCaixa);
  router.post('/abrir-caixa', controller.abrirSessaoCaixa);
  router.post('/fechar-caixa', controller.fecharSessaoCaixa);

  // Gestão de Usuários e Permissões (RBAC)
  router.get('/usuarios', controller.listar);
  router.get('/usuarios/:id', controller.obter);
  router.post('/usuarios', controller.criar);
  router.put('/usuarios/:id', controller.atualizar);
  router.delete('/usuarios/:id', controller.excluir);

  return router;
}
