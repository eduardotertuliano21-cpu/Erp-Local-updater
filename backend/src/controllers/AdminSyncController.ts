import { Request, Response } from 'express';
import { CaixaPretaRepository } from '../repositories/CaixaPretaRepository.js';

export class AdminSyncController {
  private repo = new CaixaPretaRepository();

  public obterCaixaPreta = async (req: Request, res: Response): Promise<void> => {
    try {
      const limite = Number(req.query.limite) || 50;
      const erros = this.repo.listarNaoResolvidos(limite);
      res.json({
        success: true,
        total: erros.length,
        erros,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public resolverErro = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const resolvido = this.repo.marcarResolvido(id);
      res.json({
        success: resolvido,
        message: resolvido ? 'Erro resolvido na caixa preta' : 'Registro não localizado'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
