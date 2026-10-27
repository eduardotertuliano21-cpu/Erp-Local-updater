import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService.js';
import { ApiResponse } from '../types/api.js';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  public obterOverview = (req: Request, res: Response): void => {
    try {
      const dataIso = req.query.data as string | undefined;
      const inicio = (req.query.inicio as string | undefined) || dataIso;
      const fim = (req.query.fim as string | undefined) || dataIso;
      const data = this.dashboardService.obterDashboardOverview(inicio, fim);
      res.json({
        success: true,
        data,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao carregar dados do dashboard analítico',
      } as ApiResponse);
    }
  };
}
