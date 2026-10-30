import { EmpresaEmitenteCompleta } from './NfceXmlBuilder.js';
import { EmitirNfePayload } from './NfeDanfeBuilderService.js';

export class DanfeHtmlRenderer {
  private static gerarSvgBarcode128(chave: string): string {
    const digits = chave.replace(/\D/g, '').padEnd(44, '0');
    let bars = '';
    let x = 10;
    for (let i = 0; i < digits.length; i++) {
      const d = parseInt(digits[i], 10);
      const w1 = (d % 3) + 1.5;
      const w2 = ((d + 1) % 2) + 1;
      bars += `<rect x="${x}" y="4" width="${w1}" height="42" fill="#000" />`;
      x += w1 + 1.5;
      bars += `<rect x="${x}" y="4" width="${w2}" height="42" fill="#000" />`;
      x += w2 + 2;
    }
    return `<svg viewBox="0 0 ${Math.ceil(x + 10)} 50" width="100%" height="46" preserveAspectRatio="none">${bars}</svg>`;
  }

  private static fmtDoc(doc?: string): string {
    const d = (doc || '').replace(/\D/g, '');
    if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return doc || '';
  }

  private static fmtMoeda(v?: number): string {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  public static renderizarA4(
    payload: EmitirNfePayload,
    numero: number,
    serie: number,
    chave: string,
    protocolo: string,
    dataEmissao: Date,
    emit: EmpresaEmitenteCompleta,
    totais: { vProd: number; vFrete: number; vSeg: number; vDesc: number; vOutro: number; vICMS: number; vIPI: number; vNF: number },
    status: string = 'AUTORIZADA'
  ): string {
    const chaveFmt = chave.replace(/(\d{4})/g, '$1 ').trim();
    const numFmt = String(numero).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    const dataStr = dataEmissao.toLocaleDateString('pt-BR');
    const horaStr = dataEmissao.toLocaleTimeString('pt-BR');
    const dest = payload.destinatario;
    const transp = payload.transporte || { modalidade_frete: '9' };
    const freteMap: Record<string, string> = {
      '0': '0 - Emitente (CIF)',
      '1': '1 - Destinatário (FOB)',
      '2': '2 - Terceiros',
      '9': '9 - Sem Ocorrência de Transporte',
    };

    const linhasItens = payload.itens
      .map(
        (it, i) => `
      <tr>
        <td class="c">${it.codigo || i + 1}</td>
        <td>${it.descricao}</td>
        <td class="c">${it.ncm || '00000000'}</td>
        <td class="c">${it.cst_csosn || '102'}</td>
        <td class="c">${it.cfop || '5102'}</td>
        <td class="c">${it.unidade || 'UN'}</td>
        <td class="r">${Number(it.quantidade).toFixed(2)}</td>
        <td class="r">${this.fmtMoeda(it.valor_unitario)}</td>
        <td class="r">${this.fmtMoeda(it.desconto || 0)}</td>
        <td class="r"><b>${this.fmtMoeda(it.subtotal)}</b></td>
        <td class="r">${this.fmtMoeda(it.valor_icms ? it.subtotal : 0)}</td>
        <td class="r">${this.fmtMoeda(it.valor_icms || 0)}</td>
        <td class="r">${this.fmtMoeda(it.valor_ipi || 0)}</td>
        <td class="r">${Number(it.aliquota_icms || 0).toFixed(1)}%</td>
      </tr>`
      )
      .join('');

    const tarjaCancelada =
      status === 'CANCELADA'
        ? `<div style="position:fixed;top:40%;left:10%;right:10%;text-align:center;font-size:48px;font-weight:900;color:rgba(220,38,38,0.28);border:6px solid rgba(220,38,38,0.28);padding:16px;transform:rotate(-18deg);pointer-events:none;z-index:99;">NF-e CANCELADA</div>`
        : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>DANFE NF-e Nº ${numFmt} - ${dest.nome}</title>
<style>
  @page { size: A4 portrait; margin: 7mm; }
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #000; }
  body { margin: 0; padding: 10px; background: #fff; font-size: 9px; }
  .box { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .lbl { font-size: 6.5px; text-transform: uppercase; color: #222; display: block; margin-bottom: 1px; font-weight: bold; }
  .val { font-size: 9.5px; font-weight: bold; display: block; min-height: 11px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .sec-title { font-size: 7.5px; font-weight: 900; text-transform: uppercase; margin: 4px 0 2px 0; letter-spacing: 0.4px; }
  .items th { border: 1px solid #000; background: #f1f5f9; font-size: 7px; padding: 3px; text-align: center; }
  .items td { border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px dotted #ccc; padding: 3px 4px; font-size: 8px; }
  .items tr:last-child td { border-bottom: 1px solid #000; }
  .c { text-align: center; }
  .r { text-align: right; }
  .dashed { border-top: 1px dashed #000; margin: 6px 0; }
</style>
</head>
<body>
${tarjaCancelada}
<table>
  <tr>
    <td class="box" colspan="2" style="width:78%;">
      <span class="lbl">RECEBEMOS DE ${emit.razaoSocial} OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA AO LADO</span>
      <span class="val" style="font-size:8px;font-weight:normal;">Emissão: ${dataStr} — Destinatário: <b>${dest.nome}</b> — Valor Total: <b>R$ ${this.fmtMoeda(totais.vNF)}</b></span>
    </td>
    <td class="box c" rowspan="2" style="width:22%;vertical-align:middle;">
      <div style="font-size:12px;font-weight:900;">NF-e</div>
      <div style="font-size:10px;font-weight:bold;">Nº ${numFmt}</div>
      <div style="font-size:9px;">SÉRIE ${serie}</div>
    </td>
  </tr>
  <tr>
    <td class="box" style="width:22%;"><span class="lbl">DATA DE RECEBIMENTO</span><span class="val">&nbsp;</span></td>
    <td class="box" style="width:56%;"><span class="lbl">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span><span class="val">&nbsp;</span></td>
  </tr>
</table>

<div class="dashed"></div>

<table>
  <tr>
    <td class="box" style="width:40%;">
      <div style="font-size:12px;font-weight:900;margin-bottom:3px;">${emit.nomeFantasia || emit.razaoSocial}</div>
      <div style="font-size:8.5px;font-weight:bold;">${emit.razaoSocial}</div>
      <div style="font-size:8px;margin-top:4px;">
        ${emit.logradouro || 'RUA PRINCIPAL'}, ${emit.numero || 'S/N'} - ${emit.bairro || 'CENTRO'}<br/>
        ${emit.cidade || 'SÃO PAULO'} / ${emit.uf || 'SP'} - CEP: ${emit.cep || '00000-000'}<br/>
        Fone: ${emit.telefone || '-'}
      </div>
    </td>
    <td class="box c" style="width:18%;">
      <div style="font-size:15px;font-weight:900;">DANFE</div>
      <div style="font-size:7px;line-height:1.1;">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
      <div style="margin:5px 0;font-size:8px;">
        0 - ENTRADA<br/>1 - SAÍDA &nbsp; <span style="border:1px solid #000;padding:1px 5px;font-weight:900;">${payload.tipo_operacao || '1'}</span>
      </div>
      <div style="font-size:10px;font-weight:900;">Nº ${numFmt}</div>
      <div style="font-size:8.5px;font-weight:bold;">SÉRIE ${serie} — FOLHA 1/1</div>
    </td>
    <td class="box" style="width:42%;">
      <div style="text-align:center;">${this.gerarSvgBarcode128(chave)}</div>
      <span class="lbl" style="margin-top:2px;">CHAVE DE ACESSO</span>
      <span class="val" style="font-family:monospace;font-size:9px;letter-spacing:0.3px;text-align:center;">${chaveFmt}</span>
      <div style="font-size:7px;text-align:center;margin-top:3px;">Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal</div>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td class="box" style="width:58%;"><span class="lbl">NATUREZA DA OPERAÇÃO</span><span class="val">${payload.natureza_operacao}</span></td>
    <td class="box" style="width:42%;"><span class="lbl">PROTOCOLO DE AUTORIZAÇÃO DE USO</span><span class="val">${protocolo} - ${dataStr} ${horaStr}</span></td>
  </tr>
</table>

<table>
  <tr>
    <td class="box" style="width:34%;"><span class="lbl">INSCRIÇÃO ESTADUAL</span><span class="val">${emit.inscricaoEstadual || 'ISENTO'}</span></td>
    <td class="box" style="width:33%;"><span class="lbl">INSCRIÇÃO ESTADUAL DO SUBST. TRIBUTÁRIO</span><span class="val">-</span></td>
    <td class="box" style="width:33%;"><span class="lbl">CNPJ / CPF EMITENTE</span><span class="val">${this.fmtDoc(emit.cnpj)}</span></td>
  </tr>
</table>

<div class="sec-title">DESTINATÁRIO / REMETENTE</div>
<table>
  <tr>
    <td class="box" style="width:58%;"><span class="lbl">NOME / RAZÃO SOCIAL</span><span class="val">${dest.nome}</span></td>
    <td class="box" style="width:26%;"><span class="lbl">CNPJ / CPF</span><span class="val">${this.fmtDoc(dest.documento)}</span></td>
    <td class="box" style="width:16%;"><span class="lbl">DATA DA EMISSÃO</span><span class="val">${dataStr}</span></td>
  </tr>
  <tr>
    <td class="box"><span class="lbl">ENDEREÇO</span><span class="val">${dest.logradouro || 'NÃO INFORMADO'}, ${dest.numero || 'S/N'}</span></td>
    <td class="box"><span class="lbl">BAIRRO / DISTRITO</span><span class="val">${dest.bairro || 'CENTRO'}</span></td>
    <td class="box"><span class="lbl">CEP</span><span class="val">${dest.cep || '00000-000'}</span></td>
  </tr>
  <tr>
    <td class="box"><span class="lbl">MUNICÍPIO</span><span class="val">${dest.cidade || emit.cidade || 'SÃO PAULO'} - ${dest.uf || emit.uf || 'SP'}</span></td>
    <td class="box"><span class="lbl">INSCRIÇÃO ESTADUAL</span><span class="val">${dest.ie || 'ISENTO'}</span></td>
    <td class="box"><span class="lbl">HORA DA SAÍDA</span><span class="val">${horaStr}</span></td>
  </tr>
</table>

<div class="sec-title">CÁLCULO DO IMPOSTO</div>
<table>
  <tr>
    <td class="box r"><span class="lbl">BASE DE CÁLC. ICMS</span><span class="val">${this.fmtMoeda(totais.vICMS > 0 ? totais.vProd : 0)}</span></td>
    <td class="box r"><span class="lbl">VALOR DO ICMS</span><span class="val">${this.fmtMoeda(totais.vICMS)}</span></td>
    <td class="box r"><span class="lbl">VALOR DO FRETE</span><span class="val">${this.fmtMoeda(totais.vFrete)}</span></td>
    <td class="box r"><span class="lbl">VALOR DO SEGURO</span><span class="val">${this.fmtMoeda(totais.vSeg)}</span></td>
    <td class="box r"><span class="lbl">DESCONTO</span><span class="val">${this.fmtMoeda(totais.vDesc)}</span></td>
    <td class="box r"><span class="lbl">OUTRAS DESPESAS</span><span class="val">${this.fmtMoeda(totais.vOutro)}</span></td>
    <td class="box r"><span class="lbl">VALOR DO IPI</span><span class="val">${this.fmtMoeda(totais.vIPI)}</span></td>
    <td class="box r"><span class="lbl">VALOR DOS PRODUTOS</span><span class="val">${this.fmtMoeda(totais.vProd)}</span></td>
    <td class="box r" style="background:#f8fafc;"><span class="lbl">VALOR TOTAL DA NOTA</span><span class="val" style="font-size:11px;">R$ ${this.fmtMoeda(totais.vNF)}</span></td>
  </tr>
</table>

<div class="sec-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
<table>
  <tr>
    <td class="box" style="width:36%;"><span class="lbl">NOME / RAZÃO SOCIAL</span><span class="val">${transp.transportadora_nome || 'O PRÓPRIO'}</span></td>
    <td class="box" style="width:22%;"><span class="lbl">FRETE POR CONTA</span><span class="val">${freteMap[transp.modalidade_frete] || '9 - Sem Frete'}</span></td>
    <td class="box" style="width:14%;"><span class="lbl">PLACA DO VEÍCULO</span><span class="val">${transp.placa_veiculo || '-'} ${transp.uf_veiculo || ''}</span></td>
    <td class="box" style="width:14%;"><span class="lbl">VOLUMES / ESPÉCIE</span><span class="val">${transp.volumes_qtd || 1} / ${transp.especie || 'CAIXA'}</span></td>
    <td class="box r" style="width:14%;"><span class="lbl">PESO BRUTO / LÍQ. (KG)</span><span class="val">${Number(transp.peso_bruto || 0).toFixed(2)} / ${Number(transp.peso_liquido || 0).toFixed(2)}</span></td>
  </tr>
</table>

<div class="sec-title">DADOS DOS PRODUTOS / SERVIÇOS</div>
<table class="items">
  <thead>
    <tr>
      <th>CÓD.</th><th>DESCRIÇÃO DO PRODUTO / SERVIÇO</th><th>NCM/SH</th><th>CSOSN/CST</th><th>CFOP</th><th>UN</th><th>QTD</th><th>VL. UNIT</th><th>DESC.</th><th>VL. TOTAL</th><th>B.CÁLC ICMS</th><th>VL. ICMS</th><th>VL. IPI</th><th>ALÍQ. ICMS</th>
    </tr>
  </thead>
  <tbody>${linhasItens}</tbody>
</table>

<div class="sec-title">DADOS ADICIONAIS</div>
<table>
  <tr>
    <td class="box" style="width:65%;min-height:55px;">
      <span class="lbl">INFORMAÇÕES COMPLEMENTARES</span>
      <span class="val" style="font-weight:normal;font-size:8px;line-height:1.35;">
        Forma de Pagamento: ${payload.forma_pagamento || 'À VISTA'} | Documento emitido por ME ou EPP optante pelo Simples Nacional (ou conforme CRT configurado).<br/>
        ${payload.informacoes_complementares || ''}
      </span>
    </td>
    <td class="box" style="width:35%;min-height:55px;">
      <span class="lbl">RESERVADO AO FISCO</span>
      <span class="val" style="font-size:7.5px;font-weight:normal;">Sistema ClickStorm ERP Local — Emissão Embarcada</span>
    </td>
  </tr>
</table>
</body>
</html>`;
  }
}
