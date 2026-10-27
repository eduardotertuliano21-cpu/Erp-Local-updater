import type { DatabaseSync } from 'node:sqlite';

export function initAcougueSchema(db: DatabaseSync): void {
  db.exec(`
    -- Rendimento de Desossa e Transformação de Carnes
    CREATE TABLE IF NOT EXISTS desossas (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL,
      produto_origem_id TEXT NOT NULL,
      produto_origem_nome TEXT NOT NULL,
      peso_origem REAL NOT NULL,
      custo_origem_total REAL NOT NULL,
      peso_cortes_total REAL NOT NULL,
      peso_quebra REAL NOT NULL,
      percentual_quebra REAL NOT NULL,
      status TEXT DEFAULT 'CONCLUIDA',
      operador_id TEXT,
      observacoes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS desossa_itens (
      id TEXT PRIMARY KEY,
      desossa_id TEXT NOT NULL,
      produto_destino_id TEXT NOT NULL,
      descricao TEXT NOT NULL,
      peso REAL NOT NULL,
      percentual_rendimento REAL NOT NULL,
      custo_unitario_rateado REAL NOT NULL,
      preco_venda_sugerido REAL,
      FOREIGN KEY (desossa_id) REFERENCES desossas(id)
    );

    CREATE INDEX IF NOT EXISTS idx_desossa_origem ON desossas(produto_origem_id);
    CREATE INDEX IF NOT EXISTS idx_desossa_itens ON desossa_itens(desossa_id);
  `);
}
