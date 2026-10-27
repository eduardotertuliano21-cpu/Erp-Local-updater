import { Bonjour } from 'bonjour-service';
import os from 'node:os';

export interface DiscoveryInfo {
  role: 'MASTER' | 'SLAVE';
  isMaster: boolean;
  masterIp: string | null;
  masterPort: number;
  localIp: string;
  localPort: number;
  serviceDiscovered: boolean;
}

export class ZeroConfService {
  private bonjour: Bonjour | null = null;
  private role: 'MASTER' | 'SLAVE' = 'MASTER';
  private masterIp: string | null = null;
  private masterPort = 5000;
  private localPort: number;
  private serviceDiscovered = false;

  constructor(port = 5000) {
    this.localPort = port;
  }

  public getLocalIp(): string {
    const interfaces = os.networkInterfaces();
    let fallback = '127.0.0.1';
    for (const name of Object.keys(interfaces)) {
      const lower = name.toLowerCase();
      if (
        lower.includes('vethernet') ||
        lower.includes('virtual') ||
        lower.includes('wsl') ||
        lower.includes('vmware') ||
        lower.includes('hyper-v') ||
        lower.includes('docker') ||
        lower.includes('tailscale') ||
        lower.includes('zerotier')
      ) {
        continue;
      }
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
            return iface.address;
          }
          fallback = iface.address;
        }
      }
    }
    return fallback;
  }

  public async iniciarDescoberta(timeoutMs = 3000): Promise<DiscoveryInfo> {
    try {
      this.bonjour = new Bonjour();

      // Procura por serviço _clickstorm._tcp
      const browser = this.bonjour.find({ type: 'clickstorm' });

      await new Promise<void>((resolve) => {
        let timer: NodeJS.Timeout;

        browser.on('up', (service) => {
          const serviceIp = service.addresses?.[0] || service.host;
          const localIp = this.getLocalIp();

          // Evita se auto-descobrir como outro servidor
          if (serviceIp && serviceIp !== localIp && serviceIp !== '127.0.0.1') {
            this.role = 'SLAVE';
            this.masterIp = serviceIp;
            this.masterPort = service.port || 5000;
            this.serviceDiscovered = true;
            clearTimeout(timer);
            resolve();
          }
        });

        timer = setTimeout(() => {
          resolve();
        }, timeoutMs);
      });

      // Se nenhum outro master foi localizado, este nó assume a liderança como MASTER
      if (this.role === 'MASTER') {
        this.masterIp = this.getLocalIp();
        this.publicarMaster();
      }
    } catch (err) {
      console.warn('[ZeroConf] Falha ao escanear rede mDNS, operando como Master autônomo:', err);
      this.role = 'MASTER';
      this.masterIp = this.getLocalIp();
    }

    return this.obterInfo();
  }

  public publicarMaster(): void {
    if (!this.bonjour) this.bonjour = new Bonjour();
    try {
      this.bonjour.publish({
        name: `ClickStorm-Master-${os.hostname()}`,
        type: 'clickstorm',
        port: this.localPort,
        txt: { version: '2.0', role: 'MASTER' },
      });
      console.log(`📡 [ZeroConf] Publicando serviço _clickstorm._tcp na porta ${this.localPort}`);
    } catch (err) {
      console.warn('[ZeroConf] Erro ao publicar anúncio mDNS:', err);
    }
  }

  public obterInfo(): DiscoveryInfo {
    return {
      role: this.role,
      isMaster: this.role === 'MASTER',
      masterIp: this.masterIp,
      masterPort: this.masterPort,
      localIp: this.getLocalIp(),
      localPort: this.localPort,
      serviceDiscovered: this.serviceDiscovered,
    };
  }

  public setMasterIpManual(ip: string, port = 5000): void {
    this.role = 'SLAVE';
    this.masterIp = ip;
    this.masterPort = port;
    this.serviceDiscovered = true;
  }

  public promoverMaster(): void {
    this.role = 'MASTER';
    this.masterIp = this.getLocalIp();
    this.publicarMaster();
  }
}
