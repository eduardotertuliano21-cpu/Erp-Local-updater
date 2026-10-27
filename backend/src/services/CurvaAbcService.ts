import { getOperacaoDb } from '../config/database.js';

export interface ProdutoCurvaAbc {
  produto_id: string;
  descricao: string;
  quantidade_total: number;
  faturamento_total: number;
  percentual_faturamento: number;
  percentual_acumulado: number;
  classe: 'A' | 'B' | 'C';
}

export interface CurvaAbcResumo {
  totalFaturamento: number;
  totalItensVendidos: number;
  resumoClasses: {
    classeA: { quantidadeProdutos: number; faturamento: number; percentual: number };
    classeB: { quantidadeProdutos: number; faturamento: number; percentual: number };
    classeC: { quantidadeProdutos: number; faturamento: number; percentual: number };
  };
  produtos: ProdutoCurvaAbc[];
}

export class CurvaAbcService {
  public calcular(dataInicio?: string, dataFim?: string): CurvaAbcResumo {
    const db = getOperacaoDb();
    let whereClauses = ["v.status != 'CANCELADA'"];
    const params: any[] = [];

    if (dataInicio) {
      whereClauses.push('date(v.criado_em) >= date(?)');
      params.push(dataInicio);
    }
    if (dataFim) {
      whereClauses.push('date(v.criado_em) <= date(?)');
      params.push(dataFim);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        iv.produto_id,
        iv.descricao,
        SUM(iv.quantidade) as quantidade_total,
        SUM(iv.preco_unitario * iv.quantidade - IFNULL(iv.desconto, 0)) as faturamento_total
      FROM itens_venda iv
      JOIN vendas v ON v.id = iv.venda_id
      ${whereSql}
      GROUP BY iv.produto_id, iv.descricao
      ORDER BY faturamento_total DESC
    `;

    const rows = db.prepare(query).all(...params) as any[];

    const totalFaturamento = rows.reduce((acc, r) => acc + Number(r.faturamento_total || 0), 0);
    const totalItensVendidos = rows.reduce((acc, r) => acc + Number(r.quantidade_total || 0), 0);

    let acumulado = 0;
    const produtos: ProdutoCurvaAbc[] = [];

    let countA = 0, fatA = 0;
    let countB = 0, fatB = 0;
    let countC = 0, fatC = 0;

    for (const r of rows) {
      const faturamento = Number(r.faturamento_total || 0);
      const percentual = totalFaturamento > 0 ? (faturamento / totalFaturamento) * 100 : 0;
      acumulado += percentual;

      let classe: 'A' | 'B' | 'C' = 'C';
      if (acumulado <= 80 || (produtos.length === 0 && totalFaturamento > 0)) {
        classe = 'A';
        countA++;
        fatA += faturamento;
      } else if (acumulado <= 95) {
        classe = 'B';
        countB++;
        fatB += faturamento;
      } else {
        classe = 'C';
        countC++;
        fatC += faturamento;
      }

      produtos.push({
        produto_id: r.produto_id,
        descricao: r.descricao,
        quantidade_total: Number(r.quantidade_total || 0),
        faturamento_total: Number(faturamento.toFixed(2)),
        percentual_faturamento: Number(percentual.toFixed(2)),
        percentual_acumulado: Number(Math.min(100, acumulado).toFixed(2)),
        classe,
      });
    }

    return {
      totalFaturamento: Number(totalFaturamento.toFixed(2)),
      totalItensVendidos,
      resumoClasses: {
        classeA: {
          quantidadeProdutos: countA,
          faturamento: Number(fatA.toFixed(2)),
          percentual: totalFaturamento > 0 ? Number(((fatA / totalFaturamento) * 100).toFixed(1)) : 0,
        },
        classeB: {
          quantidadeProdutos: countB,
          faturamento: Number(fatB.toFixed(2)),
          percentual: totalFaturamento > 0 ? Number(((fatB / totalFaturamento) * 100).toFixed(1)) : 0,
        },
        classeC: {
          quantidadeProdutos: countC,
          faturamento: Number(fatC.toFixed(2)),
          percentual: totalFaturamento > 0 ? Number(((fatC / totalFaturamento) * 100).toFixed(1)) : 0,
        },
      },
      produtos,
    };
  }
}
