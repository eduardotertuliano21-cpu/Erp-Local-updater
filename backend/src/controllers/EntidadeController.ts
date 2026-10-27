import { Request, Response } from 'express';
import { EntidadeService } from '../services/EntidadeService.js';
import { ApiResponse } from '../types/api.js';

export class EntidadeController {
  constructor(private entidadeService: EntidadeService) {}

  public listar = (req: Request, res: Response): void => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const termo = req.query.q as string | undefined;
      const entidades = this.entidadeService.listar(tipo, termo);
      res.json({ success: true, data: entidades } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public salvar = (req: Request, res: Response): void => {
    try {
      const entidade = this.entidadeService.salvar(req.body);
      res.status(201).json({ success: true, data: entidade } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
