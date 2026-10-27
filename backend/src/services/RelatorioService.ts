import { getOperacaoDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface ResumoGeralERP {
  totalVendasHoje: number;
  faturamentoHoje: number;
  ticketMedioHoje: number;
  totalNfceEmitidas: number;
  totalNfceContingencia: number;
  faturamentoPorMetodo: Record<string, number>;
  produtosCadastrados: number;
}

export interface FiltroVendasRelatorio {
  inicio?: string;
  fim?: string;
  tipoFiscal?: 'TODAS' | 'FISCAL' | 'NAO_FISCAL';
  status?: string;
  limite?: number;
}

export class RelatorioService {
  private operacaoDb = getOperacaoDb();
  private catalogoDb = getCatalogoReadOnlyDb();

  public obterResumoGeral(): ResumoGeralERP {
    const hoje = new Date().toISOString().slice(0, 10);

    // Vendas e Faturamento de hoje
    const stmtVendas = this.operacaoDb.prepare(`
      SELECT 
        COUNT(*) as totalVendas,
        COALESCE(SUM(total_liquido), 0) as faturamentoTotal
      FROM vendas 
      WHERE DATE(criado_em) = DATE(?) AND status = 'CONCLUIDA'
    `);
    const rowVendas = stmtVendas.get(hoje) as { totalVendas: number; faturamentoTotal: number } | undefined;
    const totalVendas = rowVendas?.totalVendas || 0;
    const faturamento = rowVendas?.faturamentoTotal || 0;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    // Documentos Fiscais
    const stmtFiscais = this.operacaoDb.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'EMITIDA_CONTINGENCIA' THEN 1 ELSE 0 END) as contingencias
      FROM documentos_fiscais
    `);
    const rowFiscais = stmtFiscais.get() as { total: number; contingencias: number } | undefined;

    // Faturamento por Método de Pagamento
    const stmtMetodos = this.operacaoDb.prepare(`
      SELECT p.metodo, COALESCE(SUM(p.valor), 0) as total
      FROM pagamentos_venda p
      JOIN vendas v ON v.id = p.venda_id
      WHERE v.status = 'CONCLUIDA'
      GROUP BY p.metodo
    `);
    const rowsMetodos = stmtMetodos.all() as Array<{ metodo: string; total: number }>;
    const faturamentoPorMetodo: Record<string, number> = {};
    for (const r of rowsMetodos) {
      faturamentoPorMetodo[r.metodo] = r.total;
    }

    // Contagem de produtos no catálogo
    const stmtProds = this.catalogoDb.prepare(`SELECT COUNT(*) as total FROM produtos WHERE ativo = 1`);
    const rowProds = stmtProds.get() as { total: number } | undefined;

    return {
      totalVendasHoje: totalVendas,
      faturamentoHoje: faturamento,
      ticketMedioHoje: parseFloat(ticketMedio.toFixed(2)),
      totalNfceEmitidas: rowFiscais?.total || 0,
      totalNfceContingencia: rowFiscais?.contingencias || 0,
      faturamentoPorMetodo,
      produtosCadastrados: rowProds?.total || 0,
    };
  }

  public listarVendasAnalitico(filtro: FiltroVendasRelatorio = {}): any[] {
    const { inicio, fim, tipoFiscal, status, limite = 100 } = filtro;
    const condicoes: string[] = ['1=1'];
    const params: any[] = [];

    if (inicio && inicio.trim()) {
      condicoes.push('DATE(v.criado_em) >= DATE(?)');
      params.push(inicio.trim());
    }

    if (fim && fim.trim()) {
      condicoes.push('DATE(v.criado_em) <= DATE(?)');
      params.push(fim.trim());
    }

    if (status && status !== 'TODOS') {
      condicoes.push('v.status = ?');
      params.push(status);
    }

    if (tipoFiscal === 'FISCAL') {
      condicoes.push("df.id IS NOT NULL AND df.status != 'CANCELADA'");
    } else if (tipoFiscal === 'NAO_FISCAL') {
      condicoes.push("(df.id IS NULL OR df.status = 'CANCELADA')");
    }

    const sql = `
      SELECT 
        v.id, v.numero_sequencial, v.operador_id, v.cpf_cliente,
        v.subtotal, v.desconto, v.total_liquido, v.troco, v.status, v.criado_em,
        v.sincronizado,
        df.id as fiscal_id,
        df.numero as fiscal_numero,
        df.serie as fiscal_serie,
        df.chave_acesso as fiscal_chave,
        df.status as fiscal_status,
        df.protocolo_autorizacao as fiscal_protocolo,
        df.emitido_em as fiscal_emitido_em,
        (SELECT COUNT(*) FROM itens_venda WHERE venda_id = v.id) as total_itens,
        (SELECT GROUP_CONCAT(metodo, ', ') FROM pagamentos_venda WHERE venda_id = v.id) as metodos_pagamento
      FROM vendas v
      LEFT JOIN documentos_fiscais df ON df.venda_id = v.id
      WHERE ${condicoes.join(' AND ')}
      ORDER BY v.criado_em DESC
      LIMIT ?
    `;
    params.push(limite);

    const stmt = this.operacaoDb.prepare(sql);
    return stmt.all(...params);
  }

  public listarSessoesCaixa(limite = 50): any[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT 
        c.id,
        c.numero,
        COALESCE(c.operador_abertura, 'ADMIN') AS operador_abertura,
        COALESCE(c.operador_abertura, 'ADMIN') AS operador,
        c.status,
        COALESCE(c.saldo_inicial, 0) AS saldo_inicial,
        c.saldo_final,
        c.aberto_em,
        c.fechado_em,
        c.sincronizado,
        (SELECT COUNT(*) FROM vendas WHERE caixa_id = c.id AND status = 'CONCLUIDA') as total_vendas,
        (SELECT COALESCE(SUM(total_liquido), 0) FROM vendas WHERE caixa_id = c.id AND status = 'CONCLUIDA') as faturamento_total,
        (SELECT COALESCE(SUM(valor), 0) FROM caixa_movimentacoes WHERE caixa_id = c.id AND tipo = 'SANGRIA') as total_sangrias,
        (SELECT COALESCE(SUM(valor), 0) FROM caixa_movimentacoes WHERE caixa_id = c.id AND tipo = 'SUPRIMENTO') as total_suprimentos
      FROM caixas c
      ORDER BY c.aberto_em DESC
      LIMIT ?
    `);
    return stmt.all(limite);
  }

  public listarMovimentacoesCaixa(): any[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT m.*, c.numero as caixa_numero
      FROM caixa_movimentacoes m
      JOIN caixas c ON c.id = m.caixa_id
      ORDER BY m.criado_em DESC
      LIMIT 50
    `);
    return stmt.all();
  }

  public listarLogsAuditoria(): any[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT * FROM logs_auditoria ORDER BY criado_em DESC LIMIT 50
    `);
    return stmt.all();
  }
}
