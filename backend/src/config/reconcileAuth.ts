import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR } from './database.js';
import { initAuthSchema } from './schemaAuth.js';
import { initErpCatalogoSchema } from './schemaErp.js';
import { UserSyncService } from '../services/UserSyncService.js';

export function reconciliarAdminGlobal(
  dataDir: string = DATA_DIR,
  overrideAdmin?: { login: string; senha_hash: string; nome?: string }
): void {
  try {
    if (!fs.existsSync(dataDir)) return;
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.sqlite'));

    // 1. Assegura que todos os bancos físicos possuem as tabelas de autenticação e config
    for (const f of files) {
      try {
        const db = new DatabaseSync(path.join(dataDir, f));
        initErpCatalogoSchema(db);
        initAuthSchema(db);
        try { db.exec("ALTER TABLE vendas ADD COLUMN numero_caixa_fisico TEXT DEFAULT '01';"); } catch {}
        db.close();
      } catch (err) {
        console.warn(`[Reconcile] Aviso ao inicializar schema em ${f}:`, err);
      }
    }

    // 2. Localiza Administrador customizado ou usa o fornecido via override
    let customAdmin: any = overrideAdmin
      ? { id: 'admin_root', nome: overrideAdmin.nome || 'Administrador', login: overrideAdmin.login, senha_hash: overrideAdmin.senha_hash }
      : null;

    if (!customAdmin) {
      for (const f of files) {
        try {
          const db = new DatabaseSync(path.join(dataDir, f), { readOnly: true });
          const users = db.prepare("SELECT * FROM usuarios WHERE hierarquia = 'ADMIN'").all() as any[];
          for (const u of users) {
            if (u.login && u.login.toLowerCase() !== 'admin') {
              customAdmin = u;
              break;
            }
          }
          db.close();
          if (customAdmin) break;
        } catch {}
      }
    }

    if (!customAdmin) return;

    // 3. Propaga o Administrador customizado para todos os bancos físicos do sistema
    for (const f of files) {
      try {
        const db = new DatabaseSync(path.join(dataDir, f));
        const existByLogin = db
          .prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(login)) = ? LIMIT 1")
          .get(customAdmin.login.toLowerCase()) as { id: string } | undefined;

        let targetId = existByLogin?.id;
        let finalId: string = targetId || customAdmin.id || 'admin_root';
        if (targetId) {
          db.prepare(`
            UPDATE usuarios SET nome = ?, senha_hash = ?, hierarquia = 'ADMIN', ativo = 1, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(customAdmin.nome, customAdmin.senha_hash, finalId);
        } else {
          const existAdmin = db
            .prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(login)) = 'admin' LIMIT 1")
            .get() as { id: string } | undefined;

          if (existAdmin) {
            targetId = existAdmin.id;
            finalId = targetId;
            db.prepare(`
              UPDATE usuarios SET nome = ?, login = ?, senha_hash = ?, hierarquia = 'ADMIN', ativo = 1, atualizado_em = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(customAdmin.nome, customAdmin.login, customAdmin.senha_hash, finalId);
          } else {
            db.prepare(`
              INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
              VALUES (?, ?, ?, ?, 'ADMIN', 1)
            `).run(finalId, customAdmin.nome, customAdmin.login, customAdmin.senha_hash);
          }
        }

        db.prepare(`
          INSERT INTO permissoes_usuario (
            usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios,
            acessa_estoque, acessa_financeiro, acessa_configuracoes
          ) VALUES (?, 1, 1, 1, 1, 1, 1)
          ON CONFLICT(usuario_id) DO UPDATE SET
            pode_cancelar_venda = 1, pode_dar_desconto = 1, pode_ver_relatorios = 1,
            acessa_estoque = 1, acessa_financeiro = 1, acessa_configuracoes = 1
        `).run(finalId);
        db.close();
      } catch (err) {
        console.warn(`[Reconcile] Erro ao sincronizar admin em ${f}:`, err);
      }
    }

    // 4. Auto-cura de caixas e sessões de caixa zumbis desincronizados
    for (const f of files) {
      try {
        const db = new DatabaseSync(path.join(dataDir, f));
        const caixasAbertos = (db.prepare("SELECT COUNT(*) as t FROM caixas WHERE status = 'ABERTO'").get() as any)?.t || 0;
        if (caixasAbertos === 0) {
          db.prepare("UPDATE sessoes_caixa SET status = 'FECHADO', data_fechamento = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
        }
        // 5. Unificação bidirecional de Usuários (RBAC) e Colaboradores (Equipe)
        UserSyncService.reconciliarTudo(db);
        db.close();
      } catch {}
    }
  } catch (err) {
    console.warn('[Reconcile] Erro durante reconciliação global:', err);
  }
}
