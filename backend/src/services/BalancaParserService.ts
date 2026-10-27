import { ICatalogoRepository } from '../repositories/ICatalogoRepository.js';
import { Produto } from '../types/api.js';

export interface BalancaItemDecodificado {
  isCodigoBalanca: boolean;
  produto?: Produto;
  quantidade: number;
  valorTotal: number;
  tipoDecodificacao?: 'POR_PRECO' | 'POR_PESO';
}

export class BalancaParserService {
  constructor(private catalogoRepo: ICatalogoRepository) {}

  public decodificar(codigo: string): BalancaItemDecodificado {
    const limpo = codigo.trim();

    // Código de balança padrão brasileiro: 13 dígitos começando com '2'
    if (limpo.length !== 13 || !limpo.startsWith('2')) {
      return { isCodigoBalanca: false, quantidade: 1, valorTotal: 0 };
    }

    // Padrão 1: Prefixo 2 + 4 dígitos PLU + 5 dígitos Valor (Centavos) + DV
    // Exemplo: 2 0142 00890 5 -> PLU 0142, R$ 8,90
    const plu4 = limpo.slice(1, 5);
    const plu5 = limpo.slice(1, 6);

    // Tenta encontrar produto no catálogo por PLU (código de barras = PLU ou sku = PLU)
    let produto = this.catalogoRepo.buscarPorCodigoBarras(plu4) 
      || this.catalogoRepo.buscarPorCodigoBarras(plu4.replace(/^0+/, ''))
      || this.catalogoRepo.buscarPorCodigoBarras(plu5)
      || this.catalogoRepo.buscarPorCodigoBarras(plu5.replace(/^0+/, ''));

    if (!produto) {
      // Tenta buscar no catálogo se o código de barras cadastrado começa com o PLU
      const candidatos = this.catalogoRepo.buscarPorDescricao(plu4, 5);
      if (candidatos.length > 0) {
        produto = candidatos[0];
      }
    }

    if (!produto) {
      return { isCodigoBalanca: false, quantidade: 1, valorTotal: 0 };
    }

    // Extrai o valor monetário total em centavos (posições 6 a 11 ou 7 a 11)
    const valorCentavosStr = limpo.slice(6, 12);
    const valorTotal = parseInt(valorCentavosStr, 10) / 100;

    let quantidade = 1;

    if (produto.unidade_medida?.toUpperCase() === 'KG' && produto.preco_venda > 0) {
      // Se vendido a quilo e tiver valor total, calcula o peso fracionado em KG
      quantidade = parseFloat((valorTotal / produto.preco_venda).toFixed(3));
    } else {
      quantidade = 1;
    }

    return {
      isCodigoBalanca: true,
      produto,
      quantidade: quantidade > 0 ? quantidade : 1,
      valorTotal: valorTotal > 0 ? valorTotal : produto.preco_venda,
      tipoDecodificacao: 'POR_PRECO',
    };
  }
}
