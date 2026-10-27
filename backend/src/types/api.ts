export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  diagnostico_ia?: string;
}

export interface Produto {
  id: string;
  codigo_barras: string;
  sku?: string;
  descricao: string;
  categoria?: string;
  tipo_pdv?: 'VAREJO' | 'RESTAURANTE';
  ramo_atuacao?: 'varejo' | 'restaurante' | 'ambos';
  preco_venda: number;
  unidade_medida: string;
  ncm?: string;
  cfop?: string;
  aliquota_icms?: number;
  cest?: string;
  cst_csosn?: string;
  origem?: number;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  ativo: number;
  foto?: string;
  tamanho?: string | null;
  cor?: string | null;
  marca?: string | null;
  modelo?: string | null;
  campanha_id?: string | null;
  em_campanha?: boolean;
  nome_campanha?: string | null;
  preco_promocional?: number | null;
  preco_original?: number;
  fator_saida?: number;
  fator_entrada?: number;
  codigo_barras_bipado?: string;
  pesavel?: number;
  codigo_balanca?: string | null;
  validade_balanca?: number;
  is_pesavel_checkout?: boolean | number;
  is_pesavel_etiqueta?: boolean | number;
  plu_balanca?: number | null;
  atualizado_em: string;
}

export interface CampanhaPromocional {
  id: string;
  nome_campanha: string;
  tipo_desconto: 'PORCENTAGEM' | 'VALOR_FIXO';
  valor_desconto: number;
  data_inicio: string;
  data_fim: string;
  status: 'ATIVA' | 'INATIVA';
  criado_em?: string;
  atualizado_em?: string;
  produtos_count?: number;
}

export interface ItemVendaPayload {
  produto_id: string;
  codigo_barras: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
  fator_saida?: number;
  ncm?: string;
  cfop?: string;
  cst_csosn?: string;
  cest?: string;
  unidade_medida?: string;
  aliquota_icms?: number;
  origem?: number;
}

export interface PagamentoPayload {
  metodo: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'CONVENIO';
  valor: number;
  detalhes?: string;
}

export interface CriarVendaPayload {
  id?: string;
  operador_id: string;
  caixa_id: string;
  cpf_cliente?: string;
  cliente_id?: string;
  cliente_nome?: string;
  itens: ItemVendaPayload[];
  pagamentos: PagamentoPayload[];
  desconto_total?: number;
  troco?: number;
  numero_caixa_fisico?: string;
}

export interface MovimentacaoCaixaPayload {
  tipo: 'ABERTURA' | 'SANGRIA' | 'SUPRIMENTO' | 'FECHAMENTO';
  valor: number;
  motivo?: string;
  operador_id: string;
}
