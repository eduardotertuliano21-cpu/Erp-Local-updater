import fs from 'node:fs';
import path from 'node:path';
import { getCatalogoReadOnlyDb } from '../config/database.js';

export type MarcaBalancaEtiqueta = 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO';

export interface ExportCargaResult {
  sucesso: boolean;
  marca: MarcaBalancaEtiqueta;
  arquivo: string;
  diretorioDestino?: string;
  caminhoSalvo?: string | null;
  totalItens: number;
  conteudoTxt: string;
  mensagem: string;
  erro?: string;
}

export class CargaBalancaService {
  private static instance: CargaBalancaService;

  public static getInstance(): CargaBalancaService {
    if (!CargaBalancaService.instance) {
      CargaBalancaService.instance = new CargaBalancaService();
    }
    return CargaBalancaService.instance;
  }

  public obterDiretoriosPadrao(): Record<MarcaBalancaEtiqueta, { diretorio: string; arquivo: string; descricao: string }> {
    return {
      TOLEDO: {
        diretorio: process.platform === 'win32' ? 'C:\\MGV6\\' : '/tmp/toledo/',
        arquivo: 'ITENSMGV.TXT',
        descricao: 'Toledo do Brasil (MGV5 / MGV6 / MGV7)',
      },
      FILIZOLA: {
        diretorio: process.platform === 'win32' ? 'C:\\Filizola\\' : '/tmp/filizola/',
        arquivo: 'CADTXT.TXT',
        descricao: 'Filizola (Smart / Padrão CADTXT)',
      },
      ELGIN: {
        diretorio: process.platform === 'win32' ? 'C:\\Elgin\\Link\\' : '/tmp/elgin/',
        arquivo: 'PRODUTOS.TXT',
        descricao: 'Elgin (Elgin Link / Balanças de Etiqueta)',
      },
      URANO: {
        diretorio: process.platform === 'win32' ? 'C:\\Urano\\Integra\\' : '/tmp/urano/',
        arquivo: 'PRODUTOS.TXT',
        descricao: 'Urano (Urano Integra / TopMax)',
      },
    };
  }

  public buscarProdutosPesaveis(): any[] {
    const db = getCatalogoReadOnlyDb();
    const rows = db.prepare(`
      SELECT id, codigo_barras, sku, descricao, preco_venda, unidade_medida,
             pesavel, codigo_balanca, validade_balanca, is_pesavel_etiqueta, plu_balanca
      FROM produtos
      WHERE ativo = 1 AND (
        is_pesavel_etiqueta = 1 OR 
        pesavel = 1 OR 
        unidade_medida = 'KG' OR 
        (codigo_balanca IS NOT NULL AND codigo_balanca != '') OR
        (plu_balanca IS NOT NULL AND plu_balanca > 0)
      )
      ORDER BY COALESCE(plu_balanca, CAST(codigo_balanca AS INTEGER), 999999) ASC
    `).all() as any[];
    return rows;
  }

  private formatarLinhaToledo(p: any): string {
    const pluNum = p.plu_balanca || (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) : null) || 1;
    const plu = String(pluNum).padStart(6, '0').slice(-6);
    const depto = '01';
    const tipo = (p.unidade_medida === 'UN' && !p.pesavel) ? '1' : '0';
    const preco = Math.round(Number(p.preco_venda || 0) * 100).toString().padStart(6, '0').slice(-6);
    const validade = Math.min(Math.max(Number(p.validade_balanca || 5), 0), 999).toString().padStart(3, '0');
    const desc = (p.descricao || '').toUpperCase().slice(0, 50).padEnd(50, ' ');
    return `${depto}${tipo}${plu}${preco}${validade}${desc}`;
  }

  private formatarLinhaFilizola(p: any): string {
    const pluNum = p.plu_balanca || (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) : null) || 1;
    const plu = String(pluNum).padStart(6, '0').slice(-6);
    const tipo = (p.unidade_medida === 'UN' && !p.pesavel) ? 'U' : 'P';
    const desc = (p.descricao || '').toUpperCase().slice(0, 22).padEnd(22, ' ');
    const preco = Math.round(Number(p.preco_venda || 0) * 100).toString().padStart(7, '0').slice(-7);
    const validade = Math.min(Math.max(Number(p.validade_balanca || 5), 0), 999).toString().padStart(3, '0');
    return `${plu}${tipo}${desc}${preco}${validade}`;
  }

  private formatarLinhaElgin(p: any): string {
    const pluNum = p.plu_balanca || (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) : null) || 1;
    const plu = String(pluNum).padStart(6, '0').slice(-6);
    const tipo = (p.unidade_medida === 'UN' && !p.pesavel) ? '1' : '0';
    const desc = (p.descricao || '').toUpperCase().slice(0, 30).padEnd(30, ' ');
    const preco = Math.round(Number(p.preco_venda || 0) * 100).toString().padStart(6, '0').slice(-6);
    const validade = Math.min(Math.max(Number(p.validade_balanca || 5), 0), 999).toString().padStart(3, '0');
    return `${plu}${tipo}${desc}${preco}${validade}`;
  }

  private formatarLinhaUrano(p: any): string {
    const pluNum = p.plu_balanca || (p.codigo_balanca ? parseInt(p.codigo_balanca, 10) : null) || 1;
    const plu = String(pluNum).padStart(6, '0').slice(-6);
    const tipo = (p.unidade_medida === 'UN' && !p.pesavel) ? 'U' : 'P';
    const preco = Math.round(Number(p.preco_venda || 0) * 100).toString().padStart(6, '0').slice(-6);
    const validade = Math.min(Math.max(Number(p.validade_balanca || 5), 0), 999).toString().padStart(3, '0');
    const desc = (p.descricao || '').toUpperCase().slice(0, 20).padEnd(20, ' ');
    return `${plu}${tipo}${preco}${validade}${desc}`;
  }

  public gerarCarga(
    marca: MarcaBalancaEtiqueta = 'TOLEDO',
    diretorioCustom?: string
  ): ExportCargaResult {
    const def = this.obterDiretoriosPadrao()[marca] || this.obterDiretoriosPadrao().TOLEDO;
    const pastaAlvo = (diretorioCustom && diretorioCustom.trim()) ? diretorioCustom.trim() : def.diretorio;
    const arquivoNome = def.arquivo;

    const produtos = this.buscarProdutosPesaveis();
    let linhas: string[] = [];

    switch (marca) {
      case 'FILIZOLA':
        linhas = produtos.map((p) => this.formatarLinhaFilizola(p));
        break;
      case 'ELGIN':
        linhas = produtos.map((p) => this.formatarLinhaElgin(p));
        break;
      case 'URANO':
        linhas = produtos.map((p) => this.formatarLinhaUrano(p));
        break;
      case 'TOLEDO':
      default:
        linhas = produtos.map((p) => this.formatarLinhaToledo(p));
        break;
    }

    const conteudoTxt = linhas.join('\r\n') + (linhas.length > 0 ? '\r\n' : '');
    let caminhoSalvo: string | null = null;
    let avisoSalvamento: string | null = null;

    try {
      if (!fs.existsSync(pastaAlvo)) {
        fs.mkdirSync(pastaAlvo, { recursive: true });
      }
      const destinoFinal = path.join(pastaAlvo, arquivoNome);
      fs.writeFileSync(destinoFinal, conteudoTxt, { encoding: 'latin1' });
      caminhoSalvo = destinoFinal;
    } catch (err: any) {
      avisoSalvamento = `Não foi possível gravar diretamente em '${pastaAlvo}': ${err.message}. O download do arquivo TXT está disponível.`;
    }

    return {
      sucesso: true,
      marca,
      arquivo: arquivoNome,
      diretorioDestino: pastaAlvo,
      caminhoSalvo,
      totalItens: produtos.length,
      conteudoTxt,
      mensagem: caminhoSalvo
        ? `Carga de ${produtos.length} produtos gerada e gravada com sucesso em '${caminhoSalvo}'!`
        : `Carga de ${produtos.length} produtos gerada para download! (${avisoSalvamento || ''})`,
    };
  }
}
