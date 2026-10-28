import { getApiBaseUrl } from './api.js';

export interface InfoCertificado {
  id: string;
  nome_arquivo: string;
  razao_social: string;
  cnpj: string;
  valido_de: string;
  valido_ate: string;
  dias_restantes: number;
  expirado: boolean;
  alerta_vencimento: boolean;
  ativo: boolean;
}

export interface PermissaoHierarquia {
  hierarquia: 'ADMIN' | 'GERENTE' | 'OPERADOR';
  cancelar_venda: boolean;
  aplicar_desconto: boolean;
  abrir_gaveta: boolean;
  ver_relatorios: boolean;
  acessa_estoque: boolean;
  acessa_financeiro: boolean;
  acessa_configuracoes: boolean;
}

export interface OnboardingStatus {
  sistema_configurado: boolean;
  razao_social: string;
  nome_loja: string;
  cnpj: string;
  endereco: string;
  token_csc: string;
  id_token_csc: string;
  comportamento_fiscal_pdv: 'SEMPRE' | 'MANUAL';
}

export interface VeiculoCliente {
  id: string;
  cliente_id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  km_atual?: number;
}

export interface LogAuditoria {
  id: string;
  operador_id?: string;
  usuario_id?: string;
  usuario_nome?: string;
  acao: string;
  motivo?: string;
  detalhes?: string;
  entidade_id?: string;
  criado_em: string;
}

export interface CurvaAbcItem {
  produto_id: string;
  descricao: string;
  quantidade_total: number;
  faturamento_total: number;
  percentual_faturamento: number;
  percentual_acumulado: number;
  classe: 'A' | 'B' | 'C';
}

export interface CurvaAbcResponse {
  totalFaturamento: number;
  totalItensVendidos: number;
  resumoClasses: {
    classeA: { quantidadeProdutos: number; faturamento: number; percentual: number };
    classeB: { quantidadeProdutos: number; faturamento: number; percentual: number };
    classeC: { quantidadeProdutos: number; faturamento: number; percentual: number };
  };
  produtos: CurvaAbcItem[];
}

export interface KdsPedido {
  id: string;
  venda_id?: string;
  comanda_numero?: number;
  mesa_numero?: number;
  cliente_nome?: string;
  origem?: string;
  observacoes?: string;
  status: any;
  itens_json?: string;
  itens?: any[];
  criado_em: string;
}

async function enterpriseRawRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl().replace('/api', '/api/enterprise');
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

async function enterpriseWrappedRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const baseUrl = getApiBaseUrl().replace('/api', '/api/enterprise');
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha de comunicação Enterprise' };
  }
}

export const enterpriseApi = {
  // Onboarding & Fiscal
  obterStatusOnboarding: () => enterpriseWrappedRequest<OnboardingStatus>('/onboarding/status'),
  concluirOnboarding: (dados: any) => enterpriseWrappedRequest<any>('/onboarding/concluir', { method: 'POST', body: JSON.stringify(dados) }),

  // Certificados Digitais A1
  listarCertificados: () => enterpriseWrappedRequest<InfoCertificado[]>('/certificados'),
  obterCertificadoAtivo: () => enterpriseWrappedRequest<InfoCertificado | null>('/certificados/ativo'),
  obterAlertaVencimento: () => enterpriseWrappedRequest<{ alerta: boolean; dias_restantes?: number; mensagem?: string }>('/certificados/alerta-vencimento'),
  uploadCertificado: (nome_arquivo: string, conteudo_base64: string, senha: string) =>
    enterpriseWrappedRequest<InfoCertificado>('/certificados/upload', { method: 'POST', body: JSON.stringify({ nome_arquivo, conteudo_base64, senha }) }),
  ativarCertificado: (id: string) => enterpriseWrappedRequest<any>(`/certificados/${id}/ativar`, { method: 'POST' }),

  // RBAC Dinâmico
  obterMatrizRbac: () => enterpriseWrappedRequest<{ estrito: boolean; exigirAutenticacao: boolean; matriz: PermissaoHierarquia[] }>('/rbac/matriz'),
  salvarMatrizRbac: (matriz: PermissaoHierarquia[]) => enterpriseWrappedRequest<any>('/rbac/matriz', { method: 'POST', body: JSON.stringify({ matriz }) }),
  alterarModoEstritoRbac: (estrito: boolean) => enterpriseWrappedRequest<any>('/rbac/modo-estrito', { method: 'POST', body: JSON.stringify({ estrito }) }),
  alterarExigirAutenticacaoRbac: (exigir: boolean) => enterpriseWrappedRequest<any>('/rbac/exigir-autenticacao', { method: 'POST', body: JSON.stringify({ exigir }) }),
  verificarPermissaoRbac: (hierarquia: string, chave: string) => enterpriseWrappedRequest<{ permitida: boolean }>('/rbac/verificar', { method: 'POST', body: JSON.stringify({ hierarquia, chave }) }),

  // Veículos (Autopeças)
  listarVeiculosCliente: (clienteId: string) => enterpriseRawRequest<VeiculoCliente[]>(`/veiculos/cliente/${encodeURIComponent(clienteId)}`),
  buscarVeiculoPlaca: (placa: string) => enterpriseRawRequest<VeiculoCliente>(`/veiculos/placa/${encodeURIComponent(placa)}`),
  salvarVeiculo: (dados: any) => enterpriseRawRequest<VeiculoCliente>('/veiculos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarKmVeiculo: (placa: string, km: number) => enterpriseRawRequest<any>(`/veiculos/placa/${encodeURIComponent(placa)}/km`, { method: 'POST', body: JSON.stringify({ km }) }),

  // Trilha de Auditoria
  listarAuditoria: (limite = 100, acao?: string) => enterpriseRawRequest<LogAuditoria[]>(`/auditoria?limite=${limite}${acao ? `&acao=${encodeURIComponent(acao)}` : ''}`),

  // Curva ABC
  obterCurvaAbc: (inicio?: string, fim?: string) => enterpriseWrappedRequest<CurvaAbcResponse>(`/curva-abc?inicio=${encodeURIComponent(inicio || '')}&fim=${encodeURIComponent(fim || '')}`),

  // Etiquetas
  gerarEtiquetas: (payload: any) => enterpriseRawRequest<{ comandos: string; [k: string]: any }>('/etiquetas/gerar', { method: 'POST', body: JSON.stringify(payload) }),

  // TEF Local
  iniciarTef: (payload: any) => enterpriseRawRequest<any>('/tef/iniciar', { method: 'POST', body: JSON.stringify(payload) }),
  verificarTef: (id: string) => enterpriseRawRequest<any>(`/tef/${id}/status`),
  confirmarTef: (id: string) => enterpriseRawRequest<any>(`/tef/${id}/confirmar`, { method: 'POST' }),

  // KDS Cozinha
  listarKds: () => enterpriseRawRequest<KdsPedido[]>('/kds/pedidos'),
  avancarStatusKds: (id: string) => enterpriseRawRequest<KdsPedido>(`/kds/pedidos/${id}/avancar`, { method: 'POST' }),

  // Nuvem SaaS Onboarding
  obterPlanosPublicos: async () => {
    try {
      const cloudBase = ((import.meta as any).env?.VITE_CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
      const res = await fetch(`${cloudBase}/api/sync/planos-publicos`);
      return await res.json();
    } catch {
      return { sucesso: false, planos: [] };
    }
  },
  validarChaveLicencaNuvem: async (chaveLicenca: string) => {
    try {
      const cloudBase = ((import.meta as any).env?.VITE_CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
      const res = await fetch(`${cloudBase}/api/sync/validate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaveLicenca: chaveLicenca.trim() }),
      });
      return await res.json();
    } catch (err: any) {
      return { valida: false, erro: err.message || 'Falha ao conectar com o servidor central.' };
    }
  },
  registrarSelfService: async (dados: { email: string; telefone: string; senha: string; planoSlug: string; nomeLoja?: string; cnpj?: string; ramoAtuacao?: string; ramo_atuacao?: string; metodoPagamento?: 'PIX' | 'CARTAO' }) => {
    try {
      const cloudBase = ((import.meta as any).env?.VITE_CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
      const res = await fetch(`${cloudBase}/api/sync/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      return await res.json();
    } catch (err: any) {
      return { sucesso: false, erro: err.message || 'Falha ao registrar conta no servidor.' };
    }
  },
};
