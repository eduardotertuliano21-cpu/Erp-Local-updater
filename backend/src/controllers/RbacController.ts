import { Request, Response } from 'express';
import { RbacService } from '../services/RbacService.js';
import { ApiResponse } from '../types/api.js';

export class RbacController {
  private service = new RbacService();

  public obterMatriz = (_req: Request, res: Response): void => {
    try {
      const data = this.service.obterMatriz();
      res.json({ success: true, data } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public atualizarMatriz = (req: Request, res: Response): void => {
    try {
      const { matriz } = req.body;
      if (!Array.isArray(matriz)) {
        res.status(400).json({ success: false, error: 'Matriz deve ser um array de permissões' });
        return;
      }
      this.service.atualizarPermissoes(matriz);
      res.json({ success: true, message: 'Matriz de permissões atualizada com sucesso' } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public alterarModoEstrito = (req: Request, res: Response): void => {
    try {
      const { estrito } = req.body;
      this.service.alterarModoEstrito(Boolean(estrito));
      res.json({
        success: true,
        data: { estrito: Boolean(estrito) },
        message: 'Modo estrito atualizado com sucesso',
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public alterarExigirAutenticacao = (req: Request, res: Response): void => {
    try {
      const { exigir } = req.body;
      const valor = Boolean(exigir);
      this.service.alterarExigirAutenticacao(valor);
      res.json({
        success: true,
        data: { exigirAutenticacao: valor },
        message: valor ? 'Autenticação ativada' : 'Modo Porteira Aberta ativado (Login desativado)',
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public verificarPermissao = (req: Request, res: Response): void => {
    try {
      const { hierarquia, chave } = req.body;
      const permitida = this.service.verificarPermissao(hierarquia, chave);
      res.json({ success: true, data: { permitida } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
