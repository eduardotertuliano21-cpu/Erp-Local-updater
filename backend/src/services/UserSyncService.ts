import type { DatabaseSync } from 'node:sqlite';
import { hashSenha } from '../config/schemaAuth.js';

export interface UsuarioSyncInput {
  id: string;
  nome: string;
  login: string;
  hierarquia: string;
  ativo: boolean | number;
}

export interface EntidadeSyncInput {
  id: string;
  tipo: string;
  razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  cargo?: string;
  matricula?: string;
  pin?: string;
  ativo?: number;
}

export class UserSyncService {
  public static cargoParaHierarquia(cargo?: string): 'ADMIN' | 'GERENTE' | 'OPERADOR' {
    const c = (cargo || '').toUpperCase();
    if (c === 'ADMIN' || c === 'SUPERVISOR') return 'ADMIN';
    if (c === 'GERENTE') return 'GERENTE';
    return 'OPERADOR';
  }

  public static hierarquiaParaCargo(hierarquia?: string): string {
    const h = (hierarquia || '').toUpperCase();
    if (h === 'ADMIN') return 'SUPERVISOR';
    if (h === 'GERENTE') return 'GERENTE';
    return 'OPERADOR_CAIXA';
  }

  public static sincronizarUsuarioParaColaborador(db: DatabaseSync, usuario: UsuarioSyncInput, pin?: string): void {
    if (usuario.id === 'admin_virtual' || usuario.login.toLowerCase() === 'admin_virtual') return;

    const matricula = usuario.login.trim().toUpperCase();
    const nome = usuario.nome.trim();
    const cargo = this.hierarquiaParaCargo(usuario.hierarquia);
    const ativo = usuario.ativo ? 1 : 0;
    const pinFinal = pin && pin.trim().length > 0 ? pin.trim() : '1234';

    try {
      const exist = db.prepare(`
        SELECT id FROM entidades 
        WHERE id = ? OR id = ? OR UPPER(TRIM(matricula)) = ? OR UPPER(TRIM(razao_social)) = ?
        LIMIT 1
      `).get(`fun_${usuario.id}`, usuario.id, matricula, nome.toUpperCase()) as { id: string } | undefined;

      if (exist) {
        db.prepare(`
          UPDATE entidades SET
            razao_social = ?,
            nome_fantasia = ?,
            cargo = ?,
            matricula = ?,
            ativo = ?,
            pin = CASE WHEN ? != '1234' THEN ? ELSE COALESCE(pin, '1234') END,
            atualizado_em = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nome, `@${usuario.login.toLowerCase()}`, cargo, matricula, ativo, pinFinal, pinFinal, exist.id);
      } else {
        db.prepare(`
          INSERT INTO entidades (
            id, tipo, razao_social, nome_fantasia, cpf_cnpj, cargo, matricula,
            pin, comissao_percentual, limite_desconto, ativo, atualizado_em
          ) VALUES (?, 'FUNCIONARIO', ?, ?, ?, ?, ?, ?, 0, 5, ?, CURRENT_TIMESTAMP)
        `).run(`fun_${usuario.id}`, nome, `@${usuario.login.toLowerCase()}`, matricula, cargo, matricula, pinFinal, ativo);
      }

      // Sincroniza também na tabela de operadores do PDV
      db.prepare(`
        INSERT INTO operadores (id, matricula, nome, pin_hash, perfil, ativo, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(matricula) DO UPDATE SET
          nome = excluded.nome,
          perfil = excluded.perfil,
          ativo = excluded.ativo,
          atualizado_em = CURRENT_TIMESTAMP
      `).run(
        `op_${usuario.id}`,
        matricula,
        nome,
        pinFinal,
        cargo === 'SUPERVISOR' || cargo === 'GERENTE' ? 'SUPERVISOR' : 'OPERADOR',
        ativo
      );
    } catch (err) {
      console.warn('[UserSyncService] Erro ao sincronizar usuário para colaborador:', err);
    }
  }

  public static sincronizarColaboradorParaUsuario(db: DatabaseSync, entidade: EntidadeSyncInput): void {
    if (entidade.tipo !== 'FUNCIONARIO') return;

    const matriculaNorm = (entidade.matricula || '').trim().toLowerCase();
    const login = matriculaNorm || entidade.razao_social.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const hierarquia = this.cargoParaHierarquia(entidade.cargo);
    const ativo = entidade.ativo !== undefined ? (entidade.ativo ? 1 : 0) : 1;
    const pin = entidade.pin && entidade.pin.trim().length > 0 ? entidade.pin.trim() : '1234';

    try {
      const exist = db.prepare(`
        SELECT id FROM usuarios 
        WHERE id = ? OR id = ? OR LOWER(TRIM(login)) = ?
        LIMIT 1
      `).get(`usr_${entidade.id}`, entidade.id, login) as { id: string } | undefined;

      const isAdm = hierarquia === 'ADMIN' || hierarquia === 'GERENTE';

      if (exist) {
        db.prepare(`
          UPDATE usuarios SET
            nome = ?,
            hierarquia = ?,
            ativo = ?,
            atualizado_em = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(entidade.razao_social.trim(), hierarquia, ativo, exist.id);

        if (pin && pin !== '1234') {
          db.prepare(`UPDATE usuarios SET senha_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(hashSenha(pin), exist.id);
        }
      } else {
        const novoId = `usr_${entidade.id}`;
        db.prepare(`
          INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(novoId, entidade.razao_social.trim(), login, hashSenha(pin), hierarquia, ativo);

        db.prepare(`
          INSERT INTO permissoes_usuario (
            usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios,
            acessa_estoque, acessa_financeiro, acessa_configuracoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(usuario_id) DO UPDATE SET
            pode_cancelar_venda = excluded.pode_cancelar_venda,
            pode_dar_desconto = excluded.pode_dar_desconto,
            pode_ver_relatorios = excluded.pode_ver_relatorios,
            acessa_estoque = excluded.acessa_estoque,
            acessa_financeiro = excluded.acessa_financeiro,
            acessa_configuracoes = excluded.acessa_configuracoes
        `).run(novoId, isAdm ? 1 : 0, isAdm ? 1 : 0, isAdm ? 1 : 0, isAdm ? 1 : 0, isAdm ? 1 : 0, isAdm ? 1 : 0);
      }
    } catch (err) {
      console.warn('[UserSyncService] Erro ao sincronizar colaborador para usuário:', err);
    }
  }

  public static reconciliarTudo(db: DatabaseSync): void {
    try {
      // 1. Reconciliação especial de Eduardo: vincula Admin EDUARDO com colaborador
      try {
        const adm = db.prepare("SELECT * FROM usuarios WHERE LOWER(login) = 'eduardo' LIMIT 1").get() as any;
        if (adm) {
          db.prepare(`
            UPDATE entidades SET
              razao_social = ?,
              nome_fantasia = '@eduardo',
              cargo = 'SUPERVISOR',
              matricula = 'EDUARDO',
              ativo = 1,
              atualizado_em = CURRENT_TIMESTAMP
            WHERE id = 'fun_01' OR UPPER(TRIM(razao_social)) LIKE '%EDUARDO%'
          `).run(adm.nome || 'EDUARDO');
        }
      } catch {}

      // 2. Todos os usuários (exceto virtual) viram colaboradores
      const usuarios = db.prepare("SELECT id, nome, login, hierarquia, ativo FROM usuarios WHERE id != 'admin_virtual'").all() as any[];
      for (const u of usuarios) {
        this.sincronizarUsuarioParaColaborador(db, u);
      }

      // 3. Todos os funcionários viram contas de usuário
      const funcionarios = db.prepare("SELECT id, tipo, razao_social, nome_fantasia, cargo, matricula, pin, ativo FROM entidades WHERE tipo = 'FUNCIONARIO'").all() as any[];
      for (const f of funcionarios) {
        this.sincronizarColaboradorParaUsuario(db, f);
      }
    } catch (err) {
      console.warn('[UserSyncService] Falha na reconciliação unificada:', err);
    }
  }
}
