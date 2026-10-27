import type { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

export function hashSenha(senha: string): string {
  return crypto.createHash('sha256').update(`cs_salt_${senha.trim()}`).digest('hex');
}

export function verificarSenha(senha: string, hash: string): boolean {
  if (!senha || !hash) return false;
  return hashSenha(senha) === hash;
}

export function initAuthSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      login TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      hierarquia TEXT NOT NULL DEFAULT 'OPERADOR', -- ADMIN | GERENTE | OPERADOR
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_usr_login ON usuarios(login);

    CREATE TABLE IF NOT EXISTS permissoes_usuario (
      usuario_id TEXT PRIMARY KEY,
      pode_cancelar_venda INTEGER DEFAULT 0,
      pode_dar_desconto INTEGER DEFAULT 0,
      pode_ver_relatorios INTEGER DEFAULT 0,
      acessa_estoque INTEGER DEFAULT 0,
      acessa_financeiro INTEGER DEFAULT 0,
      acessa_configuracoes INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessoes_caixa (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      data_abertura TEXT DEFAULT CURRENT_TIMESTAMP,
      data_fechamento TEXT,
      saldo_inicial REAL NOT NULL DEFAULT 0,
      saldo_final REAL,
      status TEXT NOT NULL DEFAULT 'ABERTO', -- ABERTO | FECHADO
      observacoes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    CREATE INDEX IF NOT EXISTS idx_sessao_usr_status ON sessoes_caixa(usuario_id, status);
  `);

  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM usuarios').get() as { total: number };
    if (count.total === 0) {
      const insUser = db.prepare(`
        INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      const insPerm = db.prepare(`
        INSERT INTO permissoes_usuario (
          usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios,
          acessa_estoque, acessa_financeiro, acessa_configuracoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const adminId = 'usr_admin';
      insUser.run(adminId, 'Administrador do Sistema', 'admin', hashSenha('admin123'), 'ADMIN');
      insPerm.run(adminId, 1, 1, 1, 1, 1, 1);

      const gerenteId = 'usr_gerente';
      insUser.run(gerenteId, 'Gerente da Loja', 'gerente', hashSenha('1234'), 'GERENTE');
      insPerm.run(gerenteId, 1, 1, 1, 1, 1, 1);

      const operadorId = 'usr_operador';
      insUser.run(operadorId, 'Operador de Caixa', 'operador', hashSenha('1234'), 'OPERADOR');
      insPerm.run(operadorId, 0, 0, 0, 0, 0, 0);
    }

    try {
      db.prepare(`
        INSERT OR IGNORE INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
        VALUES ('admin_virtual', 'Administrador Virtual', 'admin_virtual', 'bypass', 'ADMIN', 1)
      `).run();
      db.prepare(`
        INSERT OR IGNORE INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes)
        VALUES ('admin_virtual', 1, 1, 1, 1, 1, 1)
      `).run();
    } catch {}
  } catch (err) {
    console.error('[SchemaAuth] Erro ao semear usuários padrão:', err);
  }
}
