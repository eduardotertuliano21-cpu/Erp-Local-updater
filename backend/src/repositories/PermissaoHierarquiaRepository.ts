import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface PermissaoHierarquia {
  hierarquia: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  cancelar_venda: number | boolean;
  aplicar_desconto: number | boolean;
  abrir_gaveta: number | boolean;
  ver_relatorios: number | boolean;
  acessa_estoque: number | boolean;
  acessa_financeiro: number | boolean;
  acessa_configuracoes: number | boolean;
  atualizado_em?: string;
}

export class PermissaoHierarquiaRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public listar(): PermissaoHierarquia[] {
    const stmt = this.readDb.prepare('SELECT * FROM permissoes_hierarquia');
    const rows = stmt.all() as unknown as PermissaoHierarquia[];
    return rows.map((r) => this.normalizar(r));
  }

  public obterPorHierarquia(hierarquia: string): PermissaoHierarquia | undefined {
    const stmt = this.readDb.prepare('SELECT * FROM permissoes_hierarquia WHERE hierarquia = ?');
    const row = stmt.get(hierarquia) as unknown as PermissaoHierarquia | undefined;
    return row ? this.normalizar(row) : undefined;
  }

  public salvar(p: PermissaoHierarquia): void {
    const stmt = this.writeDb.prepare(`
      INSERT INTO permissoes_hierarquia (
        hierarquia, cancelar_venda, aplicar_desconto, abrir_gaveta,
        ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(hierarquia) DO UPDATE SET
        cancelar_venda = excluded.cancelar_venda,
        aplicar_desconto = excluded.aplicar_desconto,
        abrir_gaveta = excluded.abrir_gaveta,
        ver_relatorios = excluded.ver_relatorios,
        acessa_estoque = excluded.acessa_estoque,
        acessa_financeiro = excluded.acessa_financeiro,
        acessa_configuracoes = excluded.acessa_configuracoes,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(
      p.hierarquia,
      p.cancelar_venda ? 1 : 0,
      p.aplicar_desconto ? 1 : 0,
      p.abrir_gaveta ? 1 : 0,
      p.ver_relatorios ? 1 : 0,
      p.acessa_estoque ? 1 : 0,
      p.acessa_financeiro ? 1 : 0,
      p.acessa_configuracoes ? 1 : 0
    );
  }

  private normalizar(p: PermissaoHierarquia): PermissaoHierarquia {
    return {
      hierarquia: p.hierarquia,
      cancelar_venda: Boolean(p.cancelar_venda),
      aplicar_desconto: Boolean(p.aplicar_desconto),
      abrir_gaveta: Boolean(p.abrir_gaveta),
      ver_relatorios: Boolean(p.ver_relatorios),
      acessa_estoque: Boolean(p.acessa_estoque),
      acessa_financeiro: Boolean(p.acessa_financeiro),
      acessa_configuracoes: Boolean(p.acessa_configuracoes),
      atualizado_em: p.atualizado_em,
    };
  }
}
