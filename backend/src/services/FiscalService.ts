import { IFiscalRepository, DocumentoFiscalRecord } from '../repositories/IFiscalRepository.js';
import { IOperacaoRepository } from '../repositories/IOperacaoRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { NfceXmlBuilder, EmpresaEmitenteCompleta } from './NfceXmlBuilder.js';
import { XmlSignerService } from './XmlSignerService.js';
import crypto from 'node:crypto';

export interface EmpresaEmitenteConfig extends EmpresaEmitenteCompleta {}

export const EMITENTE_PADRAO: EmpresaEmitenteConfig = {
  cnpj: '12345678000195',
  razaoSocial: 'CLICKSTORM COMERCIO E VAREJO LTDA',
  nomeFantasia: 'CLICKSTORM SUPERMERCADO',
  inscricaoEstadual: '123456789110',
  uf: 'SP',
  codigoUf: '35',
  ambiente: '2', // Homologação
  serieNfce: 1,
  crt: 1,
  codigoMunicipioIbge: '3509601',
};

export class FiscalService {
  private xmlSigner = new XmlSignerService();
  private configLojaRepo = new ConfigLojaRepository();

  constructor(
    private fiscalRepo: IFiscalRepository,
    private operacaoRepo: IOperacaoRepository,
    private config: EmpresaEmitenteConfig = EMITENTE_PADRAO
  ) {}

  public obterConfigAtual(): EmpresaEmitenteCompleta {
    try {
      const cfg = this.configLojaRepo.obter();
      if (cfg && (cfg.cnpj || cfg.razao_social || cfg.nome_loja)) {
        const uf = (cfg.estado || 'SP').toUpperCase();
        return {
          cnpj: (cfg.cnpj || this.config.cnpj).replace(/\D/g, '') || this.config.cnpj,
          razaoSocial: cfg.razao_social || cfg.nome_loja || this.config.razaoSocial,
          nomeFantasia: cfg.nome_loja || cfg.razao_social || this.config.nomeFantasia,
          inscricaoEstadual: cfg.inscricao_estadual || this.config.inscricaoEstadual || '123456789110',
          uf,
          codigoUf: this.obterCodigoUf(uf),
          ambiente: (cfg.comportamento_fiscal_pdv === 'SEMPRE' ? '1' : '2') as '1' | '2',
          serieNfce: Number(cfg.serie_nfce) || this.config.serieNfce || 1,
          crt: cfg.crt || 1,
          codigoMunicipioIbge: cfg.codigo_municipio_ibge || '3509601',
          logradouro: cfg.logradouro || 'Rua Principal',
          numero: cfg.numero || 'S/N',
          bairro: cfg.bairro || 'Centro',
          cidade: cfg.cidade || 'Sao Paulo',
          cep: cfg.cep || '00000000',
          telefone: cfg.telefone || '11999999999',
          tokenCsc: cfg.token_csc || '',
          idTokenCsc: cfg.id_token_csc || '',
        };
      }
    } catch {}
    return { ...this.config };
  }

  public emitirNfce(vendaId: string, forcarContingencia = true): DocumentoFiscalRecord {
    const docExistente = this.fiscalRepo.obterDocumentoFiscalPorVenda(vendaId);
    if (docExistente) return docExistente;

    const venda = this.operacaoRepo.obterVendaPorId(vendaId);
    if (!venda) {
      throw new Error(`Venda ${vendaId} não encontrada para emissão fiscal`);
    }

    const cfgEmit = this.obterConfigAtual();
    const serie = cfgEmit.serieNfce;
    const ultimoNumeroBanco = this.fiscalRepo.obterUltimoNumeroNfce(serie);
    const cfgLoja = this.configLojaRepo.obter();
    const proximoConfigurado = Number(cfgLoja.proximo_numero_nfce) || 1;
    const proximoNumero = Math.max(ultimoNumeroBanco + 1, proximoConfigurado);
    const tpEmis = forcarContingencia ? '9' : '1';
    const status = forcarContingencia ? 'EMITIDA_CONTINGENCIA' : 'AUTORIZADA';

    const dataEmissao = new Date();
    const chaveAcesso = this.gerarChaveAcesso(dataEmissao, proximoNumero, serie, tpEmis, cfgEmit);

    // Monta XML NFC-e 4.00 com todos os dados fiscais
    const xmlBruto = NfceXmlBuilder.montarXml(venda, proximoNumero, serie, chaveAcesso, tpEmis, dataEmissao, cfgEmit);

    // Assina digitalmente o XML com o Certificado Digital A1 ativo (se houver)
    const xmlAssinado = this.xmlSigner.assinarNfceXml(xmlBruto, chaveAcesso);

    const doc = this.fiscalRepo.salvarDocumentoFiscal({
      id: crypto.randomUUID(),
      venda_id: vendaId,
      numero: proximoNumero,
      serie,
      modelo: '65',
      chave_acesso: chaveAcesso,
      tp_emis: tpEmis,
      status,
      xml_conteudo: xmlAssinado,
      protocolo_autorizacao: forcarContingencia ? null : `135${Date.now()}`,
      motivo_contingencia: forcarContingencia ? 'Emissão off-line por indisponibilidade momentânea' : null,
    });

    this.operacaoRepo.registrarLogAuditoria(
      'EMISSAO_NFCE',
      `NFC-e #${proximoNumero} emitida (Série ${serie}, Mod 65, tpEmis ${tpEmis}). Chave: ${chaveAcesso}`,
      venda.operador_id
    );

    try {
      this.configLojaRepo.salvar({ ...cfgLoja, proximo_numero_nfce: proximoNumero + 1 });
    } catch {}

    return doc;
  }

  public gerarChaveAcesso(
    data: Date,
    numeroNf: number,
    serie: number,
    tpEmis: string,
    cfgCustom?: EmpresaEmitenteCompleta
  ): string {
    const cfg = cfgCustom || this.obterConfigAtual();
    const aamm = `${String(data.getFullYear()).slice(-2)}${String(data.getMonth() + 1).padStart(2, '0')}`;
    const cnpjLimpo = (cfg.cnpj || '12345678000195').replace(/\D/g, '').padStart(14, '0');
    const modelo = '65';
    const serieFmt = String(serie).padStart(3, '0');
    const numeroFmt = String(numeroNf).padStart(9, '0');
    const codigoAleatorio = String(Math.floor(10000000 + Math.random() * 90000000));

    const chaveSemDv = `${cfg.codigoUf}${aamm}${cnpjLimpo}${modelo}${serieFmt}${numeroFmt}${tpEmis}${codigoAleatorio}`;
    const dv = this.calcularDigitoVerificador(chaveSemDv);

    return `${chaveSemDv}${dv}`;
  }

  private calcularDigitoVerificador(chave43: string): number {
    let multiplicador = 2;
    let soma = 0;
    for (let i = chave43.length - 1; i >= 0; i--) {
      soma += parseInt(chave43[i], 10) * multiplicador;
      multiplicador = multiplicador === 9 ? 2 : multiplicador + 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  private obterCodigoUf(uf: string): string {
    const map: Record<string, string> = {
      AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32',
      GO: '52', MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41',
      PE: '26', PI: '22', RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42',
      SP: '35', SE: '28', TO: '17',
    };
    return map[uf.toUpperCase()] || '35';
  }

  public cancelarNfce(vendaId: string, motivo: string, operadorId: string): void {
    const doc = this.fiscalRepo.obterDocumentoFiscalPorVenda(vendaId);
    if (doc) {
      this.fiscalRepo.cancelarDocumentoFiscal(vendaId, motivo);
    }
    this.operacaoRepo.cancelarVenda(vendaId, motivo, operadorId);
    this.operacaoRepo.registrarLogAuditoria(
      'CANCELAMENTO_NFCE',
      `Cancelamento fiscal da venda ${vendaId}. Motivo: ${motivo}`,
      operadorId
    );
  }
}
