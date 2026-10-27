import { getApiBaseUrl } from './api.js';

export interface OrdemDeServico {
  id: string;
  numero_os: number;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  equipamento_id?: string;
  equipamento_descricao: string;
  numero_serie?: string;
  defeito_relatado: string;
  laudo_tecnico?: string;
  status: 'AGUARDANDO_AVALIACAO' | 'AGUARDANDO_PECA' | 'PRONTO' | 'ENTREGUE';
  valor_servicos: number;
  valor_pecas: number;
  valor_total: number;
  tecnico_responsavel?: string;
  data_abertura: string;
  data_previsao?: string;
  data_conclusao?: string;
  data_entrega?: string;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface NovaOrdemPayload {
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  equipamento_descricao: string;
  numero_serie?: string;
  defeito_relatado: string;
  tecnico_responsavel?: string;
  valor_servicos?: number;
  valor_pecas?: number;
  observacoes?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-ramo-atuacao': 'assistencia',
        ...(options.headers || {}),
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha na requisição' };
  }
}

export const assistenciaApi = {
  listarOrdens: (status?: string, busca?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (busca) params.append('busca', busca);
    const qs = params.toString();
    return request<OrdemDeServico[]>(`/assistencia/os${qs ? `?${qs}` : ''}`);
  },

  obterOrdem: (id: string) => request<OrdemDeServico>(`/assistencia/os/${id}`),

  criarOrdem: (dados: NovaOrdemPayload) =>
    request<OrdemDeServico>('/assistencia/os', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atualizarStatus: (id: string, status: string, observacoes?: string) =>
    request<OrdemDeServico>(`/assistencia/os/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, observacoes }),
    }),

  listarEquipamentos: (clienteId?: string) => {
    const qs = clienteId ? `?cliente_id=${encodeURIComponent(clienteId)}` : '';
    return request<any[]>(`/assistencia/equipamentos${qs}`);
  },

  listarClientes: (busca?: string) => {
    const qs = busca ? `?q=${encodeURIComponent(busca)}` : '';
    return request<any[]>(`/assistencia/clientes${qs}`);
  },

  criarCliente: (dados: { nome: string; cpf_cnpj?: string; telefone?: string; email?: string; endereco?: string }) =>
    request<any>('/assistencia/clientes', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
};
