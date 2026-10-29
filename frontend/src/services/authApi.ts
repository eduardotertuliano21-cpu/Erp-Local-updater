import { getApiBaseUrl } from './api.js';
import type { ApiResponse } from '../types/pdv.js';
import type {
  UsuarioDTO,
  LoginResponseData,
  RespostaStatusCaixaUsuario,
  SessaoCaixaDTO,
  HierarquiaUsuario,
  PermissoesUsuario,
} from '../types/auth.js';

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const baseUrl = getApiBaseUrl();
    const isMob = typeof window !== 'undefined' && (window.location.search.includes('mobile=1') || window.location.search.includes('kds=1') || window.location.pathname.startsWith('/cardapio') || window.location.pathname.startsWith('/kds'));
    const ramo = isMob ? 'restaurante' : (typeof window !== 'undefined' ? (localStorage.getItem('clickstorm_business_mode') || 'mercado') : 'mercado');
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-ramo-atuacao': ramo,
        'x-tenant': ramo,
        ...(options.headers || {}),
      },
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro ao conectar ao servidor de autenticação',
    };
  }
}

export const authApi = {
  login: (login: string, senha: string) =>
    authFetch<LoginResponseData>('/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha }),
    }),

  validarPinGarcom: (pin: string) =>
    authFetch<{ nome: string; matricula: string }>('/auth/validar-pin-garcom', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  validarCaixa: (usuarioId: string) =>
    authFetch<RespostaStatusCaixaUsuario>(`/validar-caixa/${encodeURIComponent(usuarioId)}`),

  abrirCaixa: (usuarioId: string, saldoInicial: number) =>
    authFetch<SessaoCaixaDTO>('/abrir-caixa', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, saldoInicial }),
    }),

  fecharCaixa: (sessaoId: string, saldoFinal: number, observacoes?: string) =>
    authFetch<{ fechado: boolean }>('/fechar-caixa', {
      method: 'POST',
      body: JSON.stringify({ sessaoId, saldoFinal, observacoes }),
    }),

  listarUsuarios: () => authFetch<UsuarioDTO[]>('/usuarios'),

  obterUsuario: (id: string) => authFetch<UsuarioDTO>(`/usuarios/${id}`),

  criarUsuario: (dados: {
    nome: string;
    login: string;
    senha: string;
    hierarquia: HierarquiaUsuario;
    permissoes?: Partial<PermissoesUsuario>;
  }) =>
    authFetch<UsuarioDTO>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atualizarUsuario: (
    id: string,
    dados: {
      nome?: string;
      login?: string;
      senha?: string;
      hierarquia?: HierarquiaUsuario;
      ativo?: boolean;
      permissoes?: Partial<PermissoesUsuario>;
    }
  ) =>
    authFetch<UsuarioDTO>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    }),

  excluirUsuario: (id: string) =>
    authFetch<{ success: boolean }>(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};
