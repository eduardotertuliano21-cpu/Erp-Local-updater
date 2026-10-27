import { Request, Response } from 'express';
import { ProdutoCodigosRepository } from '../repositories/ProdutoCodigosRepository.js';
import { ApiResponse } from '../types/api.js';

export class ProdutoCodigosController {
  constructor(private repo: ProdutoCodigosRepository) {}

  public listarPorProduto = (req: Request, res: Response): void => {
    try {
      const { produtoId } = req.params;
      if (!produtoId) {
        res.status(400).json({ success: false, error: 'ID do produto é obrigatório' });
        return;
      }
      const codigos = this.repo.listarPorProduto(produtoId);
      res.json({ success: true, data: codigos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public adicionar = (req: Request, res: Response): void => {
    try {
      const { produtoId } = req.params;
      const { codigo_barras, unidade_medida, fator_entrada, fator_saida } = req.body;
      if (!produtoId || !codigo_barras) {
        res.status(400).json({ success: false, error: 'Produto e código de barras são obrigatórios' });
        return;
      }
      const item = this.repo.adicionar({
        produto_id: produtoId,
        codigo_barras,
        unidade_medida,
        fator_entrada,
        fator_saida,
      });
      res.status(201).json({ success: true, data: item } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public remover = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const removido = this.repo.remover(id);
      res.json({ success: true, data: { removido, id } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
