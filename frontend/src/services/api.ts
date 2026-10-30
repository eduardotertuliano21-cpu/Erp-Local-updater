import type { ApiResponse, Produto, CaixaStatus, ItemCarrinho, PagamentoItem, ConfigOperacao } from '../types/pdv.js';

export function isPortalRemoteMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/portal') ||
    window.location.search.includes('portal=1') ||
    window.location.hostname === 'clickstormsystems.com.br' ||
    Boolean(localStorage.getItem('cs_portal_target_server'))
  );
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (isPortalRemoteMode()) {
      return '/api/portal/proxy';
    }
    const saved = localStorage.getItem('clickstorm_master_url');
    if (saved) {
      try {
        if (saved.includes('fe80') || saved.includes('169.254.')) {
          localStorage.removeItem('clickstorm_master_url');
        } else {
          new URL(saved);
          return saved.replace(/\/+$/, '');
        }
      } catch {
        localStorage.removeItem('clickstorm_master_url');
      }
    }
    let host = window.location.hostname || '127.0.0.1';
    if (host.includes('fe80') || host === '::1') host = '127.0.0.1';
    const safeHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
    const isViteDev = window.location.port === '5173' || window.location.port === '5174';
    const port = isViteDev ? '5000' : (window.location.port || '5000');
    return `${window.location.protocol}//${safeHost}:${port}/api`;
  }
  return 'http://127.0.0.1:5000/api';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.includes('fe80') || url.includes('169.254.')) {
      localStorage.removeItem('clickstorm_master_url');
      return;
    }
    try {
      new URL(url);
      localStorage.setItem('clickstorm_master_url', url);
    } catch {
      localStorage.removeItem('clickstorm_master_url');
    }
  }
}

export function formatarLogoUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/assets/logos/') || url.startsWith('/imagens/')) {
    const apiBase = getApiBaseUrl().replace(/\/api\/?$/, '');
    return `${apiBase}${url}`;
  }
  return url;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    let baseUrl = getApiBaseUrl();
    let res: Response;
    const isMob = typeof window !== 'undefined' && (
      window.location.search.includes('mobile=1') || window.location.pathname.startsWith('/mobile') ||
      window.location.search.includes('kds=1') || window.location.pathname.startsWith('/kds')
    );
    const ramo = isMob ? 'restaurante' : (typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_business_mode') || 'mercado') : 'mercado');
    const numCaixa = typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_numero_caixa_fisico') || '01') : '01';
    const isPortal = isPortalRemoteMode();
    const portalTarget = typeof window !== 'undefined' ? (localStorage.getItem('cs_portal_target_server') || 'http://192.168.3.149:5000') : null;
    const portalToken = typeof window !== 'undefined' ? localStorage.getItem('cs_portal_token') : null;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-ramo-atuacao': ramo,
      'x-tenant': ramo,
      'x-caixa-terminal': numCaixa,
    };

    if (isPortal && portalTarget) {
      defaultHeaders['x-target-server'] = portalTarget;
    }
    if (portalToken) {
      defaultHeaders['Authorization'] = `Bearer ${portalToken}`;
    }

    try {
      res = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) },
      });
    } catch {
      // Fallback para porta de contingência 3333 se porta 5000 não responder localmente
      if (!isPortal && baseUrl.includes(':5000')) {
        baseUrl = baseUrl.replace(':5000', ':3333');
        res = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: { ...defaultHeaders, ...(options.headers || {}) },
        });
      } else {
        throw new Error('Falha na conexão com o servidor da loja.');
      }
    }

    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Falha na comunicação com o backend local',
    };
  }
}

export const api = {
  // Catálogo
  buscarPorCodigoBarras: (codigo: string) =>
    request<Produto>(`/produtos/barcode/${encodeURIComponent(codigo)}`),

  pesquisarProdutos: (termo: string, context?: string, ramo?: string) => {
    const isMob = typeof window !== 'undefined' && (window.location.search.includes('mobile=1') || window.location.pathname.startsWith('/mobile'));
    const finalRamo = ramo || (isMob ? 'restaurante' : undefined);
    return request<Produto[]>(`/produtos?q=${encodeURIComponent(termo)}${context ? `&context=${context}` : ''}${finalRamo ? `&ramo=${finalRamo}&tenant=${finalRamo}` : ''}`);
  },

  // Caixa
  obterStatusCaixa: () => request<{ caixa: CaixaStatus | null; totalDinheiroCalculado: number }>('/caixa/status'),
  abrirCaixa: (numero: number, operador: string, saldoInicial: number) =>
    request<CaixaStatus>('/caixa/abrir', { method: 'POST', body: JSON.stringify({ numero, operador, saldoInicial }) }),
  movimentarCaixa: (caixaId: string, operadorId: string, tipo: 'SANGRIA' | 'SUPRIMENTO', valor: number, motivo?: string) =>
    request('/caixa/movimentar', { method: 'POST', body: JSON.stringify({ caixaId, operadorId, tipo, valor, motivo }) }),
  fecharCaixa: (caixaId: string, saldoFinal: number, operadorId: string, dadosExtras?: any) => {
    const numCaixa = typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_numero_caixa_fisico') || '01') : '01';
    return request('/caixa/fechar', { method: 'POST', body: JSON.stringify({ caixaId, saldoFinal, operadorId, numero_caixa_fisico: numCaixa, ...(dadosExtras || {}) }) });
  },

  // Vendas
  finalizarVenda: (payload: { operador_id: string; caixa_id: string; cpf_cliente?: string; itens: ItemCarrinho[]; pagamentos: PagamentoItem[]; desconto_total?: number; troco?: number; numero_caixa_fisico?: string }) => {
    const numCaixa = typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_numero_caixa_fisico') || '01') : '01';
    return request<{ id: string; numero_sequencial: number }>('/vendas', { method: 'POST', body: JSON.stringify({ numero_caixa_fisico: numCaixa, ...payload }) });
  },
  cancelarVenda: (vendaId: string, motivo: string, operadorId: string) =>
    request(`/vendas/${vendaId}/cancelar`, { method: 'POST', body: JSON.stringify({ motivo, operadorId }) }),
  listarUltimasVendas: (limite = 10) => request(`/vendas?limite=${limite}`),

  // Sincronização Dual SQLite (Cloud <-> Local)
  obterStatusSync: () =>
    request<{ status: 'IDLE' | 'SYNCING' | 'OFFLINE'; ultimoCicloEm: string | null; ultimoErro?: string; pendencias: { vendasPendentes: number; movimentacoesPendentes: number; logsPendentes: number; totalPendencias: number } }>('/sync/status'),
  forcarSync: () => request('/sync/trigger', { method: 'POST' }),

  // Motor Fiscal & Impressão ESC/POS
  obterDanfeCupom: (vendaId: string) =>
    request<{ documento: { id: string; chave_acesso: string; numero: number; serie: number; status: string }; cupom: { textoFormatado: string; bytesHexEscPos: string; chaveFormatada: string } }>(`/fiscal/danfe/${vendaId}`),

  // Autenticação de Supervisor
  autorizarSupervisor: (pin: string, motivo: string, operadorId: string) =>
    request<{ autorizado: boolean; supervisor: { id: string; nome: string; matricula: string }; tokenAutorizacao: string }>('/auth/autorizar-supervisor', {
      method: 'POST', body: JSON.stringify({ pin, motivo, operadorId }),
    }),
  imprimirDireto: (vendaId: string) =>
    request<{ sucesso: boolean; modo: string; detalhe: string }>(`/fiscal/imprimir-direto/${vendaId}`, { method: 'POST' }),
  emitirNfce: (vendaId: string) =>
    request<{ sucesso: boolean; documento?: any; motivo?: string }>(`/fiscal/emitir/${vendaId}`, { method: 'POST' }),
  checarIntegridadeTempo: () =>
    request<any>('/health/time-integrity'),

  // ERP & Retaguarda
  salvarProduto: (produto: Partial<Produto>) =>
    request<Produto>('/produtos', {
      method: 'POST',
      body: JSON.stringify(produto),
    }),

  obterResumoERP: () =>
    request<{
      totalVendasHoje: number;
      quantidadeVendasHoje: number;
      ticketMedioHoje: number;
      vendasCanceladasHoje: number;
      nfceEmitidas: number;
      nfceContingencia: number;
      produtosCadastrados: number;
      caixaAtualAberto: boolean;
    }>('/relatorios/resumo-geral'),

  listarVendasERP: (filtros?: { inicio?: string; fim?: string; tipoFiscal?: string; status?: string; limite?: number }) => {
    const p = new URLSearchParams();
    if (filtros?.inicio) p.set('inicio', filtros.inicio);
    if (filtros?.fim) p.set('fim', filtros.fim);
    if (filtros?.tipoFiscal && filtros.tipoFiscal !== 'TODAS') p.set('tipoFiscal', filtros.tipoFiscal);
    if (filtros?.status && filtros.status !== 'TODOS') p.set('status', filtros.status);
    if (filtros?.limite) p.set('limite', String(filtros.limite));
    return request<any[]>(`/relatorios/vendas?${p.toString()}`);
  },

  cancelarNfce: (vendaId: string, motivo: string, operadorId = 'OPERADOR') =>
    request<{ vendaId: string; cancelada: boolean }>(`/fiscal/cancelar/${vendaId}`, {
      method: 'POST',
      body: JSON.stringify({ motivo, operadorId }),
    }),

  listarCaixasERP: () =>
    request<any[]>('/relatorios/caixas'),

  listarAuditoriaERP: () =>
    request<any[]>('/relatorios/auditoria'),

  listarContingenciasERP: () =>
    request<any[]>('/fiscal/contingencias'),

  transmitirContingenciasERP: () =>
    request<{ transmitidas: number; restantes: number; detalhe: string }>('/fiscal/contingencia/transmitir', {
      method: 'POST',
    }),

  // Entidades Centrais (Clientes, Fornecedores, etc.)
  listarEntidades: (tipo?: string, termo?: string) =>
    request<any[]>(`/entidades?tipo=${encodeURIComponent(tipo || '')}&q=${encodeURIComponent(termo || '')}`),

  salvarEntidade: (dados: any) =>
    request<any>('/entidades', { method: 'POST', body: JSON.stringify(dados) }),

  // Financeiro & Controladoria
  listarTitulosFinanceiros: (tipo?: string, status?: string) =>
    request<any[]>(`/financeiro/titulos?tipo=${encodeURIComponent(tipo || '')}&status=${encodeURIComponent(status || '')}`),

  criarTituloFinanceiro: (dados: any) =>
    request<any>('/financeiro/titulos', { method: 'POST', body: JSON.stringify(dados) }),

  liquidarTituloFinanceiro: (id: string, valorPago: number, dataPagamento?: string) =>
    request<any>(`/financeiro/titulos/${id}/liquidar`, { method: 'POST', body: JSON.stringify({ valorPago, dataPagamento }) }),

  obterTotaisFinanceiro: () =>
    request<any>('/financeiro/totais'),

  obterDRE: (periodo?: string) =>
    request<any>(`/financeiro/dre?periodo=${encodeURIComponent(periodo || '')}`),

  // Estoque, WMS & Importação XML
  obterPosicaoEstoque: () =>
    request<any[]>('/estoque/posicao'),

  listarMovimentosEstoque: (produtoId?: string) => request<any[]>(`/estoque/movimentos?produtoId=${encodeURIComponent(produtoId || '')}`),
  ajustarEstoque: (dados: any) => request<any>('/estoque/ajuste', { method: 'POST', body: JSON.stringify(dados) }),
  importarXmlNfe: (xml: string) => request<any>('/compras/importar-xml', { method: 'POST', body: JSON.stringify({ xml }) }),

  // PCP / Produção
  obterFichaTecnica: (produtoId: string) => request<any[]>(`/pcp/fichas/${produtoId}`),
  salvarInsumoFicha: (dados: any) => request<any>('/pcp/fichas', { method: 'POST', body: JSON.stringify(dados) }),
  listarOrdensPcp: () => request<any[]>('/pcp/ordens'),
  criarOrdemPcp: (dados: any) => request<any>('/pcp/ordens', { method: 'POST', body: JSON.stringify(dados) }),
  finalizarOrdemPcp: (id: string, quantidadeProduzida: number, operadorId?: string) =>
    request<any>(`/pcp/ordens/${id}/finalizar`, { method: 'POST', body: JSON.stringify({ quantidadeProduzida, operadorId }) }),

  // White-Label & Personalização de Marca
  obterConfigLoja: () => request<any>('/config/loja'),
  salvarConfigLoja: (dados: any) => request<any>('/config/loja', { method: 'POST', body: JSON.stringify(dados) }),

  // Descoberta de Rede Zero-Config (mDNS)
  obterDiscoveryStatus: () => request<any>('/discovery/status'),
  conectarMasterManual: (masterIp: string, masterPort = 5000) =>
    request<any>('/discovery/conectar', { method: 'POST', body: JSON.stringify({ masterIp, masterPort }) }),

  // Políticas e Regras de Operação do PDV
  obterConfigOperacao: () => request<ConfigOperacao>('/config/operacao'),
  salvarConfigOperacao: (dados: Partial<ConfigOperacao>) =>
    request<ConfigOperacao>('/config/operacao', { method: 'POST', body: JSON.stringify(dados) }),

  // Dashboard Analítico & Inteligência de Negócio
  obterDashboardOverview: (filtros?: { inicio?: string; fim?: string } | string) => {
    const q = typeof filtros === 'string'
      ? `?data=${encodeURIComponent(filtros)}`
      : filtros ? `?${new URLSearchParams(Object.entries(filtros).filter(([_, v]) => Boolean(v))).toString()}` : '';
    return request<any>(`/dashboard/overview${q}`);
  },

  // Motor Central de Configuração (SSOT) & Adaptação de Nichos
  obterSettings: () => request<any>('/settings'),
  salvarSettings: (dados: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(dados) }),
  uploadLogo: (imagemBase64: string, extensao = 'png') =>
    request<{ url: string; caminhoFisico: string }>('/settings/upload-logo', { method: 'POST', body: JSON.stringify({ imagemBase64, extensao }) }),

  exportarCargaMgvUrl: (marca = 'TOLEDO') => `${getApiBaseUrl()}/balanca/exportar-mgv?marca=${marca}`,
  exportarCargaBalanca: (marca: string, diretorioDestino?: string) =>
    request<any>('/balanca/exportar-carga', { method: 'POST', body: JSON.stringify({ marca, diretorioDestino }) }),
  obterDiretoriosCarga: () => request<Record<string, string>>('/balanca/diretorios-carga'),

  // Módulo Restaurante & Comanda Mobile
  obterQrCodeMobile: (porta = '5174', tipo: 'mobile' | 'kds' = 'mobile') => request<{ ip: string; porta: string; url: string; qrcode: string; tipo?: string }>(`/qrcode-mobile?porta=${porta}&tipo=${tipo}`),
  obterMesasRestaurante: () => request<any[]>('/restaurante/mesas'),
  lancarPedidoRestaurante: (dados: any) => request<any>('/restaurante/pedido', { method: 'POST', body: JSON.stringify(dados) }),
  liberarMesaRestaurante: (mesa_numero: number) => request<any>('/restaurante/liberar', { method: 'POST', body: JSON.stringify({ mesa_numero }) }),

  // Multi-Database Tenant
  switchTenant: (tenant: string) => request<{ tenant: string; database: string }>('/tenant/switch', { method: 'POST', body: JSON.stringify({ tenant }) }),
  obterTenantAtual: () => request<{ tenant: string; database: string }>('/tenant/current'),

  // Automação Balança de Checkout Plug and Play (Serial / USB)
  testarBalanca: (modelo?: string, porta?: string) => request<any>(`/balanca/testar${modelo || porta ? `?${new URLSearchParams({ ...(modelo ? { modelo } : {}), ...(porta ? { porta } : {}) }).toString()}` : ''}`),
  obterStatusBalanca: () => request<any>('/balanca/status'),
  listarPortasBalanca: () => request<any>('/balanca/portas'),
  salvarConfigBalanca: (dados: any) => request<any>('/balanca/config', { method: 'POST', body: JSON.stringify(dados) }),

  // Configuração Fiscal Multi-Terminal & Séries por Caixa
  obterCaixasFiscais: () => request<{ detectouMultiplosTerminais: boolean; totalCaixas: number; caixas: any[] }>('/fiscal/caixas'),
  salvarCaixasFiscais: (caixas: any[]) => request<any>('/fiscal/caixas', { method: 'POST', body: JSON.stringify({ caixas }) }),
  terminalHeartbeat: (numeroCaixa: string, apelido?: string) => request<any>('/fiscal/caixas/heartbeat', { method: 'POST', body: JSON.stringify({ numeroCaixa, apelido }) }),
};
