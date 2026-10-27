import { Request, Response } from 'express';
import { CatalogoService } from '../services/CatalogoService.js';
import { BalancaParserService } from '../services/BalancaParserService.js';
import { CatalogoSyncRepository } from '../repositories/CatalogoSyncRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import fs from 'node:fs';
import path from 'node:path';
import { IMAGENS_DIR, DatabaseConnection } from '../config/database.js';
import { EstoqueRepository } from '../repositories/EstoqueRepository.js';
import { ApiResponse, Produto } from '../types/api.js';
import { AuditoriaRepository } from '../repositories/AuditoriaRepository.js';
import crypto from 'node:crypto';

export class CatalogoController {
  private auditoriaRepo = new AuditoriaRepository();
  constructor(
    private catalogoService: CatalogoService,
    private balancaParser?: BalancaParserService,
    private catalogoSyncRepo?: CatalogoSyncRepository,
    private estoqueRepo?: EstoqueRepository,
    private configLojaRepo?: ConfigLojaRepository
  ) {}

  private obterRamoAtuacao(req: Request): string {
    const fromQuery = (req.query.ramo as string) || (req.headers['x-ramo-atuacao'] as string);
    if (fromQuery && (fromQuery === 'varejo' || fromQuery === 'restaurante' || fromQuery === 'ambos' || fromQuery === 'todos')) {
      return fromQuery;
    }
    if (this.configLojaRepo) {
      const cfg = this.configLojaRepo.obter();
      if (cfg.ramo_atuacao) return cfg.ramo_atuacao;
      const seg = (cfg.segmento || '').toUpperCase();
      if (seg === 'RESTAURANTE' || seg === 'FOOD') return 'restaurante';
    }
    return 'varejo';
  }

  public buscarPorCodigoBarras = (req: Request, res: Response): void => {
    try {
      const { codigo } = req.params;

      // 1. Tenta decodificar como código de balança EAN-13 iniciado em '2'
      if (this.balancaParser && codigo.length === 13 && codigo.startsWith('2')) {
        const decodificado = this.balancaParser.decodificar(codigo);
        if (decodificado.isCodigoBalanca && decodificado.produto) {
          const saldo = this.estoqueRepo ? this.estoqueRepo.obterSaldoProduto(decodificado.produto.id) : 0;
          res.json({
            success: true,
            data: {
              ...decodificado.produto,
              estoque_atual: saldo,
              quantidadeSugerida: decodificado.quantidade,
              valorTotalBalanca: decodificado.valorTotal,
              isItemBalanca: true,
            },
          } as ApiResponse);
          return;
        }
      }

      // 2. Busca convencional no banco físico ativo
      const produto = this.catalogoService.buscarPorCodigoBarras(codigo, 'todos');

      if (!produto) {
        res.status(404).json({
          success: false,
          error: 'Produto não encontrado na base de dados ativa',
        } as ApiResponse);
        return;
      }

      const estoqueAtual = this.estoqueRepo ? this.estoqueRepo.obterSaldoProduto(produto.id) : 0;
      res.json({
        success: true,
        data: {
          ...produto,
          estoque_atual: estoqueAtual,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro interno ao buscar produto',
      } as ApiResponse);
    }
  };

  public pesquisar = (req: Request, res: Response): void => {
    try {
      const termo = (req.query.q as string) || '';
      const ramoSolicitado = (req.query.ramo as string) || (req.headers['x-ramo-atuacao'] as string);
      const isRetaguarda = req.query.context === 'admin' || req.query.context === 'erp';
      const defaultLimit = termo.trim() && !isRetaguarda ? 10 : 50;
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || defaultLimit, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      let produtos = this.catalogoService.pesquisarProdutos(termo, 'todos', limit, offset);

      if (produtos.length === 0 && (ramoSolicitado === 'restaurante' || req.query.context === 'restaurante')) {
        try {
          const fallbackDb = DatabaseConnection.getReadOnlyDb('mercado');
          const rows = fallbackDb.prepare(`
            SELECT * FROM produtos WHERE (tipo_pdv = 'RESTAURANTE' OR ramo_atuacao = 'restaurante' OR categoria = 'PRATOS' OR 1=1) AND ativo = 1 LIMIT ? OFFSET ?
          `).all(limit, offset) as any[];
          if (rows.length > 0) produtos = rows as Produto[];
        } catch {}
      }

      const produtosComEstoque = produtos.map((p) => ({
        ...p,
        estoque_atual: this.estoqueRepo ? this.estoqueRepo.obterSaldoProduto(p.id) : 0,
      }));

      res.json({
        success: true,
        data: produtosComEstoque,
        pagination: { limit, offset, count: produtosComEstoque.length },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao pesquisar produtos',
      } as ApiResponse);
    }
  };

  public salvarProduto = (req: Request, res: Response): void => {
    try {
      const p = req.body;
      if (!p.codigo_barras || !p.descricao || p.preco_venda === undefined) {
        res.status(400).json({
          success: false,
          error: 'Código de barras, descrição e preço de venda são obrigatórios',
        } as ApiResponse);
        return;
      }

      const isRestaurante = p.tipo_pdv === 'RESTAURANTE' || p.categoria === 'PRATOS' || req.headers['x-ramo-atuacao'] === 'restaurante' || req.query.ramo === 'restaurante';
      const tipoPdv = isRestaurante ? 'RESTAURANTE' : (p.tipo_pdv || 'VAREJO');
      const ramoAtuacao = p.ramo_atuacao || (isRestaurante ? 'restaurante' : 'varejo');

      const produto: Produto = {
        id: p.id || crypto.randomUUID(),
        codigo_barras: String(p.codigo_barras).trim(),
        sku: p.sku ? String(p.sku).trim() : undefined,
        descricao: String(p.descricao).toUpperCase().trim(),
        categoria: p.categoria ? String(p.categoria).trim() : 'GERAL',
        tipo_pdv: tipoPdv,
        ramo_atuacao: ramoAtuacao,
        preco_venda: Number(p.preco_venda),
        unidade_medida: String(p.unidade_medida || 'UN').toUpperCase().trim(),
        ncm: p.ncm ? String(p.ncm).trim() : '00000000',
        cfop: p.cfop ? String(p.cfop).trim() : '5102',
        aliquota_icms: Number(p.aliquota_icms || 0),
        cest: p.cest ? String(p.cest).trim() : undefined,
        cst_csosn: p.cst_csosn ? String(p.cst_csosn).trim() : '102',
        origem: p.origem !== undefined ? Number(p.origem) : 0,
        aliquota_pis: Number(p.aliquota_pis || 0),
        aliquota_cofins: Number(p.aliquota_cofins || 0),
        ativo: p.ativo !== undefined ? Number(p.ativo) : 1,
        foto: p.foto ? String(p.foto).trim() : undefined,
        tamanho: p.tamanho ? String(p.tamanho).trim() : null,
        cor: p.cor ? String(p.cor).trim() : null,
        marca: p.marca ? String(p.marca).trim() : null,
        modelo: p.modelo ? String(p.modelo).trim() : null,
        pesavel: p.pesavel || p.is_pesavel_etiqueta ? 1 : 0,
        codigo_balanca: p.codigo_balanca ? String(p.codigo_balanca).trim() : (p.plu_balanca ? String(p.plu_balanca) : null),
        validade_balanca: p.validade_balanca !== undefined ? Number(p.validade_balanca) : 5,
        is_pesavel_checkout: p.is_pesavel_checkout ? 1 : 0,
        is_pesavel_etiqueta: p.is_pesavel_etiqueta !== undefined ? (p.is_pesavel_etiqueta ? 1 : 0) : (p.pesavel ? 1 : 0),
        plu_balanca: p.plu_balanca !== undefined ? Number(p.plu_balanca) : (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) || null : null),
        atualizado_em: new Date().toISOString(),
      };

      let produtoAnterior: any = null;
      if (p.id) {
        try {
          const anterior = this.catalogoService.pesquisarProdutos(p.codigo_barras || '', 'todos');
          produtoAnterior = anterior.find((x) => x.id === p.id) || null;
        } catch {}
      }

      if (!this.catalogoSyncRepo) {
        this.catalogoSyncRepo = new CatalogoSyncRepository();
      }

      this.catalogoSyncRepo.aplicarLoteProdutos([produto]);

      if (produtoAnterior && Number(produtoAnterior.preco_venda) !== Number(p.preco_venda)) {
        try {
          this.auditoriaRepo.registrar({
            usuario_id: (req.headers['x-user-id'] as string) || 'OPERADOR',
            acao: 'ALTERACAO_PRECO',
            motivo: 'Atualização de preço no catálogo',
            detalhes: JSON.stringify({
              produto_id: produto.id,
              descricao: produto.descricao,
              preco_anterior: produtoAnterior.preco_venda,
              preco_novo: produto.preco_venda,
            }),
          });
        } catch {}
      }

      res.status(201).json({
        success: true,
        data: produto,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao salvar produto',
      } as ApiResponse);
    }
  };

  public uploadFoto = (req: Request, res: Response): void => {
    try {
      const { imagemBase64 } = req.body || {};
      if (!imagemBase64) {
        res.status(400).json({ success: false, error: 'Imagem em formato base64 é obrigatória' });
        return;
      }

      const match = imagemBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      const ext = match ? match[1].replace('jpeg', 'jpg') : 'jpg';
      const base64Data = match ? match[2] : imagemBase64;
      const buffer = Buffer.from(base64Data, 'base64');

      const nomeArquivo = `foto_${Date.now()}_${crypto.randomUUID().slice(0, 6)}.${ext}`;
      const caminhoDestino = path.join(IMAGENS_DIR, nomeArquivo);

      fs.writeFileSync(caminhoDestino, buffer);

      res.status(201).json({
        success: true,
        data: {
          nomeArquivo,
          url: `/imagens/${nomeArquivo}`,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao salvar foto no disco' });
    }
  };

  public excluirProduto = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID do produto é obrigatório' });
        return;
      }

      if (!this.catalogoSyncRepo) {
        this.catalogoSyncRepo = new CatalogoSyncRepository();
      }

      const excluido = this.catalogoSyncRepo.excluirProduto(id);

      try {
        this.auditoriaRepo.registrar({
          usuario_id: (req.headers['x-user-id'] as string) || 'OPERADOR',
          acao: 'EXCLUSAO_CADASTRO',
          motivo: 'Exclusão física de produto no catálogo',
          detalhes: JSON.stringify({ produto_id: id }),
        });
      } catch {}

      res.json({ success: true, data: { excluido, id } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
