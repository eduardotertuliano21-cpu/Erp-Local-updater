import { Request, Response } from 'express';
import { CaixaPretaRepository } from '../repositories/CaixaPretaRepository.js';
import { AiDiagnosticService } from '../services/AiDiagnosticService.js';

export class CaixaPretaController {
  private repo: CaixaPretaRepository;

  constructor() {
    this.repo = new CaixaPretaRepository();
  }

  public listarNaoResolvidos = async (req: Request, res: Response): Promise<void> => {
    try {
      const limite = Number(req.query.limite) || 50;
      const erros = this.repo.listarNaoResolvidos(limite);
      res.json({ success: true, total: erros.length, erros });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public listarTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const limite = Number(req.query.limite) || 100;
      const erros = this.repo.listarTodos(limite);
      res.json({ success: true, total: erros.length, erros });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public marcarResolvido = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!id) {
        res.status(400).json({ success: false, message: 'ID inválido' });
        return;
      }
      const resolvido = this.repo.marcarResolvido(id);
      res.json({ success: resolvido, message: resolvido ? 'Marcado como resolvido' : 'Não encontrado' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  public diagnosticarManual = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipoEvento, erroOriginal, contexto } = req.body;
      if (!erroOriginal) {
        res.status(400).json({ success: false, message: 'erroOriginal é obrigatório' });
        return;
      }
      const registro = await AiDiagnosticService.analisarERegistrar(
        tipoEvento || 'DIAGNOSTICO_MANUAL',
        erroOriginal,
        contexto
      );
      res.json({ success: true, registro });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
