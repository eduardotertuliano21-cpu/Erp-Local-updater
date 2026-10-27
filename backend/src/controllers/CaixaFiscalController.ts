import { Request, Response } from 'express';
import { CaixaFiscalRepository, CaixaFiscal } from '../repositories/CaixaFiscalRepository.js';
import { ZeroConfService } from '../services/ZeroConfService.js';
import { ApiResponse } from '../types/api.js';

export class CaixaFiscalController {
  private repo = new CaixaFiscalRepository();

  constructor(private zeroConfService?: ZeroConfService) {}

  public listarCaixas = (req: Request, res: Response): void => {
    try {
      const localIp = this.zeroConfService ? this.zeroConfService.getLocalIp() : req.socket.remoteAddress;
      const caixas = this.repo.listar();
      const detectou = this.repo.detectouMultiplosComputadores(localIp);

      res.json({
        success: true,
        data: {
          detectouMultiplosTerminais: detectou,
          totalCaixas: caixas.length,
          caixas,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public salvarCaixas = (req: Request, res: Response): void => {
    try {
      const { caixas } = req.body;
      if (!Array.isArray(caixas)) {
        // Suporta envio de objeto único de caixa
        if (req.body.numero_caixa) {
          const salvo = this.repo.salvar(req.body);
          res.json({ success: true, data: { caixas: [salvo] } } as ApiResponse);
          return;
        }
        res.status(400).json({ success: false, error: 'Lista de caixas inválida' } as ApiResponse);
        return;
      }

      const salvos: CaixaFiscal[] = [];
      for (const c of caixas) {
        if (c && c.numero_caixa) {
          salvos.push(this.repo.salvar(c));
        }
      }

      res.json({
        success: true,
        data: {
          caixas: this.repo.listar(),
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public heartbeatTerminal = (req: Request, res: Response): void => {
    try {
      const numCaixa = String(req.body.numeroCaixa || req.headers['x-caixa-terminal'] || '01');
      const apelido = req.body.apelido || req.body.hostname;
      const ip = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');

      this.repo.registrarHeartbeat(numCaixa, ip, apelido);

      res.json({
        success: true,
        data: {
          registrado: true,
          numeroCaixa: numCaixa,
          ip,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
