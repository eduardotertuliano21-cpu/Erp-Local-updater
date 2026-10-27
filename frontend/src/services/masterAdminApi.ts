const API_BASE = '/api';

export interface MasterAuthResponse {
  sucesso: boolean;
  token?: string;
  mensagem?: string;
}

export interface MasterLicencaStatus {
  sucesso: boolean;
  novoVencimento?: string;
  mensagem: string;
}

const TOKEN_KEY = 'clickstorm_master_token';

export const masterAdminApi = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  async login(usuario: string, senha: string): Promise<{ success: boolean; data?: MasterAuthResponse; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/master/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha de conexão com servidor' };
    }
  },

  async desbloquear(): Promise<{ success: boolean; data?: MasterLicencaStatus; error?: string }> {
    try {
      const token = this.getToken();
      const res = await fetch(`${API_BASE}/master/desbloquear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-token': token || '',
        },
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao executar desbloqueio master' };
    }
  },

  async bloquear(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = this.getToken();
      const res = await fetch(`${API_BASE}/master/bloquear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-token': token || '',
        },
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao executar bloqueio master' };
    }
  },

  async concederTeste(dias: number): Promise<{ success: boolean; data?: MasterLicencaStatus; error?: string }> {
    try {
      const token = this.getToken();
      const res = await fetch(`${API_BASE}/master/estender-teste`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-token': token || '',
        },
        body: JSON.stringify({ dias }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao conceder teste' };
    }
  },

  async obterStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = this.getToken();
      const res = await fetch(`${API_BASE}/master/status`, {
        headers: { 'x-master-token': token || '' },
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao obter status master' };
    }
  },

  async simularStripe(plano: 'MENSAL' | 'ANUAL'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/assinatura/simular-teste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao testar API Stripe' };
    }
  },

  async checarAtualizacoes(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sistema/update/checar`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao verificar atualizações' };
    }
  },

  async obterCaixaPreta(limite = 50): Promise<{ success: boolean; total?: number; erros?: any[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/loja/caixa-preta?limite=${limite}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao consultar Caixa Preta' };
    }
  },

  async resolverErroCaixaPreta(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/loja/caixa-preta/${id}/resolver`, {
        method: 'POST',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao resolver erro na Caixa Preta' };
    }
  },

  async testarDiagnosticoIa(tipoEvento: string, erroOriginal: string): Promise<{ success: boolean; registro?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/loja/caixa-preta/diagnosticar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoEvento, erroOriginal }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha no diagnóstico IA' };
    }
  },
};
