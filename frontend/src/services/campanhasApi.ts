import { getApiBaseUrl } from './api.js';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const ramo = typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_business_mode') || 'varejo') : 'varejo';
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-ramo-atuacao': ramo,
        ...(options.headers || {}),
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de comunicação com o servidor' };
  }
}

export const campanhasApi = {
  listar: () => request<CampanhaPromocional[]>('/campanhas'),
  obter: (id: string) => request<CampanhaPromocional>(`/campanhas/${id}`),
  salvar: (dados: Partial<CampanhaPromocional>) =>
    request<CampanhaPromocional>('/campanhas', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),
  excluir: (id: string) =>
    request<{ id: string; excluido: boolean }>(`/campanhas/${id}`, {
      method: 'DELETE',
    }),
  vincularProdutos: (campanhaId: string, produtoIds: string[]) =>
    request<{ campanha_id: string; count: number }>(`/campanhas/${campanhaId}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ produto_ids: produtoIds }),
    }),
  desvincularProdutos: (produtoIds: string[]) =>
    request<{ count: number }>('/campanhas/desvincular-produtos', {
      method: 'POST',
      body: JSON.stringify({ produto_ids: produtoIds }),
    }),
  listarProdutos: (campanhaId: string) =>
    request<any[]>(`/campanhas/${campanhaId}/produtos`),
};
