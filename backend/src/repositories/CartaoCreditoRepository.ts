import { getOperacaoDb } from '../config/database.js';

export interface CartaoCreditoRecord {
  id: string;
  titular_nome: string;
  ultimos_digitos: string;
  bandeira: string;
  mes_expiracao: number;
  ano_expiracao: number;
  padrao: number;
  token_stripe?: string;
  criado_em: string;
}

export class CartaoCreditoRepository {
  private db = getOperacaoDb();

  constructor() {
    this.ensureSchema();
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cartoes_salvos (
        id TEXT PRIMARY KEY,
        titular_nome TEXT NOT NULL,
        ultimos_digitos TEXT NOT NULL,
        bandeira TEXT NOT NULL,
        mes_expiracao INTEGER NOT NULL,
        ano_expiracao INTEGER NOT NULL,
        padrao INTEGER DEFAULT 0,
        token_stripe TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public listar(): CartaoCreditoRecord[] {
    return this.db
      .prepare('SELECT * FROM cartoes_salvos ORDER BY padrao DESC, criado_em DESC')
      .all() as unknown as CartaoCreditoRecord[];
  }

  public buscarPorId(id: string): CartaoCreditoRecord | null {
    const row = this.db.prepare('SELECT * FROM cartoes_salvos WHERE id = ?').get(id);
    return (row as unknown as CartaoCreditoRecord) || null;
  }

  public salvar(cartao: {
    id: string;
    titular_nome: string;
    ultimos_digitos: string;
    bandeira: string;
    mes_expiracao: number;
    ano_expiracao: number;
    padrao?: number;
    token_stripe?: string;
  }): CartaoCreditoRecord {
    const total =
      (this.db.prepare('SELECT COUNT(*) as total FROM cartoes_salvos').get() as any)?.total || 0;
    const ehPadrao = cartao.padrao || (total === 0 ? 1 : 0);

    if (ehPadrao) {
      this.db.prepare('UPDATE cartoes_salvos SET padrao = 0').run();
    }

    this.db
      .prepare(
        `INSERT INTO cartoes_salvos (
          id, titular_nome, ultimos_digitos, bandeira, mes_expiracao, ano_expiracao, padrao, token_stripe
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        cartao.id,
        cartao.titular_nome.toUpperCase().trim(),
        cartao.ultimos_digitos,
        cartao.bandeira.toUpperCase(),
        cartao.mes_expiracao,
        cartao.ano_expiracao,
        ehPadrao ? 1 : 0,
        cartao.token_stripe || null
      );

    return this.buscarPorId(cartao.id)!;
  }

  public definirPadrao(id: string): boolean {
    this.db.prepare('UPDATE cartoes_salvos SET padrao = 0').run();
    const res = this.db.prepare('UPDATE cartoes_salvos SET padrao = 1 WHERE id = ?').run(id);
    return res.changes > 0;
  }

  public excluir(id: string): boolean {
    const res = this.db.prepare('DELETE FROM cartoes_salvos WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
