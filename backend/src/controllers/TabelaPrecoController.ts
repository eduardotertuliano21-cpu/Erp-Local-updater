import { Request, Response } from 'express';
import { TabelaPrecoRepository } from '../repositories/TabelaPrecoRepository.js';
import { ApiResponse } from '../types/api.js';

export class TabelaPrecoController {
  constructor(private repo: TabelaPrecoRepository) {}

  public listar = (_req: Request, res: Response): void => {
    try {
      const tabelas = this.repo.listar();
      res.json({ success: true, data: tabelas } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public criar = (req: Request, res: Response): void => {
    try {
      const { descricao } = req.body;
      if (!descricao) {
        res.status(400).json({ success: false, error: 'Descrição da tabela de preços é obrigatória' });
        return;
      }
      const tabela = this.repo.criar(descricao);
      res.status(201).json({ success: true, data: tabela } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public obterPrecos = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const precos = this.repo.listarPrecosPorTabela(id);
      res.json({ success: true, data: precos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public salvarPreco = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { produto_id, preco_venda } = req.body;
      if (!produto_id || preco_venda === undefined) {
        res.status(400).json({ success: false, error: 'produto_id e preco_venda são obrigatórios' });
        return;
      }
      this.repo.salvarPrecoDiferenciado(id, produto_id, Number(preco_venda));
      res.json({ success: true, data: { tabela_preco_id: id, produto_id, preco_venda } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
