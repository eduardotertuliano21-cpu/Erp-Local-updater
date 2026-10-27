import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

export interface PrinterConfig {
  tipo: 'TCP' | 'WINDOWS_SPOOLER' | 'SIMULADOR_ARQUIVO';
  tcpHost?: string;
  tcpPort?: number;
  nomeImpressoraWindows?: string;
}

export class RawPrinterDriver {
  private config: PrinterConfig;

  constructor(config?: Partial<PrinterConfig>) {
    this.config = {
      tipo: config?.tipo || (process.env.PRINTER_TCP_HOST ? 'TCP' : 'SIMULADOR_ARQUIVO'),
      tcpHost: config?.tcpHost || process.env.PRINTER_TCP_HOST || '127.0.0.1',
      tcpPort: config?.tcpPort || parseInt(process.env.PRINTER_TCP_PORT || '9100', 10),
      nomeImpressoraWindows: config?.nomeImpressoraWindows || 'POS-80',
    };
  }

  public async enviarBytes(bytesHex: string): Promise<{ sucesso: boolean; modo: string; detalhe: string }> {
    const buffer = Buffer.from(bytesHex, 'hex');

    if (this.config.tipo === 'TCP') {
      try {
        const ok = await this.enviarViaTcp(buffer, this.config.tcpHost!, this.config.tcpPort!);
        return { sucesso: ok, modo: 'TCP', detalhe: `${this.config.tcpHost}:${this.config.tcpPort}` };
      } catch (err: any) {
        // Fallback para arquivo simulador se impressora de rede estiver desligada
        this.salvarEmArquivoSimulador(buffer);
        return { sucesso: false, modo: 'FALLBACK_SIMULADOR', detalhe: err.message };
      }
    }

    // Modo simulador de arquivo padrão (ideal para desenvolvimento e contingência local)
    const arquivoPath = this.salvarEmArquivoSimulador(buffer);
    return {
      sucesso: true,
      modo: 'SIMULADOR_ARQUIVO',
      detalhe: `Salvo com sucesso em: ${arquivoPath}`,
    };
  }

  private enviarViaTcp(buffer: Buffer, host: string, port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.connect(port, host, () => {
        socket.write(buffer, () => {
          socket.end();
          resolve(true);
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Timeout ao conectar na impressora ${host}:${port}`));
      });
    });
  }

  private salvarEmArquivoSimulador(buffer: Buffer): string {
    const baseDir = process.env.CLICKSTORM_DATA_DIR || path.resolve(process.cwd(), 'data');
    const spoolDir = path.join(baseDir, 'spooler');
    if (!fs.existsSync(spoolDir)) {
      fs.mkdirSync(spoolDir, { recursive: true });
    }
    const arquivo = path.join(spoolDir, 'ultimo_cupom_escpos.bin');
    fs.writeFileSync(arquivo, buffer);
    return arquivo;
  }
}
