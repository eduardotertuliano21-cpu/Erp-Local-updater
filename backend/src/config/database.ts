import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { initErpCatalogoSchema, initErpOperacaoSchema } from './schemaErp.js';
import { initAuthSchema } from './schemaAuth.js';
import { initEnterpriseSchema } from './schemaEnterprise.js';
import { initVarejoAvancadoSchema } from './schemaVarejoAvancado.js';
import { initAcougueSchema } from './schemaAcougue.js';
import { applyDatabaseEncryptionPragma } from './sqliteCrypto.js';
import { initAssistenciaSchema } from './schemaAssistencia.js';
import { initMesasSchema } from './schemaMesas.js';
import { TenantKey, TENANT_DB_FILES, normalizeTenant } from './tenantManager.js';

export { TenantKey, normalizeTenant } from './tenantManager.js';

function resolveDataDir(): string {
  if (process.env.CLICKSTORM_DATA_DIR) return path.resolve(process.env.CLICKSTORM_DATA_DIR);
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
  const isPackaged = process.env.NODE_ENV === 'production' || process.cwd().toLowerCase().includes('program files');
  if (isPackaged && appData) return fs.existsSync(path.join(appData, 'Clickstorm ERP Local', 'data')) ? path.join(appData, 'Clickstorm ERP Local', 'data') : path.join(appData, 'ClickStorm PDV', 'data');
  return path.resolve(process.cwd(), 'data');
}

export const DATA_DIR = resolveDataDir();
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export function resolveImagensDir(): string {
  if (process.platform === 'win32') {
    const winDir = 'C:\\ClickStorm_Data\\imagens';
    try {
      if (!fs.existsSync(winDir)) fs.mkdirSync(winDir, { recursive: true });
      return winDir;
    } catch {}
  }
  const fallback = path.join(DATA_DIR, 'imagens');
  if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}
export const IMAGENS_DIR = resolveImagensDir();

export class DatabaseConnection {
  private static activeTenant: TenantKey = 'mercado';
  private static connections: Map<TenantKey, { readDb: DatabaseSync; writeDb: DatabaseSync }> = new Map();

  public static setActiveTenant(tenant: TenantKey): void {
    if (this.activeTenant !== tenant) {
      console.log(`[Multi-Database] Alternando banco ativo de '${this.activeTenant}' para '${tenant}'`);
      this.closeConnection(this.activeTenant);
      this.activeTenant = tenant;
    }
  }

  public static getActiveTenant(): TenantKey {
    return this.activeTenant;
  }

  public static closeConnection(tenant: TenantKey): void {
    const conn = this.connections.get(tenant);
    if (conn) {
      try { conn.readDb.close(); } catch {}
      try { conn.writeDb.close(); } catch {}
      this.connections.delete(tenant);
    }
  }

  public static closeAllConnections(): void {
    for (const key of Array.from(this.connections.keys())) {
      this.closeConnection(key);
    }
  }

  public static getOrOpenConnection(tenant: TenantKey): { readDb: DatabaseSync; writeDb: DatabaseSync } {
    let conn = this.connections.get(tenant);
    if (!conn) {
      const dbFile = TENANT_DB_FILES[tenant] || 'db_mercado.sqlite';
      const dbPath = path.join(DATA_DIR, dbFile);
      this.ensureTenantSchemaExists(tenant, dbPath);
      const writeDb = new DatabaseSync(dbPath);
      applyDatabaseEncryptionPragma(writeDb);
      writeDb.exec('PRAGMA journal_mode = WAL;');
      writeDb.exec('PRAGMA synchronous = NORMAL;');
      const readDb = new DatabaseSync(dbPath, { readOnly: true });
      applyDatabaseEncryptionPragma(readDb);
      conn = { readDb, writeDb };
      this.connections.set(tenant, conn);
    }
    return conn;
  }

  public static getDb(tenant?: TenantKey): DatabaseSync {
    return this.getOrOpenConnection(tenant || this.activeTenant).writeDb;
  }

  public static getReadOnlyDb(tenant?: TenantKey): DatabaseSync {
    return this.getOrOpenConnection(tenant || this.activeTenant).readDb;
  }

  private static ensureTenantSchemaExists(tenant: TenantKey, dbPath: string): void {
    const initDb = new DatabaseSync(dbPath);
    applyDatabaseEncryptionPragma(initDb);
    initDb.exec('PRAGMA journal_mode = WAL;');
    initDb.exec('PRAGMA synchronous = NORMAL;');

    initDb.exec(`
      CREATE TABLE IF NOT EXISTS produtos (
        id TEXT PRIMARY KEY,
        codigo_barras TEXT UNIQUE NOT NULL,
        sku TEXT,
        descricao TEXT NOT NULL,
        categoria TEXT DEFAULT 'GERAL',
        tipo_pdv TEXT DEFAULT 'VAREJO',
        ramo_atuacao TEXT DEFAULT 'varejo',
        preco_venda REAL NOT NULL,
        unidade_medida TEXT DEFAULT 'UN',
        ncm TEXT,
        cfop TEXT,
        aliquota_icms REAL DEFAULT 0,
        cest TEXT,
        cst_csosn TEXT DEFAULT '102',
        origem INTEGER DEFAULT 0,
        ativo INTEGER DEFAULT 1,
        foto TEXT,
        codigo_referencia TEXT,
        localizacao_armazem TEXT,
        veiculos_compativeis TEXT,
        tamanho TEXT,
        cor TEXT,
        marca TEXT,
        modelo TEXT,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_prod_bar ON produtos(codigo_barras);
      CREATE INDEX IF NOT EXISTS idx_prod_desc ON produtos(descricao);

      CREATE TABLE IF NOT EXISTS categorias (
        id TEXT PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL,
        ramo_atuacao TEXT DEFAULT 'ambos',
        ativo INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS regras_fiscais (
        id TEXT PRIMARY KEY,
        ncm TEXT NOT NULL,
        cfop_padrao TEXT NOT NULL,
        cst_csosn TEXT NOT NULL,
        aliquota_icms REAL DEFAULT 0,
        aliquota_pis REAL DEFAULT 0,
        aliquota_cofins REAL DEFAULT 0,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS operadores (
        id TEXT PRIMARY KEY,
        matricula TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        perfil TEXT NOT NULL,
        ativo INTEGER DEFAULT 1,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS caixas (
        id TEXT PRIMARY KEY,
        numero INTEGER NOT NULL,
        operador_abertura TEXT NOT NULL,
        status TEXT NOT NULL,
        saldo_inicial REAL NOT NULL,
        saldo_final REAL,
        aberto_em TEXT DEFAULT CURRENT_TIMESTAMP,
        fechado_em TEXT,
        sincronizado INTEGER DEFAULT 0,
        sincronizado_em TEXT
      );

      CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
        id TEXT PRIMARY KEY,
        caixa_id TEXT NOT NULL,
        operador_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        motivo TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        sincronizado INTEGER DEFAULT 0,
        sincronizado_em TEXT
      );

      CREATE TABLE IF NOT EXISTS vendas (
        id TEXT PRIMARY KEY,
        numero_sequencial INTEGER,
        caixa_id TEXT NOT NULL,
        operador_id TEXT NOT NULL,
        numero_caixa_fisico TEXT DEFAULT '01',
        cpf_cliente TEXT,
        subtotal REAL NOT NULL,
        desconto REAL DEFAULT 0,
        total_liquido REAL NOT NULL,
        troco REAL DEFAULT 0,
        status TEXT NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
        sincronizado INTEGER DEFAULT 0,
        sincronizado_em TEXT
      );

      CREATE TABLE IF NOT EXISTS itens_venda (
        id TEXT PRIMARY KEY,
        venda_id TEXT NOT NULL,
        produto_id TEXT NOT NULL,
        codigo_barras TEXT NOT NULL,
        descricao TEXT NOT NULL,
        quantidade REAL NOT NULL,
        preco_unitario REAL NOT NULL,
        desconto REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        ncm TEXT,
        cfop TEXT,
        cst_csosn TEXT DEFAULT '102',
        cest TEXT,
        unidade_medida TEXT DEFAULT 'UN',
        aliquota_icms REAL DEFAULT 0,
        origem INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS pagamentos_venda (
        id TEXT PRIMARY KEY,
        venda_id TEXT NOT NULL,
        metodo TEXT NOT NULL,
        valor REAL NOT NULL,
        detalhes TEXT
      );

      CREATE TABLE IF NOT EXISTS licenca_local (
        id TEXT PRIMARY KEY,
        cnpj TEXT,
        razao_social TEXT,
        data_vencimento TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ATIVA',
        dias_carencia INTEGER DEFAULT 0,
        chave_licenca TEXT,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assinaturas_historico (
        id TEXT PRIMARY KEY,
        stripe_payment_id TEXT,
        stripe_session_id TEXT,
        plano TEXT NOT NULL,
        metodo_pagamento TEXT NOT NULL,
        valor REAL NOT NULL,
        status TEXT NOT NULL,
        pago_em TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    initErpCatalogoSchema(initDb);
    initErpOperacaoSchema(initDb);
    initAuthSchema(initDb);
    initEnterpriseSchema(initDb);
    initVarejoAvancadoSchema(initDb);
    if (tenant === 'acougue') initAcougueSchema(initDb);
    else if (tenant === 'assistencia') initAssistenciaSchema(initDb);
    else if (tenant === 'restaurante') initMesasSchema(initDb);

    for (const sql of ['ALTER TABLE produtos ADD COLUMN tamanho TEXT;', 'ALTER TABLE produtos ADD COLUMN cor TEXT;', 'ALTER TABLE produtos ADD COLUMN marca TEXT;', 'ALTER TABLE produtos ADD COLUMN modelo TEXT;', 'ALTER TABLE vendas ADD COLUMN numero_caixa_fisico TEXT DEFAULT \'01\';', 'CREATE INDEX IF NOT EXISTS idx_prod_marca ON produtos(marca);', 'CREATE INDEX IF NOT EXISTS idx_prod_modelo ON produtos(modelo);']) {
      try { initDb.exec(sql); } catch {}
    }

    const countOp = initDb.prepare('SELECT COUNT(*) as total FROM operadores').get() as { total: number };
    if (countOp.total === 0) {
      const insOp = initDb.prepare('INSERT INTO operadores (id, matricula, nome, pin_hash, perfil, ativo) VALUES (?, ?, ?, ?, ?, 1)');
      for (const op of [['op_01', '001', 'OPERADOR PADRAO', '1234', 'OPERADOR'], ['op_02', '9999', 'SUPERVISOR GERAL', '9999', 'SUPERVISOR'], ['op_03', '1001', 'TECNICO RESPONSAVEL', '1111', 'OPERADOR']]) insOp.run(...op);
    }

    const countLic = initDb.prepare('SELECT COUNT(*) as total FROM licenca_local').get() as { total: number };
    if (countLic.total === 0) {
      const daqui30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      initDb.prepare(`INSERT INTO licenca_local (id, cnpj, razao_social, data_vencimento, status, dias_carencia, chave_licenca) VALUES ('default', '00.000.000/0001-91', 'CLICKSTORM COMERCIO E VAREJO LTDA', ?, 'ATIVA', 0, 'CS-PRO-LOCAL-LICENSE')`).run(daqui30Dias);
    }

    initDb.close();
  }
}

// Proxies dinâmicos com roteamento automático para o banco do tenant ativo
const createDbProxy = (isReadOnly: boolean): DatabaseSync => {
  return new Proxy({} as DatabaseSync, {
    get(_target, prop) {
      const activeDb = isReadOnly ? DatabaseConnection.getReadOnlyDb() : DatabaseConnection.getDb();
      const val = (activeDb as any)[prop];
      return typeof val === 'function' ? val.bind(activeDb) : val;
    },
  });
};

export const getCatalogoReadOnlyDb = (): DatabaseSync => createDbProxy(true);
export const getCatalogoWriterDb = (): DatabaseSync => createDbProxy(false);
export const getOperacaoDb = (): DatabaseSync => createDbProxy(false);
