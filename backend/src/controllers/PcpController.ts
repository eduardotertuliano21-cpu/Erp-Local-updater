import { Request, Response } from 'express';
import { PcpService } from '../services/PcpService.js';
import { ApiResponse } from '../types/api.js';

export class PcpController {
  constructor(private pcpService: PcpService) {}

  public obterFicha = (req: Request, res: Response): void => {
    try {
      const { produtoId } = req.params;
      const ficha = this.pcpService.obterFicha(produtoId);
      res.json({ success: true, data: ficha } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public salvarInsumoFicha = (req: Request, res: Response): void => {
    try {
      const insumo = this.pcpService.adicionarInsumoFicha(req.body);
      res.status(201).json({ success: true, data: insumo } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public listarOrdens = (_req: Request, res: Response): void => {
    try {
      const ordens = this.pcpService.listarOrdens();
      res.json({ success: true, data: ordens } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public criarOrdem = (req: Request, res: Response): void => {
    try {
      const op = this.pcpService.criarOrdem(req.body);
      res.status(201).json({ success: true, data: op } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public finalizarOrdem = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { quantidadeProduzida, operadorId } = req.body;
      this.pcpService.finalizarOrdem(id, Number(quantidadeProduzida), operadorId);
      res.json({ success: true, data: { finalizada: true } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
