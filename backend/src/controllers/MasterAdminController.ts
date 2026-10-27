import { Request, Response } from 'express';
import { MasterAdminService } from '../services/MasterAdminService.js';
import { ApiResponse } from '../types/api.js';

export class MasterAdminController {
  constructor(private masterService: MasterAdminService) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { usuario, senha } = req.body || {};
      const resultado = await this.masterService.autenticar(usuario, senha);
      if (!resultado.sucesso) {
        res.status(401).json({ success: false, error: resultado.mensagem } as ApiResponse);
        return;
      }
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro interno no acesso master' } as ApiResponse);
    }
  };

  public desbloquear = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['x-master-token'] as string;
      if (!this.masterService.validarToken(token)) {
        res.status(403).json({ success: false, error: 'Acesso não autorizado ao módulo master.' } as ApiResponse);
        return;
      }
      const resultado = await this.masterService.desbloquearSistema();
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao desbloquear sistema' } as ApiResponse);
    }
  };

  public bloquear = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['x-master-token'] as string;
      if (!this.masterService.validarToken(token)) {
        res.status(403).json({ success: false, error: 'Acesso não autorizado ao módulo master.' } as ApiResponse);
        return;
      }
      const resultado = await this.masterService.bloquearSistema();
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao bloquear sistema' } as ApiResponse);
    }
  };

  public concederTeste = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['x-master-token'] as string;
      if (!this.masterService.validarToken(token)) {
        res.status(403).json({ success: false, error: 'Acesso não autorizado ao módulo master.' } as ApiResponse);
        return;
      }
      const { dias } = req.body || {};
      const resultado = this.masterService.concederTesteGratis(Number(dias) || 7);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao conceder teste grátis' } as ApiResponse);
    }
  };

  public obterStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['x-master-token'] as string;
      if (!this.masterService.validarToken(token)) {
        res.status(403).json({ success: false, error: 'Acesso não autorizado ao módulo master.' } as ApiResponse);
        return;
      }
      const status = this.masterService.obterStatusMaster();
      res.json({ success: true, data: status } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao obter status master' } as ApiResponse);
    }
  };
}
