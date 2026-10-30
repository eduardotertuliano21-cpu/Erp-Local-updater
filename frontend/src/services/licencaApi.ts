import { getApiBaseUrl } from './api.js';

export interface LicencaStatusDTO {
  valida: boolean;
  status: 'ATIVA' | 'VENCIDA' | 'BLOQUEADA' | 'TESTE';
  dataVencimento: string;
  diasRestantes: number;
  diasCarencia: number;
  emTolerancia?: boolean;
  diasToleranciaRestantes?: number;
  isTrial?: boolean;
  diasTrialRestantes?: number;
  razaoSocial?: string;
  cnpj?: string;
  ramo_atuacao?: string;
  mensagem?: string;
  fraudeDetectada?: boolean;
  alertaRelogio?: string;
  moduloNfe?: boolean;
}

async function req<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha de conexão com a API de licenciamento' };
  }
}

export const licencaApi = {
  obterStatus: () => req<LicencaStatusDTO>('/licenca/status'),
  emergencyOverride: (senhaMestre: string) =>
    req<{ sucesso: boolean; diasAdicionados: number; novoStatus: LicencaStatusDTO }>('/licenca/emergency-override', {
      method: 'POST',
      body: JSON.stringify({ senhaMestre }),
    }),
  ativar: (chave: string, dataVencimento?: string) =>
    req<{ sucesso: boolean; novoStatus: LicencaStatusDTO }>('/licenca/ativar', {
      method: 'POST',
      body: JSON.stringify({ chave, dataVencimento }),
    }),
};
