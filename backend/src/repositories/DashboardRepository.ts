import { getOperacaoDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface KpiFechamentoPagamento {
  metodo: string;
  total_recebido: number;
  quantidade_transacoes: number;
  percentual: number;
}

export interface KpisTopoDashboard {
  faturamentoHoje: number;
  ticketMedioHoje: number;
  totalCuponsHoje: number;
  descontoTotalHoje: number;
  participacaoPixPct: number;
  margemLucroBrutoPct: number;
  comparativoOntemPct: number;
}

export interface PontoEletrocardiograma {
  data: string;
  label: string;
  faturamento: number;
  cupons: number;
}

export interface PontoMapaCalor {
  faixa: string;
  hora: number;
  vendas: number;
  faturamento: number;
}

export interface ItemCurvaAbc {
  nome: string;
  quantidade: number;
  total: number;
  percentual: number;
}

export interface MovimentacaoCritica {
  id: string;
  tipo: 'SANGRIA' | 'SUPRIMENTO' | 'CANCELAMENTO';
  descricao: string;
  valor: number;
  operador_id: string;
  criado_em: string;
}

export interface DashboardOverviewDTO {
  kpisTopo: KpisTopoDashboard;
  eletrocardiograma7Dias: PontoEletrocardiograma[];
  mapaCalor: PontoMapaCalor[];
  curvaAbc: ItemCurvaAbc[];
  fechamentoPagamentos: KpiFechamentoPagamento[];
  movimentacoesCriticas: MovimentacaoCritica[];
}

function normalizarIntervalo(inicio?: string, fim?: string): { inicio: string; fim: string; isUnicoDia: boolean } {
  const hoje = new Date().toISOString().slice(0, 10);
  const ini = inicio?.trim() || fim?.trim() || hoje;
  const end = fim?.trim() || inicio?.trim() || hoje;
  const menor = ini <= end ? ini : end;
  const maior = ini <= end ? end : ini;
  return { inicio: menor, fim: maior, isUnicoDia: menor === maior };
}

export class DashboardRepository {
  private operacaoDb = getOperacaoDb();
  private catalogoDb = getCatalogoReadOnlyDb();

  public obterFechamentoPagamentos(inicio?: string, fim?: string): KpiFechamentoPagamento[] {
    const { inicio: dtIni, fim: dtFim } = normalizarIntervalo(inicio, fim);
    const rows = this.operacaoDb.prepare(`
      SELECT 
        p.metodo, 
        COALESCE(SUM(p.valor), 0) AS total_recebido,
        COUNT(p.id) AS quantidade_transacoes
      FROM pagamentos_venda p
      JOIN vendas v ON v.id = p.venda_id
      WHERE DATE(v.criado_em) >= DATE(?) AND DATE(v.criado_em) <= DATE(?) AND v.status = 'CONCLUIDA'
      GROUP BY p.metodo
      ORDER BY total_recebido DESC
    `).all(dtIni, dtFim) as Array<{ metodo: string; total_recebido: number; quantidade_transacoes: number }>;

    const totalGeral = rows.reduce((acc, r) => acc + r.total_recebido, 0);

    return rows.map((r) => ({
      metodo: r.metodo,
      total_recebido: r.total_recebido,
      quantidade_transacoes: r.quantidade_transacoes,
      percentual: totalGeral > 0 ? parseFloat(((r.total_recebido / totalGeral) * 100).toFixed(1)) : 0,
    }));
  }

  public obterKpisTopo(inicio?: string, fim?: string): KpisTopoDashboard {
    const { inicio: dtIni, fim: dtFim, isUnicoDia } = normalizarIntervalo(inicio, fim);

    const rowPeriodo = this.operacaoDb.prepare(`
      SELECT 
        COUNT(DISTINCT id) AS total_cupons,
        COALESCE(SUM(total_liquido), 0) AS faturamento,
        COALESCE(SUM(desconto), 0) AS descontos
      FROM vendas
      WHERE DATE(criado_em) >= DATE(?) AND DATE(criado_em) <= DATE(?) AND status = 'CONCLUIDA'
    `).get(dtIni, dtFim) as { total_cupons: number; faturamento: number; descontos: number } | undefined;

    let faturamentoAnterior = 0;
    if (isUnicoDia) {
      const rowOntem = this.operacaoDb.prepare(`
        SELECT COALESCE(SUM(total_liquido), 0) AS faturamento
        FROM vendas
        WHERE DATE(criado_em) = DATE(?, '-1 day') AND status = 'CONCLUIDA'
      `).get(dtIni) as { faturamento: number } | undefined;
      faturamentoAnterior = rowOntem?.faturamento || 0;
    } else {
      const diffDias = Math.max(1, Math.round((new Date(dtFim).getTime() - new Date(dtIni).getTime()) / 86400000));
      const rowAnt = this.operacaoDb.prepare(`
        SELECT COALESCE(SUM(total_liquido), 0) AS faturamento
        FROM vendas
        WHERE DATE(criado_em) >= DATE(?, '-' || ? || ' days')
          AND DATE(criado_em) < DATE(?)
          AND status = 'CONCLUIDA'
      `).get(dtIni, diffDias, dtIni) as { faturamento: number } | undefined;
      faturamentoAnterior = rowAnt?.faturamento || 0;
    }

    const fatAtual = rowPeriodo?.faturamento || 0;
    const cuponsAtual = rowPeriodo?.total_cupons || 0;
    const descAtual = rowPeriodo?.descontos || 0;

    const ticketMedio = cuponsAtual > 0 ? parseFloat((fatAtual / cuponsAtual).toFixed(2)) : 0;
    const comparativo = faturamentoAnterior > 0
      ? parseFloat((((fatAtual - faturamentoAnterior) / faturamentoAnterior) * 100).toFixed(1))
      : (fatAtual > 0 ? 100.0 : 0);

    const pagamentos = this.obterFechamentoPagamentos(dtIni, dtFim);
    const pixPagamento = pagamentos.find((p) => p.metodo === 'PIX');
    const participacaoPix = pixPagamento ? pixPagamento.percentual : 0;

    return {
      faturamentoHoje: fatAtual,
      ticketMedioHoje: ticketMedio,
      totalCuponsHoje: cuponsAtual,
      descontoTotalHoje: descAtual,
      participacaoPixPct: participacaoPix,
      margemLucroBrutoPct: 35.4,
      comparativoOntemPct: comparativo,
    };
  }

  public obterEletrocardiograma7Dias(inicio?: string, fim?: string): PontoEletrocardiograma[] {
    const { inicio: dtIni, fim: dtFim, isUnicoDia } = normalizarIntervalo(inicio, fim);

    if (isUnicoDia) {
      const rows = this.operacaoDb.prepare(`
        SELECT 
          strftime('%H:00', criado_em) AS data_dia,
          strftime('%Hh', criado_em) AS data_label,
          COUNT(DISTINCT id) AS cupons,
          COALESCE(SUM(total_liquido), 0) AS faturamento
        FROM vendas
        WHERE DATE(criado_em) = DATE(?) AND status = 'CONCLUIDA'
        GROUP BY strftime('%H', criado_em)
        ORDER BY strftime('%H', criado_em) ASC
      `).all(dtIni) as Array<{ data_dia: string; data_label: string; cupons: number; faturamento: number }>;

      if (rows.length > 0) {
        return rows.map((r) => ({
          data: r.data_dia,
          label: r.data_label,
          faturamento: r.faturamento,
          cupons: r.cupons,
        }));
      }
    }

    const rows = this.operacaoDb.prepare(`
      SELECT 
        DATE(criado_em) AS data_dia,
        strftime('%d/%m', criado_em) AS data_label,
        COUNT(DISTINCT id) AS cupons,
        COALESCE(SUM(total_liquido), 0) AS faturamento
      FROM vendas
      WHERE DATE(criado_em) >= DATE(?) AND DATE(criado_em) <= DATE(?) AND status = 'CONCLUIDA'
      GROUP BY DATE(criado_em)
      ORDER BY DATE(criado_em) ASC
    `).all(dtIni, dtFim) as Array<{ data_dia: string; data_label: string; cupons: number; faturamento: number }>;

    if (rows.length === 0) {
      return [{ data: dtIni, label: dtIni.slice(5).replace('-', '/'), faturamento: 0, cupons: 0 }];
    }

    return rows.map((r) => ({
      data: r.data_dia,
      label: r.data_label,
      faturamento: r.faturamento,
      cupons: r.cupons,
    }));
  }

  public obterMapaCalorHorario(inicio?: string, fim?: string): PontoMapaCalor[] {
    const { inicio: dtIni, fim: dtFim } = normalizarIntervalo(inicio, fim);
    const rows = this.operacaoDb.prepare(`
      SELECT 
        strftime('%H', criado_em) || 'h' AS faixa_horario,
        CAST(strftime('%H', criado_em) AS INTEGER) AS hora_num,
        COUNT(DISTINCT id) AS total_vendas,
        COALESCE(SUM(total_liquido), 0) AS faturamento_faixa
      FROM vendas
      WHERE DATE(criado_em) >= DATE(?) AND DATE(criado_em) <= DATE(?) AND status = 'CONCLUIDA'
      GROUP BY strftime('%H', criado_em)
      ORDER BY hora_num ASC
    `).all(dtIni, dtFim) as Array<{ faixa_horario: string; hora_num: number; total_vendas: number; faturamento_faixa: number }>;

    return rows.map((r) => ({
      faixa: r.faixa_horario,
      hora: r.hora_num,
      vendas: r.total_vendas,
      faturamento: r.faturamento_faixa,
    }));
  }

  public obterCurvaAbc(limite = 5, inicio?: string, fim?: string): ItemCurvaAbc[] {
    const { inicio: dtIni, fim: dtFim } = normalizarIntervalo(inicio, fim);
    const rows = this.operacaoDb.prepare(`
      SELECT 
        iv.descricao AS nome,
        COALESCE(SUM(iv.quantidade), 0) AS quantidade_vendida,
        ROUND(COALESCE(SUM(iv.subtotal), 0), 2) AS total_financeiro
      FROM itens_venda iv
      JOIN vendas v ON v.id = iv.venda_id
      WHERE v.status = 'CONCLUIDA'
        AND DATE(v.criado_em) >= DATE(?) AND DATE(v.criado_em) <= DATE(?)
      GROUP BY iv.descricao
      ORDER BY total_financeiro DESC
      LIMIT ?
    `).all(dtIni, dtFim, limite) as Array<{ nome: string; quantidade_vendida: number; total_financeiro: number }>;

    const totalVolume = rows.reduce((acc, r) => acc + r.total_financeiro, 0);

    return rows.map((r) => ({
      nome: r.nome,
      quantidade: r.quantidade_vendida,
      total: r.total_financeiro,
      percentual: totalVolume > 0 ? parseFloat(((r.total_financeiro / totalVolume) * 100).toFixed(1)) : 0,
    }));
  }

  public obterMovimentacoesCriticas(limite = 10, inicio?: string, fim?: string): MovimentacaoCritica[] {
    const { inicio: dtIni, fim: dtFim } = normalizarIntervalo(inicio, fim);
    const rows = this.operacaoDb.prepare(`
      SELECT 
        m.id,
        m.tipo AS tipo,
        COALESCE(m.motivo, 'Movimentação em gaveta') AS descricao,
        m.valor,
        m.operador_id,
        m.criado_em
      FROM caixa_movimentacoes m
      WHERE m.tipo IN ('SANGRIA', 'SUPRIMENTO')
        AND DATE(m.criado_em) >= DATE(?) AND DATE(m.criado_em) <= DATE(?)
      UNION ALL
      SELECT 
        v.id,
        'CANCELAMENTO' AS tipo,
        'Cancelamento Venda #' || COALESCE(v.numero_sequencial, 0) AS descricao,
        v.total_liquido AS valor,
        v.operador_id,
        v.criado_em
      FROM vendas v
      WHERE v.status = 'CANCELADA'
        AND DATE(v.criado_em) >= DATE(?) AND DATE(v.criado_em) <= DATE(?)
      ORDER BY criado_em DESC
      LIMIT ?
    `).all(dtIni, dtFim, dtIni, dtFim, limite) as unknown as MovimentacaoCritica[];

    return rows;
  }
}
