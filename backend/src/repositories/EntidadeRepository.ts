import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import { UserSyncService } from '../services/UserSyncService.js';

export interface Entidade {
  id: string;
  tipo: 'CLIENTE' | 'FORNECEDOR' | 'TRANSPORTADORA' | 'FUNCIONARIO';
  razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  ie_rg?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  limite_credito?: number;
  saldo_devedor?: number;
  cargo?: string;
  matricula?: string;
  pin?: string;
  comissao_percentual?: number;
  limite_desconto?: number;
  ativo?: number;
  criado_em?: string;
}

export class EntidadeRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listar(tipo?: string, termo?: string): Entidade[] {
    let sql = 'SELECT * FROM entidades WHERE ativo = 1';
    const params: any[] = [];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    if (termo && termo.trim()) {
      sql += ' AND (razao_social LIKE ? OR nome_fantasia LIKE ? OR cpf_cnpj LIKE ? OR matricula LIKE ?)';
      const t = `%${termo.trim()}%`;
      params.push(t, t, t, t);
    }

    sql += ' ORDER BY razao_social ASC LIMIT 100';
    const stmt = this.readDb.prepare(sql);
    return stmt.all(...params) as unknown as Entidade[];
  }

  public buscarPorId(id: string): Entidade | null {
    const stmt = this.readDb.prepare('SELECT * FROM entidades WHERE id = ?');
    const row = stmt.get(id);
    return (row as unknown as Entidade) || null;
  }

  public buscarPorCpfCnpj(cpfCnpj: string): Entidade | null {
    const stmt = this.readDb.prepare('SELECT * FROM entidades WHERE cpf_cnpj = ?');
    const row = stmt.get(cpfCnpj.trim());
    return (row as unknown as Entidade) || null;
  }

  public salvar(entidade: Entidade): void {
    const stmt = this.writeDb.prepare(`
      INSERT INTO entidades (
        id, tipo, razao_social, nome_fantasia, cpf_cnpj, ie_rg,
        email, telefone, endereco, limite_credito, saldo_devedor,
        cargo, matricula, pin, comissao_percentual, limite_desconto,
        ativo, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        tipo = excluded.tipo,
        razao_social = excluded.razao_social,
        nome_fantasia = excluded.nome_fantasia,
        cpf_cnpj = excluded.cpf_cnpj,
        ie_rg = excluded.ie_rg,
        email = excluded.email,
        telefone = excluded.telefone,
        endereco = excluded.endereco,
        limite_credito = excluded.limite_credito,
        saldo_devedor = excluded.saldo_devedor,
        cargo = excluded.cargo,
        matricula = excluded.matricula,
        pin = excluded.pin,
        comissao_percentual = excluded.comissao_percentual,
        limite_desconto = excluded.limite_desconto,
        ativo = excluded.ativo,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(
      entidade.id,
      entidade.tipo,
      entidade.razao_social,
      entidade.nome_fantasia || null,
      entidade.cpf_cnpj,
      entidade.ie_rg || null,
      entidade.email || null,
      entidade.telefone || null,
      entidade.endereco || null,
      entidade.limite_credito || 0,
      entidade.saldo_devedor || 0,
      entidade.cargo || 'VENDEDOR',
      entidade.matricula || null,
      entidade.pin || '1234',
      entidade.comissao_percentual || 0,
      entidade.limite_desconto || 0,
      entidade.ativo !== undefined ? entidade.ativo : 1
    );

    // Se for FUNCIONARIO, sincroniza na tabela operadores do PDV e nas contas de usuário (RBAC)
    if (entidade.tipo === 'FUNCIONARIO') {
      const matriculaOp = entidade.matricula || entidade.cpf_cnpj;
      const perfilOp = (entidade.cargo === 'SUPERVISOR' || entidade.cargo === 'GERENTE') ? 'SUPERVISOR' : 'CAIXA';
      const pinOp = entidade.pin || '1234';

      const stmtOp = this.writeDb.prepare(`
        INSERT INTO operadores (id, matricula, nome, pin_hash, perfil, ativo, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(matricula) DO UPDATE SET
          nome = excluded.nome,
          pin_hash = excluded.pin_hash,
          perfil = excluded.perfil,
          ativo = excluded.ativo,
          atualizado_em = CURRENT_TIMESTAMP
      `);
      stmtOp.run(
        entidade.id,
        matriculaOp,
        entidade.razao_social,
        pinOp,
        perfilOp,
        entidade.ativo !== undefined ? entidade.ativo : 1
      );

      // Sincroniza usuário e permissões no sistema
      UserSyncService.sincronizarColaboradorParaUsuario(this.writeDb, entidade);
    }
  }

  public excluir(id: string): boolean {
    const ent = this.buscarPorId(id);
    if (ent && ent.tipo === 'FUNCIONARIO') {
      try {
        this.writeDb.prepare("DELETE FROM usuarios WHERE id = ? OR id = ? OR LOWER(login) = LOWER(?)").run(id, `usr_${id}`, (ent.matricula || '').toLowerCase());
      } catch {}
    }
    return this.writeDb.prepare('DELETE FROM entidades WHERE id = ?').run(id).changes > 0;
  }
}
