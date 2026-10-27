import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService.js';
import { ApiResponse } from '../types/api.js';

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  public obterSettings = (_req: Request, res: Response): void => {
    try {
      const settings = this.settingsService.obterSettings();
      res.json({
        success: true,
        data: settings,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao carregar configurações do sistema',
      } as ApiResponse);
    }
  };

  public salvarSettings = (req: Request, res: Response): void => {
    try {
      const dados = req.body;
      const atualizado = this.settingsService.salvarSettings(dados);
      res.json({
        success: true,
        data: atualizado,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao salvar configurações do sistema',
      } as ApiResponse);
    }
  };

  public exportarMgv = (_req: Request, res: Response): void => {
    try {
      const conteudoTxt = this.settingsService.exportarCargaMgv();
      res.setHeader('Content-Type', 'text/plain; charset=iso-8859-1');
      res.setHeader('Content-Disposition', 'attachment; filename="ITENSMGV.TXT"');
      res.send(conteudoTxt);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao gerar carga MGV Toledo',
      } as ApiResponse);
    }
  };

  public uploadLogo = (req: Request, res: Response): void => {
    try {
      const { imagemBase64, extensao } = req.body || {};
      if (!imagemBase64) {
        res.status(400).json({ success: false, error: 'Imagem em base64 é obrigatória.' } as ApiResponse);
        return;
      }
      const resultado = this.settingsService.salvarLogoEmDisco(imagemBase64, extensao);
      res.status(201).json({
        success: true,
        data: resultado,
      } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao processar upload da logomarca',
      } as ApiResponse);
    }
  };
}
