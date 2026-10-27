import { useState, useCallback } from 'react';

interface OverrideState {
  isOpen: boolean;
  motivo: string;
  acaoDescricao?: string;
  callback?: (token: string, supervisorNome: string) => void;
}

export function useSupervisorOverride() {
  const [overrideState, setOverrideState] = useState<OverrideState>({
    isOpen: false,
    motivo: '',
  });

  const executarComSupervisor = useCallback((
    motivo: string,
    acaoAExecutar: (token?: string, supervisorNome?: string) => void,
    acaoDescricao?: string
  ) => {
    const nivelUsuario = localStorage.getItem('clickstorm_user_nivel') || 'OPERADOR';
    // Se for ADMIN ou GERENTE com permissão total direta, pode prosseguir
    if (nivelUsuario === 'ADMIN') {
      acaoAExecutar('TOKEN_ADMIN_DIRETO', 'ADMINISTRADOR');
      return;
    }

    setOverrideState({
      isOpen: true,
      motivo,
      acaoDescricao,
      callback: (token, supervisorNome) => {
        acaoAExecutar(token, supervisorNome);
      },
    });
  }, []);

  const fecharOverride = useCallback(() => {
    setOverrideState((prev) => ({ ...prev, isOpen: false, callback: undefined }));
  }, []);

  const handleAutorizado = useCallback((token: string, supervisorNome: string) => {
    if (overrideState.callback) {
      overrideState.callback(token, supervisorNome);
    }
  }, [overrideState]);

  return {
    executarComSupervisor,
    isOverrideOpen: overrideState.isOpen,
    overrideMotivo: overrideState.motivo,
    overrideDescricao: overrideState.acaoDescricao,
    fecharOverride,
    handleAutorizado,
  };
}
