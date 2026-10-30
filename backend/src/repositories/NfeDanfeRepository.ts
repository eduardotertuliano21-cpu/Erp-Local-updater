import { getOperacaoDb } from '../config/database.js';

export interface NotaNfeDanfeRecord {
  id: string;
  numero: number;
  serie: number;
  chave_acesso: string;
  natureza_operacao: string;
  tipo_operacao: string;
  finalidade: string;
  destinatario_documento: string;
  destinatario_nome: string;
  destinatario_ie?: string;
  destinatario_email?: string;
  destinatario_telefone?: string;
  destinatario_endereco_json: string;
  itens_json: string;
  transporte_json: string;
  pagamento_json: string;
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outras_despesas: number;
  valor_icms: number;
  valor_ipi: number;
  valor_total: number;
  informacoes_complementares?: string;
  status: 'AUTORIZADA' | 'CONTINGENCIA' | 'CANCELADA';
  protocolo: string;
  motivo_cancelamento?: string;
  caminho_pasta: string;
  caminho_xml: string;
  caminho_danfe_html: string;
  nome_arquivo_base: string;
  xml_conteudo: string;
  danfe_html: string;
  operador_id?: string;
  emitido_em: string;
  cancelado_em?: string;
}

export class NfeDanfeRepository {
  private db = getOperacaoDb();

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notas_nfe_danfe (
        id TEXT PRIMARY KEY,
        numero INTEGER NOT NULL,
        serie INTEGER NOT NULL DEFAULT 1,
        chave_acesso TEXT NOT NULL,
        natureza_operacao TEXT NOT NULL DEFAULT 'VENDA DE MERCADORIA',
        tipo_operacao TEXT NOT NULL DEFAULT '1',
        finalidade TEXT NOT NULL DEFAULT '1',
        destinatario_documento TEXT NOT NULL,
        destinatario_nome TEXT NOT NULL,
        destinatario_ie TEXT,
        destinatario_email TEXT,
        destinatario_telefone TEXT,
        destinatario_endereco_json TEXT,
        itens_json TEXT NOT NULL,
        transporte_json TEXT,
        pagamento_json TEXT,
        valor_produtos REAL NOT NULL DEFAULT 0,
        valor_frete REAL NOT NULL DEFAULT 0,
        valor_seguro REAL NOT NULL DEFAULT 0,
        valor_desconto REAL NOT NULL DEFAULT 0,
        valor_outras_despesas REAL NOT NULL DEFAULT 0,
        valor_icms REAL NOT NULL DEFAULT 0,
        valor_ipi REAL NOT NULL DEFAULT 0,
        valor_total REAL NOT NULL DEFAULT 0,
        informacoes_complementares TEXT,
        status TEXT NOT NULL DEFAULT 'AUTORIZADA',
        protocolo TEXT,
        motivo_cancelamento TEXT,
        caminho_pasta TEXT,
        caminho_xml TEXT,
        caminho_danfe_html TEXT,
        nome_arquivo_base TEXT,
        xml_conteudo TEXT,
        danfe_html TEXT,
        operador_id TEXT DEFAULT 'OPERADOR',
        emitido_em TEXT DEFAULT CURRENT_TIMESTAMP,
        cancelado_em TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_nfe_danfe_emitido ON notas_nfe_danfe(emitido_em);
      CREATE INDEX IF NOT EXISTS idx_nfe_danfe_dest ON notas_nfe_danfe(destinatario_nome);
    `);
  }

  public obterProximoNumero(serie = 1): number {
    this.ensureSchema();
    const row = this.db
      .prepare(`SELECT MAX(numero) as ultimo FROM notas_nfe_danfe WHERE serie = ?`)
      .get(serie) as { ultimo: number | null } | undefined;
    return (row?.ultimo || 0) + 1;
  }

  public salvar(nota: Omit<NotaNfeDanfeRecord, 'emitido_em'>): NotaNfeDanfeRecord {
    this.ensureSchema();
    this.db
      .prepare(`
      INSERT INTO notas_nfe_danfe (
        id, numero, serie, chave_acesso, natureza_operacao, tipo_operacao, finalidade,
        destinatario_documento, destinatario_nome, destinatario_ie, destinatario_email, destinatario_telefone,
        destinatario_endereco_json, itens_json, transporte_json, pagamento_json,
        valor_produtos, valor_frete, valor_seguro, valor_desconto, valor_outras_despesas,
        valor_icms, valor_ipi, valor_total, informacoes_complementares,
        status, protocolo, caminho_pasta, caminho_xml, caminho_danfe_html, nome_arquivo_base,
        xml_conteudo, danfe_html, operador_id, emitido_em
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
    `)
      .run(
        nota.id,
        nota.numero,
        nota.serie,
        nota.chave_acesso,
        nota.natureza_operacao,
        nota.tipo_operacao,
        nota.finalidade,
        nota.destinatario_documento,
        nota.destinatario_nome,
        nota.destinatario_ie || null,
        nota.destinatario_email || null,
        nota.destinatario_telefone || null,
        nota.destinatario_endereco_json,
        nota.itens_json,
        nota.transporte_json,
        nota.pagamento_json,
        nota.valor_produtos,
        nota.valor_frete,
        nota.valor_seguro,
        nota.valor_desconto,
        nota.valor_outras_despesas,
        nota.valor_icms,
        nota.valor_ipi,
        nota.valor_total,
        nota.informacoes_complementares || null,
        nota.status,
        nota.protocolo,
        nota.caminho_pasta,
        nota.caminho_xml,
        nota.caminho_danfe_html,
        nota.nome_arquivo_base,
        nota.xml_conteudo,
        nota.danfe_html,
        nota.operador_id || 'OPERADOR'
      );

    return this.obterPorId(nota.id)!;
  }

  public obterPorId(id: string): NotaNfeDanfeRecord | null {
    this.ensureSchema();
    const row = this.db.prepare(`SELECT * FROM notas_nfe_danfe WHERE id = ? LIMIT 1`).get(id);
    return (row as unknown as NotaNfeDanfeRecord) || null;
  }

  public listar(filtros?: { inicio?: string; fim?: string; status?: string; q?: string; limite?: number }) {
    this.ensureSchema();
    const conds: string[] = ['1=1'];
    const params: any[] = [];

    if (filtros?.inicio) {
      conds.push(`date(emitido_em) >= date(?)`);
      params.push(filtros.inicio);
    }
    if (filtros?.fim) {
      conds.push(`date(emitido_em) <= date(?)`);
      params.push(filtros.fim);
    }
    if (filtros?.status && filtros.status !== 'TODAS') {
      conds.push(`status = ?`);
      params.push(filtros.status);
    }
    if (filtros?.q && filtros.q.trim()) {
      const t = `%${filtros.q.trim()}%`;
      conds.push(`(destinatario_nome LIKE ? OR destinatario_documento LIKE ? OR CAST(numero AS TEXT) LIKE ? OR chave_acesso LIKE ? OR nome_arquivo_base LIKE ?)`);
      params.push(t, t, t, t, t);
    }

    const where = conds.join(' AND ');
    const limite = filtros?.limite || 100;

    const notas = this.db
      .prepare(`
      SELECT
        id, numero, serie, chave_acesso, natureza_operacao, tipo_operacao, finalidade,
        destinatario_documento, destinatario_nome, valor_produtos, valor_frete, valor_desconto,
        valor_icms, valor_ipi, valor_total, status, protocolo, motivo_cancelamento,
        caminho_pasta, caminho_xml, caminho_danfe_html, nome_arquivo_base, operador_id, emitido_em, cancelado_em
      FROM notas_nfe_danfe
      WHERE ${where}
      ORDER BY numero DESC, emitido_em DESC
      LIMIT ?
    `)
      .all(...params, limite) as any[];

    const resumo = this.db
      .prepare(`
      SELECT
        COUNT(*) as total_notas,
        SUM(CASE WHEN status != 'CANCELADA' THEN 1 ELSE 0 END) as qtd_autorizadas,
        SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END) as qtd_canceladas,
        COALESCE(SUM(CASE WHEN status != 'CANCELADA' THEN valor_total ELSE 0 END), 0) as valor_total_autorizadas,
        COALESCE(SUM(CASE WHEN status != 'CANCELADA' THEN valor_produtos ELSE 0 END), 0) as valor_produtos_total,
        COALESCE(SUM(CASE WHEN status != 'CANCELADA' THEN valor_icms ELSE 0 END), 0) as valor_icms_total,
        COALESCE(SUM(CASE WHEN status != 'CANCELADA' THEN valor_ipi ELSE 0 END), 0) as valor_ipi_total,
        COALESCE(SUM(CASE WHEN status != 'CANCELADA' THEN valor_frete ELSE 0 END), 0) as valor_frete_total
      FROM notas_nfe_danfe
      WHERE ${where}
    `)
      .get(...params) as any;

    return { notas, resumo };
  }

  public cancelar(id: string, motivo: string, danfeHtmlAtualizado: string): void {
    this.ensureSchema();
    this.db
      .prepare(`
      UPDATE notas_nfe_danfe
      SET status = 'CANCELADA', motivo_cancelamento = ?, danfe_html = ?, cancelado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(motivo, danfeHtmlAtualizado, id);
  }
}
