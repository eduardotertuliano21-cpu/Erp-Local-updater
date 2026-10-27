import { getOperacaoDb } from '../config/database.js';
import crypto from 'node:crypto';

export interface PedidoMesaItem {
  id: string;
  mesa_id: string;
  produto_id?: string;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
  observacao?: string;
  criado_em: string;
}

export interface Mesa {
  id: string;
  numero: number;
  status: 'LIVRE' | 'OCUPADA' | 'FECHANDO';
  pessoas: number;
  garcom_pin?: string;
  subtotal: number;
  itens: PedidoMesaItem[];
  atualizado_em: string;
}

export class MesaRepository {
  private get db() {
    return getOperacaoDb();
  }

  constructor() {
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mesas (
        id TEXT PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'LIVRE',
        pessoas INTEGER NOT NULL DEFAULT 0,
        garcom_pin TEXT,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pedidos_mesa (
        id TEXT PRIMARY KEY,
        mesa_id TEXT NOT NULL,
        produto_id TEXT,
        descricao TEXT NOT NULL,
        preco_unitario REAL NOT NULL,
        quantidade REAL NOT NULL,
        subtotal REAL NOT NULL,
        observacao TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
      );
    `);

    // Semente inicial de 12 mesas caso não existam
    const count = this.db.prepare('SELECT COUNT(*) as total FROM mesas').get() as { total: number };
    if (count.total === 0) {
      const stmt = this.db.prepare('INSERT INTO mesas (id, numero, status, pessoas) VALUES (?, ?, ?, ?)');
      for (let i = 1; i <= 12; i++) {
        stmt.run(crypto.randomUUID(), i, 'LIVRE', 0);
      }
    }
  }

  public listarMesas(): Mesa[] {
    this.initTables();
    const mesasRows = this.db.prepare('SELECT * FROM mesas ORDER BY numero ASC').all() as any[];
    const pedidosRows = this.db.prepare('SELECT * FROM pedidos_mesa ORDER BY criado_em ASC').all() as any[];

    const itensPorMesa = new Map<string, PedidoMesaItem[]>();
    for (const item of pedidosRows) {
      if (!itensPorMesa.has(item.mesa_id)) {
        itensPorMesa.set(item.mesa_id, []);
      }
      itensPorMesa.get(item.mesa_id)!.push(item);
    }

    return mesasRows.map((m) => {
      const itens = itensPorMesa.get(m.id) || [];
      const subtotal = itens.reduce((acc, i) => acc + i.subtotal, 0);
      return {
        id: m.id,
        numero: m.numero,
        status: m.status as Mesa['status'],
        pessoas: m.pessoas,
        garcom_pin: m.garcom_pin || undefined,
        subtotal: parseFloat(subtotal.toFixed(2)),
        itens,
        atualizado_em: m.atualizado_em,
      };
    });
  }

  public obterMesaPorNumero(numero: number): Mesa | null {
    this.initTables();
    const m = this.db.prepare('SELECT * FROM mesas WHERE numero = ? LIMIT 1').get(numero) as any;
    if (!m) return null;

    const itens = this.db.prepare('SELECT * FROM pedidos_mesa WHERE mesa_id = ? ORDER BY criado_em ASC').all(m.id) as any[];
    const subtotal = itens.reduce((acc, i) => acc + i.subtotal, 0);

    return {
      id: m.id,
      numero: m.numero,
      status: m.status as Mesa['status'],
      pessoas: m.pessoas,
      garcom_pin: m.garcom_pin || undefined,
      subtotal: parseFloat(subtotal.toFixed(2)),
      itens,
      atualizado_em: m.atualizado_em,
    };
  }

  public adicionarPedido(
    numero: number,
    garcomPin: string | undefined,
    itens: { produto_id?: string; descricao: string; preco_unitario: number; quantidade: number; observacao?: string }[]
  ): Mesa {
    let mesa = this.obterMesaPorNumero(numero);
    if (!mesa) {
      const novoId = crypto.randomUUID();
      this.db.prepare('INSERT INTO mesas (id, numero, status, pessoas, garcom_pin) VALUES (?, ?, ?, ?, ?)').run(
        novoId,
        numero,
        'OCUPADA',
        2,
        garcomPin || null
      );
      mesa = this.obterMesaPorNumero(numero)!;
    } else {
      this.db.prepare("UPDATE mesas SET status = 'OCUPADA', garcom_pin = COALESCE(?, garcom_pin), atualizado_em = CURRENT_TIMESTAMP WHERE id = ?").run(
        garcomPin || null,
        mesa.id
      );
    }

    const insertItem = this.db.prepare(`
      INSERT INTO pedidos_mesa (id, mesa_id, produto_id, descricao, preco_unitario, quantidade, subtotal, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const it of itens) {
      const subtotal = parseFloat((it.preco_unitario * it.quantidade).toFixed(2));
      insertItem.run(
        crypto.randomUUID(),
        mesa.id,
        it.produto_id || null,
        it.descricao,
        it.preco_unitario,
        it.quantidade,
        subtotal,
        it.observacao || null
      );
    }

    return this.obterMesaPorNumero(numero)!;
  }

  public liberarMesa(numero: number): Mesa | null {
    const mesa = this.obterMesaPorNumero(numero);
    if (!mesa) return null;

    this.db.prepare('DELETE FROM pedidos_mesa WHERE mesa_id = ?').run(mesa.id);
    this.db.prepare("UPDATE mesas SET status = 'LIVRE', pessoas = 0, garcom_pin = NULL, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?").run(mesa.id);

    return this.obterMesaPorNumero(numero);
  }

  public atualizarStatus(numero: number, status: Mesa['status']): Mesa | null {
    const mesa = this.obterMesaPorNumero(numero);
    if (!mesa) return null;

    this.db.prepare('UPDATE mesas SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?').run(status, mesa.id);
    return this.obterMesaPorNumero(numero);
  }
}
