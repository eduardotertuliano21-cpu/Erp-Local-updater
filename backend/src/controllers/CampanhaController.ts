import { Request, Response } from 'express';
import { CampanhaRepository } from '../repositories/CampanhaRepository.js';
import { ApiResponse } from '../types/api.js';

export class CampanhaController {
  constructor(private campanhaRepo: CampanhaRepository) {}

  public listar = (_req: Request, res: Response): void => {
    try {
      const campanhas = this.campanhaRepo.listar();
      res.json({ success: true, data: campanhas } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public obter = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const campanha = this.campanhaRepo.buscarPorId(id);
      if (!campanha) {
        res.status(404).json({ success: false, error: 'Campanha não encontrada' });
        return;
      }
      res.json({ success: true, data: campanha } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public salvar = (req: Request, res: Response): void => {
    try {
      const dados = req.body;
      if (!dados.nome_campanha || dados.valor_desconto === undefined) {
        res.status(400).json({ success: false, error: 'Nome da campanha e valor do desconto são obrigatórios' });
        return;
      }
      const campanha = this.campanhaRepo.salvar(dados);
      res.status(201).json({ success: true, data: campanha } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public excluir = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const ok = this.campanhaRepo.excluir(id);
      res.json({ success: ok, data: { id, excluido: ok } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public vincularProdutos = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { produto_ids } = req.body;
      if (!Array.isArray(produto_ids)) {
        res.status(400).json({ success: false, error: 'produto_ids deve ser uma lista de IDs' });
        return;
      }
      this.campanhaRepo.vincularProdutos(id, produto_ids);
      res.json({ success: true, data: { campanha_id: id, count: produto_ids.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public desvincularProdutos = (req: Request, res: Response): void => {
    try {
      const { produto_ids } = req.body;
      if (!Array.isArray(produto_ids)) {
        res.status(400).json({ success: false, error: 'produto_ids deve ser uma lista de IDs' });
        return;
      }
      this.campanhaRepo.desvincularProdutos(produto_ids);
      res.json({ success: true, data: { count: produto_ids.length } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public listarProdutos = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const produtos = this.campanhaRepo.listarProdutosCampanha(id);
      res.json({ success: true, data: produtos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
