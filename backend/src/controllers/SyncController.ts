import { Request, Response } from 'express';
import { SyncOrchestrator } from '../services/SyncOrchestrator.js';
import { DownsyncService } from '../services/DownsyncService.js';
import { ApiResponse, Produto } from '../types/api.js';

export class SyncController {
  constructor(
    private syncOrchestrator: SyncOrchestrator,
    private downsyncService: DownsyncService
  ) {}

  public obterStatus = (_req: Request, res: Response): void => {
    try {
      const status = this.syncOrchestrator.obterStatus();
      const response: ApiResponse = {
        success: true,
        data: status,
      };
      res.json(response);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar status de sincronização',
      } as ApiResponse);
    }
  };

  public forcarSincronizacao = async (_req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.syncOrchestrator.rodarCicloSincronizacao();
      const response: ApiResponse = {
        success: true,
        data: status,
      };
      res.json(response);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao executar ciclo de sincronização',
      } as ApiResponse);
    }
  };

  public receberCargaNuvem = async (req: Request, res: Response): Promise<void> => {
    try {
      const produtos: Produto[] = Array.isArray(req.body) ? req.body : req.body.produtos;

      if (!produtos || !Array.isArray(produtos)) {
        res.status(400).json({
          success: false,
          error: 'Formato inválido. Envie um array de produtos',
        } as ApiResponse);
        return;
      }

      const resultado = await this.downsyncService.executarDownsync(produtos);

      const response: ApiResponse = {
        success: true,
        data: resultado,
      };
      res.json(response);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao aplicar carga de catálogo da nuvem',
      } as ApiResponse);
    }
  };
}
