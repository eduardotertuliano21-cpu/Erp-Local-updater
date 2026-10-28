import { IOperacaoRepository, VendaRecord } from '../repositories/IOperacaoRepository.js';
import { ICatalogoRepository } from '../repositories/ICatalogoRepository.js';
import { CriarVendaPayload } from '../types/api.js';
import { getOperacaoDb } from '../config/database.js';
import crypto from 'node:crypto';

export class VendaService {
  constructor(
    private operacaoRepo: IOperacaoRepository,
    private catalogoRepo: ICatalogoRepository
  ) {}

  public finalizarVenda(payload: CriarVendaPayload): VendaRecord {
    const caixaAberto = this.operacaoRepo.obterCaixaAberto();
    if (!caixaAberto) {
      throw new Error('Não há caixa aberto para registrar vendas. Abra o caixa primeiro.');
    }

    if (!payload.itens || payload.itens.length === 0) {
      throw new Error('A venda deve conter pelo menos 1 item');
    }

    // Calcula subtotal e total com arredondamento preciso de cada item
    let subtotal = 0;
    for (const item of payload.itens) {
      const itemSubtotal = typeof item.subtotal === 'number' && !isNaN(item.subtotal) && item.subtotal > 0
        ? Number(item.subtotal.toFixed(2))
        : Number((item.preco_unitario * item.quantidade - (item.desconto || 0)).toFixed(2));
      subtotal = Number((subtotal + itemSubtotal).toFixed(2));
    }

    const descontoTotal = Number((payload.desconto_total || 0).toFixed(2));
    let totalLiquido = Number(Math.max(0, subtotal - descontoTotal).toFixed(2));

    // Valida pagamentos (absorvendo até R$ 0.02 de divergência de arredondamento de itens)
    const totalPago = Number(payload.pagamentos.reduce((acc, p) => acc + p.valor, 0).toFixed(2));
    if (Math.abs(totalPago - totalLiquido) <= 0.02 && totalPago > 0) {
      totalLiquido = totalPago;
    } else if (totalPago < totalLiquido) {
      throw new Error(`Total pago (R$ ${totalPago.toFixed(2)}) é inferior ao total da venda (R$ ${totalLiquido.toFixed(2)})`);
    }

    // Validação especial de Convênio / Fiado
    const pagamentoConvenio = payload.pagamentos.find((p) => p.metodo === 'CONVENIO');
    if (pagamentoConvenio) {
      if (!payload.cliente_id) {
        throw new Error('Para pagamento via Convênio/Fiado é obrigatório selecionar um cliente');
      }
      const db = getOperacaoDb();
      const clienteRow = db.prepare('SELECT id, razao_social, limite_credito, saldo_devedor FROM entidades WHERE id = ?').get(payload.cliente_id) as any;
      if (!clienteRow) {
        throw new Error('Cliente selecionado para o Convênio não foi encontrado');
      }
      const limite = Number(clienteRow.limite_credito || 0);
      const devedor = Number(clienteRow.saldo_devedor || 0);
      const disponivel = limite - devedor;
      if (limite > 0 && pagamentoConvenio.valor > disponivel) {
        throw new Error(`Limite de crédito insuficiente para ${clienteRow.razao_social}. Disponível: R$ ${disponivel.toFixed(2)}`);
      }
      if (!payload.cliente_nome) {
        payload.cliente_nome = clienteRow.razao_social;
      }
    }

    const troco = totalPago > totalLiquido ? totalPago - totalLiquido : 0;
    const vendaId = payload.id || crypto.randomUUID();
    const numeroSequencial = Date.now() % 1000000;

    const venda = this.operacaoRepo.salvarVenda({
      ...payload,
      id: vendaId,
      caixa_id: caixaAberto.id,
      numero_sequencial: numeroSequencial,
      subtotal,
      desconto_total: descontoTotal,
      total_liquido: totalLiquido,
      troco,
    });

    this.operacaoRepo.registrarLogAuditoria(
      'VENDA_CONCLUIDA',
      `Venda #${numeroSequencial} concluída. Total: R$ ${totalLiquido.toFixed(2)}`,
      payload.operador_id
    );

    return venda;
  }

  public cancelarVenda(vendaId: string, motivo: string, operadorId: string): void {
    if (!motivo || motivo.trim().length < 3) {
      throw new Error('Informe um motivo válido para cancelamento');
    }
    this.operacaoRepo.cancelarVenda(vendaId, motivo, operadorId);
  }

  public listarUltimasVendas(limite = 15): VendaRecord[] {
    return this.operacaoRepo.obterUltimasVendas(limite);
  }
}
