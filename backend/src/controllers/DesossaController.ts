import { Request, Response } from 'express';
import { DesossaService } from '../services/DesossaService.js';
import { ApiResponse } from '../types/api.js';

export class DesossaController {
  constructor(private service: DesossaService) {}

  public listar = (req: Request, res: Response): void => {
    try {
      const limite = parseInt(req.query.limite as string) || 50;
      const desossas = this.service.listar(limite);
      res.json({ success: true, data: desossas } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public obterPorId = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const desossa = this.service.obterPorId(id);
      if (!desossa) {
        res.status(404).json({ success: false, error: 'Registro de desossa não encontrado' });
        return;
      }
      res.json({ success: true, data: desossa } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public processar = (req: Request, res: Response): void => {
    try {
      const resultado = this.service.processarDesossa(req.body);
      res.status(201).json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
