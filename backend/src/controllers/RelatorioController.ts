import { Request, Response } from 'express';
import { RelatorioService } from '../services/RelatorioService.js';
import { ApiResponse } from '../types/api.js';

export class RelatorioController {
  constructor(private relatorioService: RelatorioService) {}

  public obterResumoGeral = (_req: Request, res: Response): void => {
    try {
      const resumo = this.relatorioService.obterResumoGeral();
      res.json({
        success: true,
        data: resumo,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao carregar resumo gerencial',
      } as ApiResponse);
    }
  };

  public listarVendas = (req: Request, res: Response): void => {
    try {
      const { inicio, fim, tipoFiscal, status, limite } = req.query;
      const vendas = this.relatorioService.listarVendasAnalitico({
        inicio: inicio ? String(inicio) : undefined,
        fim: fim ? String(fim) : undefined,
        tipoFiscal: (tipoFiscal as any) || undefined,
        status: status ? String(status) : undefined,
        limite: Number(limite) || 100,
      });
      res.json({
        success: true,
        data: vendas,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar relatório de vendas',
      } as ApiResponse);
    }
  };

  public listarCaixas = (_req: Request, res: Response): void => {
    try {
      const caixas = this.relatorioService.listarSessoesCaixa();
      res.json({
        success: true,
        data: caixas,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar relatório de caixa',
      } as ApiResponse);
    }
  };

  public listarAuditoria = (_req: Request, res: Response): void => {
    try {
      const logs = this.relatorioService.listarLogsAuditoria();
      res.json({
        success: true,
        data: logs,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao consultar auditoria',
      } as ApiResponse);
    }
  };
}
