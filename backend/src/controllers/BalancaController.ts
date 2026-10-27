import { Request, Response } from 'express';
import { BalancaCheckoutService, ModeloBalanca } from '../services/BalancaCheckoutService.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';

export class BalancaController {
  private balancaService = BalancaCheckoutService.getInstance();
  private configRepo = new ConfigLojaRepository();

  public testar = async (req: Request, res: Response): Promise<void> => {
    try {
      const modelo = (req.query.modelo as ModeloBalanca) || undefined;
      const porta = (req.query.porta as string) || undefined;

      const resultado = await this.balancaService.lerPeso(modelo, porta);
      res.json({
        success: resultado.sucesso,
        data: resultado,
        error: resultado.erro,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Falha ao comunicar com a balança serial',
      });
    }
  };

  public obterStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.balancaService.obterStatus();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public listarPortas = async (_req: Request, res: Response): Promise<void> => {
    try {
      const portas = await this.balancaService.listarPortas();
      res.json({ success: true, data: portas });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public salvarConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { balanca_checkout_ativa, balanca_modelo, balanca_porta } = req.body;
      const atual = this.configRepo.obter();
      const atualizada = this.configRepo.salvar({
        ...atual,
        balanca_checkout_ativa: balanca_checkout_ativa !== undefined ? (balanca_checkout_ativa ? 1 : 0) : atual.balanca_checkout_ativa,
        balanca_modelo: balanca_modelo || atual.balanca_modelo || 'TOLEDO',
        balanca_porta: balanca_porta || atual.balanca_porta || 'AUTO',
      });
      res.json({ success: true, data: atualizada });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public exportarCarga = async (req: Request, res: Response): Promise<void> => {
    try {
      const { marca, diretorioDestino } = req.body;
      const cargaService = (await import('../services/CargaBalancaService.js')).CargaBalancaService.getInstance();
      const resultado = cargaService.gerarCarga(marca, diretorioDestino);
      res.json({ success: true, data: resultado });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public obterDiretoriosCarga = async (_req: Request, res: Response): Promise<void> => {
    try {
      const cargaService = (await import('../services/CargaBalancaService.js')).CargaBalancaService.getInstance();
      res.json({ success: true, data: cargaService.obterDiretoriosPadrao() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public downloadCargaMgv = async (req: Request, res: Response): Promise<void> => {
    try {
      const marca = ((req.query.marca as string) || (req.query.modelo as string) || 'TOLEDO').toUpperCase();
      const cargaService = (await import('../services/CargaBalancaService.js')).CargaBalancaService.getInstance();
      const resultado = cargaService.gerarCarga(marca as any);
      res.setHeader('Content-Type', 'text/plain; charset=windows-1252');
      res.setHeader('Content-Disposition', `attachment; filename="${resultado.arquivo}"`);
      res.send(resultado.conteudoTxt);
    } catch (err: any) {
      res.status(500).send(`Erro ao gerar carga: ${err.message}`);
    }
  };
}
