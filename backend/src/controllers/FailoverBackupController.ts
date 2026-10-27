import { Request, Response } from 'express';
import { UsbBackupService } from '../services/UsbBackupService.js';
import { ZeroConfService } from '../services/ZeroConfService.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { ApiResponse } from '../types/api.js';

export class FailoverBackupController {
  constructor(
    private usbBackupService: UsbBackupService,
    private zeroConfService: ZeroConfService,
    private configLojaRepo: ConfigLojaRepository
  ) {}

  public executarBackupUsb = (req: Request, res: Response): void => {
    try {
      const { destino } = req.body || {};
      const resultado = this.usbBackupService.executarBackup(destino);
      res.json({
        success: resultado.sucesso,
        data: resultado,
        error: !resultado.sucesso ? resultado.mensagem : undefined,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public listarUnidades = (_req: Request, res: Response): void => {
    try {
      const unidades = this.usbBackupService.detectarUnidadesRemoviveis();
      res.json({ success: true, data: { unidades } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public promoverMaster = (_req: Request, res: Response): void => {
    try {
      // 1. Atualiza configuração local para MASTER
      this.configLojaRepo.salvar({
        modo_operacao: 'MASTER',
        master_ip: '127.0.0.1',
      });

      // 2. Anuncia este terminal como Master na rede local via mDNS
      this.zeroConfService.promoverMaster();

      res.json({
        success: true,
        data: {
          mensagem: 'Terminal promovido com sucesso para Servidor Master.',
          role: 'MASTER',
          status: this.zeroConfService.obterInfo(),
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
