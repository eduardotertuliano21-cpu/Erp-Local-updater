import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getRestaurantSocket(): Socket {
  if (!socket) {
    const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
    const isViteDev = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174');
    const port = isViteDev ? '5000' : (typeof window !== 'undefined' && window.location.port ? window.location.port : '5000');
    const serverUrl = `http://${host}:${port}`;
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function subscribeToMesas(
  onEstado: (mesas: any[]) => void,
  onAtualizacao: (mesa: any) => void
): () => void {
  const s = getRestaurantSocket();

  const handleEstado = (mesas: any[]) => onEstado(mesas);
  const handleAtualizacao = (mesa: any) => onAtualizacao(mesa);

  s.on('mesas_estado', handleEstado);
  s.on('atualiza_mesa', handleAtualizacao);

  if (s.connected) {
    s.emit('solicitar_mesas');
  } else {
    s.once('connect', () => s.emit('solicitar_mesas'));
  }

  return () => {
    s.off('mesas_estado', handleEstado);
    s.off('atualiza_mesa', handleAtualizacao);
  };
}

export function emitNovoPedido(payload: {
  mesa_numero: number;
  garcom_pin?: string;
  itens: {
    produto_id?: string;
    descricao: string;
    preco_unitario: number;
    quantidade: number;
    observacao?: string;
  }[];
}): void {
  const s = getRestaurantSocket();
  s.emit('novo_pedido', payload);
}

export function emitLiberaMesa(mesa_numero: number): void {
  const s = getRestaurantSocket();
  s.emit('libera_mesa', { mesa_numero });
}
