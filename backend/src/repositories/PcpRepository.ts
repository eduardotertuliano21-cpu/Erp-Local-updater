import { getCatalogoWriterDb, getCatalogoReadOnlyDb, getOperacaoDb } from '../config/database.js';

export interface InsumoFichaTecnica {
  id: string;
  produto_pai_id: string;
  insumo_produto_id: string;
  insumo_descricao?: string;
  quantidade_necessaria: number;
  unidade_medida: string;
}

export interface OrdemProducao {
  id: string;
  numero: number;
  produto_id: string;
  produto_descricao?: string;
  quantidade_planejada: number;
  quantidade_produzida: number;
  status: 'PLANEJADA' | 'EM_PRODUCAO' | 'FINALIZADA' | 'CANCELADA';
  data_inicio?: string;
  data_conclusao?: string;
  operador_id?: string;
  criado_em?: string;
}

export class PcpRepository {
  private catalogoWriter = getCatalogoWriterDb();
  private catalogoRead = getCatalogoReadOnlyDb();
  private operacaoDb = getOperacaoDb();

  public obterFichaTecnica(produtoPaiId: string): InsumoFichaTecnica[] {
    const stmt = this.catalogoRead.prepare(`
      SELECT f.*, p.descricao as insumo_descricao
      FROM fichas_tecnicas f
      JOIN produtos p ON p.id = f.insumo_produto_id
      WHERE f.produto_pai_id = ?
    `);
    return stmt.all(produtoPaiId) as unknown as InsumoFichaTecnica[];
  }

  public salvarInsumoFicha(f: InsumoFichaTecnica): void {
    const stmt = this.catalogoWriter.prepare(`
      INSERT INTO fichas_tecnicas (id, produto_pai_id, insumo_produto_id, quantidade_necessaria, unidade_medida)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(f.id, f.produto_pai_id, f.insumo_produto_id, f.quantidade_necessaria, f.unidade_medida);
  }

  public listarOrdens(): OrdemProducao[] {
    const stmt = this.operacaoDb.prepare(`
      SELECT op.*, (SELECT descricao FROM produtos WHERE id = op.produto_id) as produto_descricao
      FROM ordens_producao op
      ORDER BY op.numero DESC LIMIT 100
    `);
    return stmt.all() as unknown as OrdemProducao[];
  }

  public salvarOrdem(op: OrdemProducao): void {
    const stmt = this.operacaoDb.prepare(`
      INSERT INTO ordens_producao (
        id, numero, produto_id, quantidade_planejada, quantidade_produzida,
        status, data_inicio, data_conclusao, operador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      op.id,
      op.numero,
      op.produto_id,
      op.quantidade_planejada,
      op.quantidade_produzida,
      op.status,
      op.data_inicio || null,
      op.data_conclusao || null,
      op.operador_id || null
    );
  }

  public atualizarStatusOrdem(id: string, status: string, qtdProduzida?: number): void {
    const stmt = this.operacaoDb.prepare(`
      UPDATE ordens_producao
      SET status = ?, 
          quantidade_produzida = COALESCE(?, quantidade_produzida),
          data_conclusao = CASE WHEN ? = 'FINALIZADA' THEN CURRENT_TIMESTAMP ELSE data_conclusao END
      WHERE id = ?
    `);
    stmt.run(status, qtdProduzida !== undefined ? qtdProduzida : null, status, id);
  }

  public obterProximoNumeroOrdem(): number {
    const row = this.operacaoDb.prepare('SELECT COALESCE(MAX(numero), 0) + 1 as prox FROM ordens_producao').get() as { prox: number };
    return row.prox;
  }
}
