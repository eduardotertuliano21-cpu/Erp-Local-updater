import crypto from 'node:crypto';
import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import { hashSenha } from '../config/schemaAuth.js';
import { UserSyncService } from '../services/UserSyncService.js';
import {
  HierarquiaUsuario,
  PermissoesUsuario,
  UsuarioDTO,
  SessaoCaixaDTO,
  RespostaStatusCaixaUsuario,
} from '../types/auth.js';

export class UsuarioRepository {
  private dbWriter = getCatalogoWriterDb();
  private dbReader = getCatalogoReadOnlyDb();

  public listarTodos(): UsuarioDTO[] {
    const rows = this.dbReader.prepare(
      `SELECT u.*, p.pode_cancelar_venda, p.pode_dar_desconto, p.pode_ver_relatorios, p.acessa_estoque, p.acessa_financeiro, p.acessa_configuracoes FROM usuarios u LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id WHERE u.id != 'admin_virtual' ORDER BY u.nome ASC`
    ).all() as any[];
    return rows.map(this.mapRowToUsuarioDTO);
  }

  public obterPorId(id: string): UsuarioDTO | null {
    const row = this.dbReader.prepare(
      `SELECT u.*, p.pode_cancelar_venda, p.pode_dar_desconto, p.pode_ver_relatorios, p.acessa_estoque, p.acessa_financeiro, p.acessa_configuracoes FROM usuarios u LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id WHERE u.id = ? LIMIT 1`
    ).get(id) as any;
    return row ? this.mapRowToUsuarioDTO(row) : null;
  }

  public obterPorLogin(login: string): { usuario: UsuarioDTO; senha_hash: string } | null {
    const row = this.dbReader.prepare(
      `SELECT u.*, p.pode_cancelar_venda, p.pode_dar_desconto, p.pode_ver_relatorios, p.acessa_estoque, p.acessa_financeiro, p.acessa_configuracoes FROM usuarios u LEFT JOIN permissoes_usuario p ON p.usuario_id = u.id WHERE LOWER(TRIM(u.login)) = LOWER(TRIM(?)) LIMIT 1`
    ).get(login) as any;
    if (!row) return null;
    return { usuario: this.mapRowToUsuarioDTO(row), senha_hash: row.senha_hash };
  }

  public criar(dados: {
    nome: string;
    login: string;
    senha: string;
    hierarquia: HierarquiaUsuario;
    permissoes?: Partial<PermissoesUsuario>;
  }): UsuarioDTO {
    const id = `usr_${crypto.randomUUID()}`;
    const hash = hashSenha(dados.senha);
    const hierarquia = dados.hierarquia || 'OPERADOR';

    this.dbWriter.prepare(`
      INSERT INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, dados.nome.trim(), dados.login.trim().toLowerCase(), hash, hierarquia);

    const isAdm = hierarquia === 'ADMIN' || hierarquia === 'GERENTE';
    const p = dados.permissoes || {};
    this.dbWriter.prepare(`INSERT INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      id, isAdm || p.pode_cancelar_venda ? 1 : 0, isAdm || p.pode_dar_desconto ? 1 : 0, isAdm || p.pode_ver_relatorios ? 1 : 0,
      isAdm || p.acessa_estoque ? 1 : 0, isAdm || p.acessa_financeiro ? 1 : 0, isAdm || p.acessa_configuracoes ? 1 : 0
    );

    const criado = this.obterPorId(id)!;
    UserSyncService.sincronizarUsuarioParaColaborador(this.dbWriter, criado, dados.senha);
    return criado;
  }

  public atualizar(
    id: string,
    dados: {
      nome?: string;
      login?: string;
      senha?: string;
      hierarquia?: HierarquiaUsuario;
      ativo?: boolean;
      permissoes?: Partial<PermissoesUsuario>;
    }
  ): UsuarioDTO | null {
    const existente = this.obterPorId(id);
    if (!existente) return null;

    if (dados.nome !== undefined) this.dbWriter.prepare(`UPDATE usuarios SET nome = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(dados.nome.trim(), id);
    if (dados.login !== undefined) this.dbWriter.prepare(`UPDATE usuarios SET login = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(dados.login.trim().toLowerCase(), id);
    if (dados.senha && dados.senha.trim().length > 0) this.dbWriter.prepare(`UPDATE usuarios SET senha_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(hashSenha(dados.senha), id);
    if (dados.hierarquia !== undefined) this.dbWriter.prepare(`UPDATE usuarios SET hierarquia = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(dados.hierarquia, id);
    if (dados.ativo !== undefined) this.dbWriter.prepare(`UPDATE usuarios SET ativo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(dados.ativo ? 1 : 0, id);

    if (dados.permissoes) {
      const p = dados.permissoes;
      this.dbWriter.prepare(`
        INSERT INTO permissoes_usuario (usuario_id, pode_cancelar_venda, pode_dar_desconto, pode_ver_relatorios, acessa_estoque, acessa_financeiro, acessa_configuracoes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(usuario_id) DO UPDATE SET
          pode_cancelar_venda = excluded.pode_cancelar_venda,
          pode_dar_desconto = excluded.pode_dar_desconto,
          pode_ver_relatorios = excluded.pode_ver_relatorios,
          acessa_estoque = excluded.acessa_estoque,
          acessa_financeiro = excluded.acessa_financeiro,
          acessa_configuracoes = excluded.acessa_configuracoes
      `).run(id, p.pode_cancelar_venda ? 1 : 0, p.pode_dar_desconto ? 1 : 0, p.pode_ver_relatorios ? 1 : 0, p.acessa_estoque ? 1 : 0, p.acessa_financeiro ? 1 : 0, p.acessa_configuracoes ? 1 : 0);
    }

    const atualizado = this.obterPorId(id);
    if (atualizado) UserSyncService.sincronizarUsuarioParaColaborador(this.dbWriter, atualizado, dados.senha);
    return atualizado;
  }

  public atualizarSenhaHash(id: string, hash: string): void {
    this.dbWriter.prepare(`UPDATE usuarios SET senha_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(hash, id);
  }

  public atualizarSenhaPorLogin(login: string, hash: string): boolean {
    return this.dbWriter.prepare(`UPDATE usuarios SET senha_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE LOWER(login) = LOWER(?)`).run(hash, login.trim()).changes > 0;
  }

  public atualizarLoginAdmin(novoLogin: string, novoNome?: string): void {
    const admin = this.dbReader.prepare(`SELECT id, login FROM usuarios WHERE hierarquia = 'ADMIN' AND id != 'admin_virtual' ORDER BY criado_em ASC LIMIT 1`).get() as any;
    if (admin && admin.login.toLowerCase() !== novoLogin.trim().toLowerCase()) {
      if (novoNome) {
        this.dbWriter.prepare(`UPDATE usuarios SET login = ?, nome = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(novoLogin.trim().toLowerCase(), novoNome.trim(), admin.id);
      } else {
        this.dbWriter.prepare(`UPDATE usuarios SET login = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?`).run(novoLogin.trim().toLowerCase(), admin.id);
      }
    }
  }

  public excluir(id: string): boolean {
    this.dbWriter.prepare(`DELETE FROM permissoes_usuario WHERE usuario_id = ?`).run(id);
    try {
      this.dbWriter.prepare(`DELETE FROM entidades WHERE id = ? OR id = ?`).run(id, `fun_${id}`);
    } catch {}
    return this.dbWriter.prepare(`DELETE FROM usuarios WHERE id = ?`).run(id).changes > 0;
  }

  public obterForcarFechamentoDiario(): boolean {
    try {
      const row = this.dbReader.prepare(`SELECT forcar_fechamento_diario FROM config_loja LIMIT 1`).get() as any;
      if (row && row.forcar_fechamento_diario !== undefined) return Boolean(row.forcar_fechamento_diario);
    } catch {}
    return true;
  }

  public obterSessaoAbertaUsuario(usuarioId: string): SessaoCaixaDTO | null {
    const row = this.dbReader.prepare(
      `SELECT s.id, s.usuario_id, s.data_abertura, s.data_fechamento, s.saldo_inicial, s.saldo_final, s.status, s.observacoes, u.nome as usuario_nome FROM sessoes_caixa s LEFT JOIN usuarios u ON u.id = s.usuario_id WHERE s.usuario_id = ? AND s.status = 'ABERTO' ORDER BY s.data_abertura DESC LIMIT 1`
    ).get(usuarioId) as any;

    if (!row) return null;
    return {
      id: row.id, usuario_id: row.usuario_id, usuario_nome: row.usuario_nome,
      data_abertura: row.data_abertura, data_fechamento: row.data_fechamento,
      saldo_inicial: Number(row.saldo_inicial || 0), saldo_final: row.saldo_final !== null ? Number(row.saldo_final) : null,
      status: row.status, observacoes: row.observacoes,
    };
  }

  public validarStatusCaixaOperador(usuarioId: string): RespostaStatusCaixaUsuario {
    const forcarFechamento = this.obterForcarFechamentoDiario();
    let caixaAberto: any = null;
    try {
      caixaAberto = this.dbWriter.prepare("SELECT * FROM caixas WHERE status = 'ABERTO' ORDER BY aberto_em DESC LIMIT 1").get();
    } catch {}

    let operId = usuarioId || 'admin_virtual';
    try {
      this.dbWriter.prepare("INSERT OR IGNORE INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo) VALUES ('admin_virtual', 'Administrador Virtual', 'admin_virtual', 'bypass', 'ADMIN', 1)").run();
      if (!this.dbReader.prepare("SELECT id FROM usuarios WHERE id = ?").get(operId)) operId = 'admin_virtual';
    } catch {}

    const sessao = this.obterSessaoAbertaUsuario(operId);

    if (!caixaAberto) {
      if (sessao) {
        try {
          this.dbWriter.prepare("UPDATE sessoes_caixa SET status = 'FECHADO', data_fechamento = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
        } catch {}
      }
      return {
        status: 'FECHADO',
        sessaoAberta: null,
        forcarFechamentoDiario: forcarFechamento,
        mensagem: 'Não há caixa aberto. É necessário realizar a abertura do caixa.',
      };
    }

    if (!sessao) {
      const novaId = caixaAberto.id || `ses_${crypto.randomUUID()}`;
      try {
        this.dbWriter.prepare(
          "INSERT INTO sessoes_caixa (id, usuario_id, saldo_inicial, status, data_abertura) VALUES (?, ?, ?, 'ABERTO', ?)"
        ).run(novaId, operId, Number(caixaAberto.saldo_inicial || 0), caixaAberto.aberto_em || new Date().toISOString());
      } catch {}
      const sessaoSinc = this.obterSessaoAbertaUsuario(operId);
      if (sessaoSinc) {
        return { status: 'ABERTO_HOJE', sessaoAberta: sessaoSinc, forcarFechamentoDiario: forcarFechamento, mensagem: 'Caixa aberto sincronizado.' };
      }
      return { status: 'FECHADO', sessaoAberta: null, forcarFechamentoDiario: forcarFechamento, mensagem: 'É necessário abrir o caixa.' };
    }

    const hoje = new Date().toISOString().split('T')[0];
    const dataAbertura = sessao.data_abertura ? sessao.data_abertura.split(' ')[0].split('T')[0] : hoje;

    if (dataAbertura === hoje) {
      return {
        status: 'ABERTO_HOJE',
        sessaoAberta: sessao,
        forcarFechamentoDiario: forcarFechamento,
        mensagem: 'Caixa aberto hoje. Acesso liberado ao PDV.',
      };
    }

    if (forcarFechamento) {
      return {
        status: 'FECHAMENTO_PENDENTE',
        sessaoAberta: sessao,
        forcarFechamentoDiario: true,
        mensagem: `Atenção: Existe um caixa aberto de data anterior (${dataAbertura}). Fechamento obrigatório pendente.`,
      };
    }

    return {
      status: 'ABERTO_HOJE',
      sessaoAberta: sessao,
      forcarFechamentoDiario: false,
      mensagem: 'Caixa de data anterior mantido aberto conforme política da loja.',
    };
  }

  public abrirSessaoCaixa(usuarioId: string, saldoInicial: number): SessaoCaixaDTO {
    try {
      this.dbWriter.prepare("UPDATE sessoes_caixa SET status = 'FECHADO', data_fechamento = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
      this.dbWriter.prepare("UPDATE caixas SET status = 'FECHADO', fechado_em = CURRENT_TIMESTAMP WHERE status = 'ABERTO'").run();
    } catch {}

    let operId = usuarioId || 'admin_virtual';
    try {
      this.dbWriter.prepare("INSERT OR IGNORE INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo) VALUES ('admin_virtual', 'Administrador Virtual', 'admin_virtual', 'bypass', 'ADMIN', 1)").run();
      if (!this.dbReader.prepare("SELECT id FROM usuarios WHERE id = ?").get(operId)) operId = 'admin_virtual';
    } catch {}

    const id = `ses_${crypto.randomUUID()}`;
    this.dbWriter.prepare(
      "INSERT INTO sessoes_caixa (id, usuario_id, saldo_inicial, status, data_abertura) VALUES (?, ?, ?, 'ABERTO', CURRENT_TIMESTAMP)"
    ).run(id, operId, saldoInicial);

    try {
      const countCaixas = (this.dbWriter.prepare("SELECT COUNT(*) as total FROM caixas").get() as any)?.total || 1;
      this.dbWriter.prepare(
        "INSERT INTO caixas (id, numero, operador_abertura, status, saldo_inicial, aberto_em) VALUES (?, ?, ?, 'ABERTO', ?, CURRENT_TIMESTAMP)"
      ).run(id, countCaixas + 1, operId, saldoInicial);
    } catch {}

    try {
      this.dbWriter.prepare(
        "INSERT INTO caixa_movimentacoes (id, caixa_id, operador_id, tipo, valor, motivo, criado_em) VALUES (?, ?, ?, 'ABERTURA', ?, 'Abertura de Caixa (Fundo de Troco)', CURRENT_TIMESTAMP)"
      ).run(crypto.randomUUID(), id, operId, saldoInicial);
    } catch {}

    return this.obterSessaoAbertaUsuario(operId)!;
  }

  public fecharSessaoCaixa(sessaoId: string, saldoFinal: number, observacoes?: string): boolean {
    const res = this.dbWriter.prepare(
      "UPDATE sessoes_caixa SET status = 'FECHADO', saldo_final = ?, data_fechamento = CURRENT_TIMESTAMP, observacoes = ? WHERE (id = ? OR status = 'ABERTO')"
    ).run(saldoFinal, observacoes || null, sessaoId);

    try {
      this.dbWriter.prepare(
        "UPDATE caixas SET status = 'FECHADO', saldo_final = ?, fechado_em = CURRENT_TIMESTAMP WHERE (id = ? OR status = 'ABERTO')"
      ).run(saldoFinal, sessaoId);
    } catch {}

    return res.changes > 0;
  }

  private mapRowToUsuarioDTO(r: any): UsuarioDTO {
    const isAdm = r.hierarquia === 'ADMIN' || r.hierarquia === 'GERENTE';
    return {
      id: r.id, nome: r.nome, login: r.login, hierarquia: r.hierarquia as HierarquiaUsuario,
      ativo: Boolean(r.ativo), criado_em: r.criado_em, atualizado_em: r.atualizado_em,
      permissoes: {
        pode_cancelar_venda: isAdm || Boolean(r.pode_cancelar_venda), pode_dar_desconto: isAdm || Boolean(r.pode_dar_desconto),
        pode_ver_relatorios: isAdm || Boolean(r.pode_ver_relatorios), acessa_estoque: isAdm || Boolean(r.acessa_estoque),
        acessa_financeiro: isAdm || Boolean(r.acessa_financeiro), acessa_configuracoes: isAdm || Boolean(r.acessa_configuracoes),
      },
    };
  }
}
