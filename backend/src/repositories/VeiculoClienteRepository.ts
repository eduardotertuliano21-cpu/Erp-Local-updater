import crypto from 'node:crypto';
import { getOperacaoDb } from '../config/database.js';

export interface VeiculoClienteRecord {
  id: string;
  cliente_id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  km_atual?: number;
  historico_manutencoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export class VeiculoClienteRepository {
  public listarPorCliente(clienteId: string): VeiculoClienteRecord[] {
    const db = getOperacaoDb();
    return db.prepare(`
      SELECT * FROM veiculos_clientes
      WHERE cliente_id = ?
      ORDER BY atualizado_em DESC
    `).all(clienteId) as unknown as VeiculoClienteRecord[];
  }

  public buscarPorPlaca(placa: string): VeiculoClienteRecord | null {
    const db = getOperacaoDb();
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const row = db.prepare(`
      SELECT * FROM veiculos_clientes
      WHERE UPPER(REPLACE(placa, '-', '')) = ?
    `).get(cleanPlaca) as unknown as VeiculoClienteRecord;
    return row || null;
  }

  public salvarVeiculo(dados: Partial<VeiculoClienteRecord>): VeiculoClienteRecord {
    const db = getOperacaoDb();
    const id = dados.id || `veic_${crypto.randomUUID()}`;
    const cleanPlaca = (dados.placa || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const existing = db.prepare(`SELECT id FROM veiculos_clientes WHERE id = ? OR UPPER(REPLACE(placa, '-', '')) = ?`).get(id, cleanPlaca) as any;

    if (existing) {
      db.prepare(`
        UPDATE veiculos_clientes
        SET cliente_id = COALESCE(?, cliente_id),
            marca = COALESCE(?, marca),
            modelo = COALESCE(?, modelo),
            ano = COALESCE(?, ano),
            cor = COALESCE(?, cor),
            km_atual = COALESCE(?, km_atual),
            historico_manutencoes = COALESCE(?, historico_manutencoes),
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        dados.cliente_id || null,
        dados.marca || null,
        dados.modelo || null,
        dados.ano || null,
        dados.cor || null,
        dados.km_atual || null,
        dados.historico_manutencoes || null,
        existing.id
      );
      return db.prepare(`SELECT * FROM veiculos_clientes WHERE id = ?`).get(existing.id) as unknown as VeiculoClienteRecord;
    }

    db.prepare(`
      INSERT INTO veiculos_clientes (id, cliente_id, placa, marca, modelo, ano, cor, km_atual, historico_manutencoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      dados.cliente_id || 'CLIENTE_PADRAO',
      cleanPlaca,
      dados.marca || '',
      dados.modelo || '',
      dados.ano || null,
      dados.cor || '',
      dados.km_atual || 0,
      dados.historico_manutencoes || null
    );

    return db.prepare(`SELECT * FROM veiculos_clientes WHERE id = ?`).get(id) as unknown as VeiculoClienteRecord;
  }

  public atualizarKm(placa: string, km: number): void {
    const db = getOperacaoDb();
    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    db.prepare(`
      UPDATE veiculos_clientes
      SET km_atual = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE UPPER(REPLACE(placa, '-', '')) = ?
    `).run(km, cleanPlaca);
  }
}
