import type { DatabaseSync } from 'node:sqlite';

export function initErpCatalogoSchema(db: DatabaseSync): void {
  db.exec(`
    -- 1. Entidades Centrais (Clientes, Fornecedores, Transportadoras, Funcionários)
    CREATE TABLE IF NOT EXISTS entidades (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      razao_social TEXT NOT NULL,
      nome_fantasia TEXT,
      cpf_cnpj TEXT NOT NULL,
      ie_rg TEXT,
      email TEXT,
      telefone TEXT,
      endereco TEXT,
      limite_credito REAL DEFAULT 0,
      saldo_devedor REAL DEFAULT 0,
      cargo TEXT DEFAULT 'VENDEDOR',
      matricula TEXT,
      pin TEXT DEFAULT '1234',
      comissao_percentual REAL DEFAULT 0,
      limite_desconto REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_entidades_cpf_cnpj ON entidades(cpf_cnpj);
    CREATE INDEX IF NOT EXISTS idx_entidades_tipo ON entidades(tipo);

    -- 2. Grades de Produtos e Variantes (Cor / Tamanho / DUN-14)
    CREATE TABLE IF NOT EXISTS produto_grades (
      id TEXT PRIMARY KEY,
      produto_pai_id TEXT NOT NULL,
      codigo_barras TEXT UNIQUE NOT NULL,
      cor TEXT,
      tamanho TEXT,
      preco_venda REAL NOT NULL,
      estoque_minimo REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_pai_id) REFERENCES produtos(id)
    );
    CREATE INDEX IF NOT EXISTS idx_produto_grades_barcode ON produto_grades(codigo_barras);

    -- 3. Ficha Técnica / Receita (BOM - PCP)
    CREATE TABLE IF NOT EXISTS fichas_tecnicas (
      id TEXT PRIMARY KEY,
      produto_pai_id TEXT NOT NULL,
      insumo_produto_id TEXT NOT NULL,
      quantidade_necessaria REAL NOT NULL,
      unidade_medida TEXT NOT NULL,
      FOREIGN KEY (produto_pai_id) REFERENCES produtos(id)
    );

    -- 4. Matriz Tributária Dinâmica
    CREATE TABLE IF NOT EXISTS matriz_tributaria (
      id TEXT PRIMARY KEY,
      ncm TEXT NOT NULL,
      uf_origem TEXT NOT NULL,
      uf_destino TEXT NOT NULL,
      cfop TEXT NOT NULL,
      cst_csosn TEXT NOT NULL,
      aliquota_icms REAL DEFAULT 0,
      aliquota_pis REAL DEFAULT 0,
      aliquota_cofins REAL DEFAULT 0,
      aliquota_ipi REAL DEFAULT 0
    );

    -- 5. Perfis e Permissões de Acesso (RBAC)
    CREATE TABLE IF NOT EXISTS rbac_perfis (
      id TEXT PRIMARY KEY,
      nome_perfil TEXT UNIQUE NOT NULL,
      permissoes TEXT NOT NULL
    );

    -- 6. Configurações da Loja e Marca (White-Label)
    CREATE TABLE IF NOT EXISTS config_loja (
      id TEXT PRIMARY KEY,
      nome_loja TEXT NOT NULL DEFAULT 'CLICKSTORM PDV',
      razao_social TEXT,
      endereco TEXT,
      cep TEXT,
      logradouro TEXT,
      numero TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      telefone TEXT,
      logo_url TEXT,
      cor_primaria TEXT DEFAULT '#0ea5e9',
      cor_secundaria TEXT DEFAULT '#0284c7',
      slogan TEXT,
      cnpj TEXT,
      licenca_token TEXT,
      modo_operacao TEXT DEFAULT 'MASTER',
      master_ip TEXT,
      segmento TEXT DEFAULT 'GERAL',
      tema_visual TEXT DEFAULT 'OBSIDIAN',
      densidade TEXT DEFAULT 'PADRAO',
      habilitar_convenio INTEGER DEFAULT 0,
      habilitar_whatsapp INTEGER DEFAULT 1,
      forcar_fechamento_diario INTEGER DEFAULT 1,
      sistema_configurado INTEGER DEFAULT 0,
      token_csc TEXT,
      id_token_csc TEXT,
      comportamento_fiscal_pdv TEXT DEFAULT 'MANUAL',
      controle_acesso_estrito INTEGER DEFAULT 0,
      exigir_autenticacao INTEGER DEFAULT 1,
      certificado_ativo_id TEXT,
      inscricao_estadual TEXT,
      crt INTEGER DEFAULT 1,
      codigo_municipio_ibge TEXT DEFAULT '3509601',
      ramo_atuacao TEXT DEFAULT 'mercado',
      impressora_padrao TEXT DEFAULT 'PADRAO_WINDOWS',
      margem_impressao INTEGER DEFAULT 0,
      balanca_checkout_ativa INTEGER DEFAULT 0,
      balanca_modelo TEXT DEFAULT 'TOLEDO',
      balanca_porta TEXT DEFAULT 'AUTO',
      serie_nfce INTEGER DEFAULT 1,
      proximo_numero_nfce INTEGER DEFAULT 1,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Motor de Campanhas e Promoções
    CREATE TABLE IF NOT EXISTS campanhas_promocionais (
      id TEXT PRIMARY KEY,
      nome_campanha TEXT NOT NULL,
      tipo_desconto TEXT NOT NULL,
      valor_desconto REAL NOT NULL,
      data_inicio TEXT NOT NULL,
      data_fim TEXT NOT NULL,
      status TEXT DEFAULT 'ATIVA',
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas_promocionais(status);
    CREATE INDEX IF NOT EXISTS idx_campanhas_datas ON campanhas_promocionais(data_inicio, data_fim);
  `);

  const colsConfigLoja = [
    'segmento TEXT DEFAULT "GERAL"', 'tema_visual TEXT DEFAULT "OBSIDIAN"', 'densidade TEXT DEFAULT "PADRAO"',
    'habilitar_convenio INTEGER DEFAULT 0', 'habilitar_whatsapp INTEGER DEFAULT 1', 'forcar_fechamento_diario INTEGER DEFAULT 1',
    'razao_social TEXT', 'endereco TEXT', 'cep TEXT', 'logradouro TEXT', 'numero TEXT', 'bairro TEXT',
    'cidade TEXT', 'estado TEXT', 'telefone TEXT', 'impressora_padrao TEXT DEFAULT "PADRAO_WINDOWS"',
    'margem_impressao INTEGER DEFAULT 0', 'exigir_autenticacao INTEGER DEFAULT 1', 'sistema_configurado INTEGER DEFAULT 0',
    'token_csc TEXT', 'id_token_csc TEXT', 'comportamento_fiscal_pdv TEXT DEFAULT "MANUAL"',
    'controle_acesso_estrito INTEGER DEFAULT 0', 'certificado_ativo_id TEXT', 'inscricao_estadual TEXT',
    'crt INTEGER DEFAULT 1', 'codigo_municipio_ibge TEXT DEFAULT "3509601"', 'ramo_atuacao TEXT DEFAULT "mercado"',
    'balanca_checkout_ativa INTEGER DEFAULT 0', 'balanca_modelo TEXT DEFAULT "TOLEDO"', 'balanca_porta TEXT DEFAULT "AUTO"',
    'serie_nfce INTEGER DEFAULT 1', 'proximo_numero_nfce INTEGER DEFAULT 1'
  ];
  for (const col of colsConfigLoja) {
    try { db.exec(`ALTER TABLE config_loja ADD COLUMN ${col};`); } catch {}
  }
  try { db.exec(`ALTER TABLE produtos ADD COLUMN campanha_id TEXT; ALTER TABLE produtos ADD COLUMN cest TEXT; ALTER TABLE produtos ADD COLUMN cst_csosn TEXT DEFAULT '102'; ALTER TABLE produtos ADD COLUMN origem INTEGER DEFAULT 0; ALTER TABLE produtos ADD COLUMN aliquota_pis REAL DEFAULT 0; ALTER TABLE produtos ADD COLUMN aliquota_cofins REAL DEFAULT 0; ALTER TABLE produtos ADD COLUMN is_pesavel_checkout INTEGER DEFAULT 0; ALTER TABLE produtos ADD COLUMN is_pesavel_etiqueta INTEGER DEFAULT 0; ALTER TABLE produtos ADD COLUMN plu_balanca INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE itens_venda ADD COLUMN ncm TEXT; ALTER TABLE itens_venda ADD COLUMN cfop TEXT; ALTER TABLE itens_venda ADD COLUMN cst_csosn TEXT DEFAULT '102'; ALTER TABLE itens_venda ADD COLUMN cest TEXT; ALTER TABLE itens_venda ADD COLUMN unidade_medida TEXT DEFAULT 'UN'; ALTER TABLE itens_venda ADD COLUMN aliquota_icms REAL DEFAULT 0; ALTER TABLE itens_venda ADD COLUMN origem INTEGER DEFAULT 0;`); } catch {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_prod_campanha ON produtos(campanha_id);`); } catch {}

  try { db.exec(`ALTER TABLE entidades ADD COLUMN cargo TEXT DEFAULT 'VENDEDOR';`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN matricula TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN pin TEXT DEFAULT '1234';`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN comissao_percentual REAL DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN limite_desconto REAL DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN limite_credito REAL DEFAULT 0;`); } catch {}
  try { db.exec(`ALTER TABLE entidades ADD COLUMN saldo_devedor REAL DEFAULT 0;`); } catch {}
}

export function initErpOperacaoSchema(db: DatabaseSync): void {
  db.exec(`
    -- 6. Títulos Financeiros (Contas a Pagar e Contas a Receber)
    CREATE TABLE IF NOT EXISTS financeiro_titulos (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      entidade_id TEXT,
      entidade_nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      valor_pago REAL DEFAULT 0,
      vencimento TEXT NOT NULL,
      pago_em TEXT,
      status TEXT NOT NULL,
      categoria TEXT DEFAULT 'GERAL',
      venda_id TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      sincronizado INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_fin_vencimento ON financeiro_titulos(vencimento);
    CREATE INDEX IF NOT EXISTS idx_fin_status ON financeiro_titulos(status);

    -- 7. Estoque e Multi-Almoxarifado
    CREATE TABLE IF NOT EXISTS estoque_movimentos (
      id TEXT PRIMARY KEY,
      produto_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      almoxarifado TEXT DEFAULT 'LOJA',
      quantidade REAL NOT NULL,
      custo_unitario REAL DEFAULT 0,
      documento_referencia TEXT,
      motivo TEXT,
      operador_id TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      sincronizado INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_estoque_prod ON estoque_movimentos(produto_id);

    -- 8. Entradas de Compras (Importação de XML de NF-e)
    CREATE TABLE IF NOT EXISTS compras_entradas (
      id TEXT PRIMARY KEY,
      chave_nfe TEXT UNIQUE,
      numero_nfe INTEGER,
      serie INTEGER,
      fornecedor_nome TEXT NOT NULL,
      cnpj_fornecedor TEXT,
      valor_total REAL NOT NULL,
      itens_contagem INTEGER DEFAULT 0,
      importado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      sincronizado INTEGER DEFAULT 0
    );

    -- 9. Ordens de Produção (PCP)
    CREATE TABLE IF NOT EXISTS ordens_producao (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL,
      produto_id TEXT NOT NULL,
      quantidade_planejada REAL NOT NULL,
      quantidade_produzida REAL DEFAULT 0,
      status TEXT NOT NULL,
      data_inicio TEXT,
      data_conclusao TEXT,
      operador_id TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Comissões de Vendedores
    CREATE TABLE IF NOT EXISTS comissoes_venda (
      id TEXT PRIMARY KEY,
      venda_id TEXT NOT NULL,
      vendedor_id TEXT NOT NULL,
      valor_venda REAL NOT NULL,
      percentual REAL NOT NULL,
      valor_comissao REAL NOT NULL,
      status TEXT DEFAULT 'PENDENTE',
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Políticas e Configurações Operacionais do PDV
    CREATE TABLE IF NOT EXISTS config_operacao (
      id TEXT PRIMARY KEY,
      desconto_maximo_operador REAL DEFAULT 5.0,
      exigir_gerente_desconto INTEGER DEFAULT 0,
      permitir_alterar_preco INTEGER DEFAULT 0,
      abertura_gaveta_sem_venda INTEGER DEFAULT 1,
      estoque_negativo TEXT DEFAULT 'AVISAR',
      agrupar_itens_repetidos INTEGER DEFAULT 1,
      foco_balanca_automatico INTEGER DEFAULT 1,
      comportamento_impressao TEXT DEFAULT 'PERGUNTAR',
      pagamento_padrao TEXT DEFAULT 'DINHEIRO',
      exibir_fotos_busca INTEGER DEFAULT 0,
      som_bip_sistema INTEGER DEFAULT 1,
      parametros_extras TEXT,
      atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO config_operacao (id) VALUES ('default');
    CREATE TABLE IF NOT EXISTS documentos_fiscais (
      id TEXT PRIMARY KEY,
      venda_id TEXT NOT NULL,
      numero INTEGER NOT NULL,
      serie INTEGER NOT NULL,
      modelo TEXT DEFAULT '65',
      chave_acesso TEXT UNIQUE,
      tp_emis INTEGER DEFAULT 1,
      status TEXT NOT NULL,
      xml_conteudo TEXT,
      protocolo_autorizacao TEXT,
      motivo_contingencia TEXT,
      emitido_em TEXT DEFAULT CURRENT_TIMESTAMP,
      sincronizado INTEGER DEFAULT 0,
      sincronizado_em TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_doc_venda ON documentos_fiscais(venda_id);
    CREATE INDEX IF NOT EXISTS idx_doc_chave ON documentos_fiscais(chave_acesso);

    CREATE TABLE IF NOT EXISTS caixa_preta_erros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      tipo_evento TEXT,
      codigo_original TEXT,
      diagnostico_ia TEXT,
      resolvido INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_caixa_preta_resolvido ON caixa_preta_erros(resolvido);
  `);
}
