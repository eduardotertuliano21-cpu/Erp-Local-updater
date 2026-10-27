import crypto from 'node:crypto';
import { PcpRepository, OrdemProducao, InsumoFichaTecnica } from '../repositories/PcpRepository.js';
import { EstoqueRepository } from '../repositories/EstoqueRepository.js';

export class PcpService {
  constructor(
    private pcpRepo: PcpRepository,
    private estoqueRepo: EstoqueRepository
  ) {}

  public obterFicha(produtoPaiId: string): InsumoFichaTecnica[] {
    return this.pcpRepo.obterFichaTecnica(produtoPaiId);
  }

  public adicionarInsumoFicha(dados: Partial<InsumoFichaTecnica>): InsumoFichaTecnica {
    if (!dados.produto_pai_id || !dados.insumo_produto_id || !dados.quantidade_necessaria) {
      throw new Error('Produto acabado, insumo e quantidade são obrigatórios.');
    }

    const insumo: InsumoFichaTecnica = {
      id: crypto.randomUUID(),
      produto_pai_id: dados.produto_pai_id,
      insumo_produto_id: dados.insumo_produto_id,
      quantidade_necessaria: Number(dados.quantidade_necessaria),
      unidade_medida: dados.unidade_medida || 'UN',
    };

    this.pcpRepo.salvarInsumoFicha(insumo);
    return insumo;
  }

  public listarOrdens(): OrdemProducao[] {
    return this.pcpRepo.listarOrdens();
  }

  public criarOrdem(dados: {
    produto_id: string;
    quantidade_planejada: number;
    operador_id?: string;
  }): OrdemProducao {
    if (!dados.produto_id || !dados.quantidade_planejada) {
      throw new Error('Produto e quantidade planejada são obrigatórios.');
    }

    const op: OrdemProducao = {
      id: crypto.randomUUID(),
      numero: this.pcpRepo.obterProximoNumeroOrdem(),
      produto_id: dados.produto_id,
      quantidade_planejada: Number(dados.quantidade_planejada),
      quantidade_produzida: 0,
      status: 'EM_PRODUCAO',
      data_inicio: new Date().toISOString(),
      operador_id: dados.operador_id,
    };

    this.pcpRepo.salvarOrdem(op);
    return op;
  }

  public finalizarOrdem(ordemId: string, quantidadeEfetiva: number, operadorId?: string): void {
    const ordens = this.pcpRepo.listarOrdens();
    const ordem = ordens.find((o) => o.id === ordemId);
    if (!ordem) throw new Error('Ordem de produção não encontrada.');

    const qtd = Number(quantidadeEfetiva);
    this.pcpRepo.atualizarStatusOrdem(ordemId, 'FINALIZADA', qtd);

    // 1. Baixa automática dos insumos da Ficha Técnica (BOM)
    const insumos = this.pcpRepo.obterFichaTecnica(ordem.produto_id);
    for (const ins of insumos) {
      const qtdBaixar = ins.quantidade_necessaria * qtd;
      this.estoqueRepo.registrarMovimento({
        id: crypto.randomUUID(),
        produto_id: ins.insumo_produto_id,
        tipo: 'SAIDA_VENDA',
        almoxarifado: 'LOJA',
        quantidade: qtdBaixar,
        custo_unitario: 0,
        documento_referencia: `OP #${ordem.numero}`,
        motivo: `Consumo PCP Ordem #${ordem.numero}`,
        operador_id: operadorId,
      });
    }

    // 2. Entrada do produto acabado no estoque
    this.estoqueRepo.registrarMovimento({
      id: crypto.randomUUID(),
      produto_id: ordem.produto_id,
      tipo: 'ENTRADA_COMPRA',
      almoxarifado: 'LOJA',
      quantidade: qtd,
      custo_unitario: 0,
      documento_referencia: `OP #${ordem.numero}`,
      motivo: `Finalização PCP Ordem #${ordem.numero}`,
      operador_id: operadorId,
    });
  }
}
