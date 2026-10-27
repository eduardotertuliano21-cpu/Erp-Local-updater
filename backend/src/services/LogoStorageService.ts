import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export function resolveLogosDir(): string {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Application Support') : path.join(process.env.HOME || '', '.config'));
  const targetDir = appData
    ? path.join(appData, 'ClickStorm PDV', 'assets', 'logos')
    : path.resolve(process.cwd(), 'data', 'assets', 'logos');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export const LOGOS_DIR = resolveLogosDir();

export class LogoStorageService {
  /**
   * Salva uma imagem em base64 com segurança no diretório isolado de logos e retorna a URL pública
   */
  public static salvarLogo(imagemBase64: string, extensaoSugerida?: string): { url: string; caminhoFisico: string } {
    if (!imagemBase64 || typeof imagemBase64 !== 'string') {
      throw new Error('Payload de imagem inválido.');
    }

    const match = imagemBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const extRaw = match ? match[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg') : (extensaoSugerida || 'png');
    const ext = extRaw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'png';
    const rawData = match ? match[2] : imagemBase64;
    const buffer = Buffer.from(rawData, 'base64');

    // Validação de tamanho: máximo 4 MB
    if (buffer.length > 4 * 1024 * 1024) {
      throw new Error('A logomarca deve ter no máximo 4 MB.');
    }

    const dir = resolveLogosDir();
    const hash = crypto.randomBytes(6).toString('hex');
    const nomeArquivo = `logo_empresa_${Date.now()}_${hash}.${ext}`;
    const caminhoFisico = path.join(dir, nomeArquivo);

    fs.writeFileSync(caminhoFisico, buffer);

    return {
      url: `/assets/logos/${nomeArquivo}`,
      caminhoFisico,
    };
  }

  /**
   * Remove logo antiga do disco se for um arquivo gerenciado
   */
  public static limparLogoAntiga(urlRelativa?: string): void {
    if (!urlRelativa || !urlRelativa.startsWith('/assets/logos/')) return;
    try {
      const nome = path.basename(urlRelativa);
      const caminho = path.join(resolveLogosDir(), nome);
      if (fs.existsSync(caminho)) {
        fs.unlinkSync(caminho);
      }
    } catch {}
  }
}
