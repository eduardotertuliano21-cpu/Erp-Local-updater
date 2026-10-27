import crypto from 'node:crypto';
import { getOperacaoDb } from '../config/database.js';

export interface KdsPedidoRecord {
  id: string;
  mesa_numero?: number;
  comanda_numero?: number;
  cliente_nome?: string;
  origem: string;
  status: 'PENDENTE' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  observacoes?: string;
  itens_json: string;
  criado_em: string;
  atualizado_em: string;
}

export class KdsService {
  public listarAtivos(): KdsPedidoRecord[] {
    const db = getOperacaoDb();
    return db.prepare(`
      SELECT * FROM kds_pedidos
      WHERE status != 'ENTREGUE'
      ORDER BY criado_em ASC
    `).all() as unknown as KdsPedidoRecord[];
  }

  public criarPedido(dados: {
    mesa_numero?: number;
    comanda_numero?: number;
    cliente_nome?: string;
    origem?: string;
    observacoes?: string;
    itens: Array<{ nome: string; quantidade: number; observacao?: string }>;
  }): KdsPedidoRecord {
    const db = getOperacaoDb();
    const id = `kds_${crypto.randomUUID()}`;
    const itensJson = JSON.stringify(dados.itens);
    const origem = dados.origem || 'SALAO';

    db.prepare(`
      INSERT INTO kds_pedidos (id, mesa_numero, comanda_numero, cliente_nome, origem, observacoes, itens_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
    `).run(
      id,
      dados.mesa_numero || null,
      dados.comanda_numero || null,
      dados.cliente_nome || null,
      origem,
      dados.observacoes || null,
      itensJson
    );

    return db.prepare(`SELECT * FROM kds_pedidos WHERE id = ?`).get(id) as unknown as KdsPedidoRecord;
  }

  public avancarStatus(id: string): KdsPedidoRecord {
    const db = getOperacaoDb();
    const atual = db.prepare(`SELECT status FROM kds_pedidos WHERE id = ?`).get(id) as any;
    if (!atual) throw new Error('Pedido KDS não encontrado');

    let proximo = 'PREPARANDO';
    if (atual.status === 'PENDENTE') proximo = 'PREPARANDO';
    else if (atual.status === 'PREPARANDO') proximo = 'PRONTO';
    else if (atual.status === 'PRONTO') proximo = 'ENTREGUE';

    db.prepare(`
      UPDATE kds_pedidos
      SET status = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(proximo, id);

    return db.prepare(`SELECT * FROM kds_pedidos WHERE id = ?`).get(id) as unknown as KdsPedidoRecord;
  }
}
