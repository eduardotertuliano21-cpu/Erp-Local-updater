export interface Produto {
  id: string;
  codigo_barras: string;
  sku?: string;
  descricao: string;
  categoria?: string;
  tipo_pdv?: 'VAREJO' | 'RESTAURANTE';
  ramo_atuacao?: string;
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
  ativo?: number;
  foto?: string;
  estoque_atual?: number;
  codigo_oem?: string;
  localizacao?: string;
  aplicacao?: string;
  tamanho?: string | null;
  cor?: string | null;
  marca?: string | null;
  modelo?: string | null;
  campanha_id?: string | null;
  em_campanha?: boolean;
  nome_campanha?: string | null;
  preco_original?: number;
  preco_promocional?: number | null;
  fator_saida?: number;
  fator_entrada?: number;
  codigo_barras_bipado?: string;
  pesavel?: number | boolean;
  codigo_balanca?: string | null;
  validade_balanca?: number;
  is_pesavel_checkout?: boolean | number;
  is_pesavel_etiqueta?: boolean | number;
  plu_balanca?: number | null;
}

export interface ItemCarrinho {
  id: string; // unique item instance id in cart
  produto_id: string;
  codigo_barras: string;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
  fator_saida?: number;
  fator_entrada?: number;
  codigo_barras_bipado?: string;
  codigo_oem?: string;
  localizacao?: string;
  aplicacao?: string;
  tamanho?: string | null;
  cor?: string | null;
  marca?: string | null;
  modelo?: string | null;
  em_campanha?: boolean;
  nome_campanha?: string | null;
  preco_original?: number;
  preco_promocional?: number | null;
  ncm?: string;
  cfop?: string;
  cst_csosn?: string;
  cest?: string;
  unidade_medida?: string;
  aliquota_icms?: number;
  origem?: number;
}

export interface TabelaPreco {
  id: string;
  descricao: string;
  ativo: number;
}

export interface CompraEntrada {
  id: string;
  chave_nfe?: string;
  numero_nfe?: number;
  numero_nota?: number;
  serie?: number;
  fornecedor_nome?: string;
  cnpj_fornecedor?: string;
  fornecedor_cnpj?: string;
  valor_total: number;
  itens_contagem?: number;
  status: number;
  itens_json?: string;
  importado_em?: string;
  data_emissao?: string;
  efetivado_em?: string;
}

export interface DesossaRecord {
  id: string;
  numero: number;
  produto_origem_id: string;
  produto_origem_nome: string;
  peso_origem: number;
  custo_origem_total: number;
  peso_cortes_total: number;
  peso_quebra: number;
  percentual_quebra: number;
  status: string;
  criado_em?: string;
  itens?: Array<{
    id: string;
    produto_destino_id: string;
    descricao: string;
    peso: number;
    percentual_rendimento: number;
    custo_unitario_rateado: number;
    preco_venda_sugerido?: number;
  }>;
}

export type MetodoPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'CONVENIO';

export interface PagamentoItem {
  metodo: MetodoPagamento;
  valor: number;
  detalhes?: string;
}

export interface CaixaStatus {
  id: string;
  numero: number;
  operador_abertura: string;
  status: 'ABERTO' | 'FECHADO';
  saldo_inicial: number;
  saldo_final: number | null;
  aberto_em: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  diagnostico_ia?: string;
}

export interface ConfigOperacao {
  id: string;
  desconto_maximo_operador: number;
  exigir_gerente_desconto: number;
  permitir_alterar_preco: number;
  abertura_gaveta_sem_venda: number;
  estoque_negativo: 'BLOQUEAR' | 'AVISAR' | 'PERMITIR';
  agrupar_itens_repetidos: number;
  foco_balanca_automatico: number;
  comportamento_impressao: 'SEMPRE' | 'PERGUNTAR' | 'NAO_IMPRIMIR';
  pagamento_padrao: MetodoPagamento;
  exibir_fotos_busca: number;
  som_bip_sistema: number;
  parametros_extras?: string;
  atualizado_em?: string;
}
