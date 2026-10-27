import type { TabelaPreco, CompraEntrada, DesossaRecord } from '../types/pdv.js';

const API_BASE = '/api';

async function req<T>(endpoint: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('clickstorm_user_id') || 'OPERADOR',
      },
      ...options,
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de comunicação local' };
  }
}

export const varejoAvancadoApi = {
  // 1. Múltiplos Códigos e Fatores de Conversão (WMS)
  listarCodigosPorProduto: (produtoId: string) =>
    req<Array<{ id: string; produto_id: string; codigo_barras: string; unidade_medida: string; fator_entrada: number; fator_saida: number }>>(`/produtos/${produtoId}/codigos-barras`),

  adicionarCodigoBarras: (produtoId: string, payload: { codigo_barras: string; unidade_medida?: string; fator_entrada?: number; fator_saida?: number }) =>
    req(`/produtos/${produtoId}/codigos-barras`, { method: 'POST', body: JSON.stringify(payload) }),

  removerCodigoBarras: (codigoId: string) =>
    req(`/produtos/codigos-barras/${codigoId}`, { method: 'DELETE' }),

  // 2. Políticas de Preço Multi-Tabela (B2B / Atacado)
  listarTabelasPreco: () =>
    req<TabelaPreco[]>('/tabelas-preco'),

  criarTabelaPreco: (descricao: string) =>
    req<TabelaPreco>('/tabelas-preco', { method: 'POST', body: JSON.stringify({ descricao }) }),

  obterPrecosTabela: (tabelaId: string) =>
    req<Record<string, number>>(`/tabelas-preco/${tabelaId}/precos`),

  salvarPrecoTabela: (tabelaId: string, produtoId: string, precoVenda: number) =>
    req(`/tabelas-preco/${tabelaId}/precos`, { method: 'POST', body: JSON.stringify({ produto_id: produtoId, preco_venda: precoVenda }) }),

  // 3. Supervisor Override (Senha / Crachá)
  autorizarSupervisor: (pinOuCracha: string, motivo: string, operadorId: string) =>
    req<{ autorizado: boolean; supervisor?: { id: string; nome: string; matricula: string }; tokenAutorizacao?: string }>('/auth/autorizar-supervisor', {
      method: 'POST',
      body: JSON.stringify({ pin: pinOuCracha, motivo, operadorId }),
    }),

  // 4. Entrada de Notas em 2 Etapas (G.E.M. - Draft Mode)
  listarCompras: () =>
    req<CompraEntrada[]>('/compras'),

  efetivarCompra: (compraId: string, itensAjustados?: any[]) =>
    req<{ sucesso: boolean; mensagem: string }>(`/compras/${compraId}/efetivar`, {
      method: 'POST',
      body: JSON.stringify({ itensAjustados }),
    }),

  desatualizarCompra: (compraId: string) =>
    req<{ sucesso: boolean; mensagem: string }>(`/compras/${compraId}/desatualizar`, {
      method: 'POST',
    }),

  // 5. Rendimento de Desossa (Açougue)
  listarDesossas: (limite = 50) =>
    req<DesossaRecord[]>(`/desossas?limite=${limite}`),

  obterDesossa: (id: string) =>
    req<DesossaRecord>(`/desossas/${id}`),

  processarDesossa: (payload: {
    produto_origem_id: string;
    produto_origem_nome: string;
    peso_origem: number;
    custo_origem_total: number;
    operador_id?: string;
    observacoes?: string;
    cortes: Array<{
      produto_destino_id: string;
      descricao: string;
      peso: number;
      preco_venda_sugerido?: number;
    }>;
  }) => req<DesossaRecord>('/desossas', { method: 'POST', body: JSON.stringify(payload) }),
};
