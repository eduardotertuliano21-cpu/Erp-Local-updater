import { getOperacaoDb } from '../config/database.js';

export interface CaixaPretaRegistro {
  id: number;
  timestamp: string;
  tipo_evento: string;
  codigo_original: string;
  diagnostico_ia: string;
  resolvido: number;
}

export class CaixaPretaRepository {
  private operacaoDb = getOperacaoDb();

  public registrarErro(
    tipoEvento: string,
    codigoOriginal: string,
    diagnosticoIa: string
  ): CaixaPretaRegistro {
    const stmt = this.operacaoDb.prepare(`
      INSERT INTO caixa_preta_erros (tipo_evento, codigo_original, diagnostico_ia, resolvido)
      VALUES (?, ?, ?, 0)
    `);

    const result = stmt.run(tipoEvento, codigoOriginal, diagnosticoIa);
    const lastId = Number(result.lastInsertRowid);

    const selectStmt = this.operacaoDb.prepare(
      `SELECT * FROM caixa_preta_erros WHERE id = ?`
    );
    return selectStmt.get(lastId) as unknown as CaixaPretaRegistro;
  }

  public listarNaoResolvidos(limite: number = 50): CaixaPretaRegistro[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT * FROM caixa_preta_erros 
      WHERE resolvido = 0 
      ORDER BY id DESC 
      LIMIT ?
    `);
    return stmt.all(limite) as unknown as CaixaPretaRegistro[];
  }

  public listarTodos(limite: number = 100): CaixaPretaRegistro[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT * FROM caixa_preta_erros 
      ORDER BY id DESC 
      LIMIT ?
    `);
    return stmt.all(limite) as unknown as CaixaPretaRegistro[];
  }

  public obterPorId(id: number): CaixaPretaRegistro | null {
    const stmt = this.operacaoDb.prepare(
      `SELECT * FROM caixa_preta_erros WHERE id = ?`
    );
    const row = stmt.get(id);
    return (row as unknown as CaixaPretaRegistro) || null;
  }

  public marcarResolvido(id: number): boolean {
    const stmt = this.operacaoDb.prepare(`
      UPDATE caixa_preta_erros 
      SET resolvido = 1 
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
