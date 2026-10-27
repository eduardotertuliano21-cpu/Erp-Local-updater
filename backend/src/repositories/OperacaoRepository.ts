import { getOperacaoDb } from '../config/database.js';
import {
  IOperacaoRepository,
  CaixaRecord,
  MovimentacaoCaixaRecord,
  VendaRecord,
  VendaComDetalhesRecord,
  ResumoPendenciasSync,
} from './IOperacaoRepository.js';
import { CriarVendaPayload, MovimentacaoCaixaPayload } from '../types/api.js';
import crypto from 'node:crypto';

export class OperacaoRepository implements IOperacaoRepository {
  private db = getOperacaoDb();

  public obterCaixaAberto(): CaixaRecord | null {
    const row = this.db.prepare(`SELECT * FROM caixas WHERE status = 'ABERTO' ORDER BY aberto_em DESC LIMIT 1`).get();
    return (row as unknown as CaixaRecord) || null;
  }

  public abrirCaixa(id: string, numero: number, operador: string, saldoInicial: number): CaixaRecord {
    try {
      this.db.prepare("UPDATE caixas SET status = 'FECHADO', fechado_em = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
      this.db.prepare("UPDATE sessoes_caixa SET status = 'FECHADO', data_fechamento = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
    } catch {}
    this.db.prepare(
      `INSERT INTO caixas (id, numero, operador_abertura, status, saldo_inicial, aberto_em) VALUES (?, ?, ?, 'ABERTO', ?, CURRENT_TIMESTAMP)`
    ).run(id, numero, operador, saldoInicial);
    try {
      this.db.prepare(
        `INSERT INTO sessoes_caixa (id, usuario_id, saldo_inicial, status, data_abertura) VALUES (?, ?, ?, 'ABERTO', CURRENT_TIMESTAMP)`
      ).run(id, operador, saldoInicial);
    } catch {}

    this.registrarMovimentacao({
      id: crypto.randomUUID(),
      caixa_id: id,
      operador_id: operador,
      tipo: 'ABERTURA',
      valor: saldoInicial,
      motivo: 'Abertura de Caixa (Fundo de Troco)',
    });

    return this.obterCaixaAberto()!;
  }

  public fecharCaixa(caixaId: string, saldoFinal: number): void {
    this.db.prepare(
      `UPDATE caixas SET status = 'FECHADO', saldo_final = ?, fechado_em = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(saldoFinal, caixaId);
    try {
      this.db.prepare(
        `UPDATE sessoes_caixa SET status = 'FECHADO', saldo_final = ?, data_fechamento = CURRENT_TIMESTAMP WHERE status = 'ABERTO'`
      ).run(saldoFinal);
    } catch {}
  }

  public registrarMovimentacao(
    mov: MovimentacaoCaixaPayload & { id: string; caixa_id: string }
  ): MovimentacaoCaixaRecord {
    const stmt = this.db.prepare(`
      INSERT INTO caixa_movimentacoes (id, caixa_id, operador_id, tipo, valor, motivo, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(mov.id, mov.caixa_id, mov.operador_id, mov.tipo, mov.valor, mov.motivo || null);

    const selectStmt = this.db.prepare(`SELECT * FROM caixa_movimentacoes WHERE id = ?`);
    return selectStmt.get(mov.id) as unknown as MovimentacaoCaixaRecord;
  }

  public listarMovimentacoesCaixa(caixaId: string): MovimentacaoCaixaRecord[] {
    const stmt = this.db.prepare(
      `SELECT * FROM caixa_movimentacoes WHERE caixa_id = ? ORDER BY criado_em ASC`
    );
    return stmt.all(caixaId) as unknown as MovimentacaoCaixaRecord[];
  }

  public salvarVenda(
    venda: CriarVendaPayload & { id: string; numero_sequencial: number; subtotal: number; total_liquido: number }
  ): VendaRecord {
    const stmtVenda = this.db.prepare(`
      INSERT INTO vendas (
        id, numero_sequencial, caixa_id, operador_id, cpf_cliente,
        subtotal, desconto, total_liquido, troco, status, numero_caixa_fisico, criado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONCLUIDA', ?, CURRENT_TIMESTAMP)
    `);

    const stmtItem = this.db.prepare(`
      INSERT INTO itens_venda (
        id, venda_id, produto_id, codigo_barras, descricao, quantidade, preco_unitario, desconto, subtotal,
        ncm, cfop, cst_csosn, cest, unidade_medida, aliquota_icms, origem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stmtPagamento = this.db.prepare(
      `INSERT INTO pagamentos_venda (id, venda_id, metodo, valor, detalhes) VALUES (?, ?, ?, ?, ?)`
    );

    this.db.exec('BEGIN TRANSACTION;');
    try {
      stmtVenda.run(
        venda.id, venda.numero_sequencial, venda.caixa_id, venda.operador_id, venda.cpf_cliente || null,
        venda.subtotal, venda.desconto_total || 0, venda.total_liquido, venda.troco || 0,
        venda.numero_caixa_fisico || '01'
      );

      for (const item of venda.itens) {
        stmtItem.run(
          crypto.randomUUID(), venda.id, item.produto_id, item.codigo_barras, item.descricao,
          item.quantidade, item.preco_unitario, item.desconto, item.subtotal,
          item.ncm || null, item.cfop || null, item.cst_csosn || '102', item.cest || null,
          item.unidade_medida || 'UN', item.aliquota_icms || 0, item.origem || 0
        );

        const fator = Number((item as any).fator_saida) || 1;
        try {
          this.db.prepare(`
            INSERT INTO estoque_movimentos (id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id)
            VALUES (?, ?, 'SAIDA_VENDA', 'LOJA', ?, ?, ?, 'Venda PDV', ?)
          `).run(crypto.randomUUID(), item.produto_id, item.quantidade * fator, item.preco_unitario, `Venda #${venda.numero_sequencial}`, venda.operador_id);
        } catch {}
      }

      for (const pag of venda.pagamentos) {
        stmtPagamento.run(
          crypto.randomUUID(),
          venda.id,
          pag.metodo,
          pag.valor,
          pag.detalhes || null
        );

        if (pag.metodo === 'CONVENIO' && venda.cliente_id) {
          try {
            this.db.prepare('UPDATE entidades SET saldo_devedor = COALESCE(saldo_devedor, 0) + ? WHERE id = ?')
              .run(pag.valor, venda.cliente_id);
            const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const desc = `Venda Convênio/Fiado #${venda.numero_sequencial}`;
            this.db.prepare(`
              INSERT INTO financeiro_titulos (
                id, tipo, entidade_id, entidade_nome, descricao, valor, vencimento, status, venda_id, criado_em
              ) VALUES (?, 'RECEBER', ?, ?, ?, ?, ?, 'PENDENTE', ?, CURRENT_TIMESTAMP)
            `).run(crypto.randomUUID(), venda.cliente_id, venda.cliente_nome || 'Cliente', desc, pag.valor, vencimento, venda.id);
          } catch (e) {
            console.error('[Convênio] Erro ao gravar lançamento financeiro:', e);
          }
        }
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }

    const selectStmt = this.db.prepare(`SELECT * FROM vendas WHERE id = ?`);
    return selectStmt.get(venda.id) as unknown as VendaRecord;
  }

  public cancelarVenda(vendaId: string, motivo: string, operadorId: string): void {
    const stmt = this.db.prepare(`UPDATE vendas SET status = 'CANCELADA', sincronizado = 0 WHERE id = ?`);
    stmt.run(vendaId);
    this.registrarLogAuditoria('CANCELAMENTO_VENDA', `Venda ${vendaId} cancelada. Motivo: ${motivo}`, operadorId);
  }

  public obterUltimasVendas(limite = 15): VendaRecord[] {
    const stmt = this.db.prepare(
      `SELECT * FROM vendas ORDER BY criado_em DESC LIMIT ?`
    );
    return stmt.all(limite) as unknown as VendaRecord[];
  }

  public obterVendaPorId(vendaId: string): VendaComDetalhesRecord | null {
    const stmtVenda = this.db.prepare(`SELECT * FROM vendas WHERE id = ? LIMIT 1`);
    const venda = stmtVenda.get(vendaId) as unknown as VendaRecord | undefined;
    if (!venda) return null;

    const stmtItens = this.db.prepare(`SELECT * FROM itens_venda WHERE venda_id = ?`);
    const stmtPags = this.db.prepare(`SELECT * FROM pagamentos_venda WHERE venda_id = ?`);

    return {
      ...venda,
      itens: stmtItens.all(vendaId) as any[],
      pagamentos: stmtPags.all(vendaId) as any[],
    };
  }

  public registrarLogAuditoria(acao: string, detalhes: string, operadorId?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO logs_auditoria (id, acao, detalhes, operador_id, criado_em)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(crypto.randomUUID(), acao, detalhes, operadorId || null);
  }

  // --- MÉTODOS DE SINCRONIZAÇÃO (LOCAL -> CLOUD) ---

  public obterVendasPendentes(limite = 50): VendaComDetalhesRecord[] {
    const stmtVendas = this.db.prepare(
      `SELECT * FROM vendas WHERE sincronizado = 0 ORDER BY criado_em ASC LIMIT ?`
    );
    const vendas = stmtVendas.all(limite) as unknown as VendaRecord[];

    const stmtItens = this.db.prepare(`SELECT * FROM itens_venda WHERE venda_id = ?`);
    const stmtPags = this.db.prepare(`SELECT * FROM pagamentos_venda WHERE venda_id = ?`);

    return vendas.map((v) => ({
      ...v,
      itens: stmtItens.all(v.id) as any[],
      pagamentos: stmtPags.all(v.id) as any[],
    }));
  }

  public marcarVendasSincronizadas(ids: string[]): void {
    if (ids.length === 0) return;
    const stmt = this.db.prepare(`
      UPDATE vendas
      SET sincronizado = 1, sincronizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const id of ids) {
        stmt.run(id);
      }
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  public obterMovimentacoesPendentes(limite = 50): MovimentacaoCaixaRecord[] {
    const stmt = this.db.prepare(
      `SELECT * FROM caixa_movimentacoes WHERE sincronizado = 0 ORDER BY criado_em ASC LIMIT ?`
    );
    return stmt.all(limite) as unknown as MovimentacaoCaixaRecord[];
  }

  public marcarMovimentacoesSincronizadas(ids: string[]): void {
    if (ids.length === 0) return;
    const stmt = this.db.prepare(`
      UPDATE caixa_movimentacoes
      SET sincronizado = 1, sincronizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const id of ids) {
        stmt.run(id);
      }
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  public obterResumoPendencias(): ResumoPendenciasSync {
    let v = 0, m = 0, l = 0;
    try {
      const rowV = this.db.prepare(`SELECT COUNT(*) as total FROM vendas WHERE sincronizado = 0`).get() as { total: number };
      if (rowV) v = rowV.total;
    } catch {}
    try {
      const rowM = this.db.prepare(`SELECT COUNT(*) as total FROM caixa_movimentacoes WHERE sincronizado = 0`).get() as { total: number };
      if (rowM) m = rowM.total;
    } catch {}
    try {
      const rowL = this.db.prepare(`SELECT COUNT(*) as total FROM logs_auditoria WHERE sincronizado = 0`).get() as { total: number };
      if (rowL) l = rowL.total;
    } catch {}

    return {
      vendasPendentes: v,
      movimentacoesPendentes: m,
      logsPendentes: l,
      totalPendencias: v + m + l,
    };
  }
}
