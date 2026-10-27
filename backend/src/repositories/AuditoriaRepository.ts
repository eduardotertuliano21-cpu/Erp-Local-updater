import crypto from 'node:crypto';
import { getOperacaoDb } from '../config/database.js';

export interface LogAuditoriaDTO {
  id: string;
  usuario_id?: string;
  usuario_nome?: string;
  acao: string;
  detalhes?: string;
  motivo?: string;
  ip_origem?: string;
  criado_em: string;
}

export class AuditoriaRepository {
  private getDb() {
    return getOperacaoDb();
  }

  public registrar(dados: {
    usuario_id?: string;
    usuario_nome?: string;
    acao: string;
    detalhes?: string;
    motivo?: string;
    ip_origem?: string;
  }): LogAuditoriaDTO {
    const id = `aud_${crypto.randomUUID()}`;
    const db = this.getDb();
    db.prepare(`
      INSERT INTO logs_auditoria (id, usuario_id, usuario_nome, acao, detalhes, motivo, ip_origem, autorizado_por_id, operador_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dados.usuario_id || 'SISTEMA',
      dados.usuario_nome || 'Operador Local',
      dados.acao,
      dados.detalhes || null,
      dados.motivo || null,
      dados.ip_origem || '127.0.0.1',
      (dados as any).autorizado_por_id || null,
      (dados as any).operador_id || dados.usuario_id || null
    );

    return {
      id,
      ...dados,
      criado_em: new Date().toISOString(),
    };
  }

  public listar(limite = 100, acaoFiltro?: string): LogAuditoriaDTO[] {
    const db = this.getDb();
    if (acaoFiltro) {
      return db.prepare(`
        SELECT id, usuario_id, usuario_nome, acao, detalhes, motivo, ip_origem, criado_em
        FROM logs_auditoria
        WHERE acao = ?
        ORDER BY criado_em DESC
        LIMIT ?
      `).all(acaoFiltro, limite) as unknown as LogAuditoriaDTO[];
    }

    return db.prepare(`
      SELECT id, usuario_id, usuario_nome, acao, detalhes, motivo, ip_origem, criado_em
      FROM logs_auditoria
      ORDER BY criado_em DESC
      LIMIT ?
    `).all(limite) as unknown as LogAuditoriaDTO[];
  }
}
