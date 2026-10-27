import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../services/api.js';

export type NichoSegmento = 'peso' | 'varejo_rapido' | 'auto_pecas' | 'food' | 'restaurante' | 'assistencia';

export interface StoreSettings {
  id: string;
  nome_loja: string;
  cnpj?: string;
  slogan?: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria?: string;
  tema_visual?: string;
  densidade?: string;
  modo_operacao: 'MASTER' | 'SLAVE';
  master_ip?: string;
  segment: NichoSegmento;
  ramo_atuacao?: string;
  exigir_senha_cancelamento: boolean;
  permitir_estoque_negativo: boolean;
  agrupar_itens: boolean;
  desconto_maximo_operador: number;
  ativar_crediario: boolean;
  ativar_comissao: boolean;
  ativar_delivery: boolean;
  taxa_servico_restaurante: number;
  cozinha_impressora_ip?: string;
  exibir_oem_aplicacao: boolean;
  foco_balanca_automatico: boolean;
  habilitar_convenio?: boolean;
  habilitar_whatsapp?: boolean;
  forcar_fechamento_diario?: boolean;
  comportamento_fiscal_pdv?: 'SEMPRE' | 'MANUAL';
  sistema_configurado?: boolean | number;
  token_csc?: string;
  id_token_csc?: string;
  inscricao_estadual?: string;
  crt?: number;
  codigo_municipio_ibge?: string;
  razao_social?: string;
  endereco?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  impressora_padrao?: string;
  margem_impressao?: number;
  balanca_checkout_ativa?: boolean | number;
  balanca_modelo?: 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO';
  balanca_porta?: string;
  serie_nfce?: number;
  proximo_numero_nfce?: number;
  atualizado_em?: string;
}

export const SETTINGS_PADRAO: StoreSettings = {
  id: 'default',
  nome_loja: 'CLICKSTORM PDV',
  slogan: 'Automação Comercial de Alta Performance',
  cor_primaria: '#0ea5e9',
  cor_secundaria: '#0284c7',
  tema_visual: 'OBSIDIAN',
  densidade: 'PADRAO',
  modo_operacao: 'MASTER',
  segment: 'varejo_rapido',
  exigir_senha_cancelamento: true,
  permitir_estoque_negativo: false,
  agrupar_itens: true,
  desconto_maximo_operador: 5.0,
  ativar_crediario: false,
  ativar_comissao: false,
  ativar_delivery: false,
  taxa_servico_restaurante: 10,
  exibir_oem_aplicacao: false,
  foco_balanca_automatico: true,
  habilitar_convenio: false,
  habilitar_whatsapp: true,
  forcar_fechamento_diario: true,
  comportamento_fiscal_pdv: 'MANUAL',
  sistema_configurado: false,
  inscricao_estadual: '',
  crt: 1,
  codigo_municipio_ibge: '',
  impressora_padrao: 'PADRAO_WINDOWS',
  margem_impressao: 0,
  balanca_checkout_ativa: false,
  balanca_modelo: 'TOLEDO',
  balanca_porta: 'AUTO',
  serie_nfce: 1,
  proximo_numero_nfce: 1,
};

interface ConfigContextType {
  config: StoreSettings;
  carregando: boolean;
  atualizarConfig: (dados: Partial<StoreSettings>) => Promise<boolean>;
  segment: NichoSegmento;
  isFood: boolean;
  isRestaurante: boolean;
  useScale: boolean;
  isAutoPecas: boolean;
  isAssistencia: boolean;
  isVarejoRapido: boolean;
  featureFlags: {
    crediario: boolean;
    comissao: boolean;
    delivery: boolean;
    focoBalanca: boolean;
    oemAplicacao: boolean;
    agruparItens: boolean;
    estoqueNegativo: boolean;
    senhaCancelamento: boolean;
    convenio: boolean;
    whatsapp: boolean;
  };
}

const STORAGE_KEY = 'clickstorm_ssot_settings';
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        try {
          return { ...SETTINGS_PADRAO, ...JSON.parse(salvo) };
        } catch {
          // fallback
        }
      }
    }
    return SETTINGS_PADRAO;
  });

  const [carregando, setCarregando] = useState(true);

  // Aplica cores do tema via CSS Variables no root
  const aplicarCssVariables = useCallback((cor: string, corSecundaria?: string) => {
    if (typeof document !== 'undefined') {
      const corValida = cor && cor.startsWith('#') && cor.length >= 7 ? cor : '#10b981';
      document.documentElement.style.setProperty('--color-brand', corValida);
      document.documentElement.style.setProperty('--color-brand-hover', corSecundaria || corValida);
      document.documentElement.style.setProperty('--brand-primary', corValida);
      document.documentElement.style.setProperty('--brand-primary-hover', corSecundaria || corValida);
    }
  }, []);

  const buscarSettings = useCallback(async () => {
    try {
      const res = await api.obterSettings();
      if (res.success && res.data) {
        const dadosNovos = { ...SETTINGS_PADRAO, ...res.data };
        setConfig((prev) => (JSON.stringify(prev) === JSON.stringify(dadosNovos) ? prev : dadosNovos));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosNovos));
        }
        aplicarCssVariables(dadosNovos.cor_primaria, dadosNovos.cor_secundaria);
      }
    } catch (e) {
      console.warn('Usando configurações do cache local (modo contingência offline):', e);
    } finally {
      setCarregando(false);
    }
  }, [aplicarCssVariables]);

  useEffect(() => {
    buscarSettings();
    aplicarCssVariables(config.cor_primaria, config.cor_secundaria);

    // Polling silencioso a cada 10 segundos para sincronizar edições remotas do Master Admin
    const intervaloPolling = setInterval(buscarSettings, 10000);
    return () => clearInterval(intervaloPolling);
  }, [buscarSettings, aplicarCssVariables, config.cor_primaria, config.cor_secundaria]);

  const atualizarConfig = async (dados: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await api.salvarSettings(dados);
      if (res.success && res.data) {
        const atualizado = { ...config, ...res.data };
        setConfig(atualizado);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
        }
        aplicarCssVariables(atualizado.cor_primaria, atualizado.cor_secundaria);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const segment = config.segment || 'varejo_rapido';
  const isFood = segment === 'food' || segment === 'restaurante';
  const isRestaurante = isFood;
  const useScale = segment === 'peso';
  const isAutoPecas = segment === 'auto_pecas';
  const isAssistencia = segment === 'assistencia';
  const isVarejoRapido = segment === 'varejo_rapido';

  const featureFlags = useMemo(() => ({
    crediario: config.ativar_crediario,
    comissao: config.ativar_comissao,
    delivery: config.ativar_delivery,
    focoBalanca: useScale || config.foco_balanca_automatico,
    oemAplicacao: isAutoPecas || config.exibir_oem_aplicacao,
    agruparItens: config.agrupar_itens,
    estoqueNegativo: config.permitir_estoque_negativo,
    senhaCancelamento: config.exigir_senha_cancelamento,
    convenio: Boolean(config.habilitar_convenio || config.ativar_crediario),
    whatsapp: config.habilitar_whatsapp !== false,
  }), [config, useScale, isAutoPecas]);

  return (
    <ConfigContext.Provider
      value={{
        config,
        carregando,
        atualizarConfig,
        segment,
        isFood,
        isRestaurante,
        useScale,
        isAutoPecas,
        isAssistencia,
        isVarejoRapido,
        featureFlags,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useStoreConfig = (): ConfigContextType => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error('useStoreConfig deve ser utilizado dentro de um ConfigProvider');
  }
  return ctx;
};
