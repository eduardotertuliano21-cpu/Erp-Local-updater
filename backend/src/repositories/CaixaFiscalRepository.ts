import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface CaixaFiscal {
  numero_caixa: string;
  serie_nfce: number;
  proximo_numero_nfce: number;
  apelido?: string;
  ip_ultimo_acesso?: string;
  ultimo_ping?: string;
  ativo: number;
  atualizado_em?: string;
}

export class CaixaFiscalRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  constructor() {
    this.assegurarCaixaPadrao();
  }

  private assegurarCaixaPadrao(): void {
    try {
      const existe = this.readDb.prepare('SELECT COUNT(*) as total FROM config_caixas_fiscais').get() as { total: number };
      if (!existe || existe.total === 0) {
        // Inicializa Caixa 01 pegando do config_loja atual se existir
        let serie = 1;
        let proxNumero = 1;
        try {
          const cfg = this.readDb.prepare('SELECT serie_nfce, proximo_numero_nfce FROM config_loja WHERE id = "default"').get() as any;
          if (cfg) {
            serie = Number(cfg.serie_nfce) || 1;
            proxNumero = Number(cfg.proximo_numero_nfce) || 1;
          }
        } catch {}

        this.writeDb.prepare(`
          INSERT OR IGNORE INTO config_caixas_fiscais (numero_caixa, serie_nfce, proximo_numero_nfce, apelido, ip_ultimo_acesso, ativo)
          VALUES ('01', ?, ?, 'Caixa 01 - Principal (Servidor)', '127.0.0.1', 1)
        `).run(serie, proxNumero);
      }
    } catch {}
  }

  public listar(): CaixaFiscal[] {
    this.assegurarCaixaPadrao();
    const rows = this.readDb.prepare('SELECT * FROM config_caixas_fiscais ORDER BY CAST(numero_caixa AS INTEGER) ASC').all() as any[];
    return rows.map((r) => ({
      numero_caixa: String(r.numero_caixa).padStart(2, '0'),
      serie_nfce: Number(r.serie_nfce) || 1,
      proximo_numero_nfce: Number(r.proximo_numero_nfce) || 1,
      apelido: r.apelido || `Caixa ${r.numero_caixa}`,
      ip_ultimo_acesso: r.ip_ultimo_acesso,
      ultimo_ping: r.ultimo_ping,
      ativo: r.ativo ? 1 : 0,
      atualizado_em: r.atualizado_em,
    }));
  }

  public obterPorNumero(numCaixa: string): CaixaFiscal | undefined {
    const limpo = String(numCaixa).padStart(2, '0');
    const row = this.readDb.prepare('SELECT * FROM config_caixas_fiscais WHERE numero_caixa = ? OR numero_caixa = ?').get(limpo, String(Number(limpo))) as any;
    if (!row) return undefined;
    return {
      numero_caixa: String(row.numero_caixa).padStart(2, '0'),
      serie_nfce: Number(row.serie_nfce) || 1,
      proximo_numero_nfce: Number(row.proximo_numero_nfce) || 1,
      apelido: row.apelido,
      ip_ultimo_acesso: row.ip_ultimo_acesso,
      ultimo_ping: row.ultimo_ping,
      ativo: row.ativo ? 1 : 0,
      atualizado_em: row.atualizado_em,
    };
  }

  public salvar(c: Partial<CaixaFiscal> & { numero_caixa: string }): CaixaFiscal {
    const num = String(c.numero_caixa).padStart(2, '0');
    const atual = this.obterPorNumero(num);
    const serie = c.serie_nfce !== undefined ? Number(c.serie_nfce) : (atual ? atual.serie_nfce : Number(num) || 1);
    const prox = c.proximo_numero_nfce !== undefined ? Number(c.proximo_numero_nfce) : (atual ? atual.proximo_numero_nfce : 1);
    const apelido = c.apelido || (atual ? atual.apelido : `Caixa ${num}`);
    const ativo = c.ativo !== undefined ? (c.ativo ? 1 : 0) : 1;

    this.writeDb.prepare(`
      INSERT INTO config_caixas_fiscais (numero_caixa, serie_nfce, proximo_numero_nfce, apelido, ativo, atualizado_em)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(numero_caixa) DO UPDATE SET
        serie_nfce = excluded.serie_nfce,
        proximo_numero_nfce = excluded.proximo_numero_nfce,
        apelido = excluded.apelido,
        ativo = excluded.ativo,
        atualizado_em = CURRENT_TIMESTAMP
    `).run(num, serie, prox, apelido || null, ativo);

    // Se for o caixa 01, reflete em config_loja para retrocompatibilidade
    if (num === '01') {
      try {
        this.writeDb.prepare('UPDATE config_loja SET serie_nfce = ?, proximo_numero_nfce = ? WHERE id = "default"').run(serie, prox);
      } catch {}
    }

    return this.obterPorNumero(num)!;
  }

  public incrementarProximoNumero(numCaixa: string, novoProximo: number): void {
    const num = String(numCaixa).padStart(2, '0');
    this.writeDb.prepare(`
      UPDATE config_caixas_fiscais
      SET proximo_numero_nfce = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE numero_caixa = ? OR numero_caixa = ?
    `).run(novoProximo, num, String(Number(num)));

    if (num === '01') {
      try {
        this.writeDb.prepare('UPDATE config_loja SET proximo_numero_nfce = ? WHERE id = "default"').run(novoProximo);
      } catch {}
    }
  }

  public registrarHeartbeat(numCaixa: string, ip: string, apelido?: string): void {
    const num = String(numCaixa).padStart(2, '0');
    const existente = this.obterPorNumero(num);
    const cleanIp = ip.replace(/^::ffff:/, '');

    if (!existente) {
      const defaultSerie = Math.max(1, Number(num) || 2);
      this.writeDb.prepare(`
        INSERT INTO config_caixas_fiscais (numero_caixa, serie_nfce, proximo_numero_nfce, apelido, ip_ultimo_acesso, ultimo_ping, ativo)
        VALUES (?, ?, 1, ?, ?, CURRENT_TIMESTAMP, 1)
      `).run(num, defaultSerie, apelido || `Caixa ${num} (Terminal LAN)`, cleanIp);
    } else {
      this.writeDb.prepare(`
        UPDATE config_caixas_fiscais
        SET ip_ultimo_acesso = ?, ultimo_ping = CURRENT_TIMESTAMP
        WHERE numero_caixa = ?
      `).run(cleanIp, num);
    }
  }

  public detectouMultiplosComputadores(localIp?: string): boolean {
    try {
      const caixas = this.listar();
      if (caixas.length > 1) return true;

      // Verifica se houve pings recentes de outros IPs
      const cleanLocalIp = (localIp || '127.0.0.1').replace(/^::ffff:/, '');
      const outroIp = this.readDb.prepare(`
        SELECT COUNT(*) as total FROM config_caixas_fiscais
        WHERE ip_ultimo_acesso IS NOT NULL
          AND ip_ultimo_acesso != '127.0.0.1'
          AND ip_ultimo_acesso != 'localhost'
          AND ip_ultimo_acesso != ?
      `).get(cleanLocalIp) as { total: number };

      return (outroIp?.total || 0) > 0;
    } catch {
      return false;
    }
  }
}
