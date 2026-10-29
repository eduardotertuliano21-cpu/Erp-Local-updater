import { Request, Response } from 'express';
import { AuditoriaRepository } from '../repositories/AuditoriaRepository.js';
import { CurvaAbcService } from '../services/CurvaAbcService.js';
import { TefLocalService } from '../services/TefLocalService.js';
import { EtiquetaGeneratorService } from '../services/EtiquetaGeneratorService.js';
import { KdsService } from '../services/KdsService.js';
import { VeiculoClienteRepository } from '../repositories/VeiculoClienteRepository.js';
import { ApiResponse } from '../types/api.js';
import { RestaurantSocketService } from '../services/RestaurantSocketService.js';

export class EnterpriseController {
  private auditoriaRepo = new AuditoriaRepository();
  private curvaAbcService = new CurvaAbcService();
  private tefService = new TefLocalService();
  private etiquetaService = new EtiquetaGeneratorService();
  private kdsService = new KdsService();
  private veiculoRepo = new VeiculoClienteRepository();

  // 1. Auditoria
  public listarAuditoria = (req: Request, res: Response): void => {
    try {
      const limite = Number(req.query.limite) || 100;
      const acao = (req.query.acao as string) || undefined;
      const logs = this.auditoriaRepo.listar(limite, acao);
      res.json({ success: true, data: logs } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 2. Curva ABC
  public obterCurvaAbc = (req: Request, res: Response): void => {
    try {
      const inicio = (req.query.inicio as string) || undefined;
      const fim = (req.query.fim as string) || undefined;
      const resultado = this.curvaAbcService.calcular(inicio, fim);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 3. TEF Local
  public iniciarTef = (req: Request, res: Response): void => {
    try {
      const { valor, tipo_cartao, venda_id } = req.body;
      if (!valor || !tipo_cartao) {
        res.status(400).json({ success: false, error: 'Valor e tipo_cartao são obrigatórios' });
        return;
      }
      const transacao = this.tefService.iniciarSolicitacao({
        valor: Number(valor),
        tipo_cartao,
        venda_id,
        operador_id: (req.headers['x-user-id'] as string) || 'OPERADOR',
      });
      res.status(201).json({ success: true, data: transacao } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public verificarTef = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const status = this.tefService.verificarResposta(id);
      res.json({ success: true, data: status } as ApiResponse);
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  public confirmarTef = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      this.tefService.confirmarTransacao(id);
      res.json({ success: true, data: { confirmado: true, id } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 4. Etiquetas
  public gerarEtiquetas = (req: Request, res: Response): void => {
    try {
      const { itens, formato = 'GONDOLA', linguagem = 'ZPL' } = req.body;
      if (!itens || !Array.isArray(itens)) {
        res.status(400).json({ success: false, error: 'Array itens é obrigatório' });
        return;
      }
      const comandos = this.etiquetaService.gerarComandos(itens, formato, linguagem);
      res.json({ success: true, data: { comandos, formato, linguagem, total: itens.length } } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  // 5. KDS Monitor (Cozinha & Produção)
  public listarKds = (_req: Request, res: Response): void => {
    try {
      const pedidos = this.kdsService.listarAtivos();
      res.json({ success: true, data: pedidos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public listarKdsProntos = (_req: Request, res: Response): void => {
    try {
      const pedidos = this.kdsService.listarProntos();
      res.json({ success: true, data: pedidos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public criarPedidoKds = (req: Request, res: Response): void => {
    try {
      const pedido = this.kdsService.criarPedido(req.body);
      RestaurantSocketService.getInstance()?.broadcastKdsLista();
      res.status(201).json({ success: true, data: pedido } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public avancarStatusKds = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const atualizado = this.kdsService.avancarStatus(id);
      RestaurantSocketService.getInstance()?.broadcastKdsStatus(atualizado);
      res.json({ success: true, data: atualizado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public marcarProntoKds = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const atualizado = this.kdsService.marcarPronto(id);
      RestaurantSocketService.getInstance()?.broadcastKdsStatus(atualizado);
      res.json({ success: true, data: atualizado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public marcarEntregueKds = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const atualizado = this.kdsService.marcarEntregue(id);
      RestaurantSocketService.getInstance()?.broadcastKdsStatus(atualizado);
      res.json({ success: true, data: atualizado } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  // 6. Veículos (Autopeças)
  public listarVeiculosCliente = (req: Request, res: Response): void => {
    try {
      const { clienteId } = req.params;
      const veiculos = this.veiculoRepo.listarPorCliente(clienteId);
      res.json({ success: true, data: veiculos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public buscarVeiculoPlaca = (req: Request, res: Response): void => {
    try {
      const { placa } = req.params;
      const veiculo = this.veiculoRepo.buscarPorPlaca(placa);
      res.json({ success: true, data: veiculo } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public salvarVeiculo = (req: Request, res: Response): void => {
    try {
      const veiculo = this.veiculoRepo.salvarVeiculo(req.body);
      res.status(201).json({ success: true, data: veiculo } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public atualizarKmVeiculo = (req: Request, res: Response): void => {
    try {
      const { placa } = req.params;
      const { km } = req.body;
      this.veiculoRepo.atualizarKm(placa, Number(km || 0));
      res.json({ success: true, data: { placa, km } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
