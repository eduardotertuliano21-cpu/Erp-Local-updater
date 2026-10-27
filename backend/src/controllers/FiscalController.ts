import { Request, Response } from 'express';
import { FiscalService } from '../services/FiscalService.js';
import { PrinterService } from '../services/PrinterService.js';
import { RawPrinterDriver } from '../services/RawPrinterDriver.js';
import { ContingencyTransmissionService } from '../services/ContingencyTransmissionService.js';
import { IFiscalRepository } from '../repositories/IFiscalRepository.js';
import { IOperacaoRepository } from '../repositories/IOperacaoRepository.js';
import { ApiResponse } from '../types/api.js';
import { AiDiagnosticService } from '../services/AiDiagnosticService.js';

export class FiscalController {
  constructor(
    private fiscalService: FiscalService,
    private printerService: PrinterService,
    private fiscalRepo: IFiscalRepository,
    private operacaoRepo: IOperacaoRepository,
    private rawPrinterDriver?: RawPrinterDriver,
    private contingencyService?: ContingencyTransmissionService
  ) {}

  public emitirNfce = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendaId } = req.params;
      const { contingencia = true } = req.body;

      const doc = this.fiscalService.emitirNfce(vendaId, Boolean(contingencia));

      res.status(201).json({
        success: true,
        data: doc,
      } as ApiResponse);
    } catch (err: any) {
      let diagnosticoIa: string | undefined;
      try {
        const registro = await AiDiagnosticService.analisarERegistrar(
          'REJEICAO_SEFAZ',
          err.message || 'Erro ao emitir NFC-e',
          { vendaId: req.params.vendaId, contingencia: req.body.contingencia }
        );
        diagnosticoIa = registro.diagnostico_ia;
      } catch {}

      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao emitir NFC-e',
        diagnostico_ia: diagnosticoIa,
      } as ApiResponse);
    }
  };

  public obterDanfeCupom = (req: Request, res: Response): void => {
    try {
      const { vendaId } = req.params;

      let doc = this.fiscalRepo.obterDocumentoFiscalPorVenda(vendaId);
      if (!doc) {
        // Se ainda não foi emitida, emite automaticamente em contingência
        doc = this.fiscalService.emitirNfce(vendaId, true);
      }

      const venda = this.operacaoRepo.obterVendaPorId(vendaId);

      if (!venda) {
        res.status(404).json({
          success: false,
          error: 'Venda não encontrada para impressão',
        } as ApiResponse);
        return;
      }

      const emitente = this.obterEmitenteConfig();
      const cupom = this.printerService.formatarCupomNfce(venda, doc, emitente);

      res.json({
        success: true,
        data: {
          documento: doc,
          cupom,
        },
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao gerar cupom fiscal',
      } as ApiResponse);
    }
  };

  private obterEmitenteConfig(): any {
    return this.fiscalService.obterConfigAtual();
  }

  public imprimirDireto = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendaId } = req.params;
      let doc = this.fiscalRepo.obterDocumentoFiscalPorVenda(vendaId);
      if (!doc) {
        doc = this.fiscalService.emitirNfce(vendaId, true);
      }

      const venda = this.operacaoRepo.obterVendaPorId(vendaId);
      if (!venda) {
        res.status(404).json({
          success: false,
          error: 'Venda não encontrada para impressão',
        } as ApiResponse);
        return;
      }

      const emitente = this.obterEmitenteConfig();
      const cupom = this.printerService.formatarCupomNfce(venda, doc, emitente);
      const driver = this.rawPrinterDriver || new RawPrinterDriver();
      const resultado = await driver.enviarBytes(cupom.bytesHexEscPos);

      res.json({
        success: true,
        data: resultado,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao enviar para impressora térmica',
      } as ApiResponse);
    }
  };

  public transmitirContingencias = async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!this.contingencyService) {
        this.contingencyService = new ContingencyTransmissionService(this.fiscalRepo, this.operacaoRepo);
      }
      const resultado = await this.contingencyService.transmitirFilaContingencia();
      res.json({
        success: true,
        data: resultado,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao transmitir contingências fiscais',
      } as ApiResponse);
    }
  };

  public listarContingencias = (_req: Request, res: Response): void => {
    try {
      const docs = this.fiscalRepo.listarDocumentosContingenciaPendentes();
      res.json({
        success: true,
        data: docs,
      } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao listar contingências fiscais',
      } as ApiResponse);
    }
  };

  public cancelarNfce = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vendaId } = req.params;
      const { motivo, operadorId = 'OPERADOR' } = req.body;

      if (!motivo || String(motivo).trim().length < 5) {
        res.status(400).json({
          success: false,
          error: 'Justificativa de cancelamento deve ter pelo menos 5 caracteres',
        } as ApiResponse);
        return;
      }

      this.fiscalService.cancelarNfce(vendaId, String(motivo).trim(), String(operadorId));

      res.json({
        success: true,
        message: 'NFC-e e venda canceladas com sucesso',
        data: { vendaId, cancelada: true },
      } as ApiResponse);
    } catch (err: any) {
      let diagnosticoIa: string | undefined;
      try {
        const registro = await AiDiagnosticService.analisarERegistrar(
          'CANCELAMENTO_NFCE_ERRO',
          err.message || 'Erro ao cancelar NFC-e',
          { vendaId: req.params.vendaId, motivo: req.body.motivo }
        );
        diagnosticoIa = registro.diagnostico_ia;
      } catch {}

      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao cancelar NFC-e',
        diagnostico_ia: diagnosticoIa,
      } as ApiResponse);
    }
  };
}
