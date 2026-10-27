import { Request, Response } from 'express';
import { gitHubUpdateService } from '../services/GitHubUpdateService.js';

export class GitHubUpdateController {
  public async checarAtualizacao(_req: Request, res: Response): Promise<void> {
    try {
      const info = await gitHubUpdateService.checarAtualizacao();
      res.json({ success: true, data: info });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Falha ao checar atualizações no GitHub',
      });
    }
  }

  public async baixarAtualizacao(req: Request, res: Response): Promise<void> {
    try {
      const { urlDownload, versao } = req.body;
      if (!urlDownload) {
        res.status(400).json({ success: false, error: 'URL de download obrigatória' });
        return;
      }
      const progresso = await gitHubUpdateService.baixarAtualizacao(urlDownload, versao || 'latest');
      res.json({ success: true, data: progresso });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public obterProgresso(_req: Request, res: Response): void {
    const progresso = gitHubUpdateService.obterProgresso();
    res.json({ success: true, data: progresso });
  }

  public instalarAtualizacao(req: Request, res: Response): void {
    const { caminhoArquivo, silencioso } = req.body;
    const resultado = gitHubUpdateService.instalarAtualizacao(caminhoArquivo, Boolean(silencioso));
    if (resultado.sucesso) {
      res.json({ success: true, message: resultado.mensagem });
    } else {
      res.status(400).json({ success: false, error: resultado.mensagem });
    }
  }

  public obterVersao(_req: Request, res: Response): void {
    const versao = gitHubUpdateService.obterVersaoAtual();
    res.json({ success: true, data: { versao } });
  }
}

export const gitHubUpdateController = new GitHubUpdateController();
