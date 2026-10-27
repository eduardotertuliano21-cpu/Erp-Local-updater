import { Request, Response } from 'express';
import { FinanceiroService } from '../services/FinanceiroService.js';
import { ApiResponse } from '../types/api.js';

export class FinanceiroController {
  constructor(private financeiroService: FinanceiroService) {}

  public listar = (req: Request, res: Response): void => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const status = req.query.status as string | undefined;
      const titulos = this.financeiroService.listar(tipo, status);
      res.json({ success: true, data: titulos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public criar = (req: Request, res: Response): void => {
    try {
      const titulo = this.financeiroService.criarTitulo(req.body);
      res.status(201).json({ success: true, data: titulo } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public liquidar = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { valorPago, dataPagamento } = req.body;
      this.financeiroService.liquidarTitulo(id, Number(valorPago), dataPagamento);
      res.json({ success: true, data: { liquidado: true } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public totais = (_req: Request, res: Response): void => {
    try {
      const totais = this.financeiroService.obterTotais();
      res.json({ success: true, data: totais } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public dre = (req: Request, res: Response): void => {
    try {
      const mesAno = req.query.periodo as string | undefined;
      const dre = this.financeiroService.obterDRE(mesAno);
      res.json({ success: true, data: dre } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
