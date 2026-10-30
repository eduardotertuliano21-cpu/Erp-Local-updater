import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { DATA_DIR } from '../config/database.js';

export interface ArquivoNotaSalvo {
  pastaDestino: string;
  nomeBase: string;
  caminhoXml: string;
  caminhoDanfeHtml: string;
  ano: string;
  mes: string;
  data: string;
}

export interface NoPastaNfe {
  ano: string;
  mes: string;
  data: string;
  caminhoCompleto: string;
  arquivos: Array<{
    nome: string;
    tipo: 'XML' | 'DANFE_HTML';
    tamanhoBytes: number;
    caminho: string;
    modificadoEm: string;
  }>;
}

export class NfeDanfeStorageService {
  public static getRootDir(): string {
    const dir = path.join(DATA_DIR, 'notas_nfe');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public static sanitizarNomeCliente(nome: string): string {
    const semAcento = (nome || 'CONSUMIDOR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
    return semAcento || 'CLIENTE';
  }

  public static salvarArquivosNota(
    numeroNota: number,
    nomeCliente: string,
    dataEmissao: Date,
    xmlConteudo: string,
    danfeHtml: string
  ): ArquivoNotaSalvo {
    const ano = String(dataEmissao.getFullYear());
    const mes = String(dataEmissao.getMonth() + 1).padStart(2, '0');
    const dia = String(dataEmissao.getDate()).padStart(2, '0');
    const dataPasta = `${ano}-${mes}-${dia}`;

    const pastaDestino = path.join(this.getRootDir(), ano, mes, dataPasta);
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true });
    }

    const clienteLimpo = this.sanitizarNomeCliente(nomeCliente);
    const numFormatado = String(numeroNota).padStart(6, '0');
    const nomeBase = `${numFormatado}_${clienteLimpo}`;

    const caminhoXml = path.join(pastaDestino, `${nomeBase}.xml`);
    const caminhoDanfeHtml = path.join(pastaDestino, `${nomeBase}_DANFE.html`);

    fs.writeFileSync(caminhoXml, xmlConteudo, 'utf-8');
    fs.writeFileSync(caminhoDanfeHtml, danfeHtml, 'utf-8');

    return {
      pastaDestino,
      nomeBase,
      caminhoXml,
      caminhoDanfeHtml,
      ano,
      mes,
      data: dataPasta,
    };
  }

  public static listarEstruturaPastas(): { diretorioRaiz: string; pastas: NoPastaNfe[] } {
    const root = this.getRootDir();
    const resultado: NoPastaNfe[] = [];

    if (!fs.existsSync(root)) {
      return { diretorioRaiz: root, pastas: [] };
    }

    const anos = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();
    for (const ano of anos) {
      const dirAno = path.join(root, ano);
      const meses = fs.readdirSync(dirAno, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();
      for (const mes of meses) {
        const dirMes = path.join(dirAno, mes);
        const datas = fs.readdirSync(dirMes, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();
        for (const data of datas) {
          const dirData = path.join(dirMes, data);
          const files = fs.readdirSync(dirData, { withFileTypes: true }).filter((f) => f.isFile());
          const arquivos = files.map((f) => {
            const fullPath = path.join(dirData, f.name);
            const stat = fs.statSync(fullPath);
            return {
              nome: f.name,
              tipo: (f.name.endsWith('.xml') ? 'XML' : 'DANFE_HTML') as 'XML' | 'DANFE_HTML',
              tamanhoBytes: stat.size,
              caminho: fullPath,
              modificadoEm: stat.mtime.toISOString(),
            };
          });
          if (arquivos.length > 0) {
            resultado.push({
              ano,
              mes,
              data,
              caminhoCompleto: dirData,
              arquivos,
            });
          }
        }
      }
    }

    return { diretorioRaiz: root, pastas: resultado };
  }

  public static abrirPastaSistema(caminhoSolicitado?: string): { aberto: boolean; caminho: string } {
    const root = this.getRootDir();
    let alvo = root;
    if (caminhoSolicitado && fs.existsSync(caminhoSolicitado)) {
      const stat = fs.statSync(caminhoSolicitado);
      alvo = stat.isDirectory() ? caminhoSolicitado : path.dirname(caminhoSolicitado);
    }

    if (process.platform === 'win32') {
      exec(`explorer.exe "${alvo}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${alvo}"`);
    } else {
      exec(`xdg-open "${alvo}"`);
    }

    return { aberto: true, caminho: alvo };
  }
}
