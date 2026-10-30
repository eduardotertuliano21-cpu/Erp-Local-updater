import { EmpresaEmitenteCompleta } from './NfceXmlBuilder.js';

export interface ItemNfeInput {
  produto_id?: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  cst_csosn: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  desconto?: number;
  subtotal: number;
  aliquota_icms?: number;
  valor_icms?: number;
  aliquota_ipi?: number;
  valor_ipi?: number;
}

export interface DestinatarioNfeInput {
  documento: string;
  nome: string;
  ie?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  codigo_ibge?: string;
}

export interface TransporteNfeInput {
  modalidade_frete: '0' | '1' | '2' | '9'; // 0=Emitente(CIF), 1=Destinatario(FOB), 2=Terceiros, 9=Sem Frete
  transportadora_nome?: string;
  transportadora_documento?: string;
  placa_veiculo?: string;
  uf_veiculo?: string;
  volumes_qtd?: number;
  especie?: string;
  peso_bruto?: number;
  peso_liquido?: number;
}

export interface EmitirNfePayload {
  serie?: number;
  natureza_operacao: string;
  tipo_operacao: '0' | '1'; // 0=Entrada, 1=Saida
  finalidade: '1' | '2' | '3' | '4'; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolucao
  destinatario: DestinatarioNfeInput;
  itens: ItemNfeInput[];
  transporte?: TransporteNfeInput;
  forma_pagamento?: string;
  meio_pagamento?: string;
  parcelas?: number;
  valor_frete?: number;
  valor_seguro?: number;
  valor_desconto?: number;
  valor_outras_despesas?: number;
  informacoes_complementares?: string;
  baixar_estoque?: boolean;
  operador_id?: string;
}

export class NfeDanfeBuilderService {
  public static gerarChaveAcessoMod55(
    cUF: string,
    dataEmissao: Date,
    cnpj: string,
    serie: number,
    numero: number,
    tpEmis: string
  ): string {
    const yy = String(dataEmissao.getFullYear()).slice(-2);
    const mm = String(dataEmissao.getMonth() + 1).padStart(2, '0');
    const aamm = `${yy}${mm}`;
    const cnpjLimpo = (cnpj || '00000000000191').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
    const mod = '55';
    const seriePad = String(serie).padStart(3, '0');
    const nNFPad = String(numero).padStart(9, '0');
    const cNF = String(Math.floor(10000000 + Math.random() * 90000000));
    const chave43 = `${cUF.padStart(2, '0')}${aamm}${cnpjLimpo}${mod}${seriePad}${nNFPad}${tpEmis}${cNF}`;
    return `${chave43}${this.calcularModulo11(chave43)}`;
  }

  private static calcularModulo11(chave43: string): number {
    let peso = 2;
    let soma = 0;
    for (let i = chave43.length - 1; i >= 0; i--) {
      soma += parseInt(chave43[i], 10) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto === 0 || resto === 1 ? 0 : 11 - resto;
  }

  public static montarXmlNfe55(
    payload: EmitirNfePayload,
    numero: number,
    serie: number,
    chave: string,
    data: Date,
    emit: EmpresaEmitenteCompleta,
    totais: { vProd: number; vFrete: number; vSeg: number; vDesc: number; vOutro: number; vICMS: number; vIPI: number; vNF: number }
  ): string {
    const isoDate = data.toISOString().split('.')[0] + '-03:00';
    const cMunEmit = emit.codigoMunicipioIbge || '3550308';
    const cnpjEmit = (emit.cnpj || '00000000000191').replace(/\D/g, '').padStart(14, '0');
    const docDest = (payload.destinatario.documento || '').replace(/\D/g, '');
    const tagDocDest = docDest.length === 14 ? `<CNPJ>${docDest}</CNPJ>` : `<CPF>${docDest.padStart(11, '0')}</CPF>`;
    const ieDest = (payload.destinatario.ie || '').replace(/\D/g, '');
    const indIEDest = ieDest ? '1' : '9';

    let itensXml = '';
    payload.itens.forEach((it, idx) => {
      const ncm = (it.ncm || '00000000').replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
      const cfop = (it.cfop || '5102').replace(/\D/g, '').slice(0, 4);
      const csosn = (it.cst_csosn || '102').trim();
      const vProd = (it.quantidade * it.valor_unitario).toFixed(2);
      const vDescTag = it.desconto && it.desconto > 0 ? `<vDesc>${it.desconto.toFixed(2)}</vDesc>` : '';
      itensXml += `
      <det nItem="${idx + 1}">
        <prod>
          <cProd>${this.esc(it.codigo || String(idx + 1))}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${this.esc(it.descricao)}</xProd>
          <NCM>${ncm}</NCM>
          <CFOP>${cfop}</CFOP>
          <uCom>${this.esc(it.unidade || 'UN')}</uCom>
          <qCom>${it.quantidade.toFixed(4)}</qCom>
          <vUnCom>${it.valor_unitario.toFixed(4)}</vUnCom>
          <vProd>${vProd}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>${this.esc(it.unidade || 'UN')}</uTrib>
          <qTrib>${it.quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${it.valor_unitario.toFixed(4)}</vUnTrib>
          ${vDescTag}
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS><ICMSSN102><orig>0</orig><CSOSN>${csosn}</CSOSN></ICMSSN102></ICMS>
          <PIS><PISSN><CST>49</CST></PISSN></PIS>
          <COFINS><COFINSSN><CST>49</CST></COFINSSN></COFINS>
        </imposto>
      </det>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chave}" versao="4.00">
    <ide>
      <cUF>${emit.codigoUf || '35'}</cUF>
      <cNF>${chave.slice(35, 43)}</cNF>
      <natOp>${this.esc(payload.natureza_operacao)}</natOp>
      <mod>55</mod>
      <serie>${serie}</serie>
      <nNF>${numero}</nNF>
      <dhEmi>${isoDate}</dhEmi>
      <dhSaiEnt>${isoDate}</dhSaiEnt>
      <tpNF>${payload.tipo_operacao || '1'}</tpNF>
      <idDest>1</idDest>
      <cMunFG>${cMunEmit}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chave.slice(-1)}</cDV>
      <tpAmb>${emit.ambiente || '2'}</tpAmb>
      <finNFe>${payload.finalidade || '1'}</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
    </ide>
    <emit>
      <CNPJ>${cnpjEmit}</CNPJ>
      <xNome>${this.esc(emit.razaoSocial)}</xNome>
      <xFant>${this.esc(emit.nomeFantasia)}</xFant>
      <enderEmit>
        <xLgr>${this.esc(emit.logradouro || 'RUA PRINCIPAL')}</xLgr>
        <nro>${this.esc(emit.numero || 'S/N')}</nro>
        <xBairro>${this.esc(emit.bairro || 'CENTRO')}</xBairro>
        <cMun>${cMunEmit}</cMun>
        <xMun>${this.esc(emit.cidade || 'SAO PAULO')}</xMun>
        <UF>${emit.uf || 'SP'}</UF>
        <CEP>${(emit.cep || '00000000').replace(/\D/g, '')}</CEP>
      </enderEmit>
      <IE>${(emit.inscricaoEstadual || 'ISENTO').replace(/\D/g, '') || 'ISENTO'}</IE>
      <CRT>${emit.crt || 1}</CRT>
    </emit>
    <dest>
      ${tagDocDest}
      <xNome>${this.esc(payload.destinatario.nome)}</xNome>
      <enderDest>
        <xLgr>${this.esc(payload.destinatario.logradouro || 'NAO INFORMADO')}</xLgr>
        <nro>${this.esc(payload.destinatario.numero || 'S/N')}</nro>
        <xBairro>${this.esc(payload.destinatario.bairro || 'CENTRO')}</xBairro>
        <cMun>${payload.destinatario.codigo_ibge || cMunEmit}</cMun>
        <xMun>${this.esc(payload.destinatario.cidade || emit.cidade || 'SAO PAULO')}</xMun>
        <UF>${this.esc(payload.destinatario.uf || emit.uf || 'SP')}</UF>
        <CEP>${(payload.destinatario.cep || '00000000').replace(/\D/g, '').padStart(8, '0')}</CEP>
      </enderDest>
      <indIEDest>${indIEDest}</indIEDest>
      ${ieDest ? `<IE>${ieDest}</IE>` : ''}
    </dest>
    ${itensXml}
    <total>
      <ICMSTot>
        <vBC>${(totais.vICMS > 0 ? totais.vProd : 0).toFixed(2)}</vBC>
        <vICMS>${totais.vICMS.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${totais.vProd.toFixed(2)}</vProd>
        <vFrete>${totais.vFrete.toFixed(2)}</vFrete>
        <vSeg>${totais.vSeg.toFixed(2)}</vSeg>
        <vDesc>${totais.vDesc.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${totais.vIPI.toFixed(2)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>0.00</vPIS>
        <vCOFINS>0.00</vCOFINS>
        <vOutro>${totais.vOutro.toFixed(2)}</vOutro>
        <vNF>${totais.vNF.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <transp>
      <modFrete>${payload.transporte?.modalidade_frete || '9'}</modFrete>
    </transp>
    <pag>
      <detPag>
        <tPag>${payload.meio_pagamento || '01'}</tPag>
        <vPag>${totais.vNF.toFixed(2)}</vPag>
      </detPag>
    </pag>
    ${payload.informacoes_complementares ? `<infAdic><infCpl>${this.esc(payload.informacoes_complementares)}</infCpl></infAdic>` : ''}
  </infNFe>
</NFe>`;
  }

  public static esc(s?: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
