import { getCatalogoReadOnlyDb } from '../config/database.js';
import { ICatalogoRepository } from './ICatalogoRepository.js';
import { Produto } from '../types/api.js';

function mapearProdutoComCampanha(row: any): Produto {
  const p = { ...row } as Produto;
  if (row.nome_campanha && (row.campanha_status === 'ATIVA' || !row.campanha_status)) {
    p.em_campanha = true;
    p.nome_campanha = row.nome_campanha;
    p.preco_original = Number(row.preco_venda);
    if (row.tipo_desconto === 'PORCENTAGEM') {
      p.preco_promocional = Math.max(0, +(Number(row.preco_venda) * (1 - Number(row.valor_desconto || 0) / 100)).toFixed(2));
    } else {
      p.preco_promocional = Math.max(0, +(Number(row.preco_venda) - Number(row.valor_desconto || 0)).toFixed(2));
    }
  } else {
    p.em_campanha = false;
    p.nome_campanha = null;
    p.preco_promocional = null;
    p.preco_original = Number(row.preco_venda);
  }
  return p;
}

const SELECT_PRODUTO_CAMPANHA = `
  SELECT 
    p.*,
    c.nome_campanha,
    c.tipo_desconto,
    c.valor_desconto,
    c.status AS campanha_status
  FROM produtos p
  LEFT JOIN campanhas_promocionais c 
    ON p.campanha_id = c.id 
    AND c.status = 'ATIVA' 
    AND date('now', 'localtime') >= date(c.data_inicio) 
    AND date('now', 'localtime') <= date(c.data_fim)
`;

export class CatalogoRepository implements ICatalogoRepository {
  private db = getCatalogoReadOnlyDb();

  public buscarPorCodigoBarras(codigo: string, ramoAtuacao?: string): Produto | null {
    if (ramoAtuacao && ramoAtuacao !== 'ambos' && ramoAtuacao !== 'todos') {
      const stmt = this.db.prepare(
        `${SELECT_PRODUTO_CAMPANHA}
         WHERE p.codigo_barras = ? 
           AND (p.ramo_atuacao = ? OR p.ramo_atuacao = 'ambos' OR p.ramo_atuacao IS NULL) 
           AND p.ativo = 1 
         LIMIT 1`
      );
      const row = stmt.get(codigo.trim(), ramoAtuacao);
      return row ? mapearProdutoComCampanha(row) : null;
    }
    const stmt = this.db.prepare(
      `${SELECT_PRODUTO_CAMPANHA} WHERE p.codigo_barras = ? AND p.ativo = 1 LIMIT 1`
    );
    const row = stmt.get(codigo.trim());
    if (row) return mapearProdutoComCampanha(row);

    // Fallback: Busca em produto_codigos_barras (WMS / Fardos / Caixas)
    try {
      const rowAlt = this.db.prepare(`
        SELECT p.*, c.nome_campanha, c.tipo_desconto, c.valor_desconto, c.status AS campanha_status,
               pcb.fator_saida, pcb.fator_entrada, pcb.unidade_medida as alt_unidade, pcb.codigo_barras as alt_barcode
        FROM produto_codigos_barras pcb
        JOIN produtos p ON p.id = pcb.produto_id
        LEFT JOIN campanhas_promocionais c ON p.campanha_id = c.id AND c.status = 'ATIVA'
        WHERE pcb.codigo_barras = ? AND p.ativo = 1
        LIMIT 1
      `).get(codigo.trim()) as any;

      if (rowAlt) {
        const prod = mapearProdutoComCampanha(rowAlt);
        prod.fator_saida = Number(rowAlt.fator_saida) || 1;
        prod.fator_entrada = Number(rowAlt.fator_entrada) || 1;
        prod.codigo_barras_bipado = rowAlt.alt_barcode;
        if (prod.fator_saida > 1) {
          prod.descricao = `${prod.descricao} [${rowAlt.alt_unidade} x${prod.fator_saida}]`;
          prod.preco_venda = +(prod.preco_venda * prod.fator_saida).toFixed(2);
        }
        return prod;
      }
    } catch {}

    return null;
  }

  public buscarPorId(id: string): Produto | null {
    const stmt = this.db.prepare(
      `${SELECT_PRODUTO_CAMPANHA} WHERE p.id = ? LIMIT 1`
    );
    const row = stmt.get(id);
    return row ? mapearProdutoComCampanha(row) : null;
  }

  public buscarPorDescricao(termo: string, limite = 10, ramoAtuacao?: string): Produto[] {
    const wildcard = `%${termo.trim()}%`;
    if (ramoAtuacao && ramoAtuacao !== 'ambos' && ramoAtuacao !== 'todos') {
      const stmt = this.db.prepare(
        `${SELECT_PRODUTO_CAMPANHA} 
         WHERE (p.descricao LIKE ? OR p.codigo_barras LIKE ? OR p.sku LIKE ?) 
           AND (p.ramo_atuacao = ? OR p.ramo_atuacao = 'ambos' OR p.ramo_atuacao IS NULL)
           AND p.ativo = 1 
         ORDER BY p.descricao ASC
         LIMIT ?`
      );
      const rows = stmt.all(wildcard, wildcard, wildcard, ramoAtuacao, limite);
      return rows.map(mapearProdutoComCampanha);
    }
    const stmt = this.db.prepare(
      `${SELECT_PRODUTO_CAMPANHA} 
       WHERE (p.descricao LIKE ? OR p.codigo_barras LIKE ? OR p.sku LIKE ?) AND p.ativo = 1 
       ORDER BY p.descricao ASC
       LIMIT ?`
    );
    const rows = stmt.all(wildcard, wildcard, wildcard, limite);
    return rows.map(mapearProdutoComCampanha);
  }

  public listarTodos(limite = 50, offset = 0, ramoAtuacao?: string): Produto[] {
    if (ramoAtuacao && ramoAtuacao !== 'ambos' && ramoAtuacao !== 'todos') {
      const stmt = this.db.prepare(
        `${SELECT_PRODUTO_CAMPANHA} 
         WHERE (p.ramo_atuacao = ? OR p.ramo_atuacao = 'ambos' OR p.ramo_atuacao IS NULL)
           AND p.ativo = 1 
         ORDER BY p.descricao ASC 
         LIMIT ? OFFSET ?`
      );
      const rows = stmt.all(ramoAtuacao, limite, offset);
      return rows.map(mapearProdutoComCampanha);
    }
    const stmt = this.db.prepare(
      `${SELECT_PRODUTO_CAMPANHA} WHERE p.ativo = 1 ORDER BY p.descricao ASC LIMIT ? OFFSET ?`
    );
    const rows = stmt.all(limite, offset);
    return rows.map(mapearProdutoComCampanha);
  }
}
