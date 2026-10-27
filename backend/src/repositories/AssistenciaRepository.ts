import { getOperacaoDb } from '../config/database.js';
import crypto from 'node:crypto';

export interface Equipamento {
  id: string;
  cliente_id?: string;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie?: string;
  cor?: string;
  acessorios?: string;
  criado_em?: string;
}

export interface OrdemDeServico {
  id: string;
  numero_os: number;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  equipamento_id?: string;
  equipamento_descricao: string;
  numero_serie?: string;
  defeito_relatado: string;
  laudo_tecnico?: string;
  status: 'AGUARDANDO_AVALIACAO' | 'AGUARDANDO_PECA' | 'PRONTO' | 'ENTREGUE';
  valor_servicos: number;
  valor_pecas: number;
  valor_total: number;
  tecnico_responsavel?: string;
  data_abertura?: string;
  data_previsao?: string;
  data_conclusao?: string;
  data_entrega?: string;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export class AssistenciaRepository {
  private get db() {
    return getOperacaoDb();
  }

  public obterProximoNumeroOs(): number {
    const row = this.db.prepare('SELECT COALESCE(MAX(numero_os), 1000) + 1 as proximo FROM ordens_de_servico').get() as { proximo: number };
    return row?.proximo || 1001;
  }

  public listarOs(status?: string, busca?: string): OrdemDeServico[] {
    let sql = 'SELECT * FROM ordens_de_servico WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'TODOS') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (busca && busca.trim()) {
      const q = `%${busca.trim()}%`;
      sql += ' AND (cliente_nome LIKE ? OR equipamento_descricao LIKE ? OR numero_serie LIKE ? OR CAST(numero_os AS TEXT) LIKE ?)';
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY numero_os DESC LIMIT 200';
    const rows = this.db.prepare(sql).all(...params);
    return rows as unknown as OrdemDeServico[];
  }

  public obterOsPorId(id: string): OrdemDeServico | null {
    const row = this.db.prepare('SELECT * FROM ordens_de_servico WHERE id = ? LIMIT 1').get(id);
    return (row as unknown as OrdemDeServico) || null;
  }

  public criarOs(dados: Partial<OrdemDeServico>): OrdemDeServico {
    const id = dados.id || crypto.randomUUID();
    const numero_os = dados.numero_os || this.obterProximoNumeroOs();
    const vServ = Number(dados.valor_servicos || 0);
    const vPecas = Number(dados.valor_pecas || 0);
    const vTotal = Number(dados.valor_total || (vServ + vPecas));

    const stmt = this.db.prepare(`
      INSERT INTO ordens_de_servico (
        id, numero_os, cliente_id, cliente_nome, cliente_telefone, cliente_cpf,
        equipamento_id, equipamento_descricao, numero_serie, defeito_relatado,
        laudo_tecnico, status, valor_servicos, valor_pecas, valor_total,
        tecnico_responsavel, data_previsao, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      numero_os,
      dados.cliente_id || null,
      String(dados.cliente_nome || 'CLIENTE NÃO IDENTIFICADO').toUpperCase().trim(),
      dados.cliente_telefone || null,
      dados.cliente_cpf || null,
      dados.equipamento_id || null,
      String(dados.equipamento_descricao || 'EQUIPAMENTO DIVERSO').toUpperCase().trim(),
      dados.numero_serie || null,
      String(dados.defeito_relatado || 'Defeito a diagnosticar').trim(),
      dados.laudo_tecnico || null,
      dados.status || 'AGUARDANDO_AVALIACAO',
      vServ,
      vPecas,
      vTotal,
      dados.tecnico_responsavel || 'TÉCNICO PADRÃO',
      dados.data_previsao || null,
      dados.observacoes || null
    );

    return this.obterOsPorId(id)!;
  }

  public atualizarOs(id: string, dados: Partial<OrdemDeServico>): OrdemDeServico | null {
    const atual = this.obterOsPorId(id);
    if (!atual) return null;

    const vServ = dados.valor_servicos !== undefined ? Number(dados.valor_servicos) : atual.valor_servicos;
    const vPecas = dados.valor_pecas !== undefined ? Number(dados.valor_pecas) : atual.valor_pecas;
    const vTotal = dados.valor_total !== undefined ? Number(dados.valor_total) : (vServ + vPecas);

    const stmt = this.db.prepare(`
      UPDATE ordens_de_servico SET
        cliente_nome = ?,
        cliente_telefone = ?,
        equipamento_descricao = ?,
        numero_serie = ?,
        defeito_relatado = ?,
        laudo_tecnico = ?,
        status = ?,
        valor_servicos = ?,
        valor_pecas = ?,
        valor_total = ?,
        tecnico_responsavel = ?,
        data_conclusao = ?,
        data_entrega = ?,
        observacoes = ?,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      (dados.cliente_nome !== undefined ? String(dados.cliente_nome).toUpperCase() : atual.cliente_nome) ?? null,
      (dados.cliente_telefone !== undefined ? dados.cliente_telefone : atual.cliente_telefone) ?? null,
      (dados.equipamento_descricao !== undefined ? String(dados.equipamento_descricao).toUpperCase() : atual.equipamento_descricao) ?? null,
      (dados.numero_serie !== undefined ? dados.numero_serie : atual.numero_serie) ?? null,
      (dados.defeito_relatado !== undefined ? dados.defeito_relatado : atual.defeito_relatado) ?? null,
      (dados.laudo_tecnico !== undefined ? dados.laudo_tecnico : atual.laudo_tecnico) ?? null,
      (dados.status !== undefined ? dados.status : atual.status) ?? null,
      vServ,
      vPecas,
      vTotal,
      (dados.tecnico_responsavel !== undefined ? dados.tecnico_responsavel : atual.tecnico_responsavel) ?? null,
      (dados.data_conclusao !== undefined ? dados.data_conclusao : atual.data_conclusao) ?? null,
      (dados.data_entrega !== undefined ? dados.data_entrega : atual.data_entrega) ?? null,
      (dados.observacoes !== undefined ? dados.observacoes : atual.observacoes) ?? null,
      id
    );

    return this.obterOsPorId(id);
  }

  public excluirOs(id: string): boolean {
    const info = this.db.prepare('DELETE FROM ordens_de_servico WHERE id = ?').run(id);
    return Number(info.changes) > 0;
  }

  public listarClientes(busca?: string): any[] {
    if (busca && busca.trim()) {
      return this.db.prepare('SELECT * FROM clientes WHERE nome LIKE ? OR cpf_cnpj LIKE ? ORDER BY nome ASC LIMIT 50')
        .all(`%${busca.trim()}%`, `%${busca.trim()}%`) as any[];
    }
    return this.db.prepare('SELECT * FROM clientes ORDER BY nome ASC LIMIT 50').all() as any[];
  }

  public criarCliente(dados: { nome: string; cpf_cnpj?: string; telefone?: string; email?: string; endereco?: string }): any {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO clientes (id, nome, cpf_cnpj, telefone, email, endereco)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, dados.nome.toUpperCase(), dados.cpf_cnpj ?? null, dados.telefone ?? null, dados.email ?? null, dados.endereco ?? null);
    return this.db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  }

  public atualizarStatusOs(id: string, status: string, observacoes?: string): OrdemDeServico | null {
    const atual = this.obterOsPorId(id);
    if (!atual) return null;
    const obs = observacoes ? (atual.observacoes ? `${atual.observacoes} | ${observacoes}` : observacoes) : atual.observacoes;
    const isEntrega = status === 'ENTREGUE';
    this.db.prepare(`
      UPDATE ordens_de_servico SET
        status = ?,
        observacoes = ?,
        data_conclusao = CASE WHEN ? = 'PRONTO' AND data_conclusao IS NULL THEN CURRENT_TIMESTAMP ELSE data_conclusao END,
        data_entrega = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE data_entrega END,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, obs ?? null, status, isEntrega ? 1 : 0, id);
    return this.obterOsPorId(id);
  }

  public listarEquipamentos(clienteId?: string): Equipamento[] {
    if (clienteId) {
      return this.db.prepare('SELECT * FROM equipamentos WHERE cliente_id = ? ORDER BY criado_em DESC LIMIT 100').all(clienteId) as unknown as Equipamento[];
    }
    return this.db.prepare('SELECT * FROM equipamentos ORDER BY criado_em DESC LIMIT 100').all() as unknown as Equipamento[];
  }

  public criarEquipamento(dados: Partial<Equipamento>): Equipamento {
    const id = dados.id || crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO equipamentos (id, cliente_id, tipo, marca, modelo, numero_serie, cor, acessorios)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, dados.cliente_id || null, dados.tipo || 'OUTRO', dados.marca || 'GENERICA', dados.modelo || 'GERAL', dados.numero_serie || null, dados.cor || null, dados.acessorios || null);
    return this.db.prepare('SELECT * FROM equipamentos WHERE id = ?').get(id) as unknown as Equipamento;
  }
}
