import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MesaRepository, Mesa } from '../repositories/MesaRepository.js';
import { KdsService, KdsPedidoRecord } from './KdsService.js';

export interface NovoPedidoPayload {
  mesa_numero: number;
  garcom_pin?: string;
  itens: {
    produto_id?: string;
    descricao: string;
    preco_unitario: number;
    quantidade: number;
    observacao?: string;
  }[];
}

export class RestaurantSocketService {
  private static instance: RestaurantSocketService | null = null;
  private io: SocketIOServer;
  private mesaRepo: MesaRepository;
  private kdsService: KdsService;

  public static getInstance(): RestaurantSocketService | null {
    return RestaurantSocketService.instance;
  }

  constructor(server: HttpServer, mesaRepo: MesaRepository, kdsService?: KdsService) {
    RestaurantSocketService.instance = this;
    this.mesaRepo = mesaRepo;
    this.kdsService = kdsService || new KdsService();
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEvents();
  }

  private setupEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 [Socket.io] Cliente conectado: ${socket.id}`);

      // Envia estado atual das mesas e do KDS logo após conexão
      socket.emit('mesas_estado', this.mesaRepo.listarMesas());
      try {
        socket.emit('kds_lista_atualizada', this.kdsService.listarAtivos());
        socket.emit('kds_pedidos_prontos', this.kdsService.listarProntos());
      } catch {}

      socket.on('solicitar_mesas', () => {
        socket.emit('mesas_estado', this.mesaRepo.listarMesas());
      });

      socket.on('solicitar_kds', () => {
        try {
          socket.emit('kds_lista_atualizada', this.kdsService.listarAtivos());
          socket.emit('kds_pedidos_prontos', this.kdsService.listarProntos());
        } catch {}
      });

      // Evento: novo_pedido enviado pelo garçom (Mobile)
      socket.on('novo_pedido', (payload: NovoPedidoPayload) => {
        try {
          if (!payload.mesa_numero || !payload.itens || payload.itens.length === 0) {
            socket.emit('erro_pedido', { message: 'Dados do pedido inválidos' });
            return;
          }

          const mesaAtualizada = this.mesaRepo.adicionarPedido(
            payload.mesa_numero,
            payload.garcom_pin,
            payload.itens
          );

          console.log(`🍽️ [Novo Pedido] Mesa #${payload.mesa_numero} (+${payload.itens.length} itens) - Total: R$ ${mesaAtualizada.subtotal.toFixed(2)}`);

          // Broadcast para todos os clientes conectados (incluindo PDV Desktop)
          this.io.emit('atualiza_mesa', mesaAtualizada);
          socket.emit('pedido_confirmado', { mesa_numero: payload.mesa_numero, subtotal: mesaAtualizada.subtotal });

          // Despacha automaticamente para o Monitor de Cozinha (KDS)
          try {
            const kdsPedido = this.kdsService.criarPedido({
              mesa_numero: payload.mesa_numero,
              cliente_nome: `Mesa ${payload.mesa_numero}`,
              origem: 'SALAO',
              observacoes: payload.garcom_pin ? `Garçom PIN: ${payload.garcom_pin}` : undefined,
              itens: payload.itens.map((it) => ({
                nome: it.descricao,
                quantidade: it.quantidade,
                observacao: it.observacao,
              })),
            });
            this.io.emit('kds_novo_pedido', kdsPedido);
            this.io.emit('kds_lista_atualizada', this.kdsService.listarAtivos());
          } catch (kdsErr) {
            console.warn('[RestaurantSocketService] Erro ao integrar com KDS:', kdsErr);
          }
        } catch (err: any) {
          console.error('[Socket.io] Erro ao processar novo_pedido:', err);
          socket.emit('erro_pedido', { message: err.message || 'Erro ao processar pedido' });
        }
      });

      // Evento: avançar status no KDS (PENDENTE -> PREPARANDO -> PRONTO -> ENTREGUE)
      socket.on('kds_avancar_status', (payload: { id: string }) => {
        try {
          const atualizado = this.kdsService.avancarStatus(payload.id);
          this.broadcastKdsStatus(atualizado);
        } catch (err: any) {
          socket.emit('erro_kds', { message: err.message });
        }
      });

      // Evento direto: cozinha marca prato como PRONTO (notifica garçons)
      socket.on('kds_marcar_pronto', (payload: { id: string }) => {
        try {
          const atualizado = this.kdsService.marcarPronto(payload.id);
          this.broadcastKdsStatus(atualizado);
        } catch (err: any) {
          socket.emit('erro_kds', { message: err.message });
        }
      });

      // Evento direto: garçom ou cozinha marca como ENTREGUE
      socket.on('kds_marcar_entregue', (payload: { id: string }) => {
        try {
          const atualizado = this.kdsService.marcarEntregue(payload.id);
          this.broadcastKdsStatus(atualizado);
        } catch (err: any) {
          socket.emit('erro_kds', { message: err.message });
        }
      });

      // Evento: libera_mesa enviado pelo caixa PDV após pagamento
      socket.on('libera_mesa', (payload: { mesa_numero: number }) => {
        try {
          const mesaLiberada = this.mesaRepo.liberarMesa(payload.mesa_numero);
          if (mesaLiberada) {
            console.log(`✅ [Mesa Liberada] Mesa #${payload.mesa_numero} resetada para LIVRE`);
            this.io.emit('atualiza_mesa', mesaLiberada);
          }
        } catch (err) {
          console.error('[Socket.io] Erro ao liberar mesa:', err);
        }
      });

      // Evento: atualiza status (ex: FECHANDO)
      socket.on('mudar_status_mesa', (payload: { mesa_numero: number; status: Mesa['status'] }) => {
        try {
          const mesa = this.mesaRepo.atualizarStatus(payload.mesa_numero, payload.status);
          if (mesa) {
            this.io.emit('atualiza_mesa', mesa);
          }
        } catch (err) {
          console.error('[Socket.io] Erro ao mudar status da mesa:', err);
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 [Socket.io] Cliente desconectado: ${socket.id}`);
      });
    });
  }

  public broadcastKdsStatus(pedido: KdsPedidoRecord): void {
    this.io.emit('kds_lista_atualizada', this.kdsService.listarAtivos());
    this.io.emit('kds_pedidos_prontos', this.kdsService.listarProntos());
    if (pedido.status === 'PRONTO') {
      console.log(`🔔 [KDS] Pedido ${pedido.id} para Mesa ${pedido.mesa_numero} está PRONTO! Notificando garçons...`);
      this.io.emit('kds_pedido_pronto', pedido);
    } else if (pedido.status === 'ENTREGUE') {
      this.io.emit('kds_pedido_entregue', pedido);
    }
  }

  public broadcastMesa(mesa: Mesa): void {
    this.io.emit('atualiza_mesa', mesa);
  }

  public broadcastTodasMesas(): void {
    this.io.emit('mesas_estado', this.mesaRepo.listarMesas());
  }

  public broadcastKdsLista(): void {
    try {
      this.io.emit('kds_lista_atualizada', this.kdsService.listarAtivos());
      this.io.emit('kds_pedidos_prontos', this.kdsService.listarProntos());
    } catch {}
  }
}
