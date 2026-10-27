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
    return { success: false, error: err.message || 'Falha de comunicação com servidor de backup/failover' };
  }
}

export const backupApi = {
  executarBackupUsb: (destino?: string) =>
    req<{ sucesso: boolean; unidadeEncontrada?: string; pastaDestino?: string; arquivosCopiados: string[]; mensagem: string }>(
      '/backup/usb-dump',
      { method: 'POST', body: JSON.stringify({ destino }) }
    ),

  listarUnidades: () =>
    req<{ unidades: string[] }>('/backup/unidades'),

  promoverMaster: () =>
    req<{ mensagem: string; role: string; status: any }>('/failover/promover-master', { method: 'POST' }),
};
