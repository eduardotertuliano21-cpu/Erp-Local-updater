import { getApiBaseUrl } from './api.js';

async function req<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha de comunicação com catálogo de produtos' };
  }
}

export const produtoApi = {
  excluir: (id: string) =>
    req<{ excluido: boolean; id: string }>(`/produtos/${id}`, { method: 'DELETE' }),

  uploadFoto: (imagemBase64: string) =>
    req<{ nomeArquivo: string; url: string }>('/produtos/upload-foto', {
      method: 'POST',
      body: JSON.stringify({ imagemBase64 }),
    }),
};
