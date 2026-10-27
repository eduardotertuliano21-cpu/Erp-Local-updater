import { CriarVendaPayload, MovimentacaoCaixaPayload } from '../types/api.js';

export interface CaixaRecord {
  id: string;
  numero: number;
  operador_abertura: string;
  status: 'ABERTO' | 'FECHADO';
  saldo_inicial: number;
  saldo_final: number | null;
  aberto_em: string;
  fechado_em: string | null;
  sincronizado: number;
  sincronizado_em?: string | null;
}

export interface MovimentacaoCaixaRecord {
  id: string;
  caixa_id: string;
  operador_id: string;
  tipo: 'ABERTURA' | 'SANGRIA' | 'SUPRIMENTO' | 'FECHAMENTO';
  valor: number;
  motivo?: string;
  criado_em: string;
  sincronizado: number;
  sincronizado_em?: string | null;
}

export interface VendaComDetalhesRecord {
  id: string;
  numero_sequencial: number;
  caixa_id: string;
  operador_id: string;
  numero_caixa_fisico?: string;
  cpf_cliente?: string;
  subtotal: number;
  desconto: number;
  total_liquido: number;
  troco: number;
  status: 'CONCLUIDA' | 'CANCELADA';
  criado_em: string;
  sincronizado: number;
  sincronizado_em?: string | null;
  itens: Array<{
    id: string;
    produto_id: string;
    codigo_barras: string;
    descricao: string;
    quantidade: number;
    preco_unitario: number;
    desconto: number;
    subtotal: number;
    ncm?: string;
    cfop?: string;
    cst_csosn?: string;
    cest?: string;
    unidade_medida?: string;
    aliquota_icms?: number;
    origem?: number;
  }>;
  pagamentos: Array<{
    id: string;
    metodo: string;
    valor: number;
    detalhes?: string;
  }>;
}

export interface VendaRecord {
  id: string;
  numero_sequencial: number;
  caixa_id: string;
  operador_id: string;
  numero_caixa_fisico?: string;
  cpf_cliente?: string;
  subtotal: number;
  desconto: number;
  total_liquido: number;
  troco: number;
  status: 'CONCLUIDA' | 'CANCELADA';
  criado_em: string;
  sincronizado: number;
  sincronizado_em?: string | null;
}

export interface ResumoPendenciasSync {
  vendasPendentes: number;
  movimentacoesPendentes: number;
  logsPendentes: number;
  totalPendencias: number;
}

export interface IOperacaoRepository {
  obterCaixaAberto(): CaixaRecord | null;
  abrirCaixa(id: string, numero: number, operador: string, saldoInicial: number): CaixaRecord;
  fecharCaixa(caixaId: string, saldoFinal: number): void;
  registrarMovimentacao(mov: MovimentacaoCaixaPayload & { id: string; caixa_id: string }): MovimentacaoCaixaRecord;
  listarMovimentacoesCaixa(caixaId: string): MovimentacaoCaixaRecord[];
  salvarVenda(venda: CriarVendaPayload & { id: string; numero_sequencial: number; subtotal: number; total_liquido: number }): VendaRecord;
  cancelarVenda(vendaId: string, motivo: string, operadorId: string): void;
  obterUltimasVendas(limite?: number): VendaRecord[];
  obterVendaPorId(vendaId: string): VendaComDetalhesRecord | null;
  registrarLogAuditoria(acao: string, detalhes: string, operadorId?: string): void;

  // Sincronização Local -> Nuvem (local_operacao.db)
  obterVendasPendentes(limite?: number): VendaComDetalhesRecord[];
  marcarVendasSincronizadas(ids: string[]): void;
  obterMovimentacoesPendentes(limite?: number): MovimentacaoCaixaRecord[];
  marcarMovimentacoesSincronizadas(ids: string[]): void;
  obterResumoPendencias(): ResumoPendenciasSync;
}
