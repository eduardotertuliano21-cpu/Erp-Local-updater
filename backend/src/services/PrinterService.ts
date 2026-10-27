import { VendaComDetalhesRecord } from '../repositories/IOperacaoRepository.js';
import { DocumentoFiscalRecord } from '../repositories/IFiscalRepository.js';
import { EMITENTE_PADRAO, EmpresaEmitenteConfig } from './FiscalService.js';
import { NfceXmlBuilder } from './NfceXmlBuilder.js';

export interface CupomFormatado {
  textoFormatado: string;
  bytesHexEscPos: string;
  chaveFormatada: string;
}

export class PrinterService {
  public formatarCupomNfce(
    venda: VendaComDetalhesRecord,
    docFiscal: DocumentoFiscalRecord,
    emitenteConfig?: EmpresaEmitenteConfig
  ): CupomFormatado {
    const emit = emitenteConfig || EMITENTE_PADRAO;
    const colunas = 48; // Padrão 80mm
    const divisor = '-'.repeat(colunas);
    const divisorDuplo = '='.repeat(colunas);

    // Formata chave em 11 grupos de 4 dígitos
    const chaveFmt = docFiscal.chave_acesso.replace(/(\d{4})/g, '$1 ').trim();

    const linhas: string[] = [];

    // Cabeçalho Empresa
    linhas.push(this.centralizar(emit.nomeFantasia, colunas));
    linhas.push(this.centralizar(emit.razaoSocial, colunas));
    linhas.push(this.centralizar(`CNPJ: ${this.formatarCnpj(emit.cnpj)}  IE: ${emit.inscricaoEstadual || 'ISENTO'}`, colunas));
    if (emit.logradouro) {
      const endLinha = `${emit.logradouro}, ${emit.numero || 'S/N'} - ${emit.bairro || ''}`;
      linhas.push(this.centralizar(endLinha.slice(0, colunas), colunas));
      linhas.push(this.centralizar(`${emit.cidade || ''}/${emit.uf || 'SP'} - CEP: ${emit.cep || ''}`, colunas));
    }
    linhas.push(divisorDuplo);

    // Identificação do Documento
    linhas.push(this.centralizar('DANFE NFC-e - Documento Auxiliar da', colunas));
    linhas.push(this.centralizar('Nota Fiscal de Consumidor Eletrônica', colunas));

    if (docFiscal.tp_emis === '9') {
      linhas.push(this.centralizar('*** EMITIDA EM CONTINGÊNCIA ***', colunas));
      linhas.push(this.centralizar('Pendente de autorização pelo Fisco', colunas));
    }

    linhas.push(divisor);

    // Itens
    linhas.push('ITEM CÓDIGO         DESCRIÇÃO          QTD  UN  VL.UNIT  TOTAL');
    linhas.push(divisor);

    venda.itens.forEach((item, idx) => {
      const numItem = String(idx + 1).padStart(3, '0');
      const cod = item.codigo_barras.slice(0, 13).padEnd(13, ' ');
      const desc = item.descricao.slice(0, 22).padEnd(22, ' ');
      const un = (item.unidade_medida || 'UN').toUpperCase().slice(0, 3);
      const qtd = un === 'KG' ? item.quantidade.toFixed(3).padStart(6, ' ') : item.quantidade.toFixed(0).padStart(3, ' ');
      const unit = item.preco_unitario.toFixed(2).padStart(6, ' ');
      const tot = item.subtotal.toFixed(2).padStart(7, ' ');

      linhas.push(`${numItem}  ${desc}`);
      linhas.push(`     ${cod} ${qtd} ${un} X ${unit} = R$ ${tot}`);
    });

    linhas.push(divisor);

    // Totais
    linhas.push(this.alinharDuasColunas(`QTD. TOTAL DE ITENS`, String(venda.itens.length), colunas));
    linhas.push(this.alinharDuasColunas(`VALOR SUBTOTAL`, `R$ ${venda.subtotal.toFixed(2)}`, colunas));
    if (venda.desconto > 0) {
      linhas.push(this.alinharDuasColunas(`DESCONTOS`, `- R$ ${venda.desconto.toFixed(2)}`, colunas));
    }
    linhas.push(divisorDuplo);
    linhas.push(this.alinharDuasColunas(`VALOR A PAGAR R$`, `R$ ${venda.total_liquido.toFixed(2)}`, colunas));
    linhas.push(divisorDuplo);

    // Formas de Pagamento
    linhas.push('FORMA DE PAGAMENTO                          VALOR PAGO');
    venda.pagamentos.forEach((pag) => {
      linhas.push(this.alinharDuasColunas(pag.metodo, `R$ ${pag.valor.toFixed(2)}`, colunas));
    });

    if (venda.troco > 0) {
      linhas.push(this.alinharDuasColunas('TROCO', `R$ ${venda.troco.toFixed(2)}`, colunas));
    }

    linhas.push(divisor);

    // Dados Fiscais e Chave de Acesso
    linhas.push(this.centralizar(`NFC-e Nº ${String(docFiscal.numero).padStart(9, '0')} Série ${docFiscal.serie}`, colunas));
    linhas.push(this.centralizar(`Data Emissão: ${new Date(docFiscal.emitido_em).toLocaleString('pt-BR')}`, colunas));
    linhas.push(this.centralizar('CHAVE DE ACESSO', colunas));
    linhas.push(this.centralizar(chaveFmt, colunas));
    linhas.push(divisor);

    // Identificação do Consumidor
    if (venda.cpf_cliente) {
      linhas.push(this.centralizar(`CONSUMIDOR CPF/CNPJ: ${venda.cpf_cliente}`, colunas));
    } else {
      linhas.push(this.centralizar('CONSUMIDOR NÃO IDENTIFICADO', colunas));
    }

    linhas.push(divisor);
    linhas.push(this.centralizar('Consulta via leitor de QR Code no cupom', colunas));
    linhas.push(this.centralizar('Tributos Totais (Lei 12.741/2012):', colunas));
    const aproxTributos = (venda.total_liquido * 0.18).toFixed(2);
    linhas.push(this.centralizar(`Federal R$ ${(venda.total_liquido * 0.05).toFixed(2)} | Estadual R$ ${aproxTributos}`, colunas));
    linhas.push(divisor);
    linhas.push(this.centralizar('Sistema ClickStorm PDV Local-First', colunas));
    linhas.push('\n');

    const textoFormatado = linhas.join('\n');

    // Comandos ESC/POS binários em HEX:
    // Init + Pulso Gaveta + Texto
    const initCmd = '1b40';
    const drawerCmd = '1b700019fa';
    const textHex = Buffer.from(textoFormatado, 'latin1').toString('hex');

    // Comandos ESC/POS para plotagem gráfica de QR Code (Model 2)
    const qrData = NfceXmlBuilder.gerarUrlQrCode(docFiscal.chave_acesso, emit as any);
    const qrDataBuf = Buffer.from(qrData, 'ascii');
    const pL = (qrDataBuf.length + 3) & 0xff;
    const pH = ((qrDataBuf.length + 3) >> 8) & 0xff;
    const qrInitHex = '1b61011d286b0400314132001d286b03003143041d286b0300314530';
    const qrHeader = Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
    const qrStoreHex = Buffer.concat([qrHeader, qrDataBuf]).toString('hex');
    const qrPrintHex = '1d286b03003151300a0a0a0a1b6100';
    const cutCmd = '1d5600';

    const bytesHexEscPos = `${initCmd}${drawerCmd}${textHex}${qrInitHex}${qrStoreHex}${qrPrintHex}${cutCmd}`;

    return {
      textoFormatado,
      bytesHexEscPos,
      chaveFormatada: chaveFmt,
    };
  }

  private centralizar(texto: string, largura: number): string {
    if (texto.length >= largura) return texto;
    const espacos = Math.max(0, Math.floor((largura - texto.length) / 2));
    return ' '.repeat(espacos) + texto;
  }

  private alinharDuasColunas(col1: string, col2: string, largura: number): string {
    const espacos = Math.max(1, largura - col1.length - col2.length);
    return col1 + ' '.repeat(espacos) + col2;
  }

  private formatarCnpj(cnpj: string): string {
    const c = cnpj.replace(/\D/g, '');
    if (c.length === 11) return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
