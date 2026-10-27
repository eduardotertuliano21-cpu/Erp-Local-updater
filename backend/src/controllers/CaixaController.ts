import { Request, Response } from 'express';
import { CaixaService } from '../services/CaixaService.js';
import { ApiResponse } from '../types/api.js';
import { AuditoriaRepository } from '../repositories/AuditoriaRepository.js';

export class CaixaController {
  private auditoriaRepo = new AuditoriaRepository();
  constructor(private caixaService: CaixaService) {}

  public obterStatus = (req: Request, res: Response): void => {
    try {
      const status = this.caixaService.obterStatusAtual();
      const response: ApiResponse = {
        success: true,
        data: status,
      };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = {
        success: false,
        error: err.message || 'Erro ao consultar status do caixa',
      };
      res.status(500).json(response);
    }
  };

  public abrirCaixa = (req: Request, res: Response): void => {
    try {
      const { numero, operador, saldoInicial } = req.body;
      if (!numero || !operador || saldoInicial === undefined) {
        res.status(400).json({
          success: false,
          error: 'Parâmetros incompletos: numero, operador e saldoInicial são obrigatórios',
        } as ApiResponse);
        return;
      }

      const novoCaixa = this.caixaService.abrirCaixa(
        Number(numero),
        String(operador),
        Number(saldoInicial)
      );

      res.status(201).json({
        success: true,
        data: novoCaixa,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao abrir caixa',
      } as ApiResponse);
    }
  };

  public movimentar = (req: Request, res: Response): void => {
    try {
      const { caixaId, operadorId, tipo, valor, motivo } = req.body;
      if (!caixaId || !operadorId || !tipo || valor === undefined) {
        res.status(400).json({
          success: false,
          error: 'Parâmetros incompletos para movimentação de caixa',
        } as ApiResponse);
        return;
      }

      const mov = this.caixaService.registrarMovimentacao(
        caixaId,
        operadorId,
        tipo,
        Number(valor),
        motivo
      );

      try {
        this.auditoriaRepo.registrar({
          usuario_id: operadorId,
          acao: tipo === 'SANGRIA' ? 'SANGRIA_CAIXA' : 'SUPRIMENTO_CAIXA',
          motivo: motivo || 'Movimentação manual de caixa',
          detalhes: JSON.stringify({ caixaId, tipo, valor: Number(valor) }),
        });
      } catch {}

      res.json({
        success: true,
        data: mov,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao movimentar caixa',
      } as ApiResponse);
    }
  };

  public fecharCaixa = (req: Request, res: Response): void => {
    try {
      const { caixaId, saldoFinal, operadorId } = req.body;
      if (!caixaId || saldoFinal === undefined || !operadorId) {
        res.status(400).json({
          success: false,
          error: 'Parâmetros incompletos: caixaId, saldoFinal e operadorId são obrigatórios',
        } as ApiResponse);
        return;
      }

      this.caixaService.fecharCaixa(caixaId, Number(saldoFinal), String(operadorId));

      try {
        this.auditoriaRepo.registrar({
          usuario_id: operadorId,
          acao: 'FECHAMENTO_CAIXA',
          motivo: 'Encerramento de turno/caixa',
          detalhes: JSON.stringify({ caixaId, saldoFinal: Number(saldoFinal), numero_caixa_fisico: req.body.numero_caixa_fisico || req.headers['x-caixa-terminal'] || '01' }),
        });
      } catch {}

      res.json({
        success: true,
        data: { fechado: true, caixaId },
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao fechar caixa',
      } as ApiResponse);
    }
  };
}
