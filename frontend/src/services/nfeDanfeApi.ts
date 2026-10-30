import { getApiBaseUrl } from './api.js';
import type { ApiResponse } from '../types/pdv.js';

async function nfeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    let baseUrl = getApiBaseUrl();
    const ramo = typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_business_mode') || 'mercado') : 'mercado';
    const headers = { 'Content-Type': 'application/json', 'x-ramo-atuacao': ramo, 'x-tenant': ramo, ...(options.headers || {}) };
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
    } catch {
      if (baseUrl.includes(':5000')) {
        baseUrl = baseUrl.replace(':5000', ':3333');
        res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
      } else {
        throw new Error('Falha na conexão com o servidor local.');
      }
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de comunicação local' };
  }
}

export const nfeDanfeApi = {
  emitir: (payload: any) =>
    nfeRequest<any>('/nfe-danfe/emitir', { method: 'POST', body: JSON.stringify(payload) }),

  listar: (filtros?: { inicio?: string; fim?: string; status?: string; q?: string }) => {
    const p = new URLSearchParams();
    if (filtros?.inicio) p.set('inicio', filtros.inicio);
    if (filtros?.fim) p.set('fim', filtros.fim);
    if (filtros?.status && filtros.status !== 'TODAS') p.set('status', filtros.status);
    if (filtros?.q) p.set('q', filtros.q);
    return nfeRequest<{ notas: any[]; resumo: any }>(`/nfe-danfe/listar?${p.toString()}`);
  },

  obterDetalhes: (id: string) =>
    nfeRequest<any>(`/nfe-danfe/${encodeURIComponent(id)}`),

  cancelar: (id: string, motivo: string) =>
    nfeRequest<any>(`/nfe-danfe/${encodeURIComponent(id)}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),

  listarPastas: () =>
    nfeRequest<{ diretorioRaiz: string; pastas: any[] }>('/nfe-danfe/pastas/arvore'),

  abrirPasta: (caminho?: string) =>
    nfeRequest<{ aberto: boolean; caminho: string }>('/nfe-danfe/pastas/abrir', {
      method: 'POST',
      body: JSON.stringify({ caminho }),
    }),
};
