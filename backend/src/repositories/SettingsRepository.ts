import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import { LicencaRepository } from './LicencaRepository.js';
import { LogoStorageService } from '../services/LogoStorageService.js';

export type NichoSegmento = 'peso' | 'varejo_rapido' | 'auto_pecas' | 'food';

export interface StoreSettings {
  id: string;
  nome_loja: string;
  razao_social?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  slogan?: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria?: string;
  tema_visual?: string;
  densidade?: string;
  modo_operacao: 'MASTER' | 'SLAVE';
  master_ip?: string;
  segment: NichoSegmento;
  exigir_senha_cancelamento: boolean;
  permitir_estoque_negativo: boolean;
  agrupar_itens: boolean;
  desconto_maximo_operador: number;
  ativar_crediario: boolean;
  ativar_comissao: boolean;
  ativar_delivery: boolean;
  taxa_servico_restaurante: number;
  cozinha_impressora_ip?: string;
  exibir_oem_aplicacao: boolean;
  foco_balanca_automatico: boolean;
  inscricao_estadual?: string;
  crt?: number;
  codigo_municipio_ibge?: string;
  token_csc?: string;
  id_token_csc?: string;
  comportamento_fiscal_pdv?: 'SEMPRE' | 'MANUAL';
  ramo_atuacao?: string;
  balanca_checkout_ativa?: boolean | number;
  balanca_modelo?: 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO';
  balanca_porta?: string;
  serie_nfce?: number;
  proximo_numero_nfce?: number;
  atualizado_em?: string;
}

export const SETTINGS_PADRAO: StoreSettings = {
  id: 'default',
  nome_loja: 'CLICKSTORM PDV',
  slogan: 'Automação Comercial de Alta Performance',
  cor_primaria: '#0ea5e9',
  cor_secundaria: '#0284c7',
  tema_visual: 'OBSIDIAN',
  densidade: 'PADRAO',
  modo_operacao: 'MASTER',
  segment: 'varejo_rapido',
  exigir_senha_cancelamento: true,
  permitir_estoque_negativo: false,
  agrupar_itens: true,
  desconto_maximo_operador: 5.0,
  ativar_crediario: false,
  ativar_comissao: false,
  ativar_delivery: false,
  taxa_servico_restaurante: 10,
  exibir_oem_aplicacao: false,
  foco_balanca_automatico: true,
  comportamento_fiscal_pdv: 'MANUAL',
  crt: 1,
  codigo_municipio_ibge: '3509601',
  balanca_checkout_ativa: false,
  balanca_modelo: 'TOLEDO',
  balanca_porta: 'AUTO',
  serie_nfce: 1,
  proximo_numero_nfce: 1,
};

export class SettingsRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  constructor() {
    this.garantirColunas();
  }

  private garantirColunas(): void {
    const cols = ['dados_json', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 'inscricao_estadual', 'crt', 'codigo_municipio_ibge', 'serie_nfce', 'proximo_numero_nfce', 'token_csc', 'id_token_csc'];
    for (const c of cols) {
      try {
        this.writeDb.exec(`ALTER TABLE config_loja ADD COLUMN ${c} TEXT;`);
      } catch {}
    }
  }

  public obter(): StoreSettings {
    const stmt = this.readDb.prepare('SELECT * FROM config_loja WHERE id = ?');
    const row = stmt.get('default') as any;

    if (!row) {
      return SETTINGS_PADRAO;
    }

    let extras: Partial<StoreSettings> = {};
    if (row.dados_json) {
      try {
        extras = JSON.parse(row.dados_json);
      } catch {
        extras = {};
      }
    }

    const rawRamo = (row.ramo_atuacao || row.segmento || extras.ramo_atuacao || extras.segment || 'mercado').toLowerCase();
    let segmentNormalized: NichoSegmento = 'varejo_rapido';
    let ramoNormalized = 'mercado';
    if (rawRamo.includes('peso') || rawRamo.includes('acoug') || rawRamo.includes('horti')) { segmentNormalized = 'peso'; ramoNormalized = 'acougue'; }
    else if (rawRamo.includes('auto') || rawRamo.includes('peca')) { segmentNormalized = 'auto_pecas'; ramoNormalized = 'autopecas'; }
    else if (rawRamo.includes('food') || rawRamo.includes('rest') || rawRamo.includes('lanche')) { segmentNormalized = 'food'; ramoNormalized = 'restaurante'; }
    else if (rawRamo.includes('assist') || rawRamo.includes('os') || rawRamo.includes('tecnic')) { segmentNormalized = 'varejo_rapido'; ramoNormalized = 'assistencia'; }
    else if (rawRamo.includes('roupa') || rawRamo.includes('calcado') || rawRamo.includes('vest')) { segmentNormalized = 'varejo_rapido'; ramoNormalized = 'roupas'; }

    return {
      id: 'default',
      nome_loja: row.nome_loja || SETTINGS_PADRAO.nome_loja,
      razao_social: row.razao_social || extras.razao_social || row.nome_loja || undefined,
      cnpj: row.cnpj || extras.cnpj || undefined,
      telefone: row.telefone || extras.telefone || undefined,
      endereco: row.endereco || extras.endereco || undefined,
      cep: row.cep || extras.cep || '',
      logradouro: row.logradouro || extras.logradouro || '',
      numero: row.numero || extras.numero || '',
      bairro: row.bairro || extras.bairro || '',
      cidade: row.cidade || extras.cidade || '',
      estado: row.estado || extras.estado || '',
      slogan: row.slogan || undefined,
      logo_url: row.logo_url || extras.logo_url || undefined,
      cor_primaria: row.cor_primaria || SETTINGS_PADRAO.cor_primaria,
      cor_secundaria: row.cor_secundaria || SETTINGS_PADRAO.cor_secundaria,
      tema_visual: row.tema_visual || 'OBSIDIAN',
      densidade: row.densidade || 'PADRAO',
      modo_operacao: (row.modo_operacao as any) || 'MASTER',
      master_ip: row.master_ip || undefined,
      segment: segmentNormalized,
      ramo_atuacao: ramoNormalized,
      exigir_senha_cancelamento: extras.exigir_senha_cancelamento !== undefined ? extras.exigir_senha_cancelamento : SETTINGS_PADRAO.exigir_senha_cancelamento,
      permitir_estoque_negativo: extras.permitir_estoque_negativo !== undefined ? extras.permitir_estoque_negativo : SETTINGS_PADRAO.permitir_estoque_negativo,
      agrupar_itens: extras.agrupar_itens !== undefined ? extras.agrupar_itens : SETTINGS_PADRAO.agrupar_itens,
      desconto_maximo_operador: extras.desconto_maximo_operador !== undefined ? extras.desconto_maximo_operador : SETTINGS_PADRAO.desconto_maximo_operador,
      ativar_crediario: extras.ativar_crediario !== undefined ? extras.ativar_crediario : SETTINGS_PADRAO.ativar_crediario,
      ativar_comissao: extras.ativar_comissao !== undefined ? extras.ativar_comissao : SETTINGS_PADRAO.ativar_comissao,
      ativar_delivery: extras.ativar_delivery !== undefined ? extras.ativar_delivery : SETTINGS_PADRAO.ativar_delivery,
      taxa_servico_restaurante: extras.taxa_servico_restaurante !== undefined ? extras.taxa_servico_restaurante : 10,
      cozinha_impressora_ip: extras.cozinha_impressora_ip,
      exibir_oem_aplicacao: segmentNormalized === 'auto_pecas' || Boolean(extras.exibir_oem_aplicacao),
      foco_balanca_automatico: segmentNormalized === 'peso' || Boolean(extras.foco_balanca_automatico),
      inscricao_estadual: row.inscricao_estadual || extras.inscricao_estadual || '',
      crt: row.crt !== undefined ? Number(row.crt) : (extras.crt || 1),
      codigo_municipio_ibge: row.codigo_municipio_ibge || extras.codigo_municipio_ibge || '3509601',
      token_csc: row.token_csc || extras.token_csc || '',
      id_token_csc: row.id_token_csc || extras.id_token_csc || '',
      comportamento_fiscal_pdv: (row.comportamento_fiscal_pdv || extras.comportamento_fiscal_pdv || 'MANUAL') as any,
      balanca_checkout_ativa: Boolean(row.balanca_checkout_ativa ?? extras.balanca_checkout_ativa),
      balanca_modelo: row.balanca_modelo || extras.balanca_modelo || 'TOLEDO',
      balanca_porta: row.balanca_porta || extras.balanca_porta || 'AUTO',
      serie_nfce: row.serie_nfce ? Number(row.serie_nfce) : (extras.serie_nfce ? Number(extras.serie_nfce) : 1),
      proximo_numero_nfce: row.proximo_numero_nfce ? Number(row.proximo_numero_nfce) : (extras.proximo_numero_nfce ? Number(extras.proximo_numero_nfce) : 1),
      atualizado_em: row.atualizado_em,
    };
  }

  public salvar(novosDados: Partial<StoreSettings>): StoreSettings {
    const atual = this.obter();
    const consolidado: StoreSettings = {
      ...atual,
      ...novosDados,
      id: 'default',
      atualizado_em: new Date().toISOString(),
    };

    if (consolidado.logo_url && consolidado.logo_url.startsWith('data:image/')) {
      try {
        const salvo = LogoStorageService.salvarLogo(consolidado.logo_url);
        consolidado.logo_url = salvo.url;
      } catch {}
    }

    if (consolidado.logradouro || consolidado.numero || consolidado.bairro || consolidado.cidade) {
      consolidado.endereco = [
        consolidado.logradouro?.trim(),
        consolidado.numero?.trim() ? `Nº ${consolidado.numero.trim()}` : '',
        consolidado.bairro?.trim() ? `Bairro ${consolidado.bairro.trim()}` : '',
        consolidado.cidade?.trim() ? `${consolidado.cidade.trim()}/${consolidado.estado?.trim() || 'SP'}` : '',
        consolidado.cep?.trim() ? `CEP ${consolidado.cep.trim()}` : '',
      ].filter(Boolean).join(', ');
    }

    const dadosJson = JSON.stringify(consolidado);

    const stmt = this.writeDb.prepare(`
      INSERT INTO config_loja (
        id, nome_loja, razao_social, cnpj, telefone, endereco,
        cep, logradouro, numero, bairro, cidade, estado,
        logo_url, cor_primaria, cor_secundaria,
        slogan, modo_operacao, master_ip,
        segmento, tema_visual, densidade, dados_json, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nome_loja = excluded.nome_loja, razao_social = excluded.razao_social, cnpj = excluded.cnpj,
        telefone = excluded.telefone, endereco = excluded.endereco, cep = excluded.cep,
        logradouro = excluded.logradouro, numero = excluded.numero, bairro = excluded.bairro,
        cidade = excluded.cidade, estado = excluded.estado, logo_url = excluded.logo_url,
        cor_primaria = excluded.cor_primaria, cor_secundaria = excluded.cor_secundaria,
        slogan = excluded.slogan, modo_operacao = excluded.modo_operacao, master_ip = excluded.master_ip,
        segmento = excluded.segmento, tema_visual = excluded.tema_visual, densidade = excluded.densidade,
        dados_json = excluded.dados_json, atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(
      consolidado.id, consolidado.nome_loja, consolidado.razao_social || consolidado.nome_loja || null,
      consolidado.cnpj || null, consolidado.telefone || null, consolidado.endereco || null,
      consolidado.cep || null, consolidado.logradouro || null, consolidado.numero || null,
      consolidado.bairro || null, consolidado.cidade || null, consolidado.estado || null,
      consolidado.logo_url || null, consolidado.cor_primaria, consolidado.cor_secundaria || null,
      consolidado.slogan || null, consolidado.modo_operacao, consolidado.master_ip || null,
      consolidado.segment, consolidado.tema_visual || 'OBSIDIAN', consolidado.densidade || 'PADRAO', dadosJson
    );

    try {
      this.writeDb.prepare(`UPDATE config_loja SET inscricao_estadual = ?, crt = ?, codigo_municipio_ibge = ?, token_csc = ?, id_token_csc = ?, comportamento_fiscal_pdv = ?, ramo_atuacao = ?, segmento = ?, balanca_checkout_ativa = ?, balanca_modelo = ?, balanca_porta = ?, serie_nfce = ?, proximo_numero_nfce = ? WHERE id = 'default'`).run(
        consolidado.inscricao_estadual || null, consolidado.crt || 1, consolidado.codigo_municipio_ibge || '3509601',
        consolidado.token_csc || null, consolidado.id_token_csc || null, consolidado.comportamento_fiscal_pdv || 'MANUAL',
        consolidado.ramo_atuacao || 'mercado', (consolidado.ramo_atuacao || 'mercado').toUpperCase(),
        consolidado.balanca_checkout_ativa ? 1 : 0, consolidado.balanca_modelo || 'TOLEDO', consolidado.balanca_porta || 'AUTO',
        consolidado.serie_nfce || 1, consolidado.proximo_numero_nfce || 1
      );
    } catch {}

    try {
      const lic = new LicencaRepository().obterLicenca();
      const cloudUrl = (process.env.CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
      fetch(`${cloudUrl}/api/sync/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-license-key': lic.chave_licenca || 'CS-PRO-LOCAL-LICENSE', 'x-tenant-cnpj': consolidado.cnpj || lic.cnpj || 'ISENTO' },
        body: JSON.stringify({
          origem: 'SETTINGS', razaoSocial: consolidado.razao_social || consolidado.nome_loja,
          nomeFantasia: consolidado.nome_loja, cnpj: consolidado.cnpj, telefone: consolidado.telefone,
          endereco: consolidado.endereco, cep: consolidado.cep, logradouro: consolidado.logradouro, numero: consolidado.numero,
          bairro: consolidado.bairro, cidade: consolidado.cidade, estado: consolidado.estado,
          ramo_atuacao: consolidado.ramo_atuacao || 'mercado', segmento: (consolidado.ramo_atuacao || 'mercado').toUpperCase(),
          logoUrl: consolidado.logo_url || '',
        }),
      }).catch(() => {});
    } catch {}

    return consolidado;
  }

  public gerarCargaToledoMgv(): string {
    const prods = this.readDb.prepare(`
      SELECT codigo_barras, descricao, preco_venda, unidade_medida, pesavel, codigo_balanca, validade_balanca
      FROM produtos 
      WHERE ativo = 1 AND (pesavel = 1 OR unidade_medida = 'KG' OR (codigo_balanca IS NOT NULL AND codigo_balanca != ''))
    `).all() as any[];

    return prods.map((p) => {
      const plu = (p.codigo_balanca || p.codigo_barras || '1').replace(/\D/g, '').slice(-6).padStart(6, '0');
      const tipo = (p.unidade_medida === 'UN' && !p.pesavel) ? '1' : '0';
      const precoCentavos = Math.round(Number(p.preco_venda || 0) * 100).toString().padStart(6, '0');
      const val = Math.min(Math.max(Number(p.validade_balanca || 5), 0), 999).toString().padStart(3, '0');
      const desc = (p.descricao || '').toUpperCase().slice(0, 50).padEnd(50, ' ');
      return `${plu}${tipo}${precoCentavos}${val}${desc}`;
    }).join('\r\n');
  }
}
