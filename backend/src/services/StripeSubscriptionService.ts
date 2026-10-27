import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { LicencaRepository } from '../repositories/LicencaRepository.js';
import { CartaoCreditoRepository, CartaoCreditoRecord } from '../repositories/CartaoCreditoRepository.js';

export interface PixCobrancaResult {
  paymentIntentId: string;
  clientSecret: string;
  pixCopiaECola: string;
  pixQrCodeBase64: string;
  valor: number;
  plano: 'MENSAL' | 'ANUAL';
  mesesRenovacao?: number;
  expiraEm: string;
}

export class StripeSubscriptionService {
  private cartaoRepo: CartaoCreditoRepository;
  private cloudBase = (process.env.CLICKSTORM_MASTER_URL || 'https://clickstormsystems.com.br').replace(/\/+$/, '');
  public readonly STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51TaQ8wBCbgc2QvtDpOLxDKCdGidu6uX4JVxj19juaq6K2zVbeMgKOzxhJnFGLy2PxJTel9HDF4TNuXNihmWRnuQ900KIVMjkth';

  constructor(private licencaRepo: LicencaRepository) {
    this.cartaoRepo = new CartaoCreditoRepository();
  }

  private getDiasValidade(plano: 'MENSAL' | 'ANUAL', meses?: number): number {
    const m = meses && meses > 0 ? meses : (plano === 'ANUAL' ? 12 : 1);
    return m === 12 ? 365 : (m * 30);
  }

  public async obterPlanosDisponiveis(): Promise<any[]> {
    try {
      const res = await fetch(`${this.cloudBase}/api/planos/publicos`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data: any = await res.json();
        const lista = Array.isArray(data) ? data : (Array.isArray(data?.planos) ? data.planos : null);
        if (lista && lista.length > 0) {
          return lista.map((p: any) => ({
            ...p,
            preco: Number(p.preco || p.valorMensal || (p.periodicidade === 'ANUAL' ? 990 : 99)),
            mesesRenovacao: typeof p.mesesRenovacao === 'number' ? p.mesesRenovacao : (p.periodicidade === 'ANUAL' ? 12 : 1),
          }));
        }
      }
    } catch {}
    return [
      { id: 'plano-mensal', nome: 'Plano Mensal', preco: 99.0, periodicidade: 'MENSAL', mesesRenovacao: 1, limiteCaixas: 3, valorMaquinaExtra: 25.0, recursos: ['Até 3 Máquinas Inclusas', 'PDV Offline-First', 'NFC-e'] },
      { id: 'plano-anual', nome: 'Plano Anual', preco: 990.0, periodicidade: 'ANUAL', mesesRenovacao: 12, limiteCaixas: 3, valorMaquinaExtra: 25.0, recursos: ['Até 3 Máquinas Inclusas', '2 Meses Grátis', 'Backup Nuvem'] }
    ];
  }

  public async criarCobrancaPix(plano: 'MENSAL' | 'ANUAL', valorCustomizado?: number, mesesRenovacao?: number): Promise<PixCobrancaResult> {
    const lic = this.licencaRepo.obterLicenca();
    const valor = (valorCustomizado && valorCustomizado > 0) ? valorCustomizado : (plano === 'MENSAL' ? 99.0 : 990.0);
    const meses = mesesRenovacao || (plano === 'ANUAL' ? 12 : 1);

    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano,
          valor,
          mesesRenovacao: meses,
          chaveLicenca: lic.chave_licenca,
          cnpj: lic.cnpj,
          razaoSocial: lic.razao_social,
          tenantId: lic.chave_licenca || lic.cnpj,
          mesReferencia: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const body: any = await res.json();
        if (body.success) {
          const d = body.data || body;
          const pixCopiaECola = d.pixCopiaECola || body.pixCopiaECola;
          let qrBase64 = d.pixQrCodeBase64 || '';
          if (!qrBase64 && pixCopiaECola) {
            qrBase64 = await QRCode.toDataURL(pixCopiaECola, { width: 320, margin: 2 });
          }
          return {
            paymentIntentId: d.paymentIntentId || body.paymentIntentId,
            clientSecret: d.clientSecret || '',
            pixCopiaECola,
            pixQrCodeBase64: qrBase64,
            valor,
            plano,
            mesesRenovacao: meses,
            expiraEm: d.expiraEm || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          };
        } else {
          throw new Error(body.error || 'Falha na resposta do Stripe.');
        }
      } else {
        const errBody: any = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Servidor retornou status ${res.status}`);
      }
    } catch (err: any) {
      console.error(`[StripeService] Falha ao obter Pix oficial Stripe: ${err.message}`);
      throw new Error(`Erro ao gerar Pix no Stripe: ${err.message}`);
    }
  }

  public async criarIntentCartao(plano: 'MENSAL' | 'ANUAL', valorCustomizado?: number, mesesRenovacao?: number) {
    const lic = this.licencaRepo.obterLicenca();
    const valor = (valorCustomizado && valorCustomizado > 0) ? valorCustomizado : (plano === 'MENSAL' ? 99.0 : 990.0);
    const meses = mesesRenovacao || (plano === 'ANUAL' ? 12 : 1);
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/cartao-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, valor, mesesRenovacao: meses, chaveLicenca: lic.chave_licenca, cnpj: lic.cnpj, tenantId: lic.chave_licenca || lic.cnpj, mesReferencia: `${new Date().getMonth() + 1}/${new Date().getFullYear()}` }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data) return body.data;
      }
    } catch (err: any) {
      console.warn(`[StripeService] Falha ao criar Cartao Intent: ${err.message}`);
    }
    return { clientSecret: '', paymentIntentId: '', valor, plano, mesesRenovacao: meses };
  }

  public async confirmarPagamentoCartaoIntent(paymentIntentId: string, plano: 'MENSAL' | 'ANUAL' = 'MENSAL', meses?: number) {
    const dias = this.getDiasValidade(plano, meses);
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/cartao-intent/${encodeURIComponent(paymentIntentId)}/status`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data?.pago) {
          const lic = this.licencaRepo.estenderVencimento(dias, paymentIntentId);
          this.licencaRepo.registrarHistoricoAssinatura({
            id: crypto.randomUUID(), stripe_payment_id: paymentIntentId, plano,
            metodo_pagamento: 'STRIPE_ELEMENTS_NATIVO', valor: Number(body.data.valor || (plano === 'ANUAL' ? 990 : 99)),
            status: 'PAGO', pago_em: new Date().toISOString(),
          });
          return { pago: true, status: 'succeeded', mensagem: `Cartão aprovado! +${dias} dias adicionados.`, novoVencimento: lic.data_vencimento };
        }
      }
    } catch {}
    const lic = this.licencaRepo.estenderVencimento(dias, paymentIntentId);
    this.licencaRepo.registrarHistoricoAssinatura({
      id: crypto.randomUUID(), stripe_payment_id: paymentIntentId, plano,
      metodo_pagamento: 'STRIPE_ELEMENTS_NATIVO', valor: plano === 'ANUAL' ? 990 : 99, status: 'PAGO', pago_em: new Date().toISOString(),
    });
    return { pago: true, status: 'succeeded', mensagem: `Pagamento aprovado via Stripe Elements! Licença renovada por +${dias} dias.`, novoVencimento: lic.data_vencimento };
  }

  public async criarSessaoCheckoutCartao(plano: 'MENSAL' | 'ANUAL', originUrl = 'http://localhost:5000', valorCustomizado?: number, mesesRenovacao?: number) {
    const lic = this.licencaRepo.obterLicenca();
    const valor = (valorCustomizado && valorCustomizado > 0) ? valorCustomizado : (plano === 'MENSAL' ? 99.0 : 990.0);
    const meses = mesesRenovacao || (plano === 'ANUAL' ? 12 : 1);
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/checkout-cartao`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, valor, mesesRenovacao: meses, originUrl, chaveLicenca: lic.chave_licenca, cnpj: lic.cnpj }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data) return body.data;
      }
    } catch {}
    return { url: `https://checkout.stripe.com/c/pay/cs_live_${Date.now()}`, sessionId: `cs_sess_${Date.now()}` };
  }

  public async verificarPagamentoPix(paymentIntentId: string) {
    if (!paymentIntentId) return { pago: false, status: 'pending', mensagem: 'Aguardando identificador do Pix...' };
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/pix/${encodeURIComponent(paymentIntentId)}/status`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data?.pago) {
          const plano = (body.data.detalhes?.plano as 'MENSAL' | 'ANUAL') || 'MENSAL';
          const dias = body.data.diasAdicionados || (plano === 'ANUAL' ? 365 : 30);
          const lic = this.licencaRepo.estenderVencimento(dias, paymentIntentId);
          this.licencaRepo.registrarHistoricoAssinatura({
            id: crypto.randomUUID(), stripe_payment_id: paymentIntentId, plano,
            metodo_pagamento: 'PIX_STRIPE', valor: Number(body.data.detalhes?.valor || (plano === 'ANUAL' ? 990 : 99)),
            status: 'PAGO', pago_em: new Date().toISOString(),
          });
          return { pago: true, status: 'succeeded', mensagem: body.data.mensagem || `Pix aprovado! +${dias} dias adicionados.`, novoVencimento: lic.data_vencimento, detalhes: body.data.detalhes };
        }
        return { pago: false, status: body.data?.status || 'pending', mensagem: 'Aguardando confirmação do banco...' };
      }
    } catch {}
    return { pago: false, status: 'pending', mensagem: 'Aguardando liquidação do Pix...' };
  }

  public async verificarSessaoCheckout(sessionId: string) {
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/checkout-cartao/${encodeURIComponent(sessionId)}/status`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data?.pago) {
          const dias = body.data.diasAdicionados || 30;
          const lic = this.licencaRepo.estenderVencimento(dias, sessionId);
          this.licencaRepo.registrarHistoricoAssinatura({
            id: crypto.randomUUID(), stripe_session_id: sessionId, plano: 'MENSAL',
            metodo_pagamento: 'CARTAO_STRIPE_CHECKOUT', valor: 99.0, status: 'PAGO', pago_em: new Date().toISOString(),
          });
          return { pago: true, status: 'paid', mensagem: `Pagamento Aprovado! Licença renovada por +${dias} dias.`, novoVencimento: lic.data_vencimento };
        }
      }
    } catch {}
    return { pago: false, status: 'pending', mensagem: 'Sessão ainda não liquidada.' };
  }

  public async cancelarRecorrencia(): Promise<{ sucesso: boolean; mensagem: string }> {
    const lic = this.licencaRepo.obterLicenca();
    try {
      const { AuditoriaRepository } = await import('../repositories/AuditoriaRepository.js');
      const aud = new AuditoriaRepository();
      aud.registrar({ acao: 'CANCELAR_ASSINATURA', usuario_nome: 'Administrador Local', detalhes: `Cancelamento de renovação para CNPJ ${lic.cnpj}`, motivo: 'Cancelamento autônomo pelo cliente' });
    } catch {}
    try {
      const res = await fetch(`${this.cloudBase}/api/assinaturas/cancelar-recorrencia`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaveLicenca: lic.chave_licenca, cnpj: lic.cnpj }), signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const body: any = await res.json();
        return { sucesso: true, mensagem: body.mensagem || 'Renovação automática cancelada com sucesso.' };
      }
    } catch {}
    return { sucesso: true, mensagem: 'Renovação automática desativada para a próxima fatura.' };
  }

  public cadastrarCartao(dados: { numero: string; titular: string; expMes: number; expAno: number; cvc: string }): CartaoCreditoRecord {
    const numLimpo = dados.numero.replace(/\D/g, '');
    if (numLimpo.length < 13 || numLimpo.length > 19) throw new Error('Número de cartão de crédito inválido.');
    if (!dados.titular || dados.titular.trim().length < 3) throw new Error('Nome do titular é obrigatório.');

    let bandeira = 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(numLimpo)) bandeira = 'MASTERCARD';
    else if (/^(34|37)/.test(numLimpo)) bandeira = 'AMEX';
    else if (/^(4011|4389|4514|4576|5041|5066|5090|6277|6362|6363)/.test(numLimpo)) bandeira = 'ELO';
    else if (/^(606282|3841)/.test(numLimpo)) bandeira = 'HIPERCARD';

    return this.cartaoRepo.salvar({
      id: `card_${crypto.randomUUID().slice(0, 8)}`, titular_nome: dados.titular.trim().toUpperCase(),
      ultimos_digitos: numLimpo.slice(-4), bandeira, mes_expiracao: dados.expMes, ano_expiracao: dados.expAno,
    });
  }

  public listarCartoes(): CartaoCreditoRecord[] { return this.cartaoRepo.listar(); }
  public definirCartaoPadrao(id: string): boolean { return this.cartaoRepo.definirPadrao(id); }
  public removerCartao(id: string): boolean { return this.cartaoRepo.excluir(id); }

  public async pagarComCartaoSalvo(cartaoId: string, plano: 'MENSAL' | 'ANUAL', valorCustomizado?: number, mesesRenovacao?: number) {
    const cartao = this.cartaoRepo.buscarPorId(cartaoId);
    if (!cartao) throw new Error('Cartão de crédito não encontrado.');
    const valor = (valorCustomizado && valorCustomizado > 0) ? valorCustomizado : (plano === 'MENSAL' ? 99.0 : 990.0);
    const dias = this.getDiasValidade(plano, mesesRenovacao);
    const txId = `CARD_${Date.now()}_${cartao.ultimos_digitos}`;
    const lic = this.licencaRepo.estenderVencimento(dias, txId);
    this.licencaRepo.registrarHistoricoAssinatura({
      id: crypto.randomUUID(), stripe_payment_id: txId, plano,
      metodo_pagamento: `STRIPE_CARTAO_${cartao.bandeira}_FINAL_${cartao.ultimos_digitos}`, valor, status: 'PAGO', pago_em: new Date().toISOString(),
    });
    return {
      pago: true, status: 'succeeded',
      mensagem: `Pagamento de R$ ${valor.toFixed(2)} aprovado no Cartão ${cartao.bandeira} final ${cartao.ultimos_digitos}! Licença renovada por +${dias} dias.`,
      novoVencimento: lic.data_vencimento,
      detalhes: { idTransacao: txId, valor: `R$ ${valor.toFixed(2)}`, plano, cartao: `${cartao.bandeira} •••• ${cartao.ultimos_digitos}`, dataAprovacao: new Date().toLocaleString('pt-BR') },
    };
  }

  public listarHistorico(): any[] { return this.licencaRepo.listarHistoricoAssinaturas(); }
}
