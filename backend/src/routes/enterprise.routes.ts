import { Router } from 'express';
import { EnterpriseController } from '../controllers/EnterpriseController.js';
import { CertificadoA1Controller } from '../controllers/CertificadoA1Controller.js';
import { RbacController } from '../controllers/RbacController.js';
import { OnboardingController } from '../controllers/OnboardingController.js';

export function createEnterpriseRouter(): Router {
  const router = Router();
  const controller = new EnterpriseController();
  const certController = new CertificadoA1Controller();
  const rbacController = new RbacController();
  const onboardingController = new OnboardingController();

  // Trilha de Auditoria
  router.get('/auditoria', controller.listarAuditoria);

  // Curva ABC (BI ERP)
  router.get('/curva-abc', controller.obterCurvaAbc);

  // TEF Dial / IP Local
  router.post('/tef/iniciar', controller.iniciarTef);
  router.get('/tef/:id/status', controller.verificarTef);
  router.post('/tef/:id/confirmar', controller.confirmarTef);

  // Motor de Etiquetas (Zebra / Argox)
  router.post('/etiquetas/gerar', controller.gerarEtiquetas);

  // KDS - Monitor de Cozinha Local
  router.get('/kds/pedidos', controller.listarKds);
  router.get('/kds/prontos', controller.listarKdsProntos);
  router.post('/kds/pedidos', controller.criarPedidoKds);
  router.post('/kds/pedidos/:id/avancar', controller.avancarStatusKds);
  router.post('/kds/pedidos/:id/pronto', controller.marcarProntoKds);
  router.post('/kds/pedidos/:id/entregar', controller.marcarEntregueKds);

  // Veículos de Clientes (Autopeças)
  router.get('/veiculos/cliente/:clienteId', controller.listarVeiculosCliente);
  router.get('/veiculos/placa/:placa', controller.buscarVeiculoPlaca);
  router.post('/veiculos', controller.salvarVeiculo);
  router.post('/veiculos/placa/:placa/km', controller.atualizarKmVeiculo);

  // Certificados Digitais A1
  router.get('/certificados', certController.listar);
  router.get('/certificados/ativo', certController.obterAtivo);
  router.get('/certificados/alerta-vencimento', certController.obterAlertaVencimento);
  router.post('/certificados/upload', certController.uploadCertificado);
  router.post('/certificados/:id/ativar', certController.ativarCertificado);

  // RBAC Dinâmico e Matriz de Permissões
  router.get('/rbac/matriz', rbacController.obterMatriz);
  router.post('/rbac/matriz', rbacController.atualizarMatriz);
  router.post('/rbac/modo-estrito', rbacController.alterarModoEstrito);
  router.post('/rbac/exigir-autenticacao', rbacController.alterarExigirAutenticacao);
  router.post('/rbac/verificar', rbacController.verificarPermissao);

  // Onboarding Wizard (Primeiro Acesso)
  router.get('/onboarding/status', onboardingController.obterStatus);
  router.post('/onboarding/concluir', onboardingController.concluir);

  return router;
}

