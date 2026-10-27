export interface UpdateInfo {
  temAtualizacao: boolean;
  versaoAtual: string;
  versaoMaisRecente: string;
  tag: string;
  titulo: string;
  notas: string;
  dataPublicacao: string;
  urlDownload: string | null;
  tamanhoBytes: number;
  nomeArquivo: string | null;
}

export interface DownloadProgress {
  baixando: boolean;
  concluido: boolean;
  progresso: number;
  bytesBaixados: number;
  totalBytes: number;
  erro: string | null;
  caminhoArquivo: string | null;
  versaoBaixada: string | null;
}

export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => (v || '').trim().replace(/^v/i, '');
  const parse = (v: string) => clean(v).split('.').map((n) => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < 3; i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export function isNewerVersion(remoteVersion: string, localVersion: string): boolean {
  return compareSemver(remoteVersion, localVersion) > 0;
}

export const updateApi = {
  async getAppVersion(): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).desktopBridge?.getAppVersion) {
      try {
        const v = await (window as any).desktopBridge.getAppVersion();
        if (v) return String(v).replace(/^v/i, '');
      } catch {}
    }

    try {
      const res = await fetch('/api/sistema/update/versao');
      const json = await res.json();
      if (json.success && json.data?.versao) {
        return String(json.data.versao).replace(/^v/i, '');
      }
    } catch {}

    return '1.0.0';
  },

  async checarAtualizacao(): Promise<UpdateInfo> {
    const versaoInstalada = await this.getAppVersion();
    const res = await fetch('/api/sistema/update/checar');
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Falha ao checar atualização');
    }

    const info: UpdateInfo = data.data;
    info.versaoAtual = versaoInstalada;
    // Validação estrita: Só há atualização se a remota for estritamente MAIOR que a instalada
    info.temAtualizacao = isNewerVersion(info.versaoMaisRecente, versaoInstalada);

    return info;
  },

  async baixarAtualizacao(urlDownload: string, versao: string): Promise<DownloadProgress> {
    const res = await fetch('/api/sistema/update/baixar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlDownload, versao }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Falha ao iniciar download');
    }
    return data.data;
  },

  async obterProgresso(): Promise<DownloadProgress> {
    const res = await fetch('/api/sistema/update/progresso');
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Falha ao obter progresso');
    }
    return data.data;
  },

  async reiniciarEInstalar(caminhoArquivo?: string): Promise<{ sucesso: boolean; mensagem: string }> {
    if (typeof window !== 'undefined' && (window as any).desktopBridge?.restartAndInstall) {
      try {
        const r = await (window as any).desktopBridge.restartAndInstall();
        if (r && r.sucesso) return { sucesso: true, mensagem: 'Reiniciando via electron-updater...' };
      } catch {}
    }

    return this.instalarAtualizacao(caminhoArquivo, true);
  },

  async instalarAtualizacao(caminhoArquivo?: string, silencioso = true): Promise<{ sucesso: boolean; mensagem: string }> {
    if (typeof window !== 'undefined' && (window as any).desktopBridge?.executarInstaladorUpdate && caminhoArquivo) {
      try {
        const resp = await (window as any).desktopBridge.executarInstaladorUpdate({
          caminhoExe: caminhoArquivo,
          silent: silencioso,
        });
        if (resp && resp.sucesso) return { sucesso: true, mensagem: 'Instalador iniciado via Desktop Bridge.' };
      } catch (e) {
        console.warn('[UpdateApi] Desktop bridge falhou, fallback para API:', e);
      }
    }

    const res = await fetch('/api/sistema/update/instalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caminhoArquivo, silencioso }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Falha ao disparar instalação');
    }
    return { sucesso: true, mensagem: data.message };
  },

  onUpdateDownloaded(callback: (info: any) => void): (() => void) | undefined {
    if (typeof window !== 'undefined' && (window as any).desktopBridge?.onUpdateDownloaded) {
      return (window as any).desktopBridge.onUpdateDownloaded(callback);
    }
    return undefined;
  },
};
