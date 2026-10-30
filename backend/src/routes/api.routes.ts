import { Router } from 'express';
import { DatabaseConnection, normalizeTenant } from '../config/database.js';
import { CatalogoRepository } from '../repositories/CatalogoRepository.js';
import { CatalogoSyncRepository } from '../repositories/CatalogoSyncRepository.js';
import { OperacaoRepository } from '../repositories/OperacaoRepository.js';
import { FiscalRepository } from '../repositories/FiscalRepository.js';
import { OperadorRepository } from '../repositories/OperadorRepository.js';
import { EntidadeRepository } from '../repositories/EntidadeRepository.js';
import { FinanceiroRepository } from '../repositories/FinanceiroRepository.js';
import { EstoqueRepository } from '../repositories/EstoqueRepository.js';
import { PcpRepository } from '../repositories/PcpRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { ConfigOperacaoRepository } from '../repositories/ConfigOperacaoRepository.js';
import { DashboardRepository } from '../repositories/DashboardRepository.js';
import { MesaRepository } from '../repositories/MesaRepository.js';
import { LicencaRepository } from '../repositories/LicencaRepository.js';
import { AssistenciaRepository } from '../repositories/AssistenciaRepository.js';
import { CatalogoService } from '../services/CatalogoService.js';
import { CaixaService } from '../services/CaixaService.js';
import { VendaService } from '../services/VendaService.js';
import { DownsyncService } from '../services/DownsyncService.js';
import { UpsyncService } from '../services/UpsyncService.js';
import { SyncOrchestrator } from '../services/SyncOrchestrator.js';
import { BalancaParserService } from '../services/BalancaParserService.js';
import { FiscalService } from '../services/FiscalService.js';
import { PrinterService } from '../services/PrinterService.js';
import { RawPrinterDriver } from '../services/RawPrinterDriver.js';
import { ContingencyTransmissionService } from '../services/ContingencyTransmissionService.js';
import { AuthService } from '../services/AuthService.js';
import { RelatorioService } from '../services/RelatorioService.js';
import { EntidadeService } from '../services/EntidadeService.js';
import { FinanceiroService } from '../services/FinanceiroService.js';
import { EstoqueService } from '../services/EstoqueService.js';
import { XmlNfeImportService } from '../services/XmlNfeImportService.js';
import { PcpService } from '../services/PcpService.js';
import { ZeroConfService } from '../services/ZeroConfService.js';
import { ConfigLojaService } from '../services/ConfigLojaService.js';
import { ConfigOperacaoService } from '../services/ConfigOperacaoService.js';
import { DashboardService } from '../services/DashboardService.js';
import { SettingsService } from '../services/SettingsService.js';
import { LicencaService } from '../services/LicencaService.js';
import { TimeDriftService } from '../services/TimeDriftService.js';
import { UsbBackupService } from '../services/UsbBackupService.js';
import { StripeSubscriptionService } from '../services/StripeSubscriptionService.js';
import { CatalogoController } from '../controllers/CatalogoController.js';
import { CaixaController } from '../controllers/CaixaController.js';
import { VendaController } from '../controllers/VendaController.js';
import { SyncController } from '../controllers/SyncController.js';
import { AuthController } from '../controllers/AuthController.js';
import { FiscalController } from '../controllers/FiscalController.js';
import { RelatorioController } from '../controllers/RelatorioController.js';
import { EntidadeController } from '../controllers/EntidadeController.js';
import { FinanceiroController } from '../controllers/FinanceiroController.js';
import { EstoqueController } from '../controllers/EstoqueController.js';
import { PcpController } from '../controllers/PcpController.js';
import { ConfigLojaController } from '../controllers/ConfigLojaController.js';
import { ConfigOperacaoController } from '../controllers/ConfigOperacaoController.js';
import { DashboardController } from '../controllers/DashboardController.js';
import { SettingsController } from '../controllers/SettingsController.js';
import { RestaurantController } from '../controllers/RestaurantController.js';
import { LicencaController } from '../controllers/LicencaController.js';
import { FailoverBackupController } from '../controllers/FailoverBackupController.js';
import { StripeSubscriptionController } from '../controllers/StripeSubscriptionController.js';
import { AssistenciaController } from '../controllers/AssistenciaController.js';
import { gitHubUpdateController } from '../controllers/GitHubUpdateController.js';
import { MasterAdminService } from '../services/MasterAdminService.js';
import { MasterAdminController } from '../controllers/MasterAdminController.js';
import { createCampanhaRouter } from './campanha.routes.js';
import { createUsuarioRouter } from './usuario.routes.js';
import { createVarejoAvancadoRoutes } from './varejoAvancado.routes.js';
import { createFiscalCaixasRouter } from './fiscalCaixas.routes.js';
import { createNfeDanfeRouter } from './nfeDanfe.routes.js';
import { createSuporteRouter } from './suporte.routes.js';

export function createApiRouter(
  sharedZeroConf?: ZeroConfService,
  sharedRestaurantController?: RestaurantController
): Router {
  const router = Router();

  // Dependências instanciadas conforme SOLID (IoC)
  const catalogoRepo = new CatalogoRepository();
  const catalogoSyncRepo = new CatalogoSyncRepository();
  const operacaoRepo = new OperacaoRepository();
  const fiscalRepo = new FiscalRepository();

  const catalogoService = new CatalogoService(catalogoRepo);
  const caixaService = new CaixaService(operacaoRepo);
  const vendaService = new VendaService(operacaoRepo, catalogoRepo);

  const downsyncService = new DownsyncService(catalogoSyncRepo);
  const upsyncService = new UpsyncService(operacaoRepo);
  const contingencyService = new ContingencyTransmissionService(fiscalRepo, operacaoRepo);
  const syncOrchestrator = new SyncOrchestrator(downsyncService, upsyncService, contingencyService);

  const fiscalService = new FiscalService(fiscalRepo, operacaoRepo);
  const printerService = new PrinterService();
  const rawPrinterDriver = new RawPrinterDriver();

  // Inicia worker em background (a cada 30 segundos)
  syncOrchestrator.iniciarAgendamentoAutomatico(30000);

  const configLojaRepo = new ConfigLojaRepository(), estoqueRepo = new EstoqueRepository();
  const balancaParser = new BalancaParserService(catalogoRepo);
  const catalogoController = new CatalogoController(catalogoService, balancaParser, catalogoSyncRepo, estoqueRepo, configLojaRepo);
  const caixaController = new CaixaController(caixaService), vendaController = new VendaController(vendaService);
  const operadorRepo = new OperadorRepository(), authService = new AuthService(operadorRepo, operacaoRepo);
  const authController = new AuthController(authService);
  const relatorioService = new RelatorioService(), relatorioController = new RelatorioController(relatorioService);
  const entidadeRepo = new EntidadeRepository(), entidadeService = new EntidadeService(entidadeRepo);
  const entidadeController = new EntidadeController(entidadeService);
  const financeiroRepo = new FinanceiroRepository(), financeiroService = new FinanceiroService(financeiroRepo);
  const financeiroController = new FinanceiroController(financeiroService);
  const xmlNfeService = new XmlNfeImportService(), estoqueService = new EstoqueService(estoqueRepo);
  const estoqueController = new EstoqueController(estoqueService, xmlNfeService);
  const pcpRepo = new PcpRepository(), pcpService = new PcpService(pcpRepo, estoqueRepo);
  const pcpController = new PcpController(pcpService);
  const zeroConf = sharedZeroConf || new ZeroConfService(5000);
  const configLojaService = new ConfigLojaService(configLojaRepo), configLojaController = new ConfigLojaController(configLojaService, zeroConf);
  const configOperacaoRepo = new ConfigOperacaoRepository(), configOperacaoService = new ConfigOperacaoService(configOperacaoRepo);
  const configOperacaoController = new ConfigOperacaoController(configOperacaoService);
  const dashboardRepo = new DashboardRepository(), dashboardService = new DashboardService(dashboardRepo);
  const dashboardController = new DashboardController(dashboardService);
  const settingsService = new SettingsService(configLojaRepo);
  const settingsController = new SettingsController(settingsService);
  const syncController = new SyncController(syncOrchestrator, downsyncService);
  const fiscalController = new FiscalController(fiscalService, printerService, fiscalRepo, operacaoRepo, rawPrinterDriver, contingencyService);
  const restaurantController = sharedRestaurantController || new RestaurantController(new MesaRepository());
  const assistenciaRepo = new AssistenciaRepository();
  const assistenciaController = new AssistenciaController(assistenciaRepo);

  // Multi-Database Tenant Routing & Context Switching
  router.use((req, _res, next) => {
    const raw = (req.headers['x-tenant'] as string) || (req.query.tenant as string) || (req.headers['x-ramo-atuacao'] as string) || (req.query.ramo as string) || (req.path.startsWith('/restaurante') ? 'restaurante' : undefined);
    if (raw) DatabaseConnection.setActiveTenant(normalizeTenant(raw));
    next();
  });

  router.post('/tenant/switch', (req, res) => {
    const norm = normalizeTenant(req.body?.tenant);
    DatabaseConnection.setActiveTenant(norm);
    res.json({ success: true, activeTenant: norm });
  });

  router.get('/tenant/current', (_req, res) => {
    res.json({ success: true, data: { activeTenant: DatabaseConnection.getActiveTenant() } });
  });

  // Assistência Técnica: Ordens de Serviço (db_assistencia.sqlite)
  router.get('/assistencia/os', assistenciaController.listarOs);
  router.get('/assistencia/os/:id', assistenciaController.obterOs);
  router.post('/assistencia/os', assistenciaController.criarOs);
  router.put('/assistencia/os/:id', assistenciaController.atualizarOs);
  router.patch('/assistencia/os/:id/status', assistenciaController.atualizarStatus);
  router.delete('/assistencia/os/:id', assistenciaController.excluirOs);
  router.get('/assistencia/equipamentos', assistenciaController.listarEquipamentos);
  router.post('/assistencia/equipamentos', assistenciaController.criarEquipamento);
  router.get('/assistencia/clientes', assistenciaController.listarClientes);
  router.post('/assistencia/clientes', assistenciaController.criarCliente);

  // Módulo de Restaurante, Comanda Mobile e QR Code Wi-Fi
  router.get('/qrcode-mobile', restaurantController.obterQrCodeMobile);
  router.get('/restaurante/mesas', restaurantController.listarMesas);
  router.get('/restaurante/mesas/:numero', restaurantController.obterMesa);
  router.post('/restaurante/pedido', restaurantController.lancarPedido);
  router.post('/restaurante/liberar', restaurantController.liberarMesa);

  // Motor Central de Configuração (SSOT) & Adaptação de Nichos
  router.get('/settings', settingsController.obterSettings);
  router.put('/settings', settingsController.salvarSettings);
  router.post('/settings/upload-logo', settingsController.uploadLogo);
  router.get('/balanca/exportar-mgv', settingsController.exportarMgv);

  // Dashboard Executivo & KPIs Analíticos
  router.get('/dashboard/overview', dashboardController.obterOverview);

  // White-Label & Personalização de Marca
  router.get('/config/loja', configLojaController.obterConfig);
  router.post('/config/loja', configLojaController.salvarConfig);

  // Regras Operacionais e Políticas de Caixa do PDV
  router.get('/config/operacao', configOperacaoController.obter);
  router.post('/config/operacao', configOperacaoController.salvar);

  // Descoberta de Rede Zero-Config (mDNS)
  router.get('/discovery/status', configLojaController.obterDiscoveryStatus);
  router.post('/discovery/conectar', configLojaController.conectarMasterManual);

  const timeDriftService = new TimeDriftService();
  const licencaRepo = new LicencaRepository();
  const licencaService = new LicencaService(licencaRepo, timeDriftService);
  const licencaController = new LicencaController(licencaService);
  const stripeService = new StripeSubscriptionService(licencaRepo);
  const stripeController = new StripeSubscriptionController(stripeService);
  const usbBackupService = new UsbBackupService();
  usbBackupService.iniciarAgendamentoAutomatico();
  const failoverBackupController = new FailoverBackupController(usbBackupService, zeroConf, configLojaRepo);

  // Módulo de Assinaturas & Pagamento Stripe (Pix e Cartão de Crédito)
  router.post('/assinatura/pix', stripeController.criarPix);
  router.post('/assinatura/confirmar-pix-manual', stripeController.confirmarPixManual);
  router.post('/assinatura/cartao-intent', stripeController.criarIntentCartao);
  router.post('/assinatura/confirmar-cartao-intent', stripeController.confirmarIntentCartao);
  router.post('/assinatura/cartao', stripeController.criarCheckoutCartao);
  router.get('/assinatura/verificar-pix/:id', stripeController.verificarPix);
  router.get('/assinatura/verificar-sessao/:id', stripeController.verificarSessao);
  router.get('/assinatura/historico', stripeController.listarHistorico);
  router.get('/assinatura/cartoes', stripeController.listarCartoes);
  router.post('/assinatura/cartoes', stripeController.cadastrarCartao);
  router.delete('/assinatura/cartoes/:id', stripeController.removerCartao);
  router.put('/assinatura/cartoes/:id/padrao', stripeController.definirCartaoPadrao);
  router.post('/assinatura/pagar-cartao-salvo', stripeController.pagarComCartaoSalvo);
  router.get('/assinatura/stripe/config', stripeController.obterConfig);
  router.get('/assinatura/planos-disponiveis', stripeController.obterPlanosDisponiveis);
  router.post('/assinatura/cancelar-recorrencia', stripeController.cancelarRecorrencia);
  router.post('/licenca/cancelar', stripeController.cancelarRecorrencia);
  router.get('/sistema/update/versao', gitHubUpdateController.obterVersao);
  router.get('/sistema/update/checar', gitHubUpdateController.checarAtualizacao);
  router.post('/sistema/update/baixar', gitHubUpdateController.baixarAtualizacao);
  router.get('/sistema/update/progresso', gitHubUpdateController.obterProgresso);
  router.post('/sistema/update/instalar', gitHubUpdateController.instalarAtualizacao);

  // Módulo de Licenciamento, Motor de Tempo & Trava de Inadimplência
  router.get('/licenca/status', licencaController.obterStatus);
  router.post('/licenca/emergency-override', licencaController.emergencyOverride);
  router.post('/licenca/ativar', licencaController.ativar);
  router.get('/health/time-integrity', (_req, res) => res.json({ success: true, data: timeDriftService.obterStatusIntegridade() }));

  // Painel Master Administrativo Secreto (CTRL + F3)
  const masterService = new MasterAdminService(licencaRepo);
  const masterController = new MasterAdminController(masterService);
  router.post('/master/auth', masterController.login);
  router.post('/master/desbloquear', masterController.desbloquear);
  router.post('/master/bloquear', masterController.bloquear);
  router.post('/master/estender-teste', masterController.concederTeste);
  router.get('/master/status', masterController.obterStatus);

  // Contingência (Failover) & Backup Automático USB
  router.post('/backup/usb-dump', failoverBackupController.executarBackupUsb);
  router.get('/backup/unidades', failoverBackupController.listarUnidades);
  router.post('/failover/promover-master', failoverBackupController.promoverMaster);

  // Autenticação & Autorização de Supervisor / Garçom
  router.post('/auth/autorizar-supervisor', authController.autorizarSupervisor);
  router.post(['/auth/validar-pin-garcom', '/auth/garcom'], authController.validarPinGarcom);
  // Motor de Campanhas e Promoções + Gestão de Usuários e RBAC
  router.use(createCampanhaRouter());
  router.use(createUsuarioRouter());
  // Catálogo & Estoque (Dual SQLite WAL)
  router.get('/produtos/barcode/:codigo', catalogoController.buscarPorCodigoBarras);
  router.route('/produtos').get(catalogoController.pesquisar).post(catalogoController.salvarProduto);
  router.post('/produtos/upload-foto', catalogoController.uploadFoto);
  router.delete('/produtos/:id', catalogoController.excluirProduto);
  router.route('/entidades').get(entidadeController.listar).post(entidadeController.salvar);
  router.route('/financeiro/titulos').get(financeiroController.listar).post(financeiroController.criar);
  router.post('/financeiro/titulos/:id/liquidar', financeiroController.liquidar);
  router.get('/financeiro/totais', financeiroController.totais);
  router.get('/financeiro/dre', financeiroController.dre);
  router.get('/estoque/posicao', estoqueController.obterPosicao);
  router.get('/estoque/movimentos', estoqueController.listarMovimentos);
  router.post('/estoque/ajuste', estoqueController.ajustar);
  router.post('/compras/importar-xml', estoqueController.importarXml);
  router.get('/pcp/fichas/:produtoId', pcpController.obterFicha);
  router.post('/pcp/fichas', pcpController.salvarInsumoFicha);
  router.route('/pcp/ordens').get(pcpController.listarOrdens).post(pcpController.criarOrdem);
  router.post('/pcp/ordens/:id/finalizar', pcpController.finalizarOrdem);
  router.get('/relatorios/resumo-geral', relatorioController.obterResumoGeral);
  router.get('/relatorios/vendas', relatorioController.listarVendas);
  router.get('/relatorios/caixas', relatorioController.listarCaixas); router.get('/relatorios/auditoria', relatorioController.listarAuditoria);

  // Operações de Caixa & Turno
  router.get('/caixa/status', caixaController.obterStatus);
  router.post('/caixa/abrir', caixaController.abrirCaixa); router.post('/caixa/movimentar', caixaController.movimentar); router.post('/caixa/fechar', caixaController.fecharCaixa);

  // Operações de Venda
  router.route('/vendas').get(vendaController.listarUltimas).post(vendaController.finalizarVenda);
  router.post('/vendas/:id/cancelar', vendaController.cancelarVenda);

  // Sincronização Dual SQLite (Cloud <-> Local)
  router.get('/sync/status', syncController.obterStatus);
  router.post('/sync/trigger', syncController.forcarSincronizacao);
  router.post('/sync/receber-catalogo', syncController.receberCargaNuvem);

  // Motor Fiscal & Cupom Térmico ESC/POS
  router.post('/fiscal/emitir/:vendaId', fiscalController.emitirNfce);
  router.get('/fiscal/danfe/:vendaId', fiscalController.obterDanfeCupom);
  router.post('/fiscal/cancelar/:vendaId', fiscalController.cancelarNfce);
  router.post('/fiscal/imprimir-direto/:vendaId', fiscalController.imprimirDireto);
  router.get('/fiscal/contingencias', fiscalController.listarContingencias);
  router.post('/fiscal/contingencia/transmitir', fiscalController.transmitirContingencias);

  router.use('/', createVarejoAvancadoRoutes(estoqueController));
  router.use('/', createFiscalCaixasRouter(zeroConf));
  router.use('/', createNfeDanfeRouter());
  router.use('/', createSuporteRouter());

  return router;
}
