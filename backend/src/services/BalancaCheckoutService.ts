import { SerialPort } from 'serialport';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';

export type ModeloBalanca = 'TOLEDO' | 'FILIZOLA' | 'ELGIN' | 'URANO';

export interface LeituraBalancaResult {
  sucesso: boolean;
  peso?: number;
  unidade?: string;
  porta?: string;
  modelo?: ModeloBalanca;
  estavel?: boolean;
  erro?: string;
  portasDisponiveis?: string[];
}

export class BalancaCheckoutService {
  private static instance: BalancaCheckoutService;
  private configRepo = new ConfigLojaRepository();
  private portaAtivaCache: string | null = null;
  private ultimoPesoLido: number = 0;
  private ultimaLeituraTimestamp: number = 0;

  public static getInstance(): BalancaCheckoutService {
    if (!BalancaCheckoutService.instance) {
      BalancaCheckoutService.instance = new BalancaCheckoutService();
    }
    return BalancaCheckoutService.instance;
  }

  public async listarPortas(): Promise<Array<{ path: string; manufacturer?: string; friendlyName?: string }>> {
    try {
      const ports = await SerialPort.list();
      return ports.map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer,
        friendlyName: (p as any).friendlyName || p.path,
      }));
    } catch (err: any) {
      console.warn('[BalancaCheckoutService] Erro ao listar portas seriais:', err.message);
      return [];
    }
  }

  public async obterStatus(): Promise<{
    ativa: boolean;
    modelo: ModeloBalanca;
    portaConfigurada: string;
    portaAtiva: string | null;
    portasDisponiveis: string[];
    ultimoPeso: number;
  }> {
    const config = this.configRepo.obter();
    const portas = await this.listarPortas();
    return {
      ativa: Boolean(config.balanca_checkout_ativa),
      modelo: (config.balanca_modelo as ModeloBalanca) || 'TOLEDO',
      portaConfigurada: config.balanca_porta || 'AUTO',
      portaAtiva: this.portaAtivaCache,
      portasDisponiveis: portas.map((p) => p.path),
      ultimoPeso: this.ultimoPesoLido,
    };
  }

  public decodificarTramaPeso(trama: string | Buffer): { peso: number; estavel: boolean } | null {
    const raw = typeof trama === 'string' ? trama : trama.toString('ascii');
    if (!raw || raw.length === 0) return null;

    // 1. Tenta formato com ponto/vírgula explícito (ex: " 1.250 kg" ou "P=1.250")
    const matchDecimal = raw.match(/([0-9]{1,3}[.,][0-9]{2,3})/);
    if (matchDecimal) {
      const num = parseFloat(matchDecimal[1].replace(',', '.'));
      if (!isNaN(num) && num >= 0 && num <= 300) {
        return { peso: num, estavel: !raw.includes('?') && !raw.includes('I') };
      }
    }

    // 2. Tenta formato padrão STX...ETX com 5 ou 6 dígitos contíguos (ex: \x0201250\x03)
    const matchDigitos = raw.match(/\x02?([0-9]{5,6})\x03?/);
    if (matchDigitos) {
      const digitos = matchDigitos[1];
      const num = parseInt(digitos, 10) / 1000;
      if (!isNaN(num) && num >= 0 && num <= 300) {
        return { peso: parseFloat(num.toFixed(3)), estavel: true };
      }
    }

    // 3. Fallback: Qualquer bloco de 5 dígitos na string limpa
    const cleanNumbers = raw.replace(/\D/g, '');
    if (cleanNumbers.length >= 5) {
      const candidate = cleanNumbers.slice(-5);
      const num = parseInt(candidate, 10) / 1000;
      if (!isNaN(num) && num <= 300) {
        return { peso: parseFloat(num.toFixed(3)), estavel: true };
      }
    }

    return null;
  }

  private async sondarPorta(
    portaPath: string,
    baudRate: number,
    timeoutMs = 1200
  ): Promise<{ peso: number; estavel: boolean } | null> {
    return new Promise((resolve) => {
      let port: SerialPort | null = null;
      let resolvido = false;
      let timer: NodeJS.Timeout | null = null;

      const fecharELimpar = (res: { peso: number; estavel: boolean } | null) => {
        if (resolvido) return;
        resolvido = true;
        if (timer) clearTimeout(timer);
        if (port && port.isOpen) {
          try {
            port.close();
          } catch {}
        }
        resolve(res);
      };

      timer = setTimeout(() => fecharELimpar(null), timeoutMs);

      try {
        port = new SerialPort({
          path: portaPath,
          baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          autoOpen: false,
        });

        port.on('error', () => fecharELimpar(null));

        port.open((openErr) => {
          if (openErr) return fecharELimpar(null);

          let bufferRecebido = '';

          port!.on('data', (chunk: Buffer) => {
            bufferRecebido += chunk.toString('ascii');
            const decod = this.decodificarTramaPeso(bufferRecebido);
            if (decod !== null) {
              fecharELimpar(decod);
            }
          });

          // Envia caractere de interrogacao/demanda padrao ENQ (0x05)
          try {
            port!.write(Buffer.from([0x05]));
          } catch {}
        });
      } catch {
        fecharELimpar(null);
      }
    });
  }

  public async lerPeso(
    modeloManual?: ModeloBalanca,
    portaManual?: string
  ): Promise<LeituraBalancaResult> {
    const config = this.configRepo.obter();
    const modelo: ModeloBalanca = (modeloManual || config.balanca_modelo || 'TOLEDO') as ModeloBalanca;
    const portaConfig = portaManual || config.balanca_porta || 'AUTO';

    const portasDisponiveis = await this.listarPortas();
    const caminhosDisponiveis = portasDisponiveis.map((p) => p.path);

    if (caminhosDisponiveis.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhuma porta serial (COM / USB) detectada no sistema operacional.',
        modelo,
        portasDisponiveis: [],
      };
    }

    const baudRates = [9600, 2400];

    // 1. Se havia porta ativa em cache e ainda existe no SO, tenta direto nela
    if (portaConfig === 'AUTO' && this.portaAtivaCache && caminhosDisponiveis.includes(this.portaAtivaCache)) {
      for (const br of baudRates) {
        const res = await this.sondarPorta(this.portaAtivaCache, br, 800);
        if (res) {
          this.ultimoPesoLido = res.peso;
          this.ultimaLeituraTimestamp = Date.now();
          return {
            sucesso: true,
            peso: res.peso,
            unidade: 'kg',
            porta: this.portaAtivaCache,
            modelo,
            estavel: res.estavel,
          };
        }
      }
      // Se falhou na porta de cache, reseta cache para forçar auto-scan de cura
      this.portaAtivaCache = null;
    }

    // 2. Se porta configurada manualmente
    if (portaConfig !== 'AUTO') {
      if (!caminhosDisponiveis.includes(portaConfig)) {
        return {
          sucesso: false,
          erro: `A porta serial configurada (${portaConfig}) não está conectada no momento.`,
          porta: portaConfig,
          modelo,
          portasDisponiveis: caminhosDisponiveis,
        };
      }
      for (const br of baudRates) {
        const res = await this.sondarPorta(portaConfig, br, 1200);
        if (res) {
          this.portaAtivaCache = portaConfig;
          this.ultimoPesoLido = res.peso;
          this.ultimaLeituraTimestamp = Date.now();
          return {
            sucesso: true,
            peso: res.peso,
            unidade: 'kg',
            porta: portaConfig,
            modelo,
            estavel: res.estavel,
          };
        }
      }
      return {
        sucesso: false,
        erro: `Porta ${portaConfig} encontrada, mas a balança ${modelo} não respondeu à solicitação de peso. Verifique a velocidade (9600/2400) e o cabo.`,
        porta: portaConfig,
        modelo,
        portasDisponiveis: caminhosDisponiveis,
      };
    }

    // 3. Modo AUTO: Varredura Plug and Play em todas as portas seriais disponíveis
    for (const portaPath of caminhosDisponiveis) {
      for (const br of baudRates) {
        const res = await this.sondarPorta(portaPath, br, 900);
        if (res) {
          this.portaAtivaCache = portaPath;
          this.ultimoPesoLido = res.peso;
          this.ultimaLeituraTimestamp = Date.now();
          return {
            sucesso: true,
            peso: res.peso,
            unidade: 'kg',
            porta: portaPath,
            modelo,
            estavel: res.estavel,
          };
        }
      }
    }

    return {
      sucesso: false,
      erro: `Varredura concluída: Nenhuma balança respondeu nas portas [${caminhosDisponiveis.join(', ')}]. Certifique-se de que a balança está ligada e conectada via Serial/USB.`,
      modelo,
      portasDisponiveis: caminhosDisponiveis,
    };
  }
}
