import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UsuarioDTO,
  SessaoCaixaDTO,
  StatusValidacaoCaixa,
  PermissoesUsuario,
  HierarquiaUsuario,
} from '../types/auth.js';
import { authApi } from '../services/authApi.js';
import { enterpriseApi } from '../services/enterpriseApi.js';

export const ADMIN_VIRTUAL: UsuarioDTO = {
  id: 'usr_admin_virtual',
  nome: 'Administrador (Livre)',
  login: 'admin',
  hierarquia: 'ADMIN',
  ativo: true,
  permissoes: {
    pode_cancelar_venda: true,
    pode_dar_desconto: true,
    pode_ver_relatorios: true,
    acessa_estoque: true,
    acessa_financeiro: true,
    acessa_configuracoes: true,
  },
};

interface AuthContextType {
  usuario: UsuarioDTO | null;
  sessaoCaixa: SessaoCaixaDTO | null;
  statusCaixa: StatusValidacaoCaixa;
  forcarFechamentoDiario: boolean;
  controleAcessoEstrito: boolean;
  exigirAutenticacao: boolean;
  carregando: boolean;
  login: (login: string, senha: string) => Promise<{ success: boolean; error?: string; hierarquia?: HierarquiaUsuario }>;
  logout: () => void;
  abrirCaixa: (saldoInicial: number) => Promise<boolean>;
  fecharCaixa: (saldoFinal: number, observacoes?: string) => Promise<boolean>;
  revalidarCaixa: () => Promise<void>;
  temPermissao: (chave: keyof PermissoesUsuario | string) => boolean;
  setExigirAutenticacao: (valor: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'clickstorm_auth_user_v2';
const STORAGE_EXIGIR_AUTH_KEY = 'clickstorm_exigir_autenticacao';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exigirAutenticacao, setExigirAutenticacaoState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_EXIGIR_AUTH_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [usuario, setUsuario] = useState<UsuarioDTO | null>(() => {
    try {
      const savedExigir = localStorage.getItem(STORAGE_EXIGIR_AUTH_KEY);
      if (savedExigir === 'false') return ADMIN_VIRTUAL;
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sessaoCaixa, setSessaoCaixa] = useState<SessaoCaixaDTO | null>(null);
  const [statusCaixa, setStatusCaixa] = useState<StatusValidacaoCaixa>('FECHADO');
  const [forcarFechamentoDiario, setForcarFechamentoDiario] = useState<boolean>(true);
  const [controleAcessoEstrito, setControleAcessoEstrito] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(false);

  const setExigirAutenticacao = async (valor: boolean): Promise<void> => {
    setExigirAutenticacaoState(valor);
    localStorage.setItem(STORAGE_EXIGIR_AUTH_KEY, String(valor));
    try {
      await enterpriseApi.alterarExigirAutenticacaoRbac(valor);
    } catch {}
    if (!valor && !usuario) {
      setUsuario(ADMIN_VIRTUAL);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(ADMIN_VIRTUAL));
    }
  };

  const revalidarCaixa = useCallback(async () => {
    if (!usuario) {
      setSessaoCaixa(null);
      setStatusCaixa('FECHADO');
      return;
    }

    try {
      const res = await authApi.validarCaixa(usuario.id);
      if (res.success && res.data) {
        setStatusCaixa(res.data.status);
        setSessaoCaixa(res.data.sessaoAberta);
        setForcarFechamentoDiario(res.data.forcarFechamentoDiario);
      }
    } catch (err) {
      console.error('[AuthContext] Falha ao validar status do caixa:', err);
    }
  }, [usuario]);

  useEffect(() => {
    enterpriseApi.obterMatrizRbac().then((res) => {
      if (res.success && res.data) {
        setControleAcessoEstrito(Boolean(res.data.estrito));
        if (res.data.exigirAutenticacao !== undefined) {
          const deveExigir = Boolean(res.data.exigirAutenticacao);
          setExigirAutenticacaoState(deveExigir);
          localStorage.setItem(STORAGE_EXIGIR_AUTH_KEY, String(deveExigir));
          if (!deveExigir && !usuario) {
            setUsuario(ADMIN_VIRTUAL);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(ADMIN_VIRTUAL));
          }
        }
      }
    }).catch(() => {});

    if (usuario) {
      revalidarCaixa();
    } else if (!exigirAutenticacao) {
      setUsuario(ADMIN_VIRTUAL);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(ADMIN_VIRTUAL));
    }
  }, [usuario, exigirAutenticacao, revalidarCaixa]);

  const login = async (loginInput: string, senhaInput: string) => {
    setCarregando(true);
    try {
      const res = await authApi.login(loginInput, senhaInput);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Credenciais inválidas' };
      }

      const { usuario: userLogged, validacaoCaixa } = res.data;
      setUsuario(userLogged);
      setStatusCaixa(validacaoCaixa.status);
      setSessaoCaixa(validacaoCaixa.sessaoAberta);
      setForcarFechamentoDiario(validacaoCaixa.forcarFechamentoDiario);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userLogged));

      return {
        success: true,
        hierarquia: userLogged.hierarquia,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao autenticar' };
    } finally {
      setCarregando(false);
    }
  };

  const logout = () => {
    if (!exigirAutenticacao) {
      setUsuario(ADMIN_VIRTUAL);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(ADMIN_VIRTUAL));
    } else {
      setUsuario(null);
      localStorage.removeItem(STORAGE_USER_KEY);
    }
    setSessaoCaixa(null);
    setStatusCaixa('FECHADO');
  };

  const abrirCaixa = async (saldoInicial: number): Promise<boolean> => {
    const usuarioId = usuario?.id || 'admin_virtual';
    setCarregando(true);
    try {
      const res = await authApi.abrirCaixa(usuarioId, saldoInicial);
      if (res.success && res.data) {
        setSessaoCaixa(res.data);
        setStatusCaixa('ABERTO_HOJE');
        return true;
      }
      return false;
    } finally {
      setCarregando(false);
    }
  };

  const fecharCaixa = async (saldoFinal: number, observacoes?: string): Promise<boolean> => {
    setCarregando(true);
    try {
      const sessaoId = sessaoCaixa?.id || 'atual';
      const res = await authApi.fecharCaixa(sessaoId, saldoFinal, observacoes);
      setSessaoCaixa(null);
      setStatusCaixa('FECHADO');
      await revalidarCaixa();
      return Boolean(res.success);
    } finally {
      setCarregando(false);
    }
  };

  const temPermissao = (chave: keyof PermissoesUsuario | string): boolean => {
    // Modo Porteira Aberta: se autenticação estiver desativada, acesso total liberado
    if (!exigirAutenticacao) return true;
    if (!usuario) return false;
    // Se o controle de acesso estrito estiver desativado, o sistema é 100% aberto
    if (!controleAcessoEstrito) return true;
    if (usuario.hierarquia === 'ADMIN' || usuario.hierarquia === 'GERENTE') return true;
    if (chave === 'ver_relatorios' || chave === 'pode_ver_relatorios') {
      return Boolean(usuario.permissoes?.pode_ver_relatorios);
    }
    return Boolean((usuario.permissoes as any)?.[chave]);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        sessaoCaixa,
        statusCaixa,
        forcarFechamentoDiario,
        controleAcessoEstrito,
        exigirAutenticacao,
        carregando,
        login,
        logout,
        abrirCaixa,
        fecharCaixa,
        revalidarCaixa,
        temPermissao,
        setExigirAutenticacao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return ctx;
};
