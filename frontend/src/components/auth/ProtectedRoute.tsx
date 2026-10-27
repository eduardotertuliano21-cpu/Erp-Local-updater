import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AccessDeniedView } from './AccessDeniedView.js';
import type { PermissoesUsuario } from '../../types/auth.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissao?: keyof PermissoesUsuario | string;
  motivo?: string;
  onVoltarPdv?: () => void;
}

/**
 * Wrapper de Rota Protegida (Deep Route Protection).
 * Valida hierarquia e permissões no contexto antes de renderizar qualquer visão.
 * Intercepta acessos indevidos exibindo AccessDeniedView se o usuário não possuir acesso.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissao,
  motivo,
  onVoltarPdv = () => {},
}) => {
  const { temPermissao, usuario, exigirAutenticacao } = useAuth();

  // Modo Porteira Aberta: se exigir_autenticacao for false, renderiza livremente
  if (!exigirAutenticacao) {
    return <>{children}</>;
  }

  // Se exigir permissão específica e o usuário não possuir
  if (permissao && !temPermissao(permissao)) {
    const motivoPadrao =
      motivo ||
      `Seu usuário (${usuario?.nome || 'Operador'} - ${usuario?.hierarquia || 'OPERADOR'}) não possui permissão para acessar esta área gerencial.`;

    return <AccessDeniedView onVoltarPdv={onVoltarPdv} motivo={motivoPadrao} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
