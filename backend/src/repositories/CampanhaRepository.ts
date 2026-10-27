import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import { CampanhaPromocional, Produto } from '../types/api.js';
import crypto from 'node:crypto';

export class CampanhaRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listar(): CampanhaPromocional[] {
    const stmt = this.readDb.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM produtos p WHERE p.campanha_id = c.id AND p.ativo = 1) AS produtos_count
      FROM campanhas_promocionais c
      ORDER BY c.criado_em DESC
    `);
    return stmt.all() as unknown as CampanhaPromocional[];
  }

  public buscarPorId(id: string): CampanhaPromocional | null {
    const stmt = this.readDb.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM produtos p WHERE p.campanha_id = c.id AND p.ativo = 1) AS produtos_count
      FROM campanhas_promocionais c
      WHERE c.id = ?
      LIMIT 1
    `);
    const row = stmt.get(id);
    return (row as unknown as CampanhaPromocional) || null;
  }

  public salvar(c: Partial<CampanhaPromocional>): CampanhaPromocional {
    const id = c.id || crypto.randomUUID();
    const nome = (c.nome_campanha || 'Campanha Promocional').trim().toUpperCase();
    const tipo = c.tipo_desconto === 'VALOR_FIXO' ? 'VALOR_FIXO' : 'PORCENTAGEM';
    const valor = Number(c.valor_desconto) || 0;
    const inicio = c.data_inicio || new Date().toISOString().split('T')[0];
    const fim = c.data_fim || new Date().toISOString().split('T')[0];
    const status = c.status === 'INATIVA' ? 'INATIVA' : 'ATIVA';

    const stmt = this.writeDb.prepare(`
      INSERT INTO campanhas_promocionais (
        id, nome_campanha, tipo_desconto, valor_desconto,
        data_inicio, data_fim, status, criado_em, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nome_campanha = excluded.nome_campanha,
        tipo_desconto = excluded.tipo_desconto,
        valor_desconto = excluded.valor_desconto,
        data_inicio = excluded.data_inicio,
        data_fim = excluded.data_fim,
        status = excluded.status,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(id, nome, tipo, valor, inicio, fim, status);
    return this.buscarPorId(id)!;
  }

  public excluir(id: string): boolean {
    this.writeDb.exec('BEGIN TRANSACTION;');
    try {
      this.writeDb.prepare('UPDATE produtos SET campanha_id = NULL WHERE campanha_id = ?').run(id);
      const res = this.writeDb.prepare('DELETE FROM campanhas_promocionais WHERE id = ?').run(id);
      this.writeDb.exec('COMMIT;');
      return res.changes > 0;
    } catch (err) {
      this.writeDb.exec('ROLLBACK;');
      throw err;
    }
  }

  public vincularProdutos(campanhaId: string, produtoIds: string[]): void {
    if (!produtoIds || produtoIds.length === 0) return;
    this.writeDb.exec('BEGIN TRANSACTION;');
    try {
      const stmt = this.writeDb.prepare('UPDATE produtos SET campanha_id = ? WHERE id = ?');
      for (const pid of produtoIds) {
        stmt.run(campanhaId, pid);
      }
      this.writeDb.exec('COMMIT;');
    } catch (err) {
      this.writeDb.exec('ROLLBACK;');
      throw err;
    }
  }

  public desvincularProdutos(produtoIds: string[]): void {
    if (!produtoIds || produtoIds.length === 0) return;
    this.writeDb.exec('BEGIN TRANSACTION;');
    try {
      const stmt = this.writeDb.prepare('UPDATE produtos SET campanha_id = NULL WHERE id = ?');
      for (const pid of produtoIds) {
        stmt.run(pid);
      }
      this.writeDb.exec('COMMIT;');
    } catch (err) {
      this.writeDb.exec('ROLLBACK;');
      throw err;
    }
  }

  public listarProdutosCampanha(campanhaId: string): Produto[] {
    const stmt = this.readDb.prepare(`
      SELECT * FROM produtos WHERE campanha_id = ? AND ativo = 1 ORDER BY descricao ASC
    `);
    return stmt.all(campanhaId) as unknown as Produto[];
  }
}
