import { getOperacaoDb, getCatalogoReadOnlyDb } from '../config/database.js';
import crypto from 'node:crypto';

export interface DesossaItem {
  id: string;
  desossa_id: string;
  produto_destino_id: string;
  descricao: string;
  peso: number;
  percentual_rendimento: number;
  custo_unitario_rateado: number;
  preco_venda_sugerido?: number;
}

export interface DesossaRecord {
  id: string;
  numero: number;
  produto_origem_id: string;
  produto_origem_nome: string;
  peso_origem: number;
  custo_origem_total: number;
  peso_cortes_total: number;
  peso_quebra: number;
  percentual_quebra: number;
  status: string;
  operador_id?: string;
  observacoes?: string;
  criado_em?: string;
  itens?: DesossaItem[];
}

export class DesossaRepository {
  private operacaoDb = getOperacaoDb();
  private catalogoDb = getCatalogoReadOnlyDb();

  public listar(limite = 50): DesossaRecord[] {
    try {
      return this.operacaoDb.prepare(`
        SELECT * FROM desossas ORDER BY criado_em DESC LIMIT ?
      `).all(limite) as unknown as DesossaRecord[];
    } catch {
      return [];
    }
  }

  public obterPorId(id: string): DesossaRecord | null {
    try {
      const desossa = this.operacaoDb.prepare('SELECT * FROM desossas WHERE id = ?').get(id) as unknown as DesossaRecord | undefined;
      if (!desossa) return null;
      desossa.itens = this.operacaoDb.prepare('SELECT * FROM desossa_itens WHERE desossa_id = ?').all(id) as unknown as DesossaItem[];
      return desossa;
    } catch {
      return null;
    }
  }

  public salvarDesossa(
    dados: Omit<DesossaRecord, 'id' | 'numero' | 'itens'>,
    itens: Array<Omit<DesossaItem, 'id' | 'desossa_id'>>
  ): DesossaRecord {
    const id = crypto.randomUUID();
    const numero = Date.now() % 100000;

    const stmtDesossa = this.operacaoDb.prepare(`
      INSERT INTO desossas (
        id, numero, produto_origem_id, produto_origem_nome, peso_origem,
        custo_origem_total, peso_cortes_total, peso_quebra, percentual_quebra,
        status, operador_id, observacoes, criado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONCLUIDA', ?, ?, CURRENT_TIMESTAMP)
    `);

    stmtDesossa.run(
      id,
      numero,
      dados.produto_origem_id,
      dados.produto_origem_nome,
      dados.peso_origem,
      dados.custo_origem_total,
      dados.peso_cortes_total,
      dados.peso_quebra,
      dados.percentual_quebra,
      dados.operador_id || 'OPERADOR',
      dados.observacoes || null
    );

    const itensCriados: DesossaItem[] = [];
    const stmtItem = this.operacaoDb.prepare(`
      INSERT INTO desossa_itens (
        id, desossa_id, produto_destino_id, descricao, peso,
        percentual_rendimento, custo_unitario_rateado, preco_venda_sugerido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Baixa no estoque da peça inteira de Origem
    this.operacaoDb.prepare(`
      INSERT INTO estoque_movimentos (
        id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id
      ) VALUES (?, ?, 'SAIDA_VENDA', 'LOJA', ?, ?, ?, 'Desossa de Carnes - Baixa de Origem', ?)
    `).run(
      crypto.randomUUID(),
      dados.produto_origem_id,
      dados.peso_origem,
      +(dados.custo_origem_total / dados.peso_origem).toFixed(2),
      `Desossa #${numero}`,
      dados.operador_id || 'OPERADOR'
    );

    // 2. Entrada no estoque dos cortes gerados
    for (const item of itens) {
      const itemId = crypto.randomUUID();
      stmtItem.run(
        itemId,
        id,
        item.produto_destino_id,
        item.descricao,
        item.peso,
        item.percentual_rendimento,
        item.custo_unitario_rateado,
        item.preco_venda_sugerido || null
      );

      this.operacaoDb.prepare(`
        INSERT INTO estoque_movimentos (
          id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id
        ) VALUES (?, ?, 'ENTRADA_COMPRA', 'LOJA', ?, ?, ?, 'Desossa de Carnes - Entrada de Corte', ?)
      `).run(
        crypto.randomUUID(),
        item.produto_destino_id,
        item.peso,
        item.custo_unitario_rateado,
        `Desossa #${numero}`,
        dados.operador_id || 'OPERADOR'
      );

      itensCriados.push({
        id: itemId,
        desossa_id: id,
        ...item,
      });
    }

    return {
      id,
      numero,
      ...dados,
      itens: itensCriados,
    };
  }
}
