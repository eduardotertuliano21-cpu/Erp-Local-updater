import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

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

class GitHubUpdateService {
  private owner = process.env.GITHUB_UPDATE_OWNER || 'eduardotertuliano21-cpu';
  private repo = process.env.GITHUB_UPDATE_REPO || 'Erp-Local-updater';
  private token = process.env.GITHUB_UPDATE_TOKEN || Buffer.from('Z2l0aHViX3BhdF8xMUI1SVhKVVkwUFoxbmRnR2FsTkRuX0ZZd3dhSUJHREdGRGpYVDNTQlI3d0ZGanolbEkyTzhPZWN5RjNkSEkwcDRTNldLQU9EQTk3dW9Eak9q', 'base64').toString('utf-8');

  private downloadState: DownloadProgress = {
    baixando: false,
    concluido: false,
    progresso: 0,
    bytesBaixados: 0,
    totalBytes: 0,
    erro: null,
    caminhoArquivo: null,
    versaoBaixada: null,
  };

  public obterVersaoAtual(): string {
    try {
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version || '1.0.0';
      }
    } catch {}
    return '1.0.0';
  }

  private compararVersoes(v1: string, v2: string): number {
    const parse = (v: string) => v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
    const [maj1, min1, pat1] = parse(v1);
    const [maj2, min2, pat2] = parse(v2);
    if (maj1 !== maj2) return maj1 > maj2 ? 1 : -1;
    if (min1 !== min2) return min1 > min2 ? 1 : -1;
    if (pat1 !== pat2) return pat1 > pat2 ? 1 : -1;
    return 0;
  }

  private async fetchGitHubJson(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/repos/${this.owner}/${this.repo}${endpoint}`;
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'ClickStorm-Updater',
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(body));
              } catch (err: any) {
                reject(new Error(`Falha no parse do GitHub: ${err.message}`));
              }
            } else if (res.statusCode === 404) {
              resolve(null);
            } else {
              reject(new Error(`GitHub API erro ${res.statusCode}: ${body}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout ao conectar com GitHub'));
      });
    });
  }

  public async checarAtualizacao(): Promise<UpdateInfo> {
    const versaoAtual = this.obterVersaoAtual();
    const release = await this.fetchGitHubJson('/releases/latest');

    if (!release) {
      return {
        temAtualizacao: false,
        versaoAtual,
        versaoMaisRecente: versaoAtual,
        tag: `v${versaoAtual}`,
        titulo: 'Sistema Atualizado',
        notas: 'Nenhuma versão mais recente encontrada no repositório.',
        dataPublicacao: new Date().toISOString(),
        urlDownload: null,
        tamanhoBytes: 0,
        nomeArquivo: null,
      };
    }

    const tag = (release.tag_name || '').trim();
    const versaoMaisRecente = tag.replace(/^v/i, '');
    const temAtualizacao = this.compararVersoes(versaoMaisRecente, versaoAtual) > 0;

    let urlDownload: string | null = null;
    let tamanhoBytes = 0;
    let nomeArquivo: string | null = null;

    if (Array.isArray(release.assets) && release.assets.length > 0) {
      const assetExe = release.assets.find((a: any) => a.name.endsWith('.exe')) || release.assets[0];
      if (assetExe) {
        urlDownload = assetExe.browser_download_url;
        tamanhoBytes = assetExe.size || 0;
        nomeArquivo = assetExe.name;
      }
    }

    return {
      temAtualizacao,
      versaoAtual,
      versaoMaisRecente,
      tag,
      titulo: release.name || `Versão ${versaoMaisRecente}`,
      notas: release.body || 'Atualizações de desempenho e novas funcionalidades.',
      dataPublicacao: release.published_at || new Date().toISOString(),
      urlDownload,
      tamanhoBytes,
      nomeArquivo,
    };
  }

  public async baixarAtualizacao(url: string, versao: string): Promise<DownloadProgress> {
    if (this.downloadState.baixando) return this.downloadState;

    const destino = path.join(os.tmpdir(), `ClickStorm_Update_v${versao}.exe`);
    this.downloadState = {
      baixando: true,
      concluido: false,
      progresso: 0,
      bytesBaixados: 0,
      totalBytes: 0,
      erro: null,
      caminhoArquivo: destino,
      versaoBaixada: versao,
    };

    this.executarDownloadComRedirecionamento(url, destino)
      .then(() => {
        this.downloadState.baixando = false;
        this.downloadState.concluido = true;
        this.downloadState.progresso = 100;
      })
      .catch((err) => {
        this.downloadState.baixando = false;
        this.downloadState.erro = err.message;
      });

    return this.downloadState;
  }

  private executarDownloadComRedirecionamento(url: string, destino: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(destino);

      const requestHandler = (targetUrl: string, redirects = 0) => {
        if (redirects > 8) {
          fileStream.close();
          return reject(new Error('Muitos redirecionamentos'));
        }

        const client = targetUrl.startsWith('https') ? https : http;
        const options: https.RequestOptions = {
          headers: {
            'User-Agent': 'ClickStorm-Updater',
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/octet-stream',
          },
        };

        const req = client.get(targetUrl, options, (res) => {
          if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            return requestHandler(res.headers.location, redirects + 1);
          }

          if (res.statusCode !== 200) {
            fileStream.close();
            return reject(new Error(`Falha no download. Status HTTP: ${res.statusCode}`));
          }

          const total = parseInt(res.headers['content-length'] || '0', 10);
          this.downloadState.totalBytes = total;
          let recebido = 0;

          res.on('data', (chunk) => {
            recebido += chunk.length;
            this.downloadState.bytesBaixados = recebido;
            if (total > 0) {
              this.downloadState.progresso = Math.min(99, Math.round((recebido / total) * 100));
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => resolve());
          });
        });

        req.on('error', (err) => {
          fileStream.close();
          try { fs.unlinkSync(destino); } catch {}
          reject(err);
        });
      };

      requestHandler(url);
    });
  }

  public obterProgresso(): DownloadProgress { return this.downloadState; }

  public async executarAtualizacaoForcada(): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      const release = await this.fetchGitHubJson('/releases/latest');
      if (!release) return { sucesso: false, mensagem: 'Nenhuma release encontrada no GitHub.' };
      const tag = (release.tag_name || 'v1.0.0').trim();
      const versao = tag.replace(/^v/i, '');
      const assetExe = (release.assets || []).find((a: any) => a.name?.endsWith('.exe')) || release.assets?.[0];
      if (!assetExe?.browser_download_url) return { sucesso: false, mensagem: 'Instalador não encontrado no GitHub.' };
      await this.baixarAtualizacao(assetExe.browser_download_url, versao);
      let ticks = 0;
      const iv = setInterval(() => {
        const p = this.obterProgresso();
        if (p.concluido) {
          clearInterval(iv);
          this.instalarAtualizacao(p.caminhoArquivo || undefined, true);
        } else if (p.erro || ++ticks > 900) {
          clearInterval(iv);
        }
      }, 1000);
      return { sucesso: true, mensagem: 'Download da atualização iniciado via GitHub.' };
    } catch (err: any) {
      return { sucesso: false, mensagem: err.message };
    }
  }

  public instalarAtualizacao(caminhoArquivo?: string, silencioso = false): { sucesso: boolean; mensagem: string } {
    const arquivo = caminhoArquivo || this.downloadState.caminhoArquivo;
    if (!arquivo || !fs.existsSync(arquivo)) {
      return { sucesso: false, mensagem: 'Arquivo do instalador não localizado no computador.' };
    }

    const args = silencioso ? ['/SILENT', '/FORCECLOSEAPPLICATIONS'] : [];
    try {
      const proc = spawn(arquivo, args, { detached: true, stdio: 'ignore' });
      proc.unref();

      setTimeout(() => {
        try {
          spawn('taskkill', ['/F', '/IM', 'ClickStorm.exe'], { detached: true, stdio: 'ignore' }).unref();
        } catch {}
        process.exit(0);
      }, 800);

      return { sucesso: true, mensagem: 'Instalador iniciado com sucesso. O sistema ClickStorm será reiniciado.' };
    } catch (err: any) {
      return { sucesso: false, mensagem: `Falha ao executar o instalador: ${err.message}` };
    }
  }
}

export const gitHubUpdateService = new GitHubUpdateService();
