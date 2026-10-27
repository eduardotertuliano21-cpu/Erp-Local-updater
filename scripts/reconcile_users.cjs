const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function reconcileDir(dir) {
  if (!fs.existsSync(dir)) return;
  console.log('=== Reconciliando bancos em:', dir);

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite'));
  let customAdmin = null;

  // 1. Procurar o admin configurado pelo usuário
  for (const f of files) {
    try {
      const db = new DatabaseSync(path.join(dir, f), { readOnly: true });
      const tbl = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").all();
      if (tbl.length > 0) {
        const users = db.prepare("SELECT * FROM usuarios WHERE hierarquia = 'ADMIN'").all();
        for (const u of users) {
          if (u.login.toLowerCase() !== 'admin') {
            customAdmin = u;
            console.log(`Encontrado admin personalizado em ${f}:`, u.login, `(${u.nome})`);
            break;
          }
        }
      }
      db.close();
      if (customAdmin) break;
    } catch (e) {
      console.warn(`Erro lendo ${f}:`, e.message);
    }
  }

  if (!customAdmin) {
    console.log('Nenhum admin personalizado encontrado além do padrão admin/admin123');
    return;
  }

  // 2. Propagar este admin personalizado para TODOS os bancos da pasta
  for (const f of files) {
    try {
      const dbPath = path.join(dir, f);
      const db = new DatabaseSync(dbPath);

      // Garante que tabelas de auth existem
      db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          login TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          hierarquia TEXT NOT NULL DEFAULT 'OPERADOR',
          ativo INTEGER DEFAULT 1,
          criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_usr_login ON usuarios(login);

        CREATE TABLE IF NOT EXISTS permissoes_usuario (
          usuario_id TEXT PRIMARY KEY,
          pode_cancelar_venda INTEGER DEFAULT 1,
          pode_dar_desconto INTEGER DEFAULT 1,
          pode_ver_relatorios INTEGER DEFAULT 1,
          acessa_estoque INTEGER DEFAULT 1,
          acessa_financeiro INTEGER DEFAULT 1,
          acessa_configuracoes INTEGER DEFAULT 1
        );
      `);

      // Verifica se o login já existe ou se usr_admin existe
      const existLogin = db.prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(login)) = ? LIMIT 1").get(customAdmin.login.toLowerCase());
      const existAdmin = db.prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(login)) = 'admin' OR id = 'usr_admin' LIMIT 1").get();

      if (existLogin) {
        db.prepare("UPDATE usuarios SET nome = ?, senha_hash = ?, hierarquia = 'ADMIN', ativo = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?")
          .run(customAdmin.nome, customAdmin.senha_hash, existLogin.id);
        db.prepare("INSERT INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes) VALUES (?, 1, 1, 1, 1, 1, 1) ON CONFLICT(usuario_id) DO UPDATE SET pode_cancelar_venda=1, pode_dar_desconto=1, pode_ver_relatorios=1, acessa_estoque=1, acessa_financeiro=1, acessa_configuracoes=1")
          .run(existLogin.id);
      } else if (existAdmin) {
        db.prepare("UPDATE usuarios SET nome = ?, login = ?, senha_hash = ?, hierarquia = 'ADMIN', ativo = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?")
          .run(customAdmin.nome, customAdmin.login, customAdmin.senha_hash, existAdmin.id);
        db.prepare("INSERT INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes) VALUES (?, 1, 1, 1, 1, 1, 1) ON CONFLICT(usuario_id) DO UPDATE SET pode_cancelar_venda=1, pode_dar_desconto=1, pode_ver_relatorios=1, acessa_estoque=1, acessa_financeiro=1, acessa_configuracoes=1")
          .run(existAdmin.id);
      } else {
        db.prepare("INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo) VALUES (?, ?, ?, ?, 'ADMIN', 1)")
          .run(customAdmin.id, customAdmin.nome, customAdmin.login, customAdmin.senha_hash);
        db.prepare("INSERT INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes) VALUES (?, 1, 1, 1, 1, 1, 1)")
          .run(customAdmin.id);
      }

      console.log(`[OK] Admin ${customAdmin.login} sincronizado em ${f}`);
      db.close();
    } catch (e) {
      console.error(`Erro sincronizando em ${f}:`, e.message);
    }
  }
}

// Executa nas duas pastas possíveis (Local e AppData)
reconcileDir(path.resolve(process.cwd(), 'data'));
if (process.env.APPDATA) {
  reconcileDir(path.join(process.env.APPDATA, 'clickstorm-erp', 'data'));
  reconcileDir(path.join(process.env.APPDATA, 'ClickStorm PDV', 'data'));
}
