import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MesaRepository, Mesa } from '../repositories/MesaRepository.js';

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
  private io: SocketIOServer;
  private mesaRepo: MesaRepository;

  constructor(server: HttpServer, mesaRepo: MesaRepository) {
    this.mesaRepo = mesaRepo;
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

      // Envia estado atual das mesas logo após conexão
      socket.emit('mesas_estado', this.mesaRepo.listarMesas());

      socket.on('solicitar_mesas', () => {
        socket.emit('mesas_estado', this.mesaRepo.listarMesas());
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
        } catch (err: any) {
          console.error('[Socket.io] Erro ao processar novo_pedido:', err);
          socket.emit('erro_pedido', { message: err.message || 'Erro ao processar pedido' });
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

  public broadcastMesa(mesa: Mesa): void {
    this.io.emit('atualiza_mesa', mesa);
  }

  public broadcastTodasMesas(): void {
    this.io.emit('mesas_estado', this.mesaRepo.listarMesas());
  }
}
