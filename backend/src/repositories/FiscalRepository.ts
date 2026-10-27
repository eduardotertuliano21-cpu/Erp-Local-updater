import { getCatalogoReadOnlyDb, getOperacaoDb } from '../config/database.js';
import {
  IFiscalRepository,
  RegraFiscalRecord,
  DocumentoFiscalRecord,
} from './IFiscalRepository.js';

export class FiscalRepository implements IFiscalRepository {
  // catalogo_sync.db (Read-Only)
  private catalogoDb = getCatalogoReadOnlyDb();
  // local_operacao.db (Write/Operation)
  private operacaoDb = getOperacaoDb();

  public obterRegraFiscalPorNcm(ncm: string): RegraFiscalRecord | null {
    const stmt = this.catalogoDb.prepare(
      `SELECT * FROM regras_fiscais WHERE ncm = ? LIMIT 1`
    );
    const row = stmt.get(ncm.trim());
    return (row as unknown as RegraFiscalRecord) || null;
  }

  public obterUltimoNumeroNfce(serie: number): number {
    const stmt = this.operacaoDb.prepare(
      `SELECT MAX(numero) as ultimo FROM documentos_fiscais WHERE serie = ?`
    );
    const row = stmt.get(serie) as { ultimo: number | null } | undefined;
    return (row && row.ultimo) ? row.ultimo : 0;
  }

  public salvarDocumentoFiscal(
    doc: Omit<DocumentoFiscalRecord, 'sincronizado' | 'emitido_em'>
  ): DocumentoFiscalRecord {
    const stmt = this.operacaoDb.prepare(`
      INSERT INTO documentos_fiscais (
        id, venda_id, numero, serie, modelo, chave_acesso, tp_emis,
        status, xml_conteudo, protocolo_autorizacao, motivo_contingencia,
        emitido_em, sincronizado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `);

    stmt.run(
      doc.id,
      doc.venda_id,
      doc.numero,
      doc.serie,
      doc.modelo || '65',
      doc.chave_acesso,
      doc.tp_emis,
      doc.status,
      doc.xml_conteudo,
      doc.protocolo_autorizacao || null,
      doc.motivo_contingencia || null
    );

    const selectStmt = this.operacaoDb.prepare(
      `SELECT * FROM documentos_fiscais WHERE id = ?`
    );
    return selectStmt.get(doc.id) as unknown as DocumentoFiscalRecord;
  }

  public obterDocumentoFiscalPorVenda(vendaId: string): DocumentoFiscalRecord | null {
    const stmt = this.operacaoDb.prepare(
      `SELECT * FROM documentos_fiscais WHERE venda_id = ? LIMIT 1`
    );
    const row = stmt.get(vendaId);
    return (row as unknown as DocumentoFiscalRecord) || null;
  }

  public listarDocumentosContingenciaPendentes(limite = 50): DocumentoFiscalRecord[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT * FROM documentos_fiscais 
      WHERE status = 'EMITIDA_CONTINGENCIA' AND sincronizado = 0 
      ORDER BY emitido_em ASC LIMIT ?
    `);
    return stmt.all(limite) as unknown as DocumentoFiscalRecord[];
  }

  public marcarDocumentoAutorizado(id: string, protocolo: string): void {
    const stmt = this.operacaoDb.prepare(`
      UPDATE documentos_fiscais 
      SET status = 'AUTORIZADA', protocolo_autorizacao = ?, sincronizado = 1, sincronizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(protocolo, id);
  }

  public cancelarDocumentoFiscal(vendaId: string, motivo: string): void {
    const stmt = this.operacaoDb.prepare(`
      UPDATE documentos_fiscais 
      SET status = 'CANCELADA', motivo_contingencia = ?, sincronizado = 0
      WHERE venda_id = ?
    `);
    stmt.run(motivo, vendaId);
  }
}
