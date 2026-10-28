const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.resolve(__dirname, '..');

// Pastas candidatas para sanitização exclusiva de templates do instalador (NUNCA tocar em APPDATA do cliente)
const dirsToSanitize = [
  path.join(projectRoot, 'data'),
  path.join(projectRoot, 'backend', 'data'),
];

console.log('--- INICIANDO SANITIZAÇÃO DE BANCOS SQLITE CLICKSTORM ---');

// 1. Remover arquivos legados obsoletos
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

// 2. Sanitizar tabelas operacionais e produtos nos templates (cliente novo recebe sistema limpo)
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

      db.exec('VACUUM;');
      console.log(`[SANITIZADO COM SUCESSO] ${fullPath}`);
    } catch (err) {
      console.error(`[ERRO SANITIZANDO] ${fullPath}: ${err.message}`);
    }
  });
});

console.log('--- SANITIZAÇÃO CONCLUÍDA: BANCOS PRONTOS PARA PRODUÇÃO LIMPA ---');
