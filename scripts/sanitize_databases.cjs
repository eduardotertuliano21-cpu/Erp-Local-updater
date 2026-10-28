const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.resolve(__dirname, '..');

const dirsToSanitize = [
  path.join(projectRoot, 'data'),
  path.join(projectRoot, 'backend', 'data'),
  path.join(projectRoot, 'installer', 'staging', 'data'),
  path.join(projectRoot, 'installer', 'staging', 'resources', 'app', 'data'),
];

console.log('--- INICIANDO SANITIZAÇÃO DE BANCOS SQLITE CLICKSTORM ---');

const obsoleteFiles = [
  'catalogo_sync.db', 'catalogo_sync.db-wal', 'catalogo_sync.db-shm',
  'local_operacao.db', 'local_operacao.db-wal', 'local_operacao.db-shm',
];

dirsToSanitize.forEach((dir) => {
  if (fs.existsSync(dir)) {
    obsoleteFiles.forEach((f) => {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          console.log(`[REMOVIDO OBSOLETO] ${p}`);
        } catch (e) {
          console.warn(`[AVISO] Falha ao remover ${p}: ${e.message}`);
        }
      }
    });
  }
});

const operacionaisParaZerar = [
  'produtos',
  'itens_venda',
  'vendas',
  'pagamentos_venda',
  'caixas',
  'caixa_movimentacoes',
  'sessoes_caixa',
  'logs_auditoria',
  'financeiro_titulos',
  'estoque_movimentos',
  'compras_entradas',
  'ordens_producao',
  'comissoes_venda',
  'documentos_fiscais',
  'pedidos_mesa',
];

dirsToSanitize.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sqlite'));

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    try {
      const db = new DatabaseSync(fullPath);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t) => t.name);

      operacionaisParaZerar.forEach((tbl) => {
        if (tables.includes(tbl)) {
          db.prepare(`DELETE FROM ${tbl}`).run();
        }
      });

      if (tables.includes('mesas')) {
        db.prepare("UPDATE mesas SET status = 'LIVRE', pessoas = 0, garcom_pin = NULL").run();
      }

      // 3. Sanitiza config_loja: reseta para estado virgem (sistema_configurado = 0)
      if (tables.includes('config_loja')) {
        const cols = db.prepare("PRAGMA table_info(config_loja)").all().map((c) => c.name);
        const updates = [
          "sistema_configurado = 0",
          "nome_loja = 'CLICKSTORM PDV'",
          "razao_social = NULL",
          "cnpj = NULL",
          "telefone = NULL",
          "endereco = NULL",
          "cep = NULL",
          "logradouro = NULL",
          "numero = NULL",
          "bairro = NULL",
          "cidade = NULL",
          "estado = NULL",
          "token_csc = NULL",
          "id_token_csc = NULL",
          "atualizado_em = CURRENT_TIMESTAMP"
        ];
        if (cols.includes('dados_json')) updates.push("dados_json = NULL");
        if (cols.includes('modulo_nfe')) updates.push("modulo_nfe = 0");

        db.prepare(`UPDATE config_loja SET ${updates.join(', ')} WHERE id = 'default'`).run();
      }

      // 4. Sanitiza usuarios: remove contas de teste (novolouco, etc) mantendo apenas admin padrão
      if (tables.includes('usuarios')) {
        db.prepare(`
          DELETE FROM usuarios 
          WHERE login NOT IN ('admin', 'gerente', 'operador', 'admin_virtual')
             OR login = 'novolouco'
             OR login = 'vd02'
             OR login = 'gr01'
        `).run();

        const hasAdmin = db.prepare("SELECT id FROM usuarios WHERE login = 'admin' LIMIT 1").get();
        if (!hasAdmin) {
          const hash = crypto.createHash('sha256').update('cs_salt_admin123').digest('hex');
          db.prepare(`
            INSERT OR REPLACE INTO usuarios (id, nome, login, senha_hash, hierarquia, ativo)
            VALUES ('usr_admin', 'Administrador do Sistema', 'admin', ?, 'ADMIN', 1)
          `).run(hash);
        }
      }

      // 5. Sanitiza licenca_local: chave padrão limpa sem dados cadastrais
      if (tables.includes('licenca_local')) {
        db.prepare(`
          UPDATE licenca_local SET
            chave_licenca = 'CS-PRO-LOCAL-LICENSE',
            cnpj = NULL,
            razao_social = NULL,
            atualizado_em = CURRENT_TIMESTAMP
          WHERE id = 'default'
        `).run();
      }

      db.exec('VACUUM;');
      console.log(`[SANITIZADO COM SUCESSO] ${fullPath}`);
    } catch (err) {
      console.error(`[ERRO SANITIZANDO] ${fullPath}: ${err.message}`);
    }
  });
});

console.log('--- SANITIZAÇÃO CONCLUÍDA: BANCOS PRONTOS PARA PRODUÇÃO LIMPA ---');
