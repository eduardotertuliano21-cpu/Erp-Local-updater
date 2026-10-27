import { Request, Response } from 'express';
import { StripeSubscriptionService } from '../services/StripeSubscriptionService.js';
import { ApiResponse } from '../types/api.js';

export class StripeSubscriptionController {
  constructor(private subscriptionService: StripeSubscriptionService) {}

  public obterPlanosDisponiveis = async (_req: Request, res: Response): Promise<void> => {
    try {
      const planos = await this.subscriptionService.obterPlanosDisponiveis();
      res.json({ success: true, data: planos } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao obter planos' } as ApiResponse);
    }
  };

  public criarPix = async (req: Request, res: Response): Promise<void> => {
    try {
      const { plano, valor, mesesRenovacao } = req.body || {};
      const cobranca = await this.subscriptionService.criarCobrancaPix(
        plano === 'ANUAL' ? 'ANUAL' : 'MENSAL',
        valor ? Number(valor) : undefined,
        mesesRenovacao ? Number(mesesRenovacao) : undefined
      );
      res.status(201).json({ success: true, data: cobranca } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao gerar cobrança Pix' } as ApiResponse);
    }
  };

  public criarIntentCartao = async (req: Request, res: Response): Promise<void> => {
    try {
      const { plano, valor, mesesRenovacao } = req.body || {};
      const intent = await this.subscriptionService.criarIntentCartao(
        plano === 'ANUAL' ? 'ANUAL' : 'MENSAL',
        valor ? Number(valor) : undefined,
        mesesRenovacao ? Number(mesesRenovacao) : undefined
      );
      res.status(201).json({ success: true, data: intent } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao gerar intent de cartão' } as ApiResponse);
    }
  };

  public confirmarIntentCartao = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentIntentId, plano, mesesRenovacao } = req.body || {};
      if (!paymentIntentId) {
        res.status(400).json({ success: false, error: 'paymentIntentId obrigatório' });
        return;
      }
      const resultado = await this.subscriptionService.confirmarPagamentoCartaoIntent(
        paymentIntentId,
        plano === 'ANUAL' ? 'ANUAL' : 'MENSAL',
        mesesRenovacao ? Number(mesesRenovacao) : undefined
      );
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao confirmar cartão' } as ApiResponse);
    }
  };

  public criarCheckoutCartao = async (req: Request, res: Response): Promise<void> => {
    try {
      const { plano, originUrl, valor } = req.body || {};
      const sessao = await this.subscriptionService.criarSessaoCheckoutCartao(
        plano === 'ANUAL' ? 'ANUAL' : 'MENSAL',
        originUrl || 'http://localhost:5000',
        valor ? Number(valor) : undefined
      );
      res.status(201).json({ success: true, data: sessao } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao criar sessão de checkout' } as ApiResponse);
    }
  };

  public verificarPix = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID do pagamento não informado' });
        return;
      }
      const resultado = await this.subscriptionService.verificarPagamentoPix(id);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao verificar liquidação do Pix' } as ApiResponse);
    }
  };

  public confirmarPixManual = async (_req: Request, res: Response): Promise<void> => {
    res.status(400).json({
      success: false,
      error: 'Confirmação manual desativada. O sistema verifica e aprova o pagamento Pix automaticamente via liquidação bancária oficial.',
    } as ApiResponse);
  };

  public verificarSessao = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID da sessão não informado' });
        return;
      }
      const resultado = await this.subscriptionService.verificarSessaoCheckout(id);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao verificar sessão do Stripe' } as ApiResponse);
    }
  };

  public listarHistorico = (_req: Request, res: Response): void => {
    try {
      const historico = this.subscriptionService.listarHistorico();
      res.json({ success: true, data: historico } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao buscar histórico' } as ApiResponse);
    }
  };

  public listarCartoes = (_req: Request, res: Response): void => {
    try {
      const cartoes = this.subscriptionService.listarCartoes();
      res.json({ success: true, data: cartoes } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar cartões' } as ApiResponse);
    }
  };

  public cadastrarCartao = (req: Request, res: Response): void => {
    try {
      const { numero, titular, expMes, expAno, cvc } = req.body || {};
      if (!numero || !titular || !expMes || !expAno) {
        res.status(400).json({ success: false, error: 'Dados do cartão incompletos.' });
        return;
      }
      const novoCartao = this.subscriptionService.cadastrarCartao({
        numero,
        titular,
        expMes: Number(expMes),
        expAno: Number(expAno),
        cvc: cvc || '',
      });
      res.status(201).json({ success: true, data: novoCartao } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Erro ao cadastrar cartão' } as ApiResponse);
    }
  };

  public definirCartaoPadrao = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      this.subscriptionService.definirCartaoPadrao(id);
      res.json({ success: true, message: 'Cartão definido como padrão com sucesso.' } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao alterar cartão padrão' } as ApiResponse);
    }
  };

  public removerCartao = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      this.subscriptionService.removerCartao(id);
      res.json({ success: true, message: 'Cartão removido com sucesso.' } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao remover cartão' } as ApiResponse);
    }
  };

  public pagarComCartaoSalvo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartaoId, plano, valor, mesesRenovacao } = req.body || {};
      if (!cartaoId) {
        res.status(400).json({ success: false, error: 'Cartão não selecionado.' });
        return;
      }
      const resultado = await this.subscriptionService.pagarComCartaoSalvo(
        cartaoId,
        plano === 'ANUAL' ? 'ANUAL' : 'MENSAL',
        valor ? Number(valor) : undefined,
        mesesRenovacao ? Number(mesesRenovacao) : undefined
      );
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao processar pagamento com cartão' } as ApiResponse);
    }
  };

  public obterConfig = (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: {
        publishableKey: this.subscriptionService.STRIPE_PUBLISHABLE_KEY,
        isLive: true,
      },
    } as ApiResponse);
  };

  public cancelarRecorrencia = async (_req: Request, res: Response): Promise<void> => {
    try {
      const resultado = await this.subscriptionService.cancelarRecorrencia();
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao cancelar recorrência' } as ApiResponse);
    }
  };
}
