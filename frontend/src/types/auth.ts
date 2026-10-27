export type HierarquiaUsuario = 'ADMIN' | 'GERENTE' | 'OPERADOR';

export interface PermissoesUsuario {
  pode_cancelar_venda: boolean;
  pode_dar_desconto: boolean;
  pode_ver_relatorios: boolean;
  acessa_estoque: boolean;
  acessa_financeiro: boolean;
  acessa_configuracoes: boolean;
}

export interface UsuarioDTO {
  id: string;
  nome: string;
  login: string;
  hierarquia: HierarquiaUsuario;
  ativo: boolean;
  permissoes: PermissoesUsuario;
  criado_em?: string;
  atualizado_em?: string;
}

export interface SessaoCaixaDTO {
  id: string;
  usuario_id: string;
  usuario_nome?: string;
  data_abertura: string;
  data_fechamento?: string | null;
  saldo_inicial: number;
  saldo_final?: number | null;
  status: 'ABERTO' | 'FECHADO';
  observacoes?: string | null;
}

export type StatusValidacaoCaixa = 'FECHADO' | 'ABERTO_HOJE' | 'FECHAMENTO_PENDENTE';

export interface RespostaStatusCaixaUsuario {
  status: StatusValidacaoCaixa;
  sessaoAberta: SessaoCaixaDTO | null;
  forcarFechamentoDiario: boolean;
  mensagem: string;
}

export interface LoginResponseData {
  usuario: UsuarioDTO;
  validacaoCaixa: RespostaStatusCaixaUsuario;
}
