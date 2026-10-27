import { Request, Response } from 'express';
import { ConfigOperacaoService } from '../services/ConfigOperacaoService.js';
import { ApiResponse } from '../types/api.js';

export class ConfigOperacaoController {
  constructor(private service: ConfigOperacaoService) {}

  public obter = (_req: Request, res: Response): void => {
    try {
      const config = this.service.obter();
      res.json({ success: true, data: config } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public salvar = (req: Request, res: Response): void => {
    try {
      const config = this.service.salvar(req.body);
      res.json({ success: true, data: config } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
