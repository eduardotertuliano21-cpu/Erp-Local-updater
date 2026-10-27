import { getOperacaoDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface EstoqueMovimento {
  id: string;
  produto_id: string;
  tipo: 'ENTRADA_COMPRA' | 'SAIDA_VENDA' | 'AJUSTE_INVENTARIO' | 'PERDA_AVARIA' | 'TRANSFERENCIA';
  almoxarifado: 'LOJA' | 'DEPOSITO' | 'DEFEITO' | 'TRANSITO';
  quantidade: number;
  custo_unitario: number;
  documento_referencia?: string;
  motivo?: string;
  operador_id?: string;
  criado_em?: string;
}

export class EstoqueRepository {
  private operacaoDb = getOperacaoDb();
  private catalogoDb = getCatalogoReadOnlyDb();

  public registrarMovimento(mov: EstoqueMovimento): void {
    const stmt = this.operacaoDb.prepare(`
      INSERT INTO estoque_movimentos (
        id, produto_id, tipo, almoxarifado, quantidade, custo_unitario,
        documento_referencia, motivo, operador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      mov.id,
      mov.produto_id,
      mov.tipo,
      mov.almoxarifado,
      mov.quantidade,
      mov.custo_unitario,
      mov.documento_referencia || null,
      mov.motivo || null,
      mov.operador_id || null
    );
  }

  public listarMovimentos(produtoId?: string, limite = 100): EstoqueMovimento[] {
    let sql = 'SELECT * FROM estoque_movimentos WHERE 1=1';
    const params: any[] = [];

    if (produtoId) {
      sql += ' AND produto_id = ?';
      params.push(produtoId);
    }

    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(limite);

    const stmt = this.operacaoDb.prepare(sql);
    return stmt.all(...params) as unknown as EstoqueMovimento[];
  }

  public obterSaldoProduto(produtoId: string): number {
    const row = this.operacaoDb.prepare(`
      SELECT SUM(CASE 
        WHEN tipo IN ('ENTRADA_COMPRA', 'AJUSTE_INVENTARIO') THEN quantidade 
        ELSE -quantidade 
      END) as saldo
      FROM estoque_movimentos
      WHERE produto_id = ?
    `).get(produtoId) as { saldo: number | null } | undefined;
    return row?.saldo ?? 0;
  }

  public obterPosicaoEstoque(limite = 50, offset = 0): Array<{
    produto_id: string;
    descricao: string;
    codigo_barras: string;
    unidade_medida: string;
    saldo_loja: number;
    saldo_deposito: number;
    saldo_defeito: number;
    saldo_total: number;
  }> {
    const prods = this.catalogoDb.prepare(`
      SELECT id, codigo_barras, descricao, unidade_medida 
      FROM produtos 
      WHERE ativo = 1 
      ORDER BY descricao ASC 
      LIMIT ? OFFSET ?
    `).all(limite, offset) as any[];

    if (prods.length === 0) return [];

    const ids = prods.map((p) => p.id);
    const placeholders = ids.map(() => '?').join(',');

    const movs = this.operacaoDb.prepare(`
      SELECT 
        produto_id,
        almoxarifado,
        SUM(CASE 
          WHEN tipo IN ('ENTRADA_COMPRA', 'AJUSTE_INVENTARIO') THEN quantidade 
          ELSE -quantidade 
        END) as saldo
      FROM estoque_movimentos
      WHERE produto_id IN (${placeholders})
      GROUP BY produto_id, almoxarifado
    `).all(...ids) as Array<{ produto_id: string; almoxarifado: string; saldo: number }>;

    const mapaMov: Record<string, Record<string, number>> = {};
    for (const m of movs) {
      if (!mapaMov[m.produto_id]) mapaMov[m.produto_id] = {};
      mapaMov[m.produto_id][m.almoxarifado] = m.saldo;
    }

    return prods.map((p) => {
      const loja = mapaMov[p.id]?.['LOJA'] || 0;
      const dep = mapaMov[p.id]?.['DEPOSITO'] || 0;
      const def = mapaMov[p.id]?.['DEFEITO'] || 0;
      return {
        produto_id: p.id,
        codigo_barras: p.codigo_barras,
        descricao: p.descricao,
        unidade_medida: p.unidade_medida || 'UN',
        saldo_loja: loja,
        saldo_deposito: dep,
        saldo_defeito: def,
        saldo_total: loja + dep + def,
      };
    });
  }
}
