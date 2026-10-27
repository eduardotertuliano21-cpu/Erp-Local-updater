import { Router } from 'express';
import { ProdutoCodigosRepository } from '../repositories/ProdutoCodigosRepository.js';
import { ProdutoCodigosController } from '../controllers/ProdutoCodigosController.js';
import { TabelaPrecoRepository } from '../repositories/TabelaPrecoRepository.js';
import { TabelaPrecoController } from '../controllers/TabelaPrecoController.js';
import { EstoqueController } from '../controllers/EstoqueController.js';
import { DesossaRepository } from '../repositories/DesossaRepository.js';
import { DesossaService } from '../services/DesossaService.js';
import { DesossaController } from '../controllers/DesossaController.js';

export function createVarejoAvancadoRoutes(estoqueController: EstoqueController): Router {
  const router = Router();

  // 1. Múltiplos Códigos de Barras e Fatores de Conversão (WMS)
  const prodCodRepo = new ProdutoCodigosRepository();
  const prodCodController = new ProdutoCodigosController(prodCodRepo);
  router.get('/produtos/:produtoId/codigos-barras', prodCodController.listarPorProduto);
  router.post('/produtos/:produtoId/codigos-barras', prodCodController.adicionar);
  router.delete('/produtos/codigos-barras/:id', prodCodController.remover);

  // 2. Políticas de Preço Multi-Tabela (B2B / Atacado)
  const tabRepo = new TabelaPrecoRepository();
  const tabController = new TabelaPrecoController(tabRepo);
  router.get('/tabelas-preco', tabController.listar);
  router.post('/tabelas-preco', tabController.criar);
  router.get('/tabelas-preco/:id/precos', tabController.obterPrecos);
  router.post('/tabelas-preco/:id/precos', tabController.salvarPreco);

  // 4. Entrada de Notas em 2 Etapas (G.E.M. Draft Mode)
  router.get('/compras', estoqueController.listarCompras);
  router.post('/compras/:id/efetivar', estoqueController.efetivarCompra);
  router.post('/compras/:id/desatualizar', estoqueController.desatualizarCompra);

  // 5. Rendimento de Desossa (Açougue)
  const desossaRepo = new DesossaRepository();
  const desossaService = new DesossaService(desossaRepo);
  const desossaController = new DesossaController(desossaService);
  router.get('/desossas', desossaController.listar);
  router.get('/desossas/:id', desossaController.obterPorId);
  router.post('/desossas', desossaController.processar);

  return router;
}
