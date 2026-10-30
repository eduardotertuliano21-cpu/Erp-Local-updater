import type { ItemCarrinho } from '../types/pdv.js';
import type { OrdemDeServico } from '../services/assistenciaApi.js';

export const converterItensMesa = (itens: any[], num: number): ItemCarrinho[] =>
  itens.map((i) => ({
    id: i.id || crypto.randomUUID(),
    produto_id: i.produto_id || 'prod_food',
    codigo_barras: i.codigo_barras || `MESA${num}`,
    descricao: i.observacao ? `${i.descricao} (${i.observacao})` : i.descricao,
    preco_unitario: Number(i.preco_unitario),
    quantidade: Number(i.quantidade),
    desconto: 0,
    subtotal: Number(i.subtotal || i.preco_unitario * i.quantidade),
    ncm: i.ncm || '21069090',
    cfop: i.cfop || '5102',
    cst_csosn: i.cst_csosn || '102',
    unidade_medida: i.unidade_medida || 'UN',
    aliquota_icms: Number(i.aliquota_icms || 0),
    origem: i.origem ?? 0,
  }));

export const converterItensOs = (os: OrdemDeServico): ItemCarrinho[] => {
  const itens: ItemCarrinho[] = [];
  if (os.valor_servicos && os.valor_servicos > 0) {
    itens.push({
      id: crypto.randomUUID(),
      produto_id: `os_serv_${os.id}`,
      codigo_barras: `OS${os.numero_os}`,
      descricao: `Serviço OS #${os.numero_os} - ${os.equipamento_descricao}`,
      preco_unitario: os.valor_servicos,
      quantidade: 1,
      desconto: 0,
      subtotal: os.valor_servicos,
      ncm: '00000000',
      cfop: '5933',
      cst_csosn: '102',
      unidade_medida: 'UN',
      aliquota_icms: 0,
      origem: 0,
    });
  }
  if (os.valor_pecas && os.valor_pecas > 0) {
    itens.push({
      id: crypto.randomUUID(),
      produto_id: `os_peca_${os.id}`,
      codigo_barras: `OS${os.numero_os}`,
      descricao: `Peças OS #${os.numero_os} - ${os.equipamento_descricao}`,
      preco_unitario: os.valor_pecas,
      quantidade: 1,
      desconto: 0,
      subtotal: os.valor_pecas,
      ncm: '85177900',
      cfop: '5102',
      cst_csosn: '102',
      unidade_medida: 'UN',
      aliquota_icms: 0,
      origem: 0,
    });
  }
  if (itens.length === 0) {
    itens.push({
      id: crypto.randomUUID(),
      produto_id: `os_${os.id}`,
      codigo_barras: `OS${os.numero_os}`,
      descricao: `OS #${os.numero_os} (${os.equipamento_descricao})`,
      preco_unitario: os.valor_total || 0,
      quantidade: 1,
      desconto: 0,
      subtotal: os.valor_total || 0,
      ncm: '00000000',
      cfop: '5102',
      cst_csosn: '102',
      unidade_medida: 'UN',
      aliquota_icms: 0,
      origem: 0,
    });
  }
  return itens;
};
