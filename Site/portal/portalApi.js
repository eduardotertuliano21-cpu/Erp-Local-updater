const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocalDev ? 'http://localhost:4000/api' : '/api';

export const getPortalSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cs_portal_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setPortalSession = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cs_portal_session', JSON.stringify(data));
  }
};

export const clearPortalSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cs_portal_session');
  }
};

export const portalApi = {
  login: async (chaveLicenca, senha, servidorUrl) => {
    const res = await fetch(`${API_BASE}/portal/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chaveLicenca, senha, servidorUrl }),
    });
    return res.json();
  },

  /**
   * Encaminha requisições ao computador servidor do cliente sem armazenar nada no servidor central
   */
  requestLoja: async (endpoint, options = {}) => {
    const session = getPortalSession();
    if (!session || !session.servidorUrl) {
      throw new Error('Sessão do portal não inicializada ou endereço do servidor ausente.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-target-server': session.servidorUrl,
      'x-portal-token': session.token || '',
      ...(options.headers || {}),
    };

    // Remove barra inicial duplicada
    const limpo = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}/portal/proxy${limpo}`;

    const res = await fetch(url, {
      ...options,
      headers,
    });
    return res.json();
  },

  // Métodos de conveniência para a gestão remota da loja
  getDashboard: async () => {
    return portalApi.requestLoja('/relatorios/resumo-geral');
  },
  getProdutos: async (busca = '') => {
    return portalApi.requestLoja(`/produtos?termo=${encodeURIComponent(busca)}`);
  },
  salvarProduto: async (dados) => {
    return portalApi.requestLoja('/produtos', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  excluirProduto: async (id) => {
    return portalApi.requestLoja(`/produtos/${id}`, {
      method: 'DELETE',
    });
  },
  getEstoquePosicao: async () => {
    return portalApi.requestLoja('/estoque/posicao');
  },
  getEstoqueMovimentos: async () => {
    return portalApi.requestLoja('/estoque/movimentos');
  },
  ajustarEstoque: async (dados) => {
    return portalApi.requestLoja('/estoque/ajuste', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  getEntidades: async (tipo = '', busca = '') => {
    return portalApi.requestLoja(`/entidades?tipo=${encodeURIComponent(tipo)}&termo=${encodeURIComponent(busca)}`);
  },
  salvarEntidade: async (dados) => {
    return portalApi.requestLoja('/entidades', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  getFinanceiroTitulos: async (tipo = '', status = '') => {
    return portalApi.requestLoja(`/financeiro/titulos?tipo=${tipo}&status=${status}`);
  },
  getFinanceiroTotais: async () => {
    return portalApi.requestLoja('/financeiro/totais');
  },
  getFinanceiroDre: async () => {
    return portalApi.requestLoja('/financeiro/dre');
  },
  getRelatorioVendas: async () => {
    return portalApi.requestLoja('/relatorios/vendas');
  },
  getRelatorioCaixas: async () => {
    return portalApi.requestLoja('/relatorios/caixas');
  },
  getConfigLoja: async () => {
    return portalApi.requestLoja('/loja/config');
  },
  salvarConfigLoja: async (dados) => {
    return portalApi.requestLoja('/loja/config', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },
  testarConexaoServidor: async (servidorUrl) => {
    const res = await fetch(`${API_BASE}/portal/proxy/health`, {
      headers: {
        'x-target-server': servidorUrl,
      },
    });
    return res.json();
  },
};
