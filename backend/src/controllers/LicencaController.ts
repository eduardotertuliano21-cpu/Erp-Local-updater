import { Request, Response } from 'express';
import { LicencaService } from '../services/LicencaService.js';
import { ApiResponse } from '../types/api.js';

export class LicencaController {
  constructor(private licencaService: LicencaService) {}

  public obterStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.licencaService.sincronizarComNuvem();
      res.json({ success: true, data: status } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public emergencyOverride = (req: Request, res: Response): void => {
    try {
      const { senhaMestre } = req.body;
      const resultado = this.licencaService.aplicarEmergencyOverride(senhaMestre);
      if (!resultado.sucesso) {
        res.status(401).json({ success: false, error: resultado.erro } as ApiResponse);
        return;
      }
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public ativar = (req: Request, res: Response): void => {
    try {
      const { chave, dataVencimento } = req.body;
      const resultado = this.licencaService.ativarLicenca(chave, dataVencimento);
      if (!resultado.sucesso) {
        res.status(400).json({ success: false, error: resultado.erro } as ApiResponse);
        return;
      }
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
