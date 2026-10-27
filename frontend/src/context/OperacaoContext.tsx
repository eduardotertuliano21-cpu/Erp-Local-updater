import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ConfigOperacao } from '../types/pdv.js';
import { api } from '../services/api.js';

interface OperacaoContextType {
  config: ConfigOperacao;
  carregando: boolean;
  atualizarConfig: (dados: Partial<ConfigOperacao>) => Promise<boolean>;
  tocarBip: () => void;
  tocarAlerta: () => void;
  validarDesconto: (percentual: number) => { permitido: boolean; precisaGerente: boolean; mensagem?: string };
}

const configPadrao: ConfigOperacao = {
  id: 'default',
  desconto_maximo_operador: 5.0,
  exigir_gerente_desconto: 0,
  permitir_alterar_preco: 0,
  abertura_gaveta_sem_venda: 1,
  estoque_negativo: 'AVISAR',
  agrupar_itens_repetidos: 1,
  foco_balanca_automatico: 1,
  comportamento_impressao: 'PERGUNTAR',
  pagamento_padrao: 'DINHEIRO',
  exibir_fotos_busca: 0,
  som_bip_sistema: 1,
};

const OperacaoContext = createContext<OperacaoContextType | undefined>(undefined);

export const OperacaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigOperacao>(configPadrao);
  const [carregando, setCarregando] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const carregarConfig = useCallback(async () => {
    try {
      const res = await api.obterConfigOperacao();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    } catch (e) {
      console.error('Erro ao carregar configurações de operação:', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarConfig();
  }, [carregarConfig]);

  const atualizarConfig = async (dados: Partial<ConfigOperacao>): Promise<boolean> => {
    try {
      const res = await api.salvarConfigOperacao(dados);
      if (res.success && res.data) {
        setConfig(res.data);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Erro ao atualizar configurações:', e);
      return false;
    }
  };

  // Síntese de som digital (Bip de Leitor de Código de Barras e Alerta)
  const obterAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const tocarBip = useCallback(() => {
    if (!config.som_bip_sistema) return;
    try {
      const ctx = obterAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // 1760Hz (nota A6 - bip nítido de caixa)

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Ignora falhas de áudio
    }
  }, [config.som_bip_sistema]);

  const tocarAlerta = useCallback(() => {
    if (!config.som_bip_sistema) return;
    try {
      const ctx = obterAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime); // 320Hz tom de advertência

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignora falhas de áudio
    }
  }, [config.som_bip_sistema]);

  const validarDesconto = useCallback(
    (percentual: number) => {
      if (config.exigir_gerente_desconto === 1 && percentual > 0) {
        return {
          permitido: false,
          precisaGerente: true,
          mensagem: 'Qualquer concessão de desconto exige autorização do gerente.',
        };
      }

      if (percentual > config.desconto_maximo_operador) {
        return {
          permitido: false,
          precisaGerente: true,
          mensagem: `Desconto de ${percentual.toFixed(1)}% excede o teto permitido de ${config.desconto_maximo_operador}% para o operador. Exige autorização de gerente.`,
        };
      }

      return { permitido: true, precisaGerente: false };
    },
    [config.desconto_maximo_operador, config.exigir_gerente_desconto]
  );

  return (
    <OperacaoContext.Provider
      value={{
        config,
        carregando,
        atualizarConfig,
        tocarBip,
        tocarAlerta,
        validarDesconto,
      }}
    >
      {children}
    </OperacaoContext.Provider>
  );
};

export const useOperacao = (): OperacaoContextType => {
  const context = useContext(OperacaoContext);
  if (!context) {
    throw new Error('useOperacao deve ser usado dentro de um OperacaoProvider');
  }
  return context;
};
