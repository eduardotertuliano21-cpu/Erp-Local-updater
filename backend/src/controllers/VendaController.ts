import { Request, Response } from 'express';
import { VendaService } from '../services/VendaService.js';
import { ApiResponse } from '../types/api.js';
import { AuditoriaRepository } from '../repositories/AuditoriaRepository.js';

export class VendaController {
  private auditoriaRepo = new AuditoriaRepository();
  constructor(private vendaService: VendaService) {}

  public finalizarVenda = (req: Request, res: Response): void => {
    try {
      const payload = req.body;
      if (!payload.numero_caixa_fisico && req.headers['x-caixa-terminal']) {
        payload.numero_caixa_fisico = String(req.headers['x-caixa-terminal']);
      }
      const venda = this.vendaService.finalizarVenda(payload);

      res.status(201).json({
        success: true,
        data: venda,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Falha ao processar venda',
      } as ApiResponse);
    }
  };

  public cancelarVenda = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { motivo, operadorId } = req.body;

      if (!motivo || !operadorId) {
        res.status(400).json({
          success: false,
          error: 'Motivo e operadorId são obrigatórios para cancelamento',
        } as ApiResponse);
        return;
      }

      this.vendaService.cancelarVenda(id, motivo, operadorId);

      try {
        this.auditoriaRepo.registrar({
          usuario_id: operadorId,
          acao: 'CANCELAMENTO_VENDA',
          motivo,
          detalhes: JSON.stringify({ vendaId: id, status: 'CANCELADA' }),
        });
      } catch (err) {
        console.warn('[Auditoria] Falha ao gravar log de cancelamento:', err);
      }

      res.json({
        success: true,
        data: { cancelada: true, vendaId: id },
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao cancelar venda',
      } as ApiResponse);
    }
  };

  public listarUltimas = (req: Request, res: Response): void => {
    try {
      const limite = Number(req.query.limite) || 15;
      const vendas = this.vendaService.listarUltimasVendas(limite);

      res.json({
        success: true,
        data: vendas,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar vendas',
      } as ApiResponse);
    }
  };
}
