import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, formatarLogoUrl } from '../services/api.js';

export interface ConfigLoja {
  id: string;
  nome_loja: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria?: string;
  slogan?: string;
  cnpj?: string;
  licenca_token?: string;
  modo_operacao: 'MASTER' | 'SLAVE';
  master_ip?: string;
  segmento?: string;
  tema_visual?: 'OBSIDIAN' | 'OLED' | 'ALTO_CONTRASTE';
  densidade?: 'COMPACTO' | 'PADRAO' | 'CONFORTAVEL';
  ramo_atuacao?: 'varejo' | 'restaurante' | 'ambos';
  comportamento_fiscal_pdv?: 'SEMPRE' | 'MANUAL';
  sistema_configurado?: boolean | number;
  razao_social?: string;
  endereco?: string;
  token_csc?: string;
  id_token_csc?: string;
  balanca_checkout_ativa?: boolean | number;
  balanca_modelo?: string;
  balanca_porta?: string;
}

interface ThemeContextType {
  config: ConfigLoja;
  carregando: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
  atualizarConfig: (dados: Partial<ConfigLoja>) => Promise<boolean>;
  recarregarConfig: () => Promise<void>;
}

const defaultConfig: ConfigLoja = {
  id: 'default',
  nome_loja: 'CLICKSTORM PDV',
  cor_primaria: '#0ea5e9',
  cor_secundaria: '#0284c7',
  slogan: 'Automação Comercial de Alta Performance',
  modo_operacao: 'MASTER',
  segmento: 'GERAL',
  tema_visual: 'OBSIDIAN',
  densidade: 'PADRAO',
  ramo_atuacao: 'varejo',
};

const ThemeContext = createContext<ThemeContextType>({
  config: defaultConfig,
  carregando: true,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
  atualizarConfig: async () => false,
  recarregarConfig: async () => {},
});

function ajustarBrilhoHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexParaRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function aplicarVariaveisCss(corHex: string, _temaVisual: string = 'OBSIDIAN', densidade: string = 'PADRAO'): void {
  const corValida = corHex && corHex.startsWith('#') && corHex.length >= 7 ? corHex : '#10b981';
  const root = document.documentElement;

  const hoverColor = ajustarBrilhoHex(corValida, -20);
  const lightColor = hexParaRgba(corValida, 0.15);

  root.style.setProperty('--brand-primary', corValida);
  root.style.setProperty('--brand-primary-hover', hoverColor);
  root.style.setProperty('--brand-primary-light', lightColor);
  root.style.setProperty('--color-brand', corValida);
  root.style.setProperty('--color-brand-hover', hoverColor);
  root.style.setProperty('--color-brand-light', lightColor);

  // Densidade
  root.classList.remove('density-compact', 'density-normal', 'density-spacious');
  if (densidade === 'COMPACTO') {
    root.classList.add('density-compact');
  } else if (densidade === 'CONFORTAVEL') {
    root.classList.add('density-spacious');
  } else {
    root.classList.add('density-normal');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigLoja>(defaultConfig);
  const [carregando, setCarregando] = useState(true);
  
  // Padrão do sistema: Light Theme (fundo slate-50, cards brancos). Salva no localStorage.
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('clickstorm_theme_mode');
      return salvo === 'dark';
    }
    return false;
  });

  const aplicarModo = (dark: boolean) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (dark) {
        root.classList.add('dark');
        root.classList.remove('theme-light');
        document.body.style.backgroundColor = '#020617'; // slate-950
      } else {
        root.classList.remove('dark');
        root.classList.add('theme-light');
        document.body.style.backgroundColor = '#f8fafc'; // slate-50
      }
    }
  };

  useEffect(() => {
    aplicarModo(isDark);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const proximo = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('clickstorm_theme_mode', proximo ? 'dark' : 'light');
      }
      aplicarModo(proximo);
      return proximo;
    });
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clickstorm_theme_mode', dark ? 'dark' : 'light');
    }
    aplicarModo(dark);
  };

  const carregarConfig = useCallback(async () => {
    try {
      const res = await api.obterConfigLoja();
      if (res.success && res.data) {
        const dados = { ...res.data };
        if (dados.logo_url) {
          dados.logo_url = formatarLogoUrl(dados.logo_url);
        }
        setConfig(dados);
        aplicarVariaveisCss(dados.cor_primaria || '#0ea5e9', dados.tema_visual, dados.densidade);
      } else {
        aplicarVariaveisCss(defaultConfig.cor_primaria, defaultConfig.tema_visual, defaultConfig.densidade);
      }
    } catch {
      aplicarVariaveisCss(defaultConfig.cor_primaria, defaultConfig.tema_visual, defaultConfig.densidade);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConfig();
    const interval = setInterval(carregarConfig, 10000);
    const onFocus = () => carregarConfig();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [carregarConfig]);

  const atualizarConfig = async (novosDados: Partial<ConfigLoja>): Promise<boolean> => {
    const res = await api.salvarConfigLoja(novosDados);
    if (res.success && res.data) {
      setConfig(res.data);
      aplicarVariaveisCss(
        res.data.cor_primaria || config.cor_primaria,
        res.data.tema_visual || config.tema_visual,
        res.data.densidade || config.densidade
      );
      return true;
    }
    return false;
  };

  return (
    <ThemeContext.Provider
      value={{
        config,
        carregando,
        isDark,
        toggleTheme,
        setTheme,
        atualizarConfig,
        recarregarConfig: carregarConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
