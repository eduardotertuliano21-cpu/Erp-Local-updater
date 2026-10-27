import { Request, Response } from 'express';
import { ConfigLojaService } from '../services/ConfigLojaService.js';
import { ZeroConfService } from '../services/ZeroConfService.js';
import { ApiResponse } from '../types/api.js';

export class ConfigLojaController {
  constructor(
    private configService: ConfigLojaService,
    private zeroConfService: ZeroConfService
  ) {}

  public obterConfig = (_req: Request, res: Response): void => {
    try {
      const config = this.configService.obterConfig();
      res.json({ success: true, data: config } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public salvarConfig = (req: Request, res: Response): void => {
    try {
      const config = this.configService.salvarConfig(req.body);
      res.json({ success: true, data: config } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public obterDiscoveryStatus = (_req: Request, res: Response): void => {
    try {
      const info = this.zeroConfService.obterInfo();
      res.json({ success: true, data: info } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public conectarMasterManual = (req: Request, res: Response): void => {
    try {
      const { masterIp, masterPort } = req.body;
      if (!masterIp) {
        res.status(400).json({ success: false, error: 'IP do Servidor Master é obrigatório.' } as ApiResponse);
        return;
      }
      this.zeroConfService.setMasterIpManual(masterIp, Number(masterPort) || 5000);
      this.configService.salvarConfig({ modo_operacao: 'SLAVE', master_ip: masterIp });
      res.json({ success: true, data: this.zeroConfService.obterInfo() } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
