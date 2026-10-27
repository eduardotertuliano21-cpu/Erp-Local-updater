import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface CertificadoDigital {
  id: string;
  nome_arquivo: string;
  caminho_arquivo: string;
  razao_social?: string;
  cnpj?: string;
  valido_de?: string;
  valido_ate?: string;
  ativo: number;
  criado_em?: string;
}

export class CertificadoRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listar(): CertificadoDigital[] {
    const stmt = this.readDb.prepare(`
      SELECT * FROM certificados_digitais ORDER BY criado_em DESC
    `);
    return stmt.all() as unknown as CertificadoDigital[];
  }

  public buscarPorId(id: string): CertificadoDigital | undefined {
    const stmt = this.readDb.prepare(`
      SELECT * FROM certificados_digitais WHERE id = ?
    `);
    return stmt.get(id) as unknown as CertificadoDigital | undefined;
  }

  public obterAtivo(): CertificadoDigital | undefined {
    const stmt = this.readDb.prepare(`
      SELECT * FROM certificados_digitais WHERE ativo = 1 LIMIT 1
    `);
    return stmt.get() as unknown as CertificadoDigital | undefined;
  }

  public salvar(cert: CertificadoDigital): void {
    const stmt = this.writeDb.prepare(`
      INSERT INTO certificados_digitais (
        id, nome_arquivo, caminho_arquivo, razao_social, cnpj,
        valido_de, valido_ate, ativo, criado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nome_arquivo = excluded.nome_arquivo,
        caminho_arquivo = excluded.caminho_arquivo,
        razao_social = excluded.razao_social,
        cnpj = excluded.cnpj,
        valido_de = excluded.valido_de,
        valido_ate = excluded.valido_ate,
        ativo = excluded.ativo
    `);

    stmt.run(
      cert.id,
      cert.nome_arquivo,
      cert.caminho_arquivo,
      cert.razao_social || null,
      cert.cnpj || null,
      cert.valido_de || null,
      cert.valido_ate || null,
      cert.ativo ? 1 : 0
    );
  }

  public definirAtivo(id: string): void {
    this.writeDb.exec('BEGIN');
    try {
      this.writeDb.prepare('UPDATE certificados_digitais SET ativo = 0').run();
      this.writeDb.prepare('UPDATE certificados_digitais SET ativo = 1 WHERE id = ?').run(id);
      this.writeDb.exec('COMMIT');
    } catch (e) {
      this.writeDb.exec('ROLLBACK');
      throw e;
    }
  }

  public remover(id: string): void {
    const stmt = this.writeDb.prepare('DELETE FROM certificados_digitais WHERE id = ?');
    stmt.run(id);
  }
}
