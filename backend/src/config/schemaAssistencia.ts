import type { DatabaseSync } from 'node:sqlite';

export function initAssistenciaSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

    CREATE TABLE IF NOT EXISTS equipamentos (
      id TEXT PRIMARY KEY,
      cliente_id TEXT,
      tipo TEXT NOT NULL,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      numero_serie TEXT,
      cor TEXT,
      acessorios TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_equip_cliente ON equipamentos(cliente_id);

    CREATE TABLE IF NOT EXISTS ordens_de_servico (
      id TEXT PRIMARY KEY,
      numero_os INTEGER UNIQUE,
      cliente_id TEXT,
      cliente_nome TEXT NOT NULL,
      cliente_telefone TEXT,
      cliente_cpf TEXT,
      equipamento_id TEXT,
      equipamento_descricao TEXT NOT NULL,
      numero_serie TEXT,
      defeito_relatado TEXT NOT NULL,
      laudo_tecnico TEXT,
      status TEXT NOT NULL DEFAULT 'AGUARDANDO_AVALIACAO',
      valor_servicos REAL DEFAULT 0,
      valor_pecas REAL DEFAULT 0,
      valor_total REAL DEFAULT 0,
      tecnico_responsavel TEXT,
      data_abertura TEXT DEFAULT CURRENT_TIMESTAMP,
      data_previsao TEXT,
      data_conclusao TEXT,
      data_entrega TEXT,
      observacoes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_de_servico(status);
    CREATE INDEX IF NOT EXISTS idx_os_numero ON ordens_de_servico(numero_os);

    CREATE TABLE IF NOT EXISTS os_itens (
      id TEXT PRIMARY KEY,
      os_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      quantidade REAL DEFAULT 1,
      valor_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (os_id) REFERENCES ordens_de_servico(id) ON DELETE CASCADE
    );
  `);
}
