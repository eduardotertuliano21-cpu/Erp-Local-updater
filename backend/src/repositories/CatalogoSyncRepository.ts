import { getCatalogoWriterDb } from '../config/database.js';
import { ICatalogoSyncRepository } from './ICatalogoRepository.js';
import { Produto } from '../types/api.js';

export class CatalogoSyncRepository implements ICatalogoSyncRepository {
  private db = getCatalogoWriterDb();

  public aplicarLoteProdutos(produtos: Produto[]): { inseridosOuAtualizados: number } {
    const stmt = this.db.prepare(`
      INSERT INTO produtos (
        id, codigo_barras, sku, descricao, categoria, tipo_pdv, ramo_atuacao, preco_venda, unidade_medida, ncm, cfop, aliquota_icms, ativo, foto, tamanho, cor, marca, modelo, cest, cst_csosn, origem, aliquota_pis, aliquota_cofins, pesavel, codigo_balanca, validade_balanca, is_pesavel_checkout, is_pesavel_etiqueta, plu_balanca, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(codigo_barras) DO UPDATE SET
        sku = excluded.sku,
        descricao = excluded.descricao,
        categoria = excluded.categoria,
        tipo_pdv = excluded.tipo_pdv,
        ramo_atuacao = excluded.ramo_atuacao,
        preco_venda = excluded.preco_venda,
        unidade_medida = excluded.unidade_medida,
        ncm = excluded.ncm,
        cfop = excluded.cfop,
        aliquota_icms = excluded.aliquota_icms,
        ativo = excluded.ativo,
        foto = excluded.foto,
        tamanho = excluded.tamanho,
        cor = excluded.cor,
        marca = excluded.marca,
        modelo = excluded.modelo,
        cest = excluded.cest,
        cst_csosn = excluded.cst_csosn,
        origem = excluded.origem,
        aliquota_pis = excluded.aliquota_pis,
        aliquota_cofins = excluded.aliquota_cofins,
        pesavel = excluded.pesavel,
        codigo_balanca = excluded.codigo_balanca,
        validade_balanca = excluded.validade_balanca,
        is_pesavel_checkout = excluded.is_pesavel_checkout,
        is_pesavel_etiqueta = excluded.is_pesavel_etiqueta,
        plu_balanca = excluded.plu_balanca,
        atualizado_em = excluded.atualizado_em
    `);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const p of produtos) {
        const ramo = p.ramo_atuacao || (p.tipo_pdv === 'RESTAURANTE' ? 'restaurante' : 'varejo');
        stmt.run(
          p.id,
          p.codigo_barras,
          p.sku || null,
          p.descricao,
          p.categoria || 'GERAL',
          p.tipo_pdv || 'VAREJO',
          ramo,
          p.preco_venda,
          p.unidade_medida || 'UN',
          p.ncm || null,
          p.cfop || null,
          p.aliquota_icms ?? 0,
          p.ativo ?? 1,
          p.foto || null,
          p.tamanho || null,
          p.cor || null,
          p.marca || null,
          p.modelo || null,
          p.cest || null,
          p.cst_csosn || '102',
          p.origem ?? 0,
          p.aliquota_pis ?? 0,
          p.aliquota_cofins ?? 0,
          p.pesavel || p.is_pesavel_etiqueta ? 1 : 0,
          p.codigo_balanca || (p.plu_balanca ? String(p.plu_balanca) : null),
          p.validade_balanca ?? 5,
          p.is_pesavel_checkout ? 1 : 0,
          p.is_pesavel_etiqueta !== undefined ? (p.is_pesavel_etiqueta ? 1 : 0) : (p.pesavel ? 1 : 0),
          p.plu_balanca !== undefined ? p.plu_balanca : (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) || null : null),
          p.atualizado_em || new Date().toISOString()
        );
      }
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    return { inseridosOuAtualizados: produtos.length };
  }

  public excluirProduto(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM produtos WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  public obterUltimoTimestampSincronizacao(): string | null {
    const stmt = this.db.prepare(
      `SELECT valor FROM _sync_meta WHERE chave = 'last_catalog_downsync' LIMIT 1`
    );
    const row = stmt.get() as { valor: string } | undefined;
    return row ? row.valor : null;
  }

  public salvarUltimoTimestampSincronizacao(timestamp: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO _sync_meta (chave, valor, atualizado_em)
      VALUES ('last_catalog_downsync', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(chave) DO UPDATE SET
        valor = excluded.valor,
        atualizado_em = CURRENT_TIMESTAMP
    `);
    stmt.run(timestamp);
  }
}
