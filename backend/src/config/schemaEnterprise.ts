import type { DatabaseSync } from 'node:sqlite';

export function initEnterpriseSchema(db: DatabaseSync): void {
  db.exec(`
    -- 1. Trilha de Auditoria Completa (Logs Enterprise)
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id TEXT PRIMARY KEY,
      usuario_id TEXT,
      usuario_nome TEXT,
      acao TEXT NOT NULL,
      detalhes TEXT,
      motivo TEXT,
      ip_origem TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_acao ON logs_auditoria(acao);
    CREATE INDEX IF NOT EXISTS idx_audit_data ON logs_auditoria(criado_em);

    -- 2. Memória de Frota Local (Autopeças)
    CREATE TABLE IF NOT EXISTS veiculos_clientes (
      id TEXT PRIMARY KEY,
      cliente_id TEXT NOT NULL,
      placa TEXT NOT NULL,
      marca TEXT,
      modelo TEXT,
      ano INTEGER,
      cor TEXT,
      km_atual REAL DEFAULT 0,
      historico_manutencoes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_veic_placa ON veiculos_clientes(placa);
    CREATE INDEX IF NOT EXISTS idx_veic_cliente ON veiculos_clientes(cliente_id);

    -- 3. Transações de TEF Local (SiTef / PayGo / PinPad)
    CREATE TABLE IF NOT EXISTS tef_transacoes (
      id TEXT PRIMARY KEY,
      venda_id TEXT,
      rede TEXT DEFAULT 'SITEF',
      nsu TEXT,
      codigo_autorizacao TEXT,
      bandeira TEXT,
      tipo_cartao TEXT,
      valor REAL NOT NULL,
      status TEXT NOT NULL,
      comprovante_via_cliente TEXT,
      comprovante_via_loja TEXT,
      data_hora TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tef_nsu ON tef_transacoes(nsu);

    -- 4. Monitor de Cozinha KDS (Kitchen Display System)
    CREATE TABLE IF NOT EXISTS kds_pedidos (
      id TEXT PRIMARY KEY,
      mesa_numero INTEGER,
      comanda_numero INTEGER,
      cliente_nome TEXT,
      origem TEXT DEFAULT 'SALAO',
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      observacoes TEXT,
      itens_json TEXT NOT NULL,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kds_status ON kds_pedidos(status);

    -- 5. Gestão de Certificados Digitais A1 (.pfx)
    CREATE TABLE IF NOT EXISTS certificados_digitais (
      id TEXT PRIMARY KEY,
      nome_arquivo TEXT NOT NULL,
      caminho_arquivo TEXT NOT NULL,
      razao_social TEXT,
      cnpj TEXT,
      valido_de TEXT,
      valido_ate TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Matriz de Permissões RBAC Editável
    CREATE TABLE IF NOT EXISTS permissoes_hierarquia (
      hierarquia TEXT PRIMARY KEY,
      cancelar_venda INTEGER DEFAULT 1,
      aplicar_desconto INTEGER DEFAULT 1,
      abrir_gaveta INTEGER DEFAULT 1,
      ver_relatorios INTEGER DEFAULT 1,
      acessa_estoque INTEGER DEFAULT 1,
      acessa_financeiro INTEGER DEFAULT 1,
      acessa_configuracoes INTEGER DEFAULT 1,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações seguras na config_loja
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN sistema_configurado INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN token_csc TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN id_token_csc TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN comportamento_fiscal_pdv TEXT DEFAULT 'MANUAL';`); } catch {}
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN controle_acesso_estrito INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE config_loja ADD COLUMN certificado_ativo_id TEXT;`); } catch {}

  // Migrações seguras para suporte a balanças na tabela produtos
  try { db.exec(`ALTER TABLE produtos ADD COLUMN pesavel INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE produtos ADD COLUMN codigo_balanca TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE produtos ADD COLUMN validade_balanca INTEGER DEFAULT 5;`); } catch {}

  // Inicializa matriz de permissões padrão (Padrão Desbloqueado para testes)
  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM permissoes_hierarquia').get() as { total: number };
    if (count.total === 0) {
      db.prepare(`
        INSERT INTO permissoes_hierarquia (hierarquia, cancelar_venda, aplicar_desconto, abrir_gaveta, ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes)
        VALUES 
          ('ADMIN', 1, 1, 1, 1, 1, 1, 1),
          ('GERENTE', 1, 1, 1, 1, 1, 1, 0),
          ('OPERADOR', 1, 1, 1, 0, 0, 0, 0)
      `).run();
    }
  } catch {}
}
