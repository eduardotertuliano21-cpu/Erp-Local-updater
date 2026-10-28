import { Request, Response } from 'express';
import os from 'node:os';
import QRCode from 'qrcode';
import { MesaRepository } from '../repositories/MesaRepository.js';
import { RestaurantSocketService } from '../services/RestaurantSocketService.js';
import { KdsService } from '../services/KdsService.js';
import { ApiResponse } from '../types/api.js';

export class RestaurantController {
  private kdsService = new KdsService();

  constructor(
    private mesaRepo: MesaRepository,
    private socketService?: RestaurantSocketService
  ) {}

  public setSocketService(service: RestaurantSocketService): void {
    this.socketService = service;
  }

  // Detecta o IP local da máquina na rede Wi-Fi / Ethernet
  private obterIpLocal(): string {
    const interfaces = os.networkInterfaces();
    let ipFallback = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
      const lower = name.toLowerCase();
      if (
        lower.includes('vethernet') ||
        lower.includes('virtual') ||
        lower.includes('wsl') ||
        lower.includes('vmware') ||
        lower.includes('hyper-v') ||
        lower.includes('docker') ||
        lower.includes('tailscale') ||
        lower.includes('zerotier')
      ) {
        continue;
      }
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
            return iface.address;
          }
          ipFallback = iface.address;
        }
      }
    }
    return ipFallback;
  }

  // GET /api/qrcode-mobile
  public obterQrCodeMobile = async (req: Request, res: Response): Promise<void> => {
    try {
      const ip = this.obterIpLocal();
      const porta = (req.query.porta as string) || '5000';
      const tipo = (req.query.tipo as string) || (req.query.kds === '1' ? 'kds' : 'mobile');
      const url = tipo === 'kds' ? `http://${ip}:${porta}/?kds=1` : `http://${ip}:${porta}/?mobile=1`;

      const qrcodeBase64 = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          ip,
          porta,
          url,
          qrcode: qrcodeBase64,
          tipo,
        },
      };
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // GET /api/restaurante/mesas
  public listarMesas = (_req: Request, res: Response): void => {
    try {
      const mesas = this.mesaRepo.listarMesas();
      res.json({ success: true, data: mesas });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // GET /api/restaurante/mesas/:numero
  public obterMesa = (req: Request, res: Response): void => {
    try {
      const numero = parseInt(req.params.numero, 10);
      const mesa = this.mesaRepo.obterMesaPorNumero(numero);
      if (!mesa) {
        res.status(404).json({ success: false, error: 'Mesa não encontrada' });
        return;
      }
      res.json({ success: true, data: mesa });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // POST /api/restaurante/pedido
  public lancarPedido = (req: Request, res: Response): void => {
    try {
      const { mesa_numero, garcom_pin, itens } = req.body;
      if (!mesa_numero || !itens || !Array.isArray(itens) || itens.length === 0) {
        res.status(400).json({ success: false, error: 'Itens ou número da mesa inválidos' });
        return;
      }

      const mesaAtualizada = this.mesaRepo.adicionarPedido(mesa_numero, garcom_pin, itens);
      this.socketService?.broadcastMesa(mesaAtualizada);

      try {
        this.kdsService.criarPedido({
          mesa_numero: Number(mesa_numero),
          origem: 'SALAO',
          observacoes: garcom_pin ? `Garçom PIN: ${garcom_pin}` : undefined,
          itens: itens.map((it: any) => ({
            nome: it.descricao || it.nome || 'Item do Pedido',
            quantidade: Number(it.quantidade || 1),
            observacao: it.observacao,
          })),
        });
      } catch (kdsErr) {
        console.warn('[RestaurantController] Falha não bloqueante ao despachar para KDS:', kdsErr);
      }

      res.json({ success: true, data: mesaAtualizada });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // POST /api/restaurante/liberar
  public liberarMesa = (req: Request, res: Response): void => {
    try {
      const { mesa_numero } = req.body;
      if (!mesa_numero) {
        res.status(400).json({ success: false, error: 'Número da mesa não informado' });
        return;
      }

      const mesaLiberada = this.mesaRepo.liberarMesa(mesa_numero);
      if (mesaLiberada) {
        this.socketService?.broadcastMesa(mesaLiberada);
      }

      res.json({ success: true, data: mesaLiberada });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
