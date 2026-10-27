import http from 'node:http';
import { createApp } from './app.js';
import { getCatalogoReadOnlyDb, getOperacaoDb, DATA_DIR } from './config/database.js';
import { reconciliarAdminGlobal } from './config/reconcileAuth.js';
import { ZeroConfService } from './services/ZeroConfService.js';
import { MesaRepository } from './repositories/MesaRepository.js';
import { RestaurantController } from './controllers/RestaurantController.js';
import { RestaurantSocketService } from './services/RestaurantSocketService.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

async function startServer() {
  // Reconcilia administradores e schemas entre todos os bancos físicos locais
  reconciliarAdminGlobal(DATA_DIR);

  // Inicializa conexões Dual SQLite
  getCatalogoReadOnlyDb();
  getOperacaoDb();

  // Inicializa descoberta mDNS (ZeroConf)
  const zeroConf = new ZeroConfService(PORT);
  console.log('🔍 [ZeroConf] Buscando servidores Master na rede local (3s)...');
  const discovery = await zeroConf.iniciarDescoberta(3000);
  console.log(`🌐 [ZeroConf] Papel assumido: ${discovery.role} | Master IP: ${discovery.masterIp}`);

  // Módulo de Restaurante & WebSockets
  const mesaRepo = new MesaRepository();
  const restaurantController = new RestaurantController(mesaRepo);
  const app = createApp(zeroConf, restaurantController);
  const httpServer = http.createServer(app);

  const socketService = new RestaurantSocketService(httpServer, mesaRepo);
  restaurantController.setSocketService(socketService);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`⚡ ClickStorm Backend Local-First ONLINE`);
    console.log(`📡 Porta: http://localhost:${PORT}`);
    console.log(`🏷️  Modo de Rede: ${discovery.role}`);
    console.log(`🗄️  Dual SQLite Ativo`);
    console.log(`🍕 Módulo Restaurante & WebSockets Ativos`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar ClickStorm Backend:', err);
  process.exit(1);
});
