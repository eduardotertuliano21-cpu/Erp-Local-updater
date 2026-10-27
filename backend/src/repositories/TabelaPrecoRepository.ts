import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import crypto from 'node:crypto';

export interface TabelaPreco {
  id: string;
  descricao: string;
  ativo: number;
  criado_em?: string;
}

export interface PrecoTabelaItem {
  id: string;
  tabela_preco_id: string;
  produto_id: string;
  preco_venda: number;
  atualizado_em?: string;
}

export class TabelaPrecoRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listar(): TabelaPreco[] {
    return this.readDb.prepare('SELECT * FROM tabelas_preco WHERE ativo = 1 ORDER BY descricao ASC').all() as unknown as TabelaPreco[];
  }

  public obterPorId(id: string): TabelaPreco | null {
    const row = this.readDb.prepare('SELECT * FROM tabelas_preco WHERE id = ?').get(id) as unknown as TabelaPreco | undefined;
    return row || null;
  }

  public criar(descricao: string): TabelaPreco {
    const id = crypto.randomUUID();
    const tabela: TabelaPreco = { id, descricao: descricao.trim(), ativo: 1 };
    this.writeDb.prepare('INSERT INTO tabelas_preco (id, descricao, ativo) VALUES (?, ?, 1)').run(id, tabela.descricao);
    return tabela;
  }

  public listarPrecosPorTabela(tabelaPrecoId: string): Record<string, number> {
    const rows = this.readDb.prepare(`
      SELECT produto_id, preco_venda FROM produto_precos_tabela WHERE tabela_preco_id = ?
    `).all(tabelaPrecoId) as Array<{ produto_id: string; preco_venda: number }>;

    const mapa: Record<string, number> = {};
    for (const r of rows) {
      mapa[r.produto_id] = Number(r.preco_venda);
    }
    return mapa;
  }

  public salvarPrecoDiferenciado(tabelaPrecoId: string, produtoId: string, precoVenda: number): void {
    const id = crypto.randomUUID();
    this.writeDb.prepare(`
      INSERT INTO produto_precos_tabela (id, tabela_preco_id, produto_id, preco_venda, atualizado_em)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(tabela_preco_id, produto_id) DO UPDATE SET
        preco_venda = excluded.preco_venda,
        atualizado_em = CURRENT_TIMESTAMP
    `).run(id, tabelaPrecoId, produtoId, Number(precoVenda));
  }
}
