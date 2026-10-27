import { getOperacaoDb } from '../config/database.js';

export interface TituloFinanceiro {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  entidade_id?: string;
  entidade_nome: string;
  descricao: string;
  valor: number;
  valor_pago?: number;
  vencimento: string;
  pago_em?: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'VENCIDO';
  categoria: string;
  venda_id?: string;
  criado_em?: string;
}

export class FinanceiroRepository {
  private db = getOperacaoDb();

  public listar(tipo?: string, status?: string): TituloFinanceiro[] {
    let sql = 'SELECT * FROM financeiro_titulos WHERE 1=1';
    const params: any[] = [];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vencimento ASC LIMIT 200';
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as unknown as TituloFinanceiro[];
  }

  public salvar(t: TituloFinanceiro): void {
    const stmt = this.db.prepare(`
      INSERT INTO financeiro_titulos (
        id, tipo, entidade_id, entidade_nome, descricao, valor, valor_pago,
        vencimento, pago_em, status, categoria, venda_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        entidade_nome = excluded.entidade_nome,
        descricao = excluded.descricao,
        valor = excluded.valor,
        valor_pago = excluded.valor_pago,
        vencimento = excluded.vencimento,
        pago_em = excluded.pago_em,
        status = excluded.status,
        categoria = excluded.categoria
    `);

    stmt.run(
      t.id,
      t.tipo,
      t.entidade_id || null,
      t.entidade_nome,
      t.descricao,
      t.valor,
      t.valor_pago || 0,
      t.vencimento,
      t.pago_em || null,
      t.status,
      t.categoria || 'GERAL',
      t.venda_id || null
    );
  }

  public liquidar(id: string, valorPago: number, dataPagamento: string): void {
    const stmt = this.db.prepare(`
      UPDATE financeiro_titulos
      SET valor_pago = ?, pago_em = ?, status = 'PAGO'
      WHERE id = ?
    `);
    stmt.run(valorPago, dataPagamento, id);
  }

  public obterTotaisGerais(): {
    totalPagarPendente: number;
    totalReceberPendente: number;
    totalPagoMes: number;
    totalRecebidoMes: number;
  } {
    const pagarPend = this.db.prepare(`
      SELECT COALESCE(SUM(valor - valor_pago), 0) as total FROM financeiro_titulos WHERE tipo = 'PAGAR' AND status = 'PENDENTE'
    `).get() as { total: number };

    const receberPend = this.db.prepare(`
      SELECT COALESCE(SUM(valor - valor_pago), 0) as total FROM financeiro_titulos WHERE tipo = 'RECEBER' AND status = 'PENDENTE'
    `).get() as { total: number };

    const mesAtual = new Date().toISOString().slice(0, 7);

    const pagoMes = this.db.prepare(`
      SELECT COALESCE(SUM(valor_pago), 0) as total FROM financeiro_titulos WHERE tipo = 'PAGAR' AND status = 'PAGO' AND pago_em LIKE ?
    `).get(`${mesAtual}%`) as { total: number };

    const recebidoMes = this.db.prepare(`
      SELECT COALESCE(SUM(valor_pago), 0) as total FROM financeiro_titulos WHERE tipo = 'RECEBER' AND status = 'PAGO' AND pago_em LIKE ?
    `).get(`${mesAtual}%`) as { total: number };

    return {
      totalPagarPendente: pagarPend.total,
      totalReceberPendente: receberPend.total,
      totalPagoMes: pagoMes.total,
      totalRecebidoMes: recebidoMes.total,
    };
  }

  public calcularDRE(mesAno: string): {
    receitaBruta: number;
    descontosVenda: number;
    receitaLiquida: number;
    custoMercadorias: number;
    lucroBruto: number;
    despesasOperacionais: Record<string, number>;
    totalDespesas: number;
    resultadoLiquido: number;
  } {
    // 1. Receitas de Vendas
    const vendasStmt = this.db.prepare(`
      SELECT COALESCE(SUM(subtotal), 0) as bruta, COALESCE(SUM(desconto), 0) as descontos, COALESCE(SUM(total_liquido), 0) as liquida
      FROM vendas WHERE status = 'CONCLUIDA' AND criado_em LIKE ?
    `);
    const vendasRes = vendasStmt.get(`${mesAno}%`) as { bruta: number; descontos: number; liquida: number };

    // 2. Estimativa CMV (base 60% se sem custo explícito)
    const custoMercadorias = vendasRes.liquida * 0.60;
    const lucroBruto = vendasRes.liquida - custoMercadorias;

    // 3. Despesas pagas no período agrupadas por categoria
    const despesasStmt = this.db.prepare(`
      SELECT categoria, COALESCE(SUM(valor_pago), 0) as total
      FROM financeiro_titulos
      WHERE tipo = 'PAGAR' AND status = 'PAGO' AND pago_em LIKE ?
      GROUP BY categoria
    `);
    const despesasRows = despesasStmt.all(`${mesAno}%`) as Array<{ categoria: string; total: number }>;

    const despesasOperacionais: Record<string, number> = {};
    let totalDespesas = 0;
    for (const d of despesasRows) {
      despesasOperacionais[d.categoria] = d.total;
      totalDespesas += d.total;
    }

    const resultadoLiquido = lucroBruto - totalDespesas;

    return {
      receitaBruta: vendasRes.bruta,
      descontosVenda: vendasRes.descontos,
      receitaLiquida: vendasRes.liquida,
      custoMercadorias,
      lucroBruto,
      despesasOperacionais,
      totalDespesas,
      resultadoLiquido,
    };
  }
}
