import { EstoqueRepository, EstoqueMovimento } from '../repositories/EstoqueRepository.js';
import crypto from 'node:crypto';

export class EstoqueService {
  constructor(private estoqueRepo: EstoqueRepository) {}

  public obterPosicaoEstoque(limite = 50, offset = 0) {
    return this.estoqueRepo.obterPosicaoEstoque(limite, offset);
  }

  public listarMovimentos(produtoId?: string) {
    return this.estoqueRepo.listarMovimentos(produtoId);
  }

  public registrarAjuste(dados: {
    produto_id: string;
    tipo: 'ENTRADA_COMPRA' | 'SAIDA_VENDA' | 'AJUSTE_INVENTARIO' | 'PERDA_AVARIA' | 'TRANSFERENCIA';
    almoxarifado: 'LOJA' | 'DEPOSITO' | 'DEFEITO' | 'TRANSITO';
    quantidade: number;
    motivo: string;
    operador_id?: string;
  }): EstoqueMovimento {
    if (!dados.produto_id || !dados.quantidade || !dados.tipo) {
      throw new Error('Produto, quantidade e tipo de movimento são obrigatórios.');
    }

    const mov: EstoqueMovimento = {
      id: crypto.randomUUID(),
      produto_id: dados.produto_id,
      tipo: dados.tipo,
      almoxarifado: dados.almoxarifado || 'LOJA',
      quantidade: Math.abs(Number(dados.quantidade)),
      custo_unitario: 0,
      motivo: dados.motivo || 'Ajuste manual de estoque',
      operador_id: dados.operador_id,
    };

    this.estoqueRepo.registrarMovimento(mov);
    return mov;
  }
}
