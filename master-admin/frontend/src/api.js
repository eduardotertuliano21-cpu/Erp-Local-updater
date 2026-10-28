const API_BASE = 'http://localhost:4000/api';
const MASTER_KEY = 'clickstorm_master_secret_2026';

const getHeaders = () => {
  const token = localStorage.getItem('cs_master_token') || MASTER_KEY;
  return {
    'Content-Type': 'application/json',
    'x-admin-key': token,
    'Authorization': `Bearer ${token}`,
  };
};

export const api = {
  login: async (login, senha) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha }),
    });
    return res.json();
  },

  // Usuários Administrativos
  getUsuarios: async () => {
    const res = await fetch(`${API_BASE}/auth/usuarios`, { headers: getHeaders() });
    return res.json();
  },
  createUsuario: async (dados) => {
    const res = await fetch(`${API_BASE}/auth/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    return res.json();
  },
  toggleUsuarioStatus: async (id) => {
    const res = await fetch(`${API_BASE}/auth/usuarios/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Financeiro
  getMetricas: async () => {
    const res = await fetch(`${API_BASE}/financeiro/metricas`, { headers: getHeaders() });
    return res.json();
  },
  getTransacoes: async () => {
    const res = await fetch(`${API_BASE}/financeiro/transacoes`, { headers: getHeaders() });
    return res.json();
  },
  createCobrancaExtra: async (dados) => {
    const res = await fetch(`${API_BASE}/financeiro/cobranca-extra`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    return res.json();
  },
  baixarTransacao: async (id) => {
    const res = await fetch(`${API_BASE}/financeiro/transacoes/${id}/baixar`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },
  deleteTransacao: async (id) => {
    const res = await fetch(`${API_BASE}/financeiro/transacoes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Tenants / Clientes
  getTenants: async (busca = '', status = '', page = 1) => {
    const params = new URLSearchParams();
    if (busca) params.append('busca', busca);
    if (status) params.append('status', status);
    params.append('page', String(page));
    const res = await fetch(`${API_BASE}/tenants?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },
  updateTenant: async (id, dados) => {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    return res.json();
  },
  updateTenantStatus: async (id, statusLicenca, diasCarencia, dataExpiracao) => {
    const res = await fetch(`${API_BASE}/tenants/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ statusLicenca, diasCarencia, dataExpiracao }),
    });
    return res.json();
  },

  // Planos
  getPlanos: async () => {
    const res = await fetch(`${API_BASE}/planos`, { headers: getHeaders() });
    return res.json();
  },
  savePlano: async (plano) => {
    const method = plano.id ? 'PUT' : 'POST';
    const url = plano.id ? `${API_BASE}/planos/${plano.id}` : `${API_BASE}/planos`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(plano),
    });
    return res.json();
  },
  deletePlano: async (id) => {
    const res = await fetch(`${API_BASE}/planos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Configurações Globais (Trial & Stripe)
  getConfig: async () => {
    const res = await fetch(`${API_BASE}/config`, { headers: getHeaders() });
    return res.json();
  },
  updateConfig: async (dados) => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    return res.json();
  },

  // Versionamento & Auto-Update
  getRelease: async () => {
    const res = await fetch(`${API_BASE}/releases/admin`, { headers: getHeaders() });
    return res.json();
  },
  definirRelease: async (dados) => {
    const res = await fetch(`${API_BASE}/releases/admin/definir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dados),
    });
    return res.json();
  },
};
