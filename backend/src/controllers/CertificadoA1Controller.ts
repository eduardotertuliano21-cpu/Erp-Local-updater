import { Request, Response } from 'express';
import { CertificadoA1Service } from '../services/CertificadoA1Service.js';
import { ApiResponse } from '../types/api.js';

export class CertificadoA1Controller {
  private service = new CertificadoA1Service();

  public listar = (_req: Request, res: Response): void => {
    try {
      const lista = this.service.listar();
      res.json({ success: true, data: lista } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public obterAtivo = (_req: Request, res: Response): void => {
    try {
      const ativo = this.service.obterAtivo();
      res.json({ success: true, data: ativo } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public obterAlertaVencimento = (_req: Request, res: Response): void => {
    try {
      const alerta = this.service.obterAlertaVencimento();
      res.json({ success: true, data: alerta } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public uploadCertificado = (req: Request, res: Response): void => {
    try {
      const { nome_arquivo, conteudo_base64, senha } = req.body;
      if (!nome_arquivo || !conteudo_base64 || senha === undefined) {
        res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios: nome_arquivo, conteudo_base64, senha',
        });
        return;
      }

      const certInfo = this.service.importarCertificado(nome_arquivo, conteudo_base64, senha);
      res.status(201).json({ success: true, data: certInfo } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public ativarCertificado = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      this.service.definirAtivo(id);
      res.json({ success: true, data: { ativado: true, id } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
