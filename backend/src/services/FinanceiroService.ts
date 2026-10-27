import { FinanceiroRepository, TituloFinanceiro } from '../repositories/FinanceiroRepository.js';
import crypto from 'node:crypto';

export class FinanceiroService {
  constructor(private financeiroRepo: FinanceiroRepository) {}

  public listar(tipo?: string, status?: string): TituloFinanceiro[] {
    return this.financeiroRepo.listar(tipo, status);
  }

  public criarTitulo(dados: Partial<TituloFinanceiro>): TituloFinanceiro {
    if (!dados.tipo || !dados.entidade_nome || !dados.descricao || !dados.valor || !dados.vencimento) {
      throw new Error('Tipo, Entidade, Descrição, Valor e Vencimento são obrigatórios.');
    }

    const titulo: TituloFinanceiro = {
      id: dados.id || crypto.randomUUID(),
      tipo: dados.tipo,
      entidade_id: dados.entidade_id,
      entidade_nome: dados.entidade_nome.trim().toUpperCase(),
      descricao: dados.descricao.trim(),
      valor: Number(dados.valor),
      valor_pago: 0,
      vencimento: dados.vencimento,
      status: 'PENDENTE',
      categoria: dados.categoria ? dados.categoria.trim().toUpperCase() : 'GERAL',
    };

    this.financeiroRepo.salvar(titulo);
    return titulo;
  }

  public liquidarTitulo(id: string, valorPago: number, dataPagamento?: string): void {
    const data = dataPagamento || new Date().toISOString().slice(0, 10);
    this.financeiroRepo.liquidar(id, valorPago, data);
  }

  public obterTotais(): any {
    return this.financeiroRepo.obterTotaisGerais();
  }

  public obterDRE(mesAno?: string): any {
    const periodo = mesAno || new Date().toISOString().slice(0, 7);
    return this.financeiroRepo.calcularDRE(periodo);
  }
}
