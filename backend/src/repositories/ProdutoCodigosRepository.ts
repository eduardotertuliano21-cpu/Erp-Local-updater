import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import crypto from 'node:crypto';

export interface ProdutoCodigoBarras {
  id: string;
  produto_id: string;
  codigo_barras: string;
  unidade_medida: string;
  fator_entrada: number;
  fator_saida: number;
  criado_em?: string;
}

export class ProdutoCodigosRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listarPorProduto(produtoId: string): ProdutoCodigoBarras[] {
    return this.readDb.prepare(`
      SELECT * FROM produto_codigos_barras WHERE produto_id = ? ORDER BY criado_em ASC
    `).all(produtoId) as unknown as ProdutoCodigoBarras[];
  }

  public buscarPorCodigo(codigoBarras: string): (ProdutoCodigoBarras & { produto_id: string }) | null {
    const row = this.readDb.prepare(`
      SELECT * FROM produto_codigos_barras WHERE codigo_barras = ? LIMIT 1
    `).get(codigoBarras.trim()) as unknown as ProdutoCodigoBarras | undefined;
    return row || null;
  }

  public adicionar(dados: {
    produto_id: string;
    codigo_barras: string;
    unidade_medida?: string;
    fator_entrada?: number;
    fator_saida?: number;
  }): ProdutoCodigoBarras {
    const id = crypto.randomUUID();
    const item: ProdutoCodigoBarras = {
      id,
      produto_id: dados.produto_id,
      codigo_barras: dados.codigo_barras.trim(),
      unidade_medida: dados.unidade_medida?.toUpperCase() || 'UN',
      fator_entrada: Number(dados.fator_entrada) || 1,
      fator_saida: Number(dados.fator_saida) || 1,
    };
    this.writeDb.prepare(`
      INSERT INTO produto_codigos_barras (id, produto_id, codigo_barras, unidade_medida, fator_entrada, fator_saida)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(item.id, item.produto_id, item.codigo_barras, item.unidade_medida, item.fator_entrada, item.fator_saida);
    return item;
  }

  public remover(id: string): boolean {
    const res = this.writeDb.prepare('DELETE FROM produto_codigos_barras WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
