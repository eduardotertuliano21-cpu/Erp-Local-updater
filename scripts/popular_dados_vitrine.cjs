const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const targetDbs = [
  'C:\\Users\\eduar\\AppData\\Roaming\\clickstorm-erp\\data\\db_mercado.sqlite',
  path.join(__dirname, '..', 'data', 'db_mercado.sqlite'),
];

console.log('🚀 Iniciando enriquecimento de dados da vitrine ClickStorm...');

for (const dbPath of targetDbs) {
  if (!fs.existsSync(dbPath)) {
    console.log(`⚠️ Banco não encontrado em: ${dbPath} (pulando)`);
    continue;
  }

  console.log(`\n======================================================`);
  console.log(`📦 Populando banco: ${dbPath}`);
  console.log(`======================================================`);

  try {
    const db = new DatabaseSync(dbPath);

    // Garantir colunas necessárias
    const safeColumns = [
      `ALTER TABLE produtos ADD COLUMN is_pesavel_checkout INTEGER DEFAULT 0;`,
      `ALTER TABLE produtos ADD COLUMN is_pesavel_etiqueta INTEGER DEFAULT 0;`,
      `ALTER TABLE produtos ADD COLUMN plu_balanca INTEGER DEFAULT 0;`,
      `ALTER TABLE produtos ADD COLUMN pesavel INTEGER DEFAULT 0;`,
      `ALTER TABLE produtos ADD COLUMN codigo_balanca TEXT;`,
      `ALTER TABLE produtos ADD COLUMN validade_balanca INTEGER DEFAULT 5;`,
      `ALTER TABLE config_loja ADD COLUMN balanca_checkout_ativa INTEGER DEFAULT 0;`,
      `ALTER TABLE config_loja ADD COLUMN balanca_modelo TEXT DEFAULT 'TOLEDO';`,
      `ALTER TABLE config_loja ADD COLUMN balanca_porta TEXT DEFAULT 'AUTO';`,
      `ALTER TABLE config_loja ADD COLUMN sistema_configurado INTEGER DEFAULT 0;`,
      `ALTER TABLE config_loja ADD COLUMN slogan TEXT;`,
      `ALTER TABLE config_loja ADD COLUMN cor_primaria TEXT DEFAULT '#0ea5e9';`,
      `ALTER TABLE config_loja ADD COLUMN cor_secundaria TEXT DEFAULT '#0284c7';`,
    ];

    for (const sql of safeColumns) {
      try { db.exec(sql); } catch {}
    }

    // 1. Atualizar Configuração da Loja (Visual Profissional e Balança Ativa)
    try {
      db.exec(`
        UPDATE config_loja SET
          balanca_checkout_ativa = 1,
          balanca_modelo = 'TOLEDO',
          balanca_porta = 'AUTO',
          sistema_configurado = 1,
          slogan = 'Supermercado & Conveniência • Atendimento Rápido',
          cor_primaria = '#0ea5e9',
          cor_secundaria = '#0284c7'
        WHERE id = 'default';
      `);
      console.log('  [OK] Configuração da loja otimizada com balança ativa');
    } catch (e) {
      console.warn('  [!] Config loja update:', e.message);
    }

    // 2. Inserir Categorias
    const categorias = [
      { id: 'cat_bebidas', nome: 'BEBIDAS' },
      { id: 'cat_mercearia', nome: 'MERCEARIA' },
      { id: 'cat_hortifruti', nome: 'HORTIFRÚTI' },
      { id: 'cat_acougue', nome: 'AÇOUGUE & FRIOS' },
      { id: 'cat_padaria', nome: 'PADARIA & CONFEITARIA' },
      { id: 'cat_laticinios', nome: 'LATICÍNIOS' },
      { id: 'cat_limpeza', nome: 'LIMPEZA & HIGIENE' },
      { id: 'cat_snacks', nome: 'SNACKS & DOCES' },
      { id: 'cat_utilidades', nome: 'UTILIDADES & BAZAR' },
    ];

    const stmtCat = db.prepare(`INSERT OR REPLACE INTO categorias (id, nome, ramo_atuacao, ativo) VALUES (?, ?, 'mercado', 1)`);
    for (const c of categorias) {
      stmtCat.run(c.id, c.nome);
    }
    console.log(`  [OK] ${categorias.length} Categorias cadastradas`);

    // 3. Inserir Fornecedores, Clientes e Funcionários (Entidades)
    const entidades = [
      // Clientes
      { id: 'cli_01', tipo: 'CLIENTE', razao_social: 'Carlos Eduardo Mendes', cpf_cnpj: '345.892.128-40', telefone: '(11) 98765-4321', email: 'carlos.mendes@email.com', endereco: 'Av. Paulista, 1200 - Apto 42', limite_credito: 1500, saldo_devedor: 0 },
      { id: 'cli_02', tipo: 'CLIENTE', razao_social: 'Fernanda Souza Ribeiro', cpf_cnpj: '289.475.918-12', telefone: '(11) 97654-3210', email: 'fernanda.souza@email.com', endereco: 'Rua das Flores, 85 - Jd. Primavera', limite_credito: 2000, saldo_devedor: 145.80 },
      { id: 'cli_03', tipo: 'CLIENTE', razao_social: 'Lucas Martins Oliveira', cpf_cnpj: '412.398.765-88', telefone: '(11) 99123-4567', email: 'lucas.martins@email.com', endereco: 'Rua Bela Vista, 310', limite_credito: 800, saldo_devedor: 0 },
      { id: 'cli_04', tipo: 'CLIENTE', razao_social: 'Mariana Lima Santos', cpf_cnpj: '198.723.654-33', telefone: '(11) 98234-5678', email: 'mariana.santos@email.com', endereco: 'Alameda dos Anapurus, 450', limite_credito: 1200, saldo_devedor: 0 },
      { id: 'cli_05', tipo: 'CLIENTE', razao_social: 'Roberto Albuquerque Neto', cpf_cnpj: '087.654.321-99', telefone: '(11) 97345-6789', email: 'roberto.neto@email.com', endereco: 'Rua Amazonas, 512', limite_credito: 3000, saldo_devedor: 320.50 },
      { id: 'cli_06', tipo: 'CLIENTE', razao_social: 'Juliana Castro Barreto', cpf_cnpj: '521.849.203-71', telefone: '(11) 99456-7890', email: 'juliana.castro@email.com', endereco: 'Av. Brasil, 1890', limite_credito: 1500, saldo_devedor: 0 },
      { id: 'cli_07', tipo: 'CLIENTE', razao_social: 'Padaria & Confeitaria Estrela de Ouro', cpf_cnpj: '18.492.301/0001-44', telefone: '(11) 4002-8922', email: 'compras@estreladeouro.com.br', endereco: 'Rua Rui Barbosa, 200', limite_credito: 5000, saldo_devedor: 1250.00 },

      // Fornecedores
      { id: 'forn_01', tipo: 'FORNECEDOR', razao_social: 'Ambev S.A. Distribuidora', nome_fantasia: 'Ambev Bebidas', cpf_cnpj: '07.526.557/0001-00', telefone: '(11) 3003-8888', email: 'atendimento@ambev.com.br', endereco: 'Rua Dr. Renato Paes de Barros, 1017 - SP', limite_credito: 0, saldo_devedor: 0 },
      { id: 'forn_02', tipo: 'FORNECEDOR', razao_social: 'Nestlé Brasil Ltda', nome_fantasia: 'Nestlé Alimentos', cpf_cnpj: '60.409.075/0001-52', telefone: '(11) 2144-8000', email: 'contato@nestle.com.br', endereco: 'Av. Dr. Chucri Zaidan, 246 - SP', limite_credito: 0, saldo_devedor: 0 },
      { id: 'forn_03', tipo: 'FORNECEDOR', razao_social: 'Coca-Cola FEMSA Brasil', nome_fantasia: 'Coca-Cola FEMSA', cpf_cnpj: '45.997.418/0001-53', telefone: '(11) 4589-9000', email: 'pedidos@femsa.com.br', endereco: 'Av. Antonio Frederico Ozanan, 6000 - Jundiaí/SP', limite_credito: 0, saldo_devedor: 0 },
      { id: 'forn_04', tipo: 'FORNECEDOR', razao_social: 'JBS S.A. Carnes e Derivados', nome_fantasia: 'Friboi / Seara', cpf_cnpj: '02.916.265/0001-00', telefone: '(11) 3144-4000', email: 'comercial@friboi.com.br', endereco: 'Av. Marginal Direita do Tietê, 500 - SP', limite_credito: 0, saldo_devedor: 0 },
      { id: 'forn_05', tipo: 'FORNECEDOR', razao_social: 'Unilever Brasil Industrial Ltda', nome_fantasia: 'Unilever Higiene & Limpeza', cpf_cnpj: '61.068.276/0001-04', telefone: '(11) 3568-8000', email: 'vendas@unilever.com.br', endereco: 'Av. das Nações Unidas, 14261 - SP', limite_credito: 0, saldo_devedor: 0 },

      // Funcionários / Vendedores
      { id: 'fun_01', tipo: 'FUNCIONARIO', razao_social: 'Eduardo Oliveira', nome_fantasia: 'Eduardo Caixa', cpf_cnpj: '482.910.384-55', cargo: 'OPERADOR', matricula: 'CX01', pin: '1234', comissao_percentual: 1.5, limite_desconto: 5, telefone: '(11) 99677-3805' },
      { id: 'fun_02', tipo: 'FUNCIONARIO', razao_social: 'Camila Silveira', nome_fantasia: 'Camila Atendente', cpf_cnpj: '312.876.459-00', cargo: 'VENDEDOR', matricula: 'VD02', pin: '1234', comissao_percentual: 2.5, limite_desconto: 8, telefone: '(11) 98877-6655' },
      { id: 'fun_03', tipo: 'FUNCIONARIO', razao_social: 'Juliana Prado', nome_fantasia: 'Juliana Gerente', cpf_cnpj: '245.981.650-11', cargo: 'GERENTE', matricula: 'GR01', pin: '9999', comissao_percentual: 3.0, limite_desconto: 20, telefone: '(11) 97788-9900' },
    ];

    const stmtEnt = db.prepare(`
      INSERT OR REPLACE INTO entidades (
        id, tipo, razao_social, nome_fantasia, cpf_cnpj, telefone, email, endereco,
        limite_credito, saldo_devedor, cargo, matricula, pin, comissao_percentual, limite_desconto, ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const e of entidades) {
      stmtEnt.run(
        e.id, e.tipo, e.razao_social, e.nome_fantasia || null, e.cpf_cnpj, e.telefone || null, e.email || null,
        e.endereco || null, e.limite_credito || 0, e.saldo_devedor || 0, e.cargo || 'CLIENTE',
        e.matricula || null, e.pin || '1234', e.comissao_percentual || 0, e.limite_desconto || 0
      );
    }
    console.log(`  [OK] ${entidades.length} Entidades cadastradas (Clientes, Fornecedores e Funcionários)`);

    // 4. Catálogo Completo de Produtos (55 Itens Populares + Pesáveis de Balança)
    const produtos = [
      // BEBIDAS
      { id: 'p_01', codigo: '7894900010015', sku: 'BEV-001', desc: 'REFRIGERANTE COCA-COLA LATA 350ML', cat: 'BEBIDAS', preco: 5.50, custo: 3.20, un: 'UN', ncm: '22021000', marca: 'Coca-Cola', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_02', codigo: '7894900011517', sku: 'BEV-002', desc: 'REFRIGERANTE COCA-COLA PET 2L', cat: 'BEBIDAS', preco: 10.99, custo: 7.10, un: 'UN', ncm: '22021000', marca: 'Coca-Cola', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_03', codigo: '7891991000824', sku: 'BEV-003', desc: 'CERVEJA HEINEKEN LONG NECK 330ML', cat: 'BEBIDAS', preco: 7.89, custo: 4.80, un: 'UN', ncm: '22030000', marca: 'Heineken', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_04', codigo: '7891991015187', sku: 'BEV-004', desc: 'CERVEJA AMSTEL PURO MALTE LATA 350ML', cat: 'BEBIDAS', preco: 4.29, custo: 2.70, un: 'UN', ncm: '22030000', marca: 'Amstel', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_05', codigo: '7891000100110', sku: 'BEV-005', desc: 'AGUA MINERAL CRYSTAL SEM GAS 500ML', cat: 'BEBIDAS', preco: 2.50, custo: 0.90, un: 'UN', ncm: '22011000', marca: 'Crystal', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_06', codigo: '7891000100226', sku: 'BEV-006', desc: 'AGUA MINERAL CRYSTAL COM GAS 500ML', cat: 'BEBIDAS', preco: 2.80, custo: 1.10, un: 'UN', ncm: '22011000', marca: 'Crystal', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_07', codigo: '9002490207914', sku: 'BEV-007', desc: 'ENERGETICO RED BULL ENERGY DRINK 250ML', cat: 'BEBIDAS', preco: 10.50, custo: 6.90, un: 'UN', ncm: '22029900', marca: 'Red Bull', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_08', codigo: '7891025114123', sku: 'BEV-008', desc: 'SUCO DEL VALLE UVA 1L', cat: 'BEBIDAS', preco: 7.90, custo: 4.50, un: 'UN', ncm: '20098990', marca: 'Del Valle', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_09', codigo: '7891991001340', sku: 'BEV-009', desc: 'REFRIGERANTE GUARANA ANTARCTICA 2L', cat: 'BEBIDAS', preco: 8.99, custo: 5.60, un: 'UN', ncm: '22021000', marca: 'Antarctica', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },

      // HORTIFRÚTI PESÁVEL NO CHECKOUT (BALANÇA AO VIVO)
      { id: 'p_10', codigo: '00101', sku: 'HOR-001', desc: 'BANANA PRATA SELECIONADA', cat: 'HORTIFRÚTI', preco: 6.99, custo: 3.50, un: 'KG', ncm: '08039000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 101 },
      { id: 'p_11', codigo: '00102', sku: 'HOR-002', desc: 'MACA NACIONAL GALA', cat: 'HORTIFRÚTI', preco: 9.89, custo: 5.20, un: 'KG', ncm: '08081000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 102 },
      { id: 'p_12', codigo: '00103', sku: 'HOR-003', desc: 'TOMATE ITALIANO MADURO', cat: 'HORTIFRÚTI', preco: 7.99, custo: 4.10, un: 'KG', ncm: '07020000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 103 },
      { id: 'p_13', codigo: '00104', sku: 'HOR-004', desc: 'CEBOLA NACIONAL MEDIA', cat: 'HORTIFRÚTI', preco: 5.49, custo: 2.80, un: 'KG', ncm: '07031019', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 104 },
      { id: 'p_14', codigo: '00105', sku: 'HOR-005', desc: 'BATATA INGLESA ESPECIAL', cat: 'HORTIFRÚTI', preco: 5.99, custo: 3.00, un: 'KG', ncm: '07019000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 105 },
      { id: 'p_15', codigo: '00106', sku: 'HOR-006', desc: 'LARANJA PERA RIO', cat: 'HORTIFRÚTI', preco: 4.59, custo: 2.10, un: 'KG', ncm: '08051000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 106 },
      { id: 'p_16', codigo: '00107', sku: 'HOR-007', desc: 'LIMAO TAITI SELECIONADO', cat: 'HORTIFRÚTI', preco: 6.49, custo: 3.10, un: 'KG', ncm: '08055000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 107 },
      { id: 'p_17', codigo: '00108', sku: 'HOR-008', desc: 'CENOURA EXTRA FRESCA', cat: 'HORTIFRÚTI', preco: 4.99, custo: 2.40, un: 'KG', ncm: '07061000', marca: 'Hortifrúti', isPesCheckout: 1, isPesEtiq: 0, plu: 108 },

      // AÇOUGUE E FRIOS (BALANÇA DE ETIQUETA / RETAGUARDA)
      { id: 'p_18', codigo: '2002010000000', sku: 'ACO-001', desc: 'PICANHA BOVINA RESFRIADA GRILL', cat: 'AÇOUGUE & FRIOS', preco: 79.90, custo: 52.00, un: 'KG', ncm: '02013000', marca: 'Friboi', isPesCheckout: 0, isPesEtiq: 1, plu: 201 },
      { id: 'p_19', codigo: '2002020000000', sku: 'ACO-002', desc: 'ALCATRA COM MAMINHA BOVINA', cat: 'AÇOUGUE & FRIOS', preco: 45.90, custo: 31.00, un: 'KG', ncm: '02013000', marca: 'Friboi', isPesCheckout: 0, isPesEtiq: 1, plu: 202 },
      { id: 'p_20', codigo: '2002030000000', sku: 'ACO-003', desc: 'CONTRA FILE BOVINO TRADICIONAL', cat: 'AÇOUGUE & FRIOS', preco: 49.90, custo: 34.00, un: 'KG', ncm: '02013000', marca: 'Friboi', isPesCheckout: 0, isPesEtiq: 1, plu: 203 },
      { id: 'p_21', codigo: '2002040000000', sku: 'ACO-004', desc: 'PEITO DE FRANGO SADIA CONGELADO', cat: 'AÇOUGUE & FRIOS', preco: 21.90, custo: 13.50, un: 'KG', ncm: '02071200', marca: 'Sadia', isPesCheckout: 0, isPesEtiq: 1, plu: 204 },
      { id: 'p_22', codigo: '2002050000000', sku: 'ACO-005', desc: 'LINGUICA TOSCANA PERDIGAO', cat: 'AÇOUGUE & FRIOS', preco: 24.90, custo: 15.20, un: 'KG', ncm: '16010000', marca: 'Perdigão', isPesCheckout: 0, isPesEtiq: 1, plu: 205 },
      { id: 'p_23', codigo: '2002060000000', sku: 'ACO-006', desc: 'QUEIJO MUSSARELA FATIADO FRESCO', cat: 'AÇOUGUE & FRIOS', preco: 48.90, custo: 32.00, un: 'KG', ncm: '04069020', marca: 'Tirolez', isPesCheckout: 0, isPesEtiq: 1, plu: 206 },
      { id: 'p_24', codigo: '2002070000000', sku: 'ACO-007', desc: 'PRESUNTO COZIDO SADIA FATIADO', cat: 'AÇOUGUE & FRIOS', preco: 38.90, custo: 24.50, un: 'KG', ncm: '16024100', marca: 'Sadia', isPesCheckout: 0, isPesEtiq: 1, plu: 207 },

      // PADARIA & CONFEITARIA
      { id: 'p_25', codigo: '00301', sku: 'PAD-001', desc: 'PAO FRANCES TRADICIONAL QUENTINHO', cat: 'PADARIA & CONFEITARIA', preco: 18.90, custo: 7.20, un: 'KG', ncm: '19059090', marca: 'Padaria Própria', isPesCheckout: 1, isPesEtiq: 0, plu: 301 },
      { id: 'p_26', codigo: '7891000315507', sku: 'PAD-002', desc: 'PAO DE FORMA INTEGRAL PULLMAN 450G', cat: 'PADARIA & CONFEITARIA', preco: 8.99, custo: 5.40, un: 'UN', ncm: '19059010', marca: 'Pullman', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_27', codigo: '7891000315514', sku: 'PAD-003', desc: 'PAO DE FORMA TRADICIONAL PULLMAN 450G', cat: 'PADARIA & CONFEITARIA', preco: 7.99, custo: 4.80, un: 'UN', ncm: '19059010', marca: 'Pullman', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_28', codigo: '7896005801234', sku: 'PAD-004', desc: 'BOLO DE CENOURA COM COBERTURA 400G', cat: 'PADARIA & CONFEITARIA', preco: 14.50, custo: 8.10, un: 'UN', ncm: '19059090', marca: 'Padaria Própria', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },

      // MERCEARIA
      { id: 'p_29', codigo: '7896006700018', sku: 'MER-001', desc: 'ARROZ BRANCO TIPO 1 TIO JOAO 5KG', cat: 'MERCEARIA', preco: 32.90, custo: 24.50, un: 'UN', ncm: '10063021', marca: 'Tio João', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_30', codigo: '7896006711113', sku: 'MER-002', desc: 'FEIJAO CARIOCA CAMIL 1KG', cat: 'MERCEARIA', preco: 8.49, custo: 5.90, un: 'UN', ncm: '07133399', marca: 'Camil', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_31', codigo: '7891107000010', sku: 'MER-003', desc: 'OLEO DE SOJA REFINADO LIZA 900ML', cat: 'MERCEARIA', preco: 6.89, custo: 4.90, un: 'UN', ncm: '15079011', marca: 'Liza', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_32', codigo: '7891000100165', sku: 'MER-004', desc: 'CAFE TORRADO E MOIDO PILAO 500G', cat: 'MERCEARIA', preco: 19.90, custo: 14.20, un: 'UN', ncm: '09012100', marca: 'Pilão', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_33', codigo: '7891910000197', sku: 'MER-005', desc: 'ACUCAR REFINADO UNIAO 1KG', cat: 'MERCEARIA', preco: 4.99, custo: 3.40, un: 'UN', ncm: '17019900', marca: 'União', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_34', codigo: '7896005800015', sku: 'MER-006', desc: 'MACARRAO ESPAGUETE BARILLA 500G', cat: 'MERCEARIA', preco: 6.29, custo: 4.10, un: 'UN', ncm: '19021900', marca: 'Barilla', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_35', codigo: '7891000053508', sku: 'MER-007', desc: 'LEITE CONDENSADO MOÇA LATA 395G', cat: 'MERCEARIA', preco: 7.99, custo: 5.30, un: 'UN', ncm: '04029900', marca: 'Nestlé', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_36', codigo: '7891000053607', sku: 'MER-008', desc: 'CREME DE LEITE NESTLE 200G', cat: 'MERCEARIA', preco: 4.39, custo: 2.90, un: 'UN', ncm: '04022920', marca: 'Nestlé', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_37', codigo: '7891000053706', sku: 'MER-009', desc: 'MOLHO DE TOMATE POMAROLA SACHE 300G', cat: 'MERCEARIA', preco: 3.49, custo: 2.10, un: 'UN', ncm: '21032010', marca: 'Pomarola', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_38', codigo: '7896005800053', sku: 'MER-010', desc: 'FARINHA DE TRIGO DONA BENTA 1KG', cat: 'MERCEARIA', preco: 5.79, custo: 3.90, un: 'UN', ncm: '11010010', marca: 'Dona Benta', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },

      // LATICÍNIOS
      { id: 'p_39', codigo: '7891000100141', sku: 'LAT-001', desc: 'LEITE INTEGRAL PIRACANJUBA 1L', cat: 'LATICÍNIOS', preco: 5.19, custo: 3.70, un: 'UN', ncm: '04012010', marca: 'Piracanjuba', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_40', codigo: '7891000100172', sku: 'LAT-002', desc: 'LEITE DESNATADO PIRACANJUBA 1L', cat: 'LATICÍNIOS', preco: 5.29, custo: 3.75, un: 'UN', ncm: '04011010', marca: 'Piracanjuba', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_41', codigo: '7891079001234', sku: 'LAT-003', desc: 'MANTEIGA COM SAL AVIACAO POTE 200G', cat: 'LATICÍNIOS', preco: 13.90, custo: 9.50, un: 'UN', ncm: '04051000', marca: 'Aviação', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_42', codigo: '7891079004321', sku: 'LAT-004', desc: 'REQUEIJAO CREMOSO CATUPIRY POTE 200G', cat: 'LATICÍNIOS', preco: 9.89, custo: 6.40, un: 'UN', ncm: '04061010', marca: 'Catupiry', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_43', codigo: '7891025114567', sku: 'LAT-005', desc: 'IOGURTE GREGO TRADICIONAL DANONE 90G', cat: 'LATICÍNIOS', preco: 4.19, custo: 2.60, un: 'UN', ncm: '04031000', marca: 'Danone', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },

      // LIMPEZA E HIGIENE
      { id: 'p_44', codigo: '7891038001111', sku: 'LIM-001', desc: 'SABAO EM PO OMO LAVAGEM PERFEITA 1.6KG', cat: 'LIMPEZA & HIGIENE', preco: 21.90, custo: 15.40, un: 'UN', ncm: '34012090', marca: 'OMO', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_45', codigo: '7891038002222', sku: 'LIM-002', desc: 'AMACIANTE CONCENTRADO COMFORT 1L', cat: 'LIMPEZA & HIGIENE', preco: 16.50, custo: 11.20, un: 'UN', ncm: '38099190', marca: 'Comfort', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_46', codigo: '7891025115555', sku: 'LIM-003', desc: 'DETERGENTE LIQUIDO YPE NEUTRO 500ML', cat: 'LIMPEZA & HIGIENE', preco: 2.69, custo: 1.60, un: 'UN', ncm: '34022000', marca: 'Ypê', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_47', codigo: '7891025116666', sku: 'LIM-004', desc: 'DESINFETANTE PINHO SOL ORIGINAL 1L', cat: 'LIMPEZA & HIGIENE', preco: 8.90, custo: 5.70, un: 'UN', ncm: '38089419', marca: 'Pinho Sol', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_48', codigo: '7891025117777', sku: 'LIM-005', desc: 'AGUA SANITARIA QBOA 2L', cat: 'LIMPEZA & HIGIENE', preco: 6.99, custo: 4.20, un: 'UN', ncm: '28289011', marca: 'Qboa', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_49', codigo: '7891025118888', sku: 'HIG-001', desc: 'CREME DENTAL COLGATE TOTAL 12 90G', cat: 'LIMPEZA & HIGIENE', preco: 6.50, custo: 4.10, un: 'UN', ncm: '33061000', marca: 'Colgate', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_50', codigo: '7891025119999', sku: 'HIG-002', desc: 'SABONETE EM BARRA DOVE ORIGINAL 90G', cat: 'LIMPEZA & HIGIENE', preco: 4.20, custo: 2.60, un: 'UN', ncm: '34011190', marca: 'Dove', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_51', codigo: '7891025120001', sku: 'HIG-003', desc: 'PAPEL HIGIENICO NEVE FOLHA DUPLA 12 ROLOS', cat: 'LIMPEZA & HIGIENE', preco: 24.90, custo: 16.80, un: 'UN', ncm: '48181000', marca: 'Neve', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },

      // SNACKS E DOCES
      { id: 'p_52', codigo: '7891000100127', sku: 'SNK-001', desc: 'BATATA FRITA LAYS CLASSICA 80G', cat: 'SNACKS & DOCES', preco: 9.90, custo: 6.20, un: 'UN', ncm: '20052000', marca: 'Lay\'s', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_53', codigo: '7891000100134', sku: 'SNK-002', desc: 'CHOCOLATE BIS AO LEITE LACTA 126G', cat: 'SNACKS & DOCES', preco: 6.49, custo: 4.10, un: 'UN', ncm: '18063210', marca: 'Lacta', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_54', codigo: '7891000100158', sku: 'SNK-003', desc: 'BISCOITO RECHEADO OREO ORIGINAL 90G', cat: 'SNACKS & DOCES', preco: 4.25, custo: 2.70, un: 'UN', ncm: '19053100', marca: 'Oreo', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
      { id: 'p_55', codigo: '7622210987654', sku: 'SNK-004', desc: 'CHOCOLATE MILKA AO LEITE 100G', cat: 'SNACKS & DOCES', preco: 13.90, custo: 8.80, un: 'UN', ncm: '18063210', marca: 'Milka', isPesCheckout: 0, isPesEtiq: 0, plu: 0 },
    ];

    const stmtProd = db.prepare(`
      INSERT OR REPLACE INTO produtos (
        id, codigo_barras, sku, descricao, categoria, tipo_pdv, ramo_atuacao,
        preco_venda, unidade_medida, ncm, cfop, aliquota_icms, ativo, marca,
        is_pesavel_checkout, is_pesavel_etiqueta, plu_balanca
      ) VALUES (?, ?, ?, ?, ?, 'VAREJO', 'mercado', ?, ?, ?, '5102', 18.0, 1, ?, ?, ?, ?)
    `);

    for (const p of produtos) {
      stmtProd.run(
        p.id, p.codigo, p.sku, p.desc, p.cat, p.preco, p.un, p.ncm,
        p.marca, p.isPesCheckout, p.isPesEtiq, p.plu
      );
    }
    console.log(`  [OK] ${produtos.length} Produtos cadastrados no catálogo`);

    // 5. Inserir Estoque Inicial Positivo para Todos os Produtos
    const stmtEstoque = db.prepare(`
      INSERT OR REPLACE INTO estoque_movimentos (
        id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id, criado_em, sincronizado
      ) VALUES (?, ?, 'ENTRADA_COMPRA', 'LOJA', ?, ?, 'NF-e 004821', 'Carga de Estoque Inicial Oficial', 'EDUARDO', datetime('now', '-3 days'), 1)
    `);

    for (const p of produtos) {
      const qtdEstoque = p.un === 'KG' ? 45.5 : Math.floor(30 + Math.random() * 50);
      stmtEstoque.run(`est_${p.id}`, p.id, qtdEstoque, p.custo);
    }
    console.log(`  [OK] Movimentações de estoque registradas (estoque positivo e saudável)`);

    // 6. Caixa 01 Ativo / Aberto para o Turno
    const caixaId = 'caixa_turno_01';
    db.prepare(`
      INSERT OR REPLACE INTO caixas (
        id, numero, operador_abertura, status, saldo_inicial, aberto_em, sincronizado
      ) VALUES (?, 1, 'EDUARDO', 'ABERTO', 150.00, datetime('now', '-8 hours'), 1)
    `).run(caixaId);

    db.prepare(`
      INSERT OR REPLACE INTO caixa_movimentacoes (
        id, caixa_id, operador_id, tipo, valor, motivo, criado_em, sincronizado
      ) VALUES (?, ?, 'EDUARDO', 'SUPRIMENTO', 150.00, 'Fundo de troco inicial de abertura', datetime('now', '-8 hours'), 1)
    `).run(`mov_${caixaId}_abertura`, caixaId);
    console.log(`  [OK] Caixa 01 configurado como ABERTO (Turno em andamento)`);

    // 7. Inserir Histórico de Vendas Realistas para Alimentar o Dashboard & Gráficos
    const vendasSimuladas = [
      {
        id: 'venda_demo_01', seq: 1001, cliente: 'cli_01', operador: 'EDUARDO', minutosAtras: 380,
        itens: [
          { p: produtos[0], qtd: 2 }, // Coca lata
          { p: produtos[28], qtd: 1 }, // Arroz 5kg
          { p: produtos[29], qtd: 2 }, // Feijao
        ],
        pagamento: 'CARTAO_CREDITO'
      },
      {
        id: 'venda_demo_02', seq: 1002, cliente: 'cli_02', operador: 'EDUARDO', minutosAtras: 340,
        itens: [
          { p: produtos[9], qtd: 1.450 }, // Banana prata kg
          { p: produtos[10], qtd: 0.850 }, // Maca kg
          { p: produtos[38], qtd: 2 }, // Leite integral
        ],
        pagamento: 'PIX'
      },
      {
        id: 'venda_demo_03', seq: 1003, cliente: 'cli_03', operador: 'EDUARDO', minutosAtras: 300,
        itens: [
          { p: produtos[17], qtd: 0.950 }, // Picanha kg
          { p: produtos[2], qtd: 4 }, // Heineken
          { p: produtos[6], qtd: 2 }, // Red Bull
        ],
        pagamento: 'CARTAO_DEBITO'
      },
      {
        id: 'venda_demo_04', seq: 1004, cliente: null, operador: 'EDUARDO', minutosAtras: 260,
        itens: [
          { p: produtos[24], qtd: 0.450 }, // Pao frances kg
          { p: produtos[40], qtd: 1 }, // Manteiga aviacao
          { p: produtos[31], qtd: 1 }, // Cafe pilao
        ],
        pagamento: 'DINHEIRO', troco: 15.00
      },
      {
        id: 'venda_demo_05', seq: 1005, cliente: 'cli_04', operador: 'EDUARDO', minutosAtras: 220,
        itens: [
          { p: produtos[43], qtd: 1 }, // Sabao OMO
          { p: produtos[44], qtd: 1 }, // Amaciante Comfort
          { p: produtos[45], qtd: 2 }, // Detergente Ype
          { p: produtos[46], qtd: 1 }, // Pinho sol
        ],
        pagamento: 'CARTAO_CREDITO'
      },
      {
        id: 'venda_demo_06', seq: 1006, cliente: 'cli_05', operador: 'EDUARDO', minutosAtras: 180,
        itens: [
          { p: produtos[1], qtd: 2 }, // Coca 2L
          { p: produtos[51], qtd: 2 }, // Lays
          { p: produtos[52], qtd: 3 }, // Bis
          { p: produtos[54], qtd: 2 }, // Milka
        ],
        pagamento: 'PIX'
      },
      {
        id: 'venda_demo_07', seq: 1007, cliente: null, operador: 'EDUARDO', minutosAtras: 140,
        itens: [
          { p: produtos[22], qtd: 0.350 }, // Mussarela kg
          { p: produtos[23], qtd: 0.350 }, // Presunto kg
          { p: produtos[26], qtd: 1 }, // Pao de forma
        ],
        pagamento: 'DINHEIRO', troco: 4.80
      },
      {
        id: 'venda_demo_08', seq: 1008, cliente: 'cli_06', operador: 'EDUARDO', minutosAtras: 110,
        itens: [
          { p: produtos[20], qtd: 1.800 }, // Peito de frango kg
          { p: produtos[30], qtd: 1 }, // Oleo Liza
          { p: produtos[33], qtd: 2 }, // Macarrao Barilla
          { p: produtos[36], qtd: 2 }, // Pomarola
        ],
        pagamento: 'CARTAO_DEBITO'
      },
      {
        id: 'venda_demo_09', seq: 1009, cliente: 'cli_07', operador: 'EDUARDO', minutosAtras: 75,
        itens: [
          { p: produtos[28], qtd: 3 }, // Arroz 5kg
          { p: produtos[37], qtd: 5 }, // Farinha Dona Benta
          { p: produtos[32], qtd: 4 }, // Acucar uniao
          { p: produtos[34], qtd: 6 }, // Leite condensado Moca
        ],
        pagamento: 'CARTAO_CREDITO'
      },
      {
        id: 'venda_demo_10', seq: 1010, cliente: null, operador: 'EDUARDO', minutosAtras: 40,
        itens: [
          { p: produtos[0], qtd: 1 }, // Coca lata
          { p: produtos[53], qtd: 1 }, // Oreo
        ],
        pagamento: 'PIX'
      },
      {
        id: 'venda_demo_11', seq: 1011, cliente: 'cli_01', operador: 'EDUARDO', minutosAtras: 15,
        itens: [
          { p: produtos[18], qtd: 1.150 }, // Alcatra kg
          { p: produtos[21], qtd: 0.850 }, // Linguica toscana kg
          { p: produtos[2], qtd: 6 }, // Heineken
        ],
        pagamento: 'CARTAO_CREDITO'
      },
    ];

    const stmtVenda = db.prepare(`
      INSERT OR REPLACE INTO vendas (
        id, numero_sequencial, caixa_id, operador_id, cpf_cliente,
        subtotal, desconto, total_liquido, troco, status, criado_em, sincronizado
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'CONCLUIDA', datetime('now', ?), 1)
    `);

    const stmtItem = db.prepare(`
      INSERT OR REPLACE INTO itens_venda (
        id, venda_id, produto_id, codigo_barras, descricao, quantidade, preco_unitario,
        desconto, subtotal, ncm, cfop, cst_csosn, unidade_medida, aliquota_icms, origem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, '5102', '102', ?, 18.0, 0)
    `);

    const stmtPag = db.prepare(`
      INSERT OR REPLACE INTO pagamentos_venda (
        id, venda_id, metodo, valor, detalhes
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const v of vendasSimuladas) {
      let subtotalVenda = 0;
      for (const it of v.itens) {
        subtotalVenda += it.qtd * it.p.preco;
      }
      subtotalVenda = parseFloat(subtotalVenda.toFixed(2));
      const totalLiquido = subtotalVenda;
      const troco = v.troco || 0;
      const horaStr = `-${v.minutosAtras} minutes`;

      stmtVenda.run(v.id, v.seq, caixaId, v.operador, v.cliente, subtotalVenda, totalLiquido, troco, horaStr);

      for (let i = 0; i < v.itens.length; i++) {
        const it = v.itens[i];
        const subItem = parseFloat((it.qtd * it.p.preco).toFixed(2));
        stmtItem.run(`item_${v.id}_${i}`, v.id, it.p.id, it.p.codigo, it.p.desc, it.qtd, it.p.preco, subItem, it.p.ncm, it.p.un);
      }

      stmtPag.run(`pag_${v.id}`, v.id, v.pagamento, totalLiquido, JSON.stringify({ parcelas: 1, autorizacao: 'AUT-' + v.seq }));
    }
    console.log(`  [OK] ${vendasSimuladas.length} Vendas detalhadas registradas com faturamento e itens`);

    // 8. Títulos Financeiros (Contas a Pagar e Receber para o Gráfico de Fluxo de Caixa)
    const titulos = [
      { id: 'tit_01', tipo: 'PAGAR', nome: 'Ambev Distribuidora', desc: 'Compra de Bebidas - Fatura 8912', valor: 1450.00, pago: 1450.00, venc: '-2 days', status: 'PAGO' },
      { id: 'tit_02', tipo: 'PAGAR', nome: 'Nestlé Brasil', desc: 'Reposição de Mercearia e Doces', valor: 980.50, pago: 0, venc: '+5 days', status: 'PENDENTE' },
      { id: 'tit_03', tipo: 'PAGAR', nome: 'CPFL Energia Elétrica', desc: 'Conta de Energia do Estabelecimento', valor: 640.20, pago: 0, venc: '+10 days', status: 'PENDENTE' },
      { id: 'tit_04', tipo: 'PAGAR', nome: 'Vivo Fibra Dedicada', desc: 'Link de Internet Fibra Óptica 500MB', valor: 149.90, pago: 149.90, venc: '-5 days', status: 'PAGO' },
      { id: 'tit_05', tipo: 'RECEBER', nome: 'Padaria Estrela de Ouro', desc: 'Fornecimento Semanal Faturado', valor: 1250.00, pago: 0, venc: '+3 days', status: 'PENDENTE' },
      { id: 'tit_06', tipo: 'RECEBER', nome: 'Fernanda Souza Ribeiro', desc: 'Convênio Mensal de Mercado', valor: 145.80, pago: 0, venc: '+7 days', status: 'PENDENTE' },
    ];

    const stmtTit = db.prepare(`
      INSERT OR REPLACE INTO financeiro_titulos (
        id, tipo, entidade_nome, descricao, valor, valor_pago, vencimento, status, categoria, criado_em, sincronizado
      ) VALUES (?, ?, ?, ?, ?, ?, date('now', ?), ?, 'GERAL', datetime('now'), 1)
    `);

    for (const t of titulos) {
      stmtTit.run(t.id, t.tipo, t.nome, t.desc, t.valor, t.pago, t.venc, t.status);
    }
    console.log(`  [OK] ${titulos.length} Títulos de Contas a Pagar e Receber cadastrados`);

    console.log(`✅ Banco ${path.basename(dbPath)} populado com sucesso absoluto!`);
  } catch (err) {
    console.error(`❌ Erro ao popular ${dbPath}:`, err.message);
  }
}

console.log('\n======================================================');
console.log('🎉 PROCESSO CONCLUÍDO! O SISTEMA ESTÁ REPLETO DE DADOS PARA FOTOS!');
console.log('======================================================\n');
