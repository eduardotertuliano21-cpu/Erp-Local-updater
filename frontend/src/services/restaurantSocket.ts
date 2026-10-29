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

export function subscribeToKds(
  onLista: (pedidos: any[]) => void,
  onPedidoPronto?: (pedido: any) => void,
  onProntos?: (prontos: any[]) => void
): () => void {
  const s = getRestaurantSocket();

  const handleLista = (pedidos: any[]) => onLista(pedidos);
  const handlePronto = (pedido: any) => onPedidoPronto?.(pedido);
  const handleProntos = (prontos: any[]) => onProntos?.(prontos);

  s.on('kds_lista_atualizada', handleLista);
  s.on('kds_pedido_pronto', handlePronto);
  s.on('kds_pedidos_prontos', handleProntos);

  if (s.connected) {
    s.emit('solicitar_kds');
  } else {
    s.once('connect', () => s.emit('solicitar_kds'));
  }

  return () => {
    s.off('kds_lista_atualizada', handleLista);
    s.off('kds_pedido_pronto', handlePronto);
    s.off('kds_pedidos_prontos', handleProntos);
  };
}

export function emitKdsMarcarPronto(id: string): void {
  const s = getRestaurantSocket();
  s.emit('kds_marcar_pronto', { id });
}

export function emitKdsMarcarEntregue(id: string): void {
  const s = getRestaurantSocket();
  s.emit('kds_marcar_entregue', { id });
}

export function emitKdsAvancar(id: string): void {
  const s = getRestaurantSocket();
  s.emit('kds_avancar_status', { id });
}
