import { getOperacaoDb } from '../config/database.js';

export interface LicencaRecord {
  id: string;
  cnpj?: string;
  razao_social?: string;
  data_vencimento: string;
  status: 'ATIVA' | 'VENCIDA' | 'BLOQUEADA' | 'TESTE';
  dias_carencia: number;
  chave_licenca?: string;
  atualizado_em: string;
}

export class LicencaRepository {
  private db = getOperacaoDb();

  public obterLicenca(): LicencaRecord {
    const row = this.db.prepare('SELECT * FROM licenca_local LIMIT 1').get() as any;
    if (row) {
      return {
        id: row.id,
        cnpj: row.cnpj,
        razao_social: row.razao_social,
        data_vencimento: row.data_vencimento,
        status: row.status as LicencaRecord['status'],
        dias_carencia: row.dias_carencia || 0,
        chave_licenca: row.chave_licenca,
        atualizado_em: row.atualizado_em,
      };
    }

    // Cria registro padrão de 30 dias se ainda não existir
    const daqui30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.db.prepare(`
      INSERT INTO licenca_local (id, cnpj, razao_social, data_vencimento, status, dias_carencia, chave_licenca)
      VALUES ('default', '00.000.000/0001-91', 'CLICKSTORM COMERCIO E VAREJO LTDA', ?, 'ATIVA', 0, 'CS-PRO-LOCAL-LICENSE')
    `).run(daqui30Dias);

    return this.obterLicenca();
  }

  public adicionarDiasCarencia(dias: number): LicencaRecord {
    this.db.prepare(`
      UPDATE licenca_local
      SET dias_carencia = dias_carencia + ?, status = 'ATIVA', atualizado_em = CURRENT_TIMESTAMP
      WHERE id = 'default'
    `).run(dias);

    return this.obterLicenca();
  }

  public atualizarLicenca(dados: {
    data_vencimento?: string;
    status?: 'ATIVA' | 'VENCIDA' | 'BLOQUEADA' | 'TESTE';
    dias_carencia?: number;
    chave_licenca?: string;
    cnpj?: string;
    razao_social?: string;
  }): LicencaRecord {
    const lic = this.obterLicenca();
    this.db.prepare(`
      UPDATE licenca_local SET
        data_vencimento = COALESCE(?, data_vencimento),
        status = COALESCE(?, status),
        dias_carencia = COALESCE(?, dias_carencia),
        chave_licenca = COALESCE(?, chave_licenca),
        cnpj = COALESCE(?, cnpj),
        razao_social = COALESCE(?, razao_social),
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      dados.data_vencimento ?? lic.data_vencimento ?? null,
      dados.status ?? lic.status ?? null,
      dados.dias_carencia ?? lic.dias_carencia ?? 0,
      dados.chave_licenca ?? lic.chave_licenca ?? null,
      dados.cnpj ?? lic.cnpj ?? null,
      dados.razao_social ?? lic.razao_social ?? null,
      lic.id
    );

    return this.obterLicenca();
  }

  public estenderVencimento(dias: number, chaveReferencia?: string): LicencaRecord {
    const lic = this.obterLicenca();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimentoAtual = new Date(lic.data_vencimento);
    vencimentoAtual.setHours(0, 0, 0, 0);

    const baseData = vencimentoAtual > hoje ? vencimentoAtual : hoje;
    const novoVenc = new Date(baseData.getTime() + (dias * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    this.db.prepare(`
      UPDATE licenca_local SET
        data_vencimento = ?,
        status = 'ATIVA',
        dias_carencia = 0,
        chave_licenca = COALESCE(?, chave_licenca),
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = 'default'
    `).run(novoVenc, chaveReferencia || null);

    return this.obterLicenca();
  }

  public registrarHistoricoAssinatura(dados: {
    id: string;
    stripe_payment_id?: string;
    stripe_session_id?: string;
    plano: string;
    metodo_pagamento: string;
    valor: number;
    status: string;
    pago_em?: string;
  }): void {
    this.db.prepare(`
      INSERT INTO assinaturas_historico (
        id, stripe_payment_id, stripe_session_id, plano, metodo_pagamento, valor, status, pago_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dados.id,
      dados.stripe_payment_id || null,
      dados.stripe_session_id || null,
      dados.plano,
      dados.metodo_pagamento,
      dados.valor,
      dados.status,
      dados.pago_em || new Date().toISOString()
    );
  }

  public listarHistoricoAssinaturas(): any[] {
    return this.db.prepare(
      'SELECT * FROM assinaturas_historico ORDER BY criado_em DESC LIMIT 20'
    ).all();
  }
}
