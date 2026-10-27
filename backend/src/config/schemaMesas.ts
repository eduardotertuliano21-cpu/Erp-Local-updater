import type { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

export function initMesasSchema(db: DatabaseSync): void {
  db.exec(`
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

  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM mesas').get() as { total: number };
    if (count.total === 0) {
      const stmt = db.prepare('INSERT INTO mesas (id, numero, status, pessoas) VALUES (?, ?, ?, ?)');
      for (let i = 1; i <= 16; i++) {
        stmt.run(crypto.randomUUID(), i, 'LIVRE', 0);
      }
    }
  } catch {}
}
