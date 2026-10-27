import { getCatalogoWriterDb, getCatalogoReadOnlyDb } from '../config/database.js';

export interface ConfigLoja {
  id: string;
  nome_loja: string;
  razao_social?: string;
  endereco?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria?: string;
  slogan?: string;
  cnpj?: string;
  licenca_token?: string;
  modo_operacao: 'MASTER' | 'SLAVE';
  master_ip?: string;
  segmento?: string;
  tema_visual?: string;
  densidade?: string;
  ramo_atuacao?: string;
  habilitar_convenio?: number | boolean;
  habilitar_whatsapp?: number | boolean;
  sistema_configurado?: number | boolean;
  token_csc?: string;
  id_token_csc?: string;
  comportamento_fiscal_pdv?: 'SEMPRE' | 'MANUAL';
  controle_acesso_estrito?: number | boolean;
  exigir_autenticacao?: number | boolean;
  certificado_ativo_id?: string;
  inscricao_estadual?: string;
  crt?: number;
  codigo_municipio_ibge?: string;
  balanca_checkout_ativa?: number | boolean;
  balanca_modelo?: 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO';
  balanca_porta?: string;
  serie_nfce?: number;
  proximo_numero_nfce?: number;
  atualizado_em?: string;
}

export class ConfigLojaRepository {
  private readDb = getCatalogoReadOnlyDb();
  private writeDb = getCatalogoWriterDb();

  public obter(): ConfigLoja {
    const stmt = this.readDb.prepare('SELECT * FROM config_loja WHERE id = ?');
    const row = stmt.get('default') as unknown as ConfigLoja | undefined;

    if (!row) {
      return {
        id: 'default',
        nome_loja: 'CLICKSTORM PDV',
        razao_social: 'CLICKSTORM TECNOLOGIA LTDA',
        endereco: 'Av. Principal, 1000 - Centro',
        logo_url: undefined,
        cor_primaria: '#0ea5e9',
        cor_secundaria: '#0284c7',
        slogan: 'Automação Comercial de Alta Performance',
        modo_operacao: 'MASTER',
        segmento: 'GERAL',
        tema_visual: 'OBSIDIAN',
        densidade: 'PADRAO',
        habilitar_convenio: 0,
        habilitar_whatsapp: 1,
        sistema_configurado: 0,
        token_csc: '',
        id_token_csc: '',
        comportamento_fiscal_pdv: 'MANUAL',
        controle_acesso_estrito: 0,
        exigir_autenticacao: 1,
        serie_nfce: 1,
        proximo_numero_nfce: 1,
      };
    }
    return row;
  }

  public salvar(c: Partial<ConfigLoja>): ConfigLoja {
    const atual = this.obter();
    const cep = c.cep !== undefined ? c.cep.trim() : (atual.cep || '');
    const logradouro = c.logradouro !== undefined ? c.logradouro.trim() : (atual.logradouro || '');
    const numero = c.numero !== undefined ? c.numero.trim() : (atual.numero || '');
    const bairro = c.bairro !== undefined ? c.bairro.trim() : (atual.bairro || '');
    const cidade = c.cidade !== undefined ? c.cidade.trim() : (atual.cidade || '');
    const estado = c.estado !== undefined ? c.estado.trim().toUpperCase() : (atual.estado || '');

    let enderecoCalc = c.endereco !== undefined ? c.endereco.trim() : (atual.endereco || '');
    if (logradouro || numero || bairro || cidade) {
      enderecoCalc = [
        logradouro,
        numero ? `Nº ${numero}` : '',
        bairro ? `Bairro ${bairro}` : '',
        cidade ? `${cidade}/${estado || 'SP'}` : '',
        cep ? `CEP ${cep}` : '',
      ].filter(Boolean).join(', ');
    }

    const configAtualizada: ConfigLoja = {
      id: 'default',
      nome_loja: c.nome_loja !== undefined ? c.nome_loja.trim() : atual.nome_loja,
      razao_social: c.razao_social !== undefined ? c.razao_social.trim() : (atual.razao_social || ''),
      endereco: enderecoCalc,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      telefone: c.telefone !== undefined ? c.telefone.trim() : (atual.telefone || ''),
      logo_url: c.logo_url !== undefined ? c.logo_url : atual.logo_url,
      cor_primaria: c.cor_primaria ? c.cor_primaria.trim() : atual.cor_primaria,
      cor_secundaria: c.cor_secundaria ? c.cor_secundaria.trim() : atual.cor_secundaria,
      slogan: c.slogan !== undefined ? c.slogan : atual.slogan,
      cnpj: c.cnpj !== undefined ? c.cnpj : atual.cnpj,
      licenca_token: c.licenca_token !== undefined ? c.licenca_token : atual.licenca_token,
      modo_operacao: c.modo_operacao || atual.modo_operacao,
      master_ip: c.master_ip !== undefined ? c.master_ip : atual.master_ip,
      segmento: c.segmento || atual.segmento || 'GERAL',
      tema_visual: c.tema_visual || atual.tema_visual || 'OBSIDIAN',
      densidade: c.densidade || atual.densidade || 'PADRAO',
      habilitar_convenio: c.habilitar_convenio !== undefined ? (c.habilitar_convenio ? 1 : 0) : (atual.habilitar_convenio ? 1 : 0),
      habilitar_whatsapp: c.habilitar_whatsapp !== undefined ? (c.habilitar_whatsapp ? 1 : 0) : (atual.habilitar_whatsapp !== undefined ? (atual.habilitar_whatsapp ? 1 : 0) : 1),
      sistema_configurado: c.sistema_configurado !== undefined ? (c.sistema_configurado ? 1 : 0) : (atual.sistema_configurado ? 1 : 0),
      token_csc: c.token_csc !== undefined ? c.token_csc.trim() : (atual.token_csc || ''),
      id_token_csc: c.id_token_csc !== undefined ? c.id_token_csc.trim() : (atual.id_token_csc || ''),
      comportamento_fiscal_pdv: c.comportamento_fiscal_pdv || atual.comportamento_fiscal_pdv || 'MANUAL',
      controle_acesso_estrito: c.controle_acesso_estrito !== undefined ? (c.controle_acesso_estrito ? 1 : 0) : (atual.controle_acesso_estrito ? 1 : 0),
      exigir_autenticacao: c.exigir_autenticacao !== undefined ? (c.exigir_autenticacao ? 1 : 0) : (atual.exigir_autenticacao !== undefined ? (atual.exigir_autenticacao ? 1 : 0) : 1),
      certificado_ativo_id: c.certificado_ativo_id !== undefined ? c.certificado_ativo_id : atual.certificado_ativo_id,
      inscricao_estadual: c.inscricao_estadual !== undefined ? c.inscricao_estadual.trim() : (atual.inscricao_estadual || ''),
      crt: c.crt !== undefined ? Number(c.crt) : (atual.crt || 1),
      codigo_municipio_ibge: c.codigo_municipio_ibge !== undefined ? c.codigo_municipio_ibge.trim() : (atual.codigo_municipio_ibge || '3509601'),
      ramo_atuacao: c.ramo_atuacao !== undefined ? c.ramo_atuacao : (atual.ramo_atuacao || 'mercado'),
      balanca_checkout_ativa: c.balanca_checkout_ativa !== undefined ? (c.balanca_checkout_ativa ? 1 : 0) : (atual.balanca_checkout_ativa ? 1 : 0),
      balanca_modelo: c.balanca_modelo || atual.balanca_modelo || 'TOLEDO',
      balanca_porta: c.balanca_porta || atual.balanca_porta || 'AUTO',
      serie_nfce: c.serie_nfce !== undefined ? Number(c.serie_nfce) : (atual.serie_nfce || 1),
      proximo_numero_nfce: c.proximo_numero_nfce !== undefined ? Number(c.proximo_numero_nfce) : (atual.proximo_numero_nfce || 1),
    };

    const stmt = this.writeDb.prepare(`
      INSERT INTO config_loja (
        id, nome_loja, razao_social, endereco, cep, logradouro, numero, bairro, cidade, estado,
        telefone, logo_url, cor_primaria, cor_secundaria,
        slogan, cnpj, licenca_token, modo_operacao, master_ip,
        segmento, tema_visual, densidade, habilitar_convenio, habilitar_whatsapp,
        sistema_configurado, token_csc, id_token_csc, comportamento_fiscal_pdv,
        controle_acesso_estrito, exigir_autenticacao, certificado_ativo_id,
        inscricao_estadual, crt, codigo_municipio_ibge, ramo_atuacao, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nome_loja = excluded.nome_loja,
        razao_social = excluded.razao_social,
        endereco = excluded.endereco,
        cep = excluded.cep,
        logradouro = excluded.logradouro,
        numero = excluded.numero,
        bairro = excluded.bairro,
        cidade = excluded.cidade,
        estado = excluded.estado,
        telefone = excluded.telefone,
        logo_url = excluded.logo_url,
        cor_primaria = excluded.cor_primaria,
        cor_secundaria = excluded.cor_secundaria,
        slogan = excluded.slogan,
        cnpj = excluded.cnpj,
        licenca_token = excluded.licenca_token,
        modo_operacao = excluded.modo_operacao,
        master_ip = excluded.master_ip,
        segmento = excluded.segmento,
        tema_visual = excluded.tema_visual,
        densidade = excluded.densidade,
        habilitar_convenio = excluded.habilitar_convenio,
        habilitar_whatsapp = excluded.habilitar_whatsapp,
        sistema_configurado = excluded.sistema_configurado,
        token_csc = excluded.token_csc,
        id_token_csc = excluded.id_token_csc,
        comportamento_fiscal_pdv = excluded.comportamento_fiscal_pdv,
        controle_acesso_estrito = excluded.controle_acesso_estrito,
        exigir_autenticacao = excluded.exigir_autenticacao,
        certificado_ativo_id = excluded.certificado_ativo_id,
        inscricao_estadual = excluded.inscricao_estadual,
        crt = excluded.crt,
        codigo_municipio_ibge = excluded.codigo_municipio_ibge,
        ramo_atuacao = excluded.ramo_atuacao,
        atualizado_em = CURRENT_TIMESTAMP
    `);

    stmt.run(
      configAtualizada.id,
      configAtualizada.nome_loja,
      configAtualizada.razao_social || null,
      configAtualizada.endereco || null,
      configAtualizada.cep || null,
      configAtualizada.logradouro || null,
      configAtualizada.numero || null,
      configAtualizada.bairro || null,
      configAtualizada.cidade || null,
      configAtualizada.estado || null,
      configAtualizada.telefone || null,
      configAtualizada.logo_url || null,
      configAtualizada.cor_primaria,
      configAtualizada.cor_secundaria || null,
      configAtualizada.slogan || null,
      configAtualizada.cnpj || null,
      configAtualizada.licenca_token || null,
      configAtualizada.modo_operacao,
      configAtualizada.master_ip || null,
      configAtualizada.segmento || 'GERAL',
      configAtualizada.tema_visual || 'OBSIDIAN',
      configAtualizada.densidade || 'PADRAO',
      configAtualizada.habilitar_convenio ? 1 : 0,
      configAtualizada.habilitar_whatsapp ? 1 : 0,
      configAtualizada.sistema_configurado ? 1 : 0,
      configAtualizada.token_csc || null,
      configAtualizada.id_token_csc || null,
      configAtualizada.comportamento_fiscal_pdv || 'MANUAL',
      configAtualizada.controle_acesso_estrito ? 1 : 0,
      configAtualizada.exigir_autenticacao ? 1 : 0,
      configAtualizada.certificado_ativo_id || null,
      configAtualizada.inscricao_estadual || null,
      configAtualizada.crt || 1,
      configAtualizada.codigo_municipio_ibge || '3509601',
      configAtualizada.ramo_atuacao || 'mercado'
    );

    try {
      this.writeDb.prepare(`
        UPDATE config_loja 
        SET balanca_checkout_ativa = ?, balanca_modelo = ?, balanca_porta = ?, serie_nfce = ?, proximo_numero_nfce = ?
        WHERE id = 'default'
      `).run(
        configAtualizada.balanca_checkout_ativa ? 1 : 0,
        configAtualizada.balanca_modelo || 'TOLEDO',
        configAtualizada.balanca_porta || 'AUTO',
        configAtualizada.serie_nfce || 1,
        configAtualizada.proximo_numero_nfce || 1
      );
    } catch {}

    return configAtualizada;
  }
}
