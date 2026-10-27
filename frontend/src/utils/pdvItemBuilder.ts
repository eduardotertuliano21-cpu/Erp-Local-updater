import type { ItemCarrinho } from '../types/pdv.js';

export function criarItemCarrinho(
  prodData: any,
  quantidade: number,
  codigo: string,
  isBalancaEtiqueta: boolean = false,
  isPesagemCheckout: boolean = false
): ItemCarrinho {
  const isPromocional = Boolean(
    prodData.em_campanha &&
    prodData.preco_promocional !== undefined &&
    prodData.preco_promocional !== null
  );
  const precoUnitarioFinal = isPromocional
    ? Number(prodData.preco_promocional)
    : Number(prodData.preco_venda);
  const subtotalFinal = isBalancaEtiqueta
    ? (prodData.valorTotalBalanca || precoUnitarioFinal * quantidade)
    : precoUnitarioFinal * quantidade;

  return {
    id: crypto.randomUUID(),
    produto_id: prodData.id,
    codigo_barras: codigo,
    descricao: (isBalancaEtiqueta || isPesagemCheckout) ? `${prodData.descricao} [PESO]` : prodData.descricao,
    preco_unitario: precoUnitarioFinal,
    quantidade,
    desconto: 0,
    subtotal: parseFloat(subtotalFinal.toFixed(2)),
    ncm: prodData.ncm || '00000000',
    cfop: prodData.cfop || '5102',
    cst_csosn: prodData.cst_csosn || '102',
    cest: prodData.cest,
    unidade_medida: (isBalancaEtiqueta || isPesagemCheckout) ? 'KG' : (prodData.unidade_medida || 'UN'),
    aliquota_icms: prodData.aliquota_icms || 0,
    origem: prodData.origem ?? 0,
    codigo_oem: prodData.codigo_oem,
    localizacao: prodData.localizacao,
    aplicacao: prodData.aplicacao,
    tamanho: prodData.tamanho,
    cor: prodData.cor,
    marca: prodData.marca,
    modelo: prodData.modelo,
    em_campanha: prodData.em_campanha,
    nome_campanha: prodData.nome_campanha,
    fator_saida: prodData.fator_saida || 1,
    fator_entrada: prodData.fator_entrada || 1,
    codigo_barras_bipado: prodData.codigo_barras_bipado || codigo,
    preco_original: isPromocional ? Number(prodData.preco_venda) : undefined,
    preco_promocional: isPromocional ? Number(prodData.preco_promocional) : undefined,
  };
}
