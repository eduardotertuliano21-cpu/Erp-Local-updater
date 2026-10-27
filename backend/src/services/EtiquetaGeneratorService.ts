export interface DadosEtiqueta {
  descricao: string;
  codigoBarras: string;
  preco: number;
  unidade?: string;
  categoria?: string;
}

export type FormatoEtiqueta = 'GONDOLA' | 'PRECO_SIMPLES' | 'JOIA_DUPLA';
export type LinguagemImpressora = 'ZPL' | 'EPL';

export class EtiquetaGeneratorService {
  public gerarComandos(
    dados: DadosEtiqueta[],
    formato: FormatoEtiqueta,
    linguagem: LinguagemImpressora
  ): string {
    if (linguagem === 'ZPL') {
      return this.gerarZpl(dados, formato);
    }
    return this.gerarEpl(dados, formato);
  }

  private gerarZpl(itens: DadosEtiqueta[], formato: FormatoEtiqueta): string {
    let out = '';
    for (const item of itens) {
      const precoFormatado = `R$ ${item.preco.toFixed(2).replace('.', ',')}`;
      const desc = item.descricao.substring(0, 30);
      const barcode = item.codigoBarras.replace(/\D/g, '').padEnd(13, '0').substring(0, 13);

      if (formato === 'GONDOLA') {
        out += `^XA\n`;
        out += `^CI28\n`;
        out += `^FO30,30^A0N,28,28^FD${desc}^FS\n`;
        out += `^FO30,70^A0N,22,22^FDPRECO POR ${item.unidade || 'UN'}^FS\n`;
        out += `^FO30,105^A0N,65,65^FD${precoFormatado}^FS\n`;
        out += `^FO30,190^BEN,60,Y,N^FD${barcode}^FS\n`;
        out += `^XZ\n`;
      } else if (formato === 'PRECO_SIMPLES') {
        out += `^XA\n`;
        out += `^CI28\n`;
        out += `^FO40,30^A0N,32,32^FD${desc}^FS\n`;
        out += `^FO40,85^A0N,80,80^FD${precoFormatado}^FS\n`;
        out += `^FO40,185^A0N,22,22^FDCod: ${barcode}^FS\n`;
        out += `^XZ\n`;
      } else {
        // JOIA_DUPLA
        out += `^XA\n`;
        out += `^CI28\n`;
        out += `^FO20,20^A0N,18,18^FD${desc.substring(0, 14)}^FS\n`;
        out += `^FO20,45^A0N,28,28^FD${precoFormatado}^FS\n`;
        out += `^FO20,80^BEN,35,N,N^FD${barcode}^FS\n`;
        out += `^FO220,20^A0N,18,18^FD${desc.substring(0, 14)}^FS\n`;
        out += `^FO220,45^A0N,28,28^FD${precoFormatado}^FS\n`;
        out += `^FO220,80^BEN,35,N,N^FD${barcode}^FS\n`;
        out += `^XZ\n`;
      }
    }
    return out;
  }

  private gerarEpl(itens: DadosEtiqueta[], formato: FormatoEtiqueta): string {
    let out = '';
    for (const item of itens) {
      const precoFormatado = `R$ ${item.preco.toFixed(2).replace('.', ',')}`;
      const desc = item.descricao.substring(0, 26);
      const barcode = item.codigoBarras.replace(/\D/g, '').padEnd(13, '0').substring(0, 13);

      out += `N\n`;
      out += `q440\n`;
      out += `Q240,24\n`;

      if (formato === 'GONDOLA') {
        out += `A20,15,0,3,1,1,N,"${desc}"\n`;
        out += `A20,50,0,2,1,1,N,"PRECO POR ${item.unidade || 'UN'}"\n`;
        out += `A20,80,0,5,2,2,N,"${precoFormatado}"\n`;
        out += `B20,160,0,E30,2,4,50,B,"${barcode}"\n`;
      } else if (formato === 'PRECO_SIMPLES') {
        out += `A20,20,0,3,1,1,N,"${desc}"\n`;
        out += `A20,70,0,5,2,2,N,"${precoFormatado}"\n`;
        out += `A20,165,0,2,1,1,N,"Cod: ${barcode}"\n`;
      } else {
        // JOIA_DUPLA
        out += `A10,15,0,2,1,1,N,"${desc.substring(0, 12)}"\n`;
        out += `A10,40,0,4,1,1,N,"${precoFormatado}"\n`;
        out += `B10,80,0,E30,1,2,30,B,"${barcode}"\n`;
        out += `A220,15,0,2,1,1,N,"${desc.substring(0, 12)}"\n`;
        out += `A220,40,0,4,1,1,N,"${precoFormatado}"\n`;
        out += `B220,80,0,E30,1,2,30,B,"${barcode}"\n`;
      }
      out += `P1\n`;
    }
    return out;
  }
}
