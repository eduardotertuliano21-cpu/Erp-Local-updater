import type { DatabaseSync } from 'node:sqlite';

export function initVarejoAvancadoSchema(db: DatabaseSync): void {
  db.exec(`
    -- 1. Múltiplos Códigos de Barras e Fatores de Conversão (WMS)
    CREATE TABLE IF NOT EXISTS produto_codigos_barras (
      id TEXT PRIMARY KEY,
      produto_id TEXT NOT NULL,
      codigo_barras TEXT UNIQUE NOT NULL,
      unidade_medida TEXT DEFAULT 'UN',
      fator_entrada REAL DEFAULT 1,
      fator_saida REAL DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_prod_cod_bar ON produto_codigos_barras(codigo_barras);
    CREATE INDEX IF NOT EXISTS idx_prod_cod_prod ON produto_codigos_barras(produto_id);

    -- 2. Políticas de Preço Multi-Tabela (B2B / Atacado)
    CREATE TABLE IF NOT EXISTS tabelas_preco (
      id TEXT PRIMARY KEY,
      descricao TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS produto_precos_tabela (
      id TEXT PRIMARY KEY,
      tabela_preco_id TEXT NOT NULL,
      produto_id TEXT NOT NULL,
      preco_venda REAL NOT NULL,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tabela_preco_id, produto_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tab_preco_prod ON produto_precos_tabela(produto_id);
  `);

  // Migrações dinâmicas seguras
  try { db.exec(`ALTER TABLE entidades ADD COLUMN tabela_preco_id TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE compras_entradas ADD COLUMN status INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE compras_entradas ADD COLUMN itens_json TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE compras_entradas ADD COLUMN xml_completo TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE compras_entradas ADD COLUMN efetivado_em TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE compras_entradas ADD COLUMN efetivado_por TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE logs_auditoria ADD COLUMN autorizado_por_id TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE logs_auditoria ADD COLUMN operador_id TEXT;`); } catch {}

  // Tabelas de preço padrão
  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM tabelas_preco').get() as { total: number };
    if (count.total === 0) {
      db.prepare(`
        INSERT INTO tabelas_preco (id, descricao) VALUES 
          ('padrao', 'Varejo Padrão'),
          ('atacado', 'Tabela Atacado / B2B')
      `).run();
    }
  } catch {}
}
