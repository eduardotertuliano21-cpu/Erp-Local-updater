import { Request, Response } from 'express';
import { EstoqueService } from '../services/EstoqueService.js';
import { XmlNfeImportService } from '../services/XmlNfeImportService.js';
import { ApiResponse } from '../types/api.js';

export class EstoqueController {
  constructor(
    private estoqueService: EstoqueService,
    private xmlNfeService: XmlNfeImportService
  ) {}

  public obterPosicao = (req: Request, res: Response): void => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const posicao = this.estoqueService.obterPosicaoEstoque(limit, offset);
      res.json({ success: true, data: posicao, pagination: { limit, offset, count: posicao.length } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public listarMovimentos = (req: Request, res: Response): void => {
    try {
      const produtoId = req.query.produtoId as string | undefined;
      const movs = this.estoqueService.listarMovimentos(produtoId);
      res.json({ success: true, data: movs } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public ajustar = (req: Request, res: Response): void => {
    try {
      const mov = this.estoqueService.registrarAjuste(req.body);
      res.status(201).json({ success: true, data: mov } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public importarXml = (req: Request, res: Response): void => {
    try {
      const { xml } = req.body;
      if (!xml) {
        res.status(400).json({ success: false, error: 'XML não fornecido' } as ApiResponse);
        return;
      }
      const resultado = this.xmlNfeService.importarXml(xml);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public listarCompras = (_req: Request, res: Response): void => {
    try {
      const compras = this.xmlNfeService.listarEntradas();
      res.json({ success: true, data: compras } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public efetivarCompra = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { itensAjustados } = req.body;
      const resultado = this.xmlNfeService.efetivarEntrada(id, itensAjustados);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public desatualizarCompra = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const resultado = this.xmlNfeService.desatualizarEntrada(id);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
