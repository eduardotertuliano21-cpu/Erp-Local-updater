import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';
import { LicencaRepository } from './LicencaRepository.js';
import { LogoStorageService } from '../services/LogoStorageService.js';

export type NichoSegmento = 'peso' | 'varejo_rapido' | 'auto_pecas' | 'food' | 'restaurante' | 'assistencia';

export interface ConfigLoja {
  id: string; nome_loja: string; nome_fantasia?: string; razao_social?: string; cnpj?: string; telefone?: string;
  endereco?: string; cep?: string; logradouro?: string; numero?: string; bairro?: string; cidade?: string; estado?: string;
  slogan?: string; logo_url?: string; cor_primaria: string; cor_secundaria?: string; tema_visual?: string; densidade?: string;
  modo_operacao: 'MASTER' | 'SLAVE'; master_ip?: string; segmento?: string; segment?: NichoSegmento; ramo_atuacao?: string;
  licenca_token?: string; exigir_senha_cancelamento?: boolean; permitir_estoque_negativo?: boolean; agrupar_itens?: boolean;
  desconto_maximo_operador?: number; ativar_crediario?: boolean; ativar_comissao?: boolean; ativar_delivery?: boolean;
  taxa_servico_restaurante?: number; cozinha_impressora_ip?: string; exibir_oem_aplicacao?: boolean; foco_balanca_automatico?: boolean;
  habilitar_convenio?: number | boolean; habilitar_whatsapp?: number | boolean; forcar_fechamento_diario?: boolean;
  sistema_configurado?: number | boolean; controle_acesso_estrito?: number | boolean; exigir_autenticacao?: number | boolean;
  token_csc?: string; id_token_csc?: string; comportamento_fiscal_pdv?: 'SEMPRE' | 'MANUAL'; certificado_ativo_id?: string;
  inscricao_estadual?: string; crt?: number; codigo_municipio_ibge?: string; impressora_padrao?: string; margem_impressao?: number;
  balanca_checkout_ativa?: number | boolean; balanca_modelo?: 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO'; balanca_porta?: string;
  serie_nfce?: number; proximo_numero_nfce?: number; modulo_nfe?: number | boolean; dados_json?: string; atualizado_em?: string;
}

export type StoreSettings = ConfigLoja;

export class ConfigLojaRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  constructor() {
    this.garantirColunas();
  }

  private garantirColunas(): void {
    const cols = [
      'dados_json TEXT', 'razao_social TEXT', 'endereco TEXT', 'cep TEXT', 'logradouro TEXT', 'numero TEXT',
      'bairro TEXT', 'cidade TEXT', 'estado TEXT', 'telefone TEXT', 'impressora_padrao TEXT DEFAULT "PADRAO_WINDOWS"',
      'margem_impressao INTEGER DEFAULT 0', 'forcar_fechamento_diario INTEGER DEFAULT 1', 'sistema_configurado INTEGER DEFAULT 0',
      'token_csc TEXT', 'id_token_csc TEXT', 'comportamento_fiscal_pdv TEXT DEFAULT "MANUAL"',
      'controle_acesso_estrito INTEGER DEFAULT 0', 'exigir_autenticacao INTEGER DEFAULT 1', 'certificado_ativo_id TEXT',
      'inscricao_estadual TEXT', 'crt INTEGER DEFAULT 1', 'codigo_municipio_ibge TEXT DEFAULT "3509601"',
      'ramo_atuacao TEXT DEFAULT "mercado"', 'balanca_checkout_ativa INTEGER DEFAULT 0', 'balanca_modelo TEXT DEFAULT "TOLEDO"',
      'balanca_porta TEXT DEFAULT "AUTO"', 'serie_nfce INTEGER DEFAULT 1', 'proximo_numero_nfce INTEGER DEFAULT 1', 'modulo_nfe INTEGER DEFAULT 0'
    ];
    for (const c of cols) {
      try { this.writeDb.exec(`ALTER TABLE config_loja ADD COLUMN ${c};`); } catch {}
    }
  }

  public obter(): ConfigLoja {
    const row = this.readDb.prepare('SELECT * FROM config_loja WHERE id = ?').get('default') as any;
    let extras: any = {};
    if (row?.dados_json) {
      try { extras = JSON.parse(row.dados_json); } catch {}
    }
    const rawRamo = (row?.ramo_atuacao || row?.segmento || extras.ramo_atuacao || extras.segment || 'mercado').toLowerCase();
    let segmentNormalized: NichoSegmento = 'varejo_rapido';
    let ramoNormalized = 'mercado';
    if (rawRamo.includes('peso') || rawRamo.includes('acoug') || rawRamo.includes('horti')) { segmentNormalized = 'peso'; ramoNormalized = 'acougue'; }
    else if (rawRamo.includes('auto') || rawRamo.includes('peca')) { segmentNormalized = 'auto_pecas'; ramoNormalized = 'autopecas'; }
    else if (rawRamo.includes('food') || rawRamo.includes('rest') || rawRamo.includes('lanche')) { segmentNormalized = 'food'; ramoNormalized = 'restaurante'; }
    else if (rawRamo.includes('assist') || rawRamo.includes('os') || rawRamo.includes('tecnic')) { segmentNormalized = 'assistencia'; ramoNormalized = 'assistencia'; }
    else if (rawRamo.includes('roupa') || rawRamo.includes('calcado') || rawRamo.includes('vest')) { segmentNormalized = 'varejo_rapido'; ramoNormalized = 'roupas'; }

    const nomeLoja = row?.nome_loja || extras.nome_loja || 'CLICKSTORM PDV';
    const razaoSocial = row?.razao_social || extras.razao_social || nomeLoja;
    const cep = row?.cep || extras.cep || '';
    const logradouro = row?.logradouro || extras.logradouro || '';
    const numero = row?.numero || extras.numero || '';
    const bairro = row?.bairro || extras.bairro || '';
    const cidade = row?.cidade || extras.cidade || '';
    const estado = row?.estado || extras.estado || '';
    let endereco = row?.endereco || extras.endereco || '';
    if (!endereco && (logradouro || cidade)) {
      endereco = [logradouro, numero ? `Nº ${numero}` : '', bairro ? `Bairro ${bairro}` : '', cidade ? `${cidade}/${estado || 'SP'}` : '', cep ? `CEP ${cep}` : ''].filter(Boolean).join(', ');
    }

    return {
      id: 'default', nome_loja: nomeLoja, nome_fantasia: nomeLoja, razao_social: razaoSocial,
      cnpj: row?.cnpj || extras.cnpj || '', telefone: row?.telefone || extras.telefone || '',
      endereco, cep, logradouro, numero, bairro, cidade, estado,
      slogan: row?.slogan || extras.slogan || 'Automação Comercial de Alta Performance',
      logo_url: row?.logo_url || extras.logo_url || undefined,
      cor_primaria: row?.cor_primaria || '#0ea5e9', cor_secundaria: row?.cor_secundaria || '#0284c7',
      tema_visual: row?.tema_visual || extras.tema_visual || 'OBSIDIAN',
      densidade: row?.densidade || extras.densidade || 'PADRAO',
      modo_operacao: (row?.modo_operacao as any) || 'MASTER',
      master_ip: row?.master_ip || extras.master_ip,
      segmento: (row?.segmento || ramoNormalized).toUpperCase(),
      segment: segmentNormalized, ramo_atuacao: ramoNormalized,
      licenca_token: row?.licenca_token || extras.licenca_token,
      exigir_senha_cancelamento: extras.exigir_senha_cancelamento !== undefined ? Boolean(extras.exigir_senha_cancelamento) : true,
      permitir_estoque_negativo: extras.permitir_estoque_negativo !== undefined ? Boolean(extras.permitir_estoque_negativo) : false,
      agrupar_itens: extras.agrupar_itens !== undefined ? Boolean(extras.agrupar_itens) : true,
      desconto_maximo_operador: extras.desconto_maximo_operador !== undefined ? Number(extras.desconto_maximo_operador) : 5.0,
      ativar_crediario: extras.ativar_crediario !== undefined ? Boolean(extras.ativar_crediario) : false,
      ativar_comissao: extras.ativar_comissao !== undefined ? Boolean(extras.ativar_comissao) : false,
      ativar_delivery: extras.ativar_delivery !== undefined ? Boolean(extras.ativar_delivery) : false,
      taxa_servico_restaurante: extras.taxa_servico_restaurante !== undefined ? Number(extras.taxa_servico_restaurante) : 10,
      cozinha_impressora_ip: extras.cozinha_impressora_ip,
      exibir_oem_aplicacao: segmentNormalized === 'auto_pecas' || Boolean(extras.exibir_oem_aplicacao),
      foco_balanca_automatico: segmentNormalized === 'peso' || Boolean(extras.foco_balanca_automatico ?? true),
      habilitar_convenio: row?.habilitar_convenio !== undefined ? row.habilitar_convenio : (extras.habilitar_convenio ? 1 : 0),
      habilitar_whatsapp: row?.habilitar_whatsapp !== undefined ? row.habilitar_whatsapp : (extras.habilitar_whatsapp !== undefined ? (extras.habilitar_whatsapp ? 1 : 0) : 1),
      forcar_fechamento_diario: extras.forcar_fechamento_diario !== undefined ? Boolean(extras.forcar_fechamento_diario) : true,
      sistema_configurado: row?.sistema_configurado !== undefined ? row.sistema_configurado : (extras.sistema_configurado ? 1 : 0),
      controle_acesso_estrito: row?.controle_acesso_estrito !== undefined ? row.controle_acesso_estrito : (extras.controle_acesso_estrito ? 1 : 0),
      exigir_autenticacao: row?.exigir_autenticacao !== undefined ? row.exigir_autenticacao : (extras.exigir_autenticacao !== undefined ? (extras.exigir_autenticacao ? 1 : 0) : 1),
      token_csc: row?.token_csc || extras.token_csc || '',
      id_token_csc: row?.id_token_csc || extras.id_token_csc || '',
      comportamento_fiscal_pdv: (row?.comportamento_fiscal_pdv || extras.comportamento_fiscal_pdv || 'MANUAL') as any,
      certificado_ativo_id: row?.certificado_ativo_id || extras.certificado_ativo_id,
      inscricao_estadual: row?.inscricao_estadual || extras.inscricao_estadual || '',
      crt: row?.crt !== undefined && row?.crt !== null ? Number(row.crt) : (extras.crt ? Number(extras.crt) : 1),
      codigo_municipio_ibge: row?.codigo_municipio_ibge || extras.codigo_municipio_ibge || '3509601',
      impressora_padrao: row?.impressora_padrao || extras.impressora_padrao || 'PADRAO_WINDOWS',
      margem_impressao: row?.margem_impressao !== undefined ? Number(row.margem_impressao) : (extras.margem_impressao || 0),
      balanca_checkout_ativa: Boolean(row?.balanca_checkout_ativa ?? extras.balanca_checkout_ativa),
      balanca_modelo: row?.balanca_modelo || extras.balanca_modelo || 'TOLEDO',
      balanca_porta: row?.balanca_porta || extras.balanca_porta || 'AUTO',
      serie_nfce: row?.serie_nfce ? Number(row.serie_nfce) : (extras.serie_nfce ? Number(extras.serie_nfce) : 1),
      proximo_numero_nfce: row?.proximo_numero_nfce ? Number(row.proximo_numero_nfce) : (extras.proximo_numero_nfce ? Number(extras.proximo_numero_nfce) : 1),
      modulo_nfe: row?.modulo_nfe !== undefined ? Number(row.modulo_nfe) : (extras.modulo_nfe ? 1 : 0),
      atualizado_em: row?.atualizado_em,
    };
  }

  public salvar(c: Partial<ConfigLoja>, dispararTelemetria: boolean = true): ConfigLoja {
    const atual = this.obter();
    const nomeLoja = c.nome_loja !== undefined ? c.nome_loja.trim() : (c.nome_fantasia !== undefined ? c.nome_fantasia.trim() : atual.nome_loja);
    const razaoSocial = c.razao_social !== undefined ? c.razao_social.trim() : (atual.razao_social || nomeLoja);
    const cep = c.cep !== undefined ? c.cep.trim() : (atual.cep || '');
    const logradouro = c.logradouro !== undefined ? c.logradouro.trim() : (atual.logradouro || '');
    const numero = c.numero !== undefined ? c.numero.trim() : (atual.numero || '');
    const bairro = c.bairro !== undefined ? c.bairro.trim() : (atual.bairro || '');
    const cidade = c.cidade !== undefined ? c.cidade.trim() : (atual.cidade || '');
    const estado = c.estado !== undefined ? c.estado.trim().toUpperCase() : (atual.estado || '');

    let endereco = c.endereco !== undefined ? c.endereco.trim() : atual.endereco;
    if (logradouro || numero || bairro || cidade) {
      endereco = [logradouro, numero ? `Nº ${numero}` : '', bairro ? `Bairro ${bairro}` : '', cidade ? `${cidade}/${estado || 'SP'}` : '', cep ? `CEP ${cep}` : ''].filter(Boolean).join(', ');
    }

    let logoUrl = c.logo_url !== undefined ? c.logo_url : atual.logo_url;
    if (logoUrl && logoUrl.startsWith('data:image/')) {
      try { logoUrl = LogoStorageService.salvarLogo(logoUrl).url; } catch {}
    }

    const cfg: ConfigLoja = {
      ...atual, ...c, id: 'default', nome_loja: nomeLoja, nome_fantasia: nomeLoja, razao_social: razaoSocial,
      endereco, cep, logradouro, numero, bairro, cidade, estado, logo_url: logoUrl, atualizado_em: new Date().toISOString(),
    };

    const dadosJson = JSON.stringify(cfg);

    this.writeDb.prepare(`
      INSERT INTO config_loja (
        id, nome_loja, razao_social, cnpj, telefone, endereco, cep, logradouro, numero, bairro, cidade, estado,
        logo_url, cor_primaria, cor_secundaria, slogan, licenca_token, modo_operacao, master_ip, segmento,
        tema_visual, densidade, habilitar_convenio, habilitar_whatsapp, forcar_fechamento_diario, sistema_configurado,
        token_csc, id_token_csc, comportamento_fiscal_pdv, controle_acesso_estrito, exigir_autenticacao,
        certificado_ativo_id, inscricao_estadual, crt, codigo_municipio_ibge, ramo_atuacao, impressora_padrao,
        margem_impressao, balanca_checkout_ativa, balanca_modelo, balanca_porta, serie_nfce, proximo_numero_nfce,
        modulo_nfe, dados_json, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nome_loja = excluded.nome_loja, razao_social = excluded.razao_social, cnpj = excluded.cnpj,
        telefone = excluded.telefone, endereco = excluded.endereco, cep = excluded.cep,
        logradouro = excluded.logradouro, numero = excluded.numero, bairro = excluded.bairro,
        cidade = excluded.cidade, estado = excluded.estado, logo_url = excluded.logo_url,
        cor_primaria = excluded.cor_primaria, cor_secundaria = excluded.cor_secundaria, slogan = excluded.slogan,
        licenca_token = excluded.licenca_token, modo_operacao = excluded.modo_operacao, master_ip = excluded.master_ip,
        segmento = excluded.segmento, tema_visual = excluded.tema_visual, densidade = excluded.densidade,
        habilitar_convenio = excluded.habilitar_convenio, habilitar_whatsapp = excluded.habilitar_whatsapp,
        forcar_fechamento_diario = excluded.forcar_fechamento_diario, sistema_configurado = excluded.sistema_configurado,
        token_csc = excluded.token_csc, id_token_csc = excluded.id_token_csc,
        comportamento_fiscal_pdv = excluded.comportamento_fiscal_pdv, controle_acesso_estrito = excluded.controle_acesso_estrito,
        exigir_autenticacao = excluded.exigir_autenticacao, certificado_ativo_id = excluded.certificado_ativo_id,
        inscricao_estadual = excluded.inscricao_estadual, crt = excluded.crt,
        codigo_municipio_ibge = excluded.codigo_municipio_ibge, ramo_atuacao = excluded.ramo_atuacao,
        impressora_padrao = excluded.impressora_padrao, margem_impressao = excluded.margem_impressao,
        balanca_checkout_ativa = excluded.balanca_checkout_ativa, balanca_modelo = excluded.balanca_modelo,
        balanca_porta = excluded.balanca_porta, serie_nfce = excluded.serie_nfce,
        proximo_numero_nfce = excluded.proximo_numero_nfce, modulo_nfe = excluded.modulo_nfe,
        dados_json = excluded.dados_json, atualizado_em = CURRENT_TIMESTAMP
    `).run(
      cfg.id, cfg.nome_loja, cfg.razao_social || null, cfg.cnpj || null, cfg.telefone || null,
      cfg.endereco || null, cfg.cep || null, cfg.logradouro || null, cfg.numero || null,
      cfg.bairro || null, cfg.cidade || null, cfg.estado || null, cfg.logo_url || null,
      cfg.cor_primaria, cfg.cor_secundaria || null, cfg.slogan || null, cfg.licenca_token || null,
      cfg.modo_operacao, cfg.master_ip || null, cfg.segmento || 'GERAL', cfg.tema_visual || 'OBSIDIAN',
      cfg.densidade || 'PADRAO', cfg.habilitar_convenio ? 1 : 0, cfg.habilitar_whatsapp ? 1 : 0,
      cfg.forcar_fechamento_diario ? 1 : 0, cfg.sistema_configurado ? 1 : 0, cfg.token_csc || null,
      cfg.id_token_csc || null, cfg.comportamento_fiscal_pdv || 'MANUAL', cfg.controle_acesso_estrito ? 1 : 0,
      cfg.exigir_autenticacao ? 1 : 0, cfg.certificado_ativo_id || null, cfg.inscricao_estadual || null,
      cfg.crt || 1, cfg.codigo_municipio_ibge || '3509601', cfg.ramo_atuacao || 'mercado',
      cfg.impressora_padrao || 'PADRAO_WINDOWS', cfg.margem_impressao || 0,
      cfg.balanca_checkout_ativa ? 1 : 0, cfg.balanca_modelo || 'TOLEDO', cfg.balanca_porta || 'AUTO',
      cfg.serie_nfce || 1, cfg.proximo_numero_nfce || 1, cfg.modulo_nfe ? 1 : 0, dadosJson
    );

    if (dispararTelemetria) {
      this.dispararTelemetriaNuvem(cfg);
    }
    return cfg;
  }

  private dispararTelemetriaNuvem(cfg: ConfigLoja): void {
    try {
      const lic = new LicencaRepository().obterLicenca();
      const cloudUrl = (process.env.CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
      fetch(`${cloudUrl}/api/sync/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-license-key': lic.chave_licenca || 'CS-PRO-LOCAL-LICENSE',
          'x-tenant-cnpj': cfg.cnpj || lic.cnpj || 'ISENTO',
        },
        body: JSON.stringify({
          origem: 'SETTINGS',
          razaoSocial: cfg.razao_social || cfg.nome_loja,
          nomeFantasia: cfg.nome_loja,
          cnpj: cfg.cnpj,
          telefone: cfg.telefone,
          endereco: cfg.endereco,
          cep: cfg.cep,
          logradouro: cfg.logradouro,
          numero: cfg.numero,
          bairro: cfg.bairro,
          cidade: cfg.cidade,
          estado: cfg.estado,
          ramo_atuacao: cfg.ramo_atuacao || 'mercado',
          segmento: (cfg.ramo_atuacao || 'mercado').toUpperCase(),
          logoUrl: cfg.logo_url || '',
        }),
      }).catch(() => {});
    } catch {}
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
