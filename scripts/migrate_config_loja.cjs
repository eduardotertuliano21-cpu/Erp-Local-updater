const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const dirs = [
  path.resolve('data'),
  path.join(process.env.APPDATA || '', 'ClickStorm PDV', 'data')
];

const cols = [
  'segmento TEXT DEFAULT "GERAL"',
  'tema_visual TEXT DEFAULT "OBSIDIAN"',
  'densidade TEXT DEFAULT "PADRAO"',
  'habilitar_convenio INTEGER DEFAULT 0',
  'habilitar_whatsapp INTEGER DEFAULT 1',
  'forcar_fechamento_diario INTEGER DEFAULT 1',
  'razao_social TEXT',
  'endereco TEXT',
  'cep TEXT',
  'logradouro TEXT',
  'numero TEXT',
  'bairro TEXT',
  'cidade TEXT',
  'estado TEXT',
  'telefone TEXT',
  'impressora_padrao TEXT DEFAULT "PADRAO_WINDOWS"',
  'margem_impressao INTEGER DEFAULT 0',
  'exigir_autenticacao INTEGER DEFAULT 1',
  'sistema_configurado INTEGER DEFAULT 0',
  'token_csc TEXT',
  'id_token_csc TEXT',
  'comportamento_fiscal_pdv TEXT DEFAULT "MANUAL"',
  'controle_acesso_estrito INTEGER DEFAULT 0',
  'certificado_ativo_id TEXT',
  'inscricao_estadual TEXT',
  'crt INTEGER DEFAULT 1',
  'codigo_municipio_ibge TEXT DEFAULT "3509601"',
  'ramo_atuacao TEXT DEFAULT "mercado"'
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite'));
  for (const file of files) {
    const full = path.join(dir, file);
    try {
      const db = new DatabaseSync(full);
      for (const col of cols) {
        try { db.exec(`ALTER TABLE config_loja ADD COLUMN ${col};`); } catch (e) {}
      }
      db.close();
      console.log('✓ Migrado com sucesso:', full);
    } catch (err) {
      console.log('Skip:', file, err.message);
    }
  }
}
console.log('Todas as migrações concluídas!');
