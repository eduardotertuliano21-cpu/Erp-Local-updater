import crypto from 'node:crypto';
import { VendaComDetalhesRecord } from '../repositories/IOperacaoRepository.js';

export interface EmpresaEmitenteCompleta {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  uf: string;
  codigoUf: string;
  ambiente: '1' | '2';
  serieNfce: number;
  crt?: number;
  codigoMunicipioIbge?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  telefone?: string;
  tokenCsc?: string;
  idTokenCsc?: string;
}

export class NfceXmlBuilder {
  public static montarXml(
    venda: VendaComDetalhesRecord,
    numero: number,
    serie: number,
    chave: string,
    tpEmis: string,
    data: Date,
    config: EmpresaEmitenteCompleta
  ): string {
    const isoDate = data.toISOString().split('.')[0] + '-03:00';
    const cMun = config.codigoMunicipioIbge || '3509601';
    const cnpjEmit = (config.cnpj || '12345678000195').replace(/\D/g, '').padStart(14, '0');
    const cDV = chave.slice(-1);
    const cNF = chave.slice(35, 43);

    // Destinatário
    let destXml = '';
    if (venda.cpf_cliente) {
      const docLimpo = venda.cpf_cliente.replace(/\D/g, '');
      if (docLimpo.length === 11) {
        destXml = `<dest><CPF>${docLimpo}</CPF><indIEDest>9</indIEDest></dest>`;
      } else if (docLimpo.length === 14) {
        destXml = `<dest><CNPJ>${docLimpo}</CNPJ><indIEDest>9</indIEDest></dest>`;
      }
    }

    // Itens
    let itensXml = '';
    venda.itens.forEach((item, idx) => {
      const nItem = idx + 1;
      const cProd = this.escapeXml(item.produto_id.slice(0, 14));
      const rawBarcode = (item.codigo_barras || '').trim();
      const isValidGtin = /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(rawBarcode);
      const cEAN = isValidGtin ? rawBarcode : 'SEM GTIN';
      const xProd = this.escapeXml(item.descricao.slice(0, 120));
      const ncm = (item.ncm || '22021000').replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
      const cfop = item.cfop || (item.cst_csosn === '500' ? '5405' : '5102');
      const uCom = (item.unidade_medida || 'UN').toUpperCase().slice(0, 6);
      const qCom = item.quantidade.toFixed(4);
      const vUnCom = item.preco_unitario.toFixed(4);
      const vProd = (item.preco_unitario * item.quantidade).toFixed(2);
      const cestTag = item.cest ? `<CEST>${item.cest.replace(/\D/g, '').padEnd(7, '0').slice(0, 7)}</CEST>` : '';
      const vDescTag = item.desconto > 0 ? `<vDesc>${item.desconto.toFixed(2)}</vDesc>` : '';
      const csosn = item.cst_csosn || '102';
      const orig = item.origem !== undefined ? item.origem : 0;

      let icmsTag = `<ICMSSN102><orig>${orig}</orig><CSOSN>${csosn}</CSOSN></ICMSSN102>`;
      if (csosn === '500') {
        icmsTag = `<ICMSSN500><orig>${orig}</orig><CSOSN>500</CSOSN><vBCSTRet>0.00</vBCSTRet><vICMSSTRet>0.00</vICMSSTRet></ICMSSN500>`;
      }

      itensXml += `
      <det nItem="${nItem}">
        <prod>
          <cProd>${cProd}</cProd>
          <cEAN>${cEAN}</cEAN>
          <xProd>${xProd}</xProd>
          <NCM>${ncm}</NCM>
          ${cestTag}
          <CFOP>${cfop}</CFOP>
          <uCom>${uCom}</uCom>
          <qCom>${qCom}</qCom>
          <vUnCom>${vUnCom}</vUnCom>
          <vProd>${vProd}</vProd>
          <cEANTrib>${cEAN}</cEANTrib>
          <uTrib>${uCom}</uTrib>
          <qTrib>${qCom}</qTrib>
          <vUnTrib>${vUnCom}</vUnTrib>
          ${vDescTag}
          <indTot>1</indTot>
        </prod>
        <imposto>
          <vTotTrib>${(item.subtotal * 0.18).toFixed(2)}</vTotTrib>
          <ICMS>${icmsTag}</ICMS>
          <PIS><PISSN><CST>49</CST></PISSN></PIS>
          <COFINS><COFINSSN><CST>49</CST></COFINSSN></COFINS>
        </imposto>
      </det>`;
    });

    // Formas de Pagamento
    let detPagXml = '';
    venda.pagamentos.forEach((pag) => {
      let tPag = '99';
      const m = pag.metodo.toUpperCase();
      if (m === 'DINHEIRO') tPag = '01';
      else if (m === 'CARTAO_CREDITO') tPag = '03';
      else if (m === 'CARTAO_DEBITO') tPag = '04';
      else if (m === 'PIX') tPag = '17';
      else if (m === 'CONVENIO') tPag = '05';

      let cardXml = '';
      if (tPag === '03' || tPag === '04') {
        cardXml = `<card><tpIntegra>1</tpIntegra></card>`;
      }
      detPagXml += `
      <detPag>
        <indPag>0</indPag>
        <tPag>${tPag}</tPag>
        <vPag>${pag.valor.toFixed(2)}</vPag>
        ${cardXml}
      </detPag>`;
    });

    // QR-Code SEFAZ NFC-e Versão 2.00
    const qrUrl = this.gerarUrlQrCode(chave, config);

    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chave}" versao="4.00">
    <ide>
      <cUF>${config.codigoUf}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>VENDA A CONSUMIDOR</natOp>
      <mod>65</mod>
      <serie>${serie}</serie>
      <nNF>${numero}</nNF>
      <dhEmi>${isoDate}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${cMun}</cMunFG>
      <tpImp>4</tpImp>
      <tpEmis>${tpEmis}</tpEmis>
      <cDV>${cDV}</cDV>
      <tpAmb>${config.ambiente}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      ${tpEmis === '9' ? `<dhCont>${isoDate}</dhCont><xJust>Emissao off-line por indisponibilidade momentanea</xJust>` : ''}
    </ide>
    <emit>
      <CNPJ>${cnpjEmit}</CNPJ>
      <xNome>${this.escapeXml(config.razaoSocial)}</xNome>
      <xFant>${this.escapeXml(config.nomeFantasia)}</xFant>
      <enderEmit>
        <xLgr>${this.escapeXml(config.logradouro || 'Rua Principal')}</xLgr>
        <nro>${this.escapeXml(config.numero || 'S/N')}</nro>
        <xBairro>${this.escapeXml(config.bairro || 'Centro')}</xBairro>
        <cMun>${cMun}</cMun>
        <xMun>${this.escapeXml(config.cidade || 'Sao Paulo')}</xMun>
        <UF>${config.uf || 'SP'}</UF>
        <CEP>${(config.cep || '00000000').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>BRASIL</xPais>
        <fone>${(config.telefone || '11999999999').replace(/\D/g, '')}</fone>
      </enderEmit>
      <IE>${(config.inscricaoEstadual || '123456789110').replace(/\D/g, '')}</IE>
      <CRT>${config.crt || 1}</CRT>
    </emit>
    ${destXml}
    ${itensXml}
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${venda.subtotal.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>${venda.desconto.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>0.00</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${venda.total_liquido.toFixed(2)}</vNF>
        <vTotTrib>${(venda.total_liquido * 0.18).toFixed(2)}</vTotTrib>
      </ICMSTot>
    </total>
    <pag>
      ${detPagXml}
      <vTroco>${venda.troco.toFixed(2)}</vTroco>
    </pag>
  </infNFe>
  <infNFeSupl>
    <qrCode><![CDATA[${qrUrl}]]></qrCode>
    <urlChave>https://www.sefaz.sp.gov.br/nfce/consulta</urlChave>
  </infNFeSupl>
</NFe>`;
  }

  public static gerarUrlQrCode(chave: string, config: EmpresaEmitenteCompleta): string {
    const baseUrl = config.ambiente === '1'
      ? 'https://www.nfce.fazenda.sp.gov.br/qrcode'
      : 'https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode';
    const csc = config.tokenCsc || '0123456789';
    const idCsc = (config.idTokenCsc || '000001').padStart(6, '0');
    const paramsStr = `${chave}|2|${config.ambiente}|${idCsc}`;
    const hash = crypto.createHash('sha1').update(`${paramsStr}${csc}`).digest('hex');
    return `${baseUrl}?p=${paramsStr}|${hash}`;
  }

  private static escapeXml(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
