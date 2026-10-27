import { getCatalogoReadOnlyDb, getCatalogoWriterDb } from '../config/database.js';
import { IOperadorRepository, OperadorRecord } from './IOperadorRepository.js';

export class OperadorRepository implements IOperadorRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public buscarPorMatricula(matricula: string): OperadorRecord | null {
    const stmt = this.readDb.prepare(
      `SELECT * FROM operadores WHERE matricula = ? AND ativo = 1 LIMIT 1`
    );
    const row = stmt.get(matricula.trim());
    return (row as unknown as OperadorRecord) || null;
  }

  public buscarPorPin(pin: string): OperadorRecord | null {
    const limpo = pin.trim();
    const stmt = this.readDb.prepare(
      `SELECT * FROM operadores WHERE (TRIM(pin_hash) = ? OR TRIM(matricula) = ?) AND ativo = 1 LIMIT 1`
    );
    const row = stmt.get(limpo, limpo);
    if (row) return row as unknown as OperadorRecord;

    // Fallback: busca em entidades (funcionários/garçons)
    try {
      const stmtEnt = this.readDb.prepare(
        `SELECT id, matricula, razao_social as nome, pin as pin_hash, cargo, ativo 
         FROM entidades WHERE (TRIM(pin) = ? OR TRIM(matricula) = ?) AND ativo = 1 LIMIT 1`
      );
      const ent = stmtEnt.get(limpo, limpo) as any;
      if (ent) {
        return {
          id: ent.id,
          matricula: ent.matricula || ent.id.substring(0, 4),
          nome: ent.nome,
          pin_hash: ent.pin_hash,
          perfil: (ent.cargo === 'GERENTE' || ent.cargo === 'SUPERVISOR') ? 'SUPERVISOR' : 'OPERADOR',
          ativo: ent.ativo,
        };
      }
    } catch {}

    return null;
  }

  public listarSupervisores(): OperadorRecord[] {
    const stmt = this.readDb.prepare(
      `SELECT * FROM operadores WHERE perfil = 'SUPERVISOR' AND ativo = 1 ORDER BY nome ASC`
    );
    return stmt.all() as unknown as OperadorRecord[];
  }

  public salvarOperadoresSync(operadores: OperadorRecord[]): void {
    const stmt = this.writeDb.prepare(`
      INSERT INTO operadores (id, matricula, nome, pin_hash, perfil, ativo, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(matricula) DO UPDATE SET
        nome = excluded.nome,
        pin_hash = excluded.pin_hash,
        perfil = excluded.perfil,
        ativo = excluded.ativo,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    this.writeDb.exec('BEGIN TRANSACTION;');
    try {
      for (const op of operadores) {
        stmt.run(op.id, op.matricula, op.nome, op.pin_hash, op.perfil, op.ativo);
      }
      this.writeDb.exec('COMMIT;');
    } catch (err) {
      this.writeDb.exec('ROLLBACK;');
      throw err;
    }
  }
}
