import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStoreConfig } from './ConfigProvider.js';

export type BusinessMode = 'mercado' | 'restaurante' | 'acougue' | 'autopecas' | 'assistencia' | 'roupas';

export interface TenantOption {
  id: BusinessMode;
  label: string;
  sublabel: string;
  nichoKey: string;
  iconName: string;
  cor: string;
}

export const TENANTS_OPTIONS: TenantOption[] = [
  { id: 'mercado', label: 'Mercado / Varejo', sublabel: 'Frente de Caixa Rápido', nichoKey: 'varejo_rapido', iconName: 'ShoppingBag', cor: 'text-sky-400' },
  { id: 'restaurante', label: 'Restaurante / Food', sublabel: 'Mesas e Comandas', nichoKey: 'food', iconName: 'Utensils', cor: 'text-amber-400' },
  { id: 'acougue', label: 'Açougue / Hortifrúti', sublabel: 'Pesagem por Balança', nichoKey: 'peso', iconName: 'Scale', cor: 'text-emerald-400' },
  { id: 'autopecas', label: 'Autopeças', sublabel: 'OEM e Localização Estoque', nichoKey: 'auto_pecas', iconName: 'Car', cor: 'text-purple-400' },
  { id: 'assistencia', label: 'Assistência Técnica', sublabel: 'Ordens de Serviço (OS)', nichoKey: 'assistencia', iconName: 'Wrench', cor: 'text-teal-400' },
  { id: 'roupas', label: 'Vestuário / Calçados', sublabel: 'Grades, Cores e Marcas', nichoKey: 'roupas', iconName: 'Shirt', cor: 'text-rose-400' },
];

export function normalizeBusinessMode(raw?: string | null): BusinessMode {
  if (!raw) return 'mercado';
  const val = raw.toLowerCase().trim();
  if (val.includes('rest') || val.includes('food')) return 'restaurante';
  if (val.includes('acoug') || val.includes('peso') || val.includes('horti')) return 'acougue';
  if (val.includes('peca') || val.includes('auto')) return 'autopecas';
  if (val.includes('assist') || val.includes('tecnic') || val.includes('os')) return 'assistencia';
  if (val.includes('roupa') || val.includes('calcado') || val.includes('vestuario') || val.includes('moda')) return 'roupas';
  return 'mercado';
}

interface BusinessModeContextType {
  mode: BusinessMode;
  setMode: (mode: BusinessMode) => Promise<void>;
  trocarTenant: (mode: BusinessMode) => Promise<void>;
  alternarModo: () => void;
  isRestaurante: boolean;
  isMercado: boolean;
  isAcougue: boolean;
  isAutoPecas: boolean;
  isAssistencia: boolean;
  isVestuario: boolean;
  isVarejo: boolean;
}

const STORAGE_KEY = 'clickstorm_business_mode';

const BusinessModeContext = createContext<BusinessModeContextType>({
  mode: 'mercado',
  setMode: async () => {},
  trocarTenant: async () => {},
  alternarModo: () => {},
  isRestaurante: false,
  isMercado: true,
  isAcougue: false,
  isAutoPecas: false,
  isAssistencia: false,
  isVestuario: false,
  isVarejo: true,
});

export const BusinessModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useStoreConfig();

  const [mode, setModeState] = useState<BusinessMode>(() => {
    const rawRamo = (config as any)?.ramo_atuacao || config?.segment;
    if (rawRamo) return normalizeBusinessMode(rawRamo);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeBusinessMode(saved);
    }
    return 'mercado';
  });

  useEffect(() => {
    const rawRamo = (config as any)?.ramo_atuacao || config?.segment;
    if (rawRamo) {
      const modeFromConfig = normalizeBusinessMode(rawRamo);
      setModeState(modeFromConfig);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, modeFromConfig);
      }
    }
  }, [(config as any)?.ramo_atuacao, config?.segment]);

  const trocarTenant = async (newMode: BusinessMode) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newMode);
      }
      setModeState(newMode);
      await api.switchTenant(newMode);
    } catch (err) {
      console.warn('Erro ao alternar tenant no backend:', err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const setMode = async (newMode: BusinessMode) => {
    await trocarTenant(newMode);
  };

  const alternarModo = () => {
    const proximo: BusinessMode = mode === 'mercado' ? 'restaurante' : 'mercado';
    trocarTenant(proximo);
  };

  return (
    <BusinessModeContext.Provider
      value={{
        mode,
        setMode,
        trocarTenant,
        alternarModo,
        isRestaurante: mode === 'restaurante',
        isMercado: mode === 'mercado',
        isAcougue: mode === 'acougue',
        isAutoPecas: mode === 'autopecas',
        isAssistencia: mode === 'assistencia',
        isVestuario: mode === 'roupas',
        isVarejo: mode === 'mercado' || mode === 'roupas',
      }}
    >
      {children}
    </BusinessModeContext.Provider>
  );
};

export const useBusinessMode = () => useContext(BusinessModeContext);
