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

  public getAllLocalAddresses(): Set<string> {
    const addrs = new Set<string>([
      '127.0.0.1',
      '::1',
      'localhost',
      os.hostname().toLowerCase(),
    ]);
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.address) {
          addrs.add(iface.address.toLowerCase());
        }
      }
    }
    return addrs;
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
      const localAddresses = this.getAllLocalAddresses();
      const currentHost = os.hostname().toLowerCase();

      // Procura por serviço _clickstorm._tcp
      const browser = this.bonjour.find({ type: 'clickstorm' });

      await new Promise<void>((resolve) => {
        let timer: NodeJS.Timeout;

        browser.on('up', (service) => {
          // 1. Ignora anúncios da própria máquina (mesmo hostname ou nome de serviço)
          const serviceName = (service.name || '').toLowerCase();
          const serviceHost = (service.host || '').toLowerCase();
          if (serviceName.includes(currentHost) || serviceHost.includes(currentHost)) {
            return;
          }

          // 2. Extrai e filtra estritamente endereços IPv4 válidos (elimina IPv6 fe80 e APIPA 169.254)
          const validIpv4List = (service.addresses || []).filter((addr) => {
            if (!addr || typeof addr !== 'string') return false;
            if (addr.includes(':')) return false; // Rejeita qualquer IPv6
            if (addr.startsWith('169.254.') || addr.startsWith('127.')) return false;
            return !localAddresses.has(addr.toLowerCase());
          });

          // Se nenhum endereço for remoto e IPv4 válido, ignora o evento
          if (validIpv4List.length === 0) {
            return;
          }

          // Prioriza endereços padrão de LAN (192.168.x ou 10.x)
          const selectedMasterIp =
            validIpv4List.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.')) ||
            validIpv4List[0];

          if (selectedMasterIp) {
            this.role = 'SLAVE';
            this.masterIp = selectedMasterIp;
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

      // Se nenhum outro master remoto foi localizado, este nó assume a liderança como MASTER
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
        txt: { version: '2.0', role: 'MASTER', host: os.hostname() },
      });
      console.log(`📡 [ZeroConf] Publicando serviço _clickstorm._tcp na porta ${this.localPort}`);
    } catch (err) {
      console.warn('[ZeroConf] Erro ao publicar anúncio mDNS:', err);
    }
  }

  public obterInfo(): DiscoveryInfo {
    const localIp = this.getLocalIp();
    return {
      role: this.role,
      isMaster: this.role === 'MASTER',
      masterIp: this.role === 'MASTER' ? localIp : (this.masterIp || localIp),
      masterPort: this.masterPort,
      localIp,
      localPort: this.localPort,
      serviceDiscovered: this.serviceDiscovered,
    };
  }

  public setMasterIpManual(ip: string, port = 5000): void {
    const cleanIp = ip.trim().replace(/^https?:\/\//, '').split(':')[0];
    this.role = 'SLAVE';
    this.masterIp = cleanIp;
    this.masterPort = port;
    this.serviceDiscovered = true;
  }

  public promoverMaster(): void {
    this.role = 'MASTER';
    this.masterIp = this.getLocalIp();
    this.publicarMaster();
  }
}
