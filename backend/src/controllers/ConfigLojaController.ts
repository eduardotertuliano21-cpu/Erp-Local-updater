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

  public obterDiscoveryStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const info = this.zeroConfService.obterInfo();
      let masterConfig: any = null;
      if (info.role === 'SLAVE' && info.masterIp) {
        try {
          const r = await fetch(`http://${info.masterIp}:${info.masterPort || 5000}/api/settings`, {
            signal: AbortSignal.timeout(2000),
          });
          const j = (await r.json()) as any;
          if (j?.success && j?.data?.sistema_configurado) masterConfig = j.data;
        } catch {}
      }
      res.json({ success: true, data: { ...info, masterConfig } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public conectarMasterManual = async (req: Request, res: Response): Promise<void> => {
    try {
      const { masterIp, masterPort } = req.body;
      if (!masterIp) {
        res.status(400).json({ success: false, error: 'IP do Servidor Master é obrigatório.' } as ApiResponse);
        return;
      }
      const cleanIp = String(masterIp).trim().replace(/^https?:\/\//, '').split(':')[0];
      const port = Number(masterPort) || 5000;
      let masterConfig: any = null;
      try {
        const r = await fetch(`http://${cleanIp}:${port}/api/settings`, {
          signal: AbortSignal.timeout(3000),
        });
        const j = (await r.json()) as any;
        if (j?.success && j?.data) masterConfig = j.data;
      } catch {}
      this.zeroConfService.setMasterIpManual(cleanIp, port);
      const dadosSalvar: any = { ...(masterConfig || {}), modo_operacao: 'SLAVE', master_ip: cleanIp };
      if (masterConfig?.sistema_configurado) dadosSalvar.sistema_configurado = 1;
      this.configService.salvarConfig(dadosSalvar);
      res.json({ success: true, data: { ...this.zeroConfService.obterInfo(), masterConfig } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
