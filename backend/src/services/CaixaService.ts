import { IOperacaoRepository, CaixaRecord, MovimentacaoCaixaRecord } from '../repositories/IOperacaoRepository.js';
import crypto from 'node:crypto';

export class CaixaService {
  constructor(private operacaoRepo: IOperacaoRepository) {}

  public obterStatusAtual(): { caixa: CaixaRecord | null; totalDinheiroCalculado: number } {
    const caixa = this.operacaoRepo.obterCaixaAberto();
    if (!caixa) {
      return { caixa: null, totalDinheiroCalculado: 0 };
    }

    const movimentacoes = this.operacaoRepo.listarMovimentacoesCaixa(caixa.id);
    let total = 0;

    for (const mov of movimentacoes) {
      if (mov.tipo === 'ABERTURA' || mov.tipo === 'SUPRIMENTO') {
        total += mov.valor;
      } else if (mov.tipo === 'SANGRIA') {
        total -= mov.valor;
      }
    }

    return { caixa, totalDinheiroCalculado: total };
  }

  public abrirCaixa(numero: number, operador: string, saldoInicial: number): CaixaRecord {
    const atual = this.operacaoRepo.obterCaixaAberto();
    if (atual) {
      throw new Error(`O Caixa #${atual.numero} já está aberto`);
    }

    const id = crypto.randomUUID();
    const novoCaixa = this.operacaoRepo.abrirCaixa(id, numero, operador, saldoInicial);
    this.operacaoRepo.registrarLogAuditoria('ABERTURA_CAIXA', `Caixa #${numero} aberto com R$ ${saldoInicial}`, operador);
    return novoCaixa;
  }

  public registrarMovimentacao(
    caixaId: string,
    operadorId: string,
    tipo: 'SANGRIA' | 'SUPRIMENTO',
    valor: number,
    motivo?: string
  ): MovimentacaoCaixaRecord {
    if (valor <= 0) {
      throw new Error('Valor da movimentação deve ser maior que zero');
    }

    const mov = this.operacaoRepo.registrarMovimentacao({
      id: crypto.randomUUID(),
      caixa_id: caixaId,
      operador_id: operadorId,
      tipo,
      valor,
      motivo,
    });

    this.operacaoRepo.registrarLogAuditoria(
      `CAIXA_${tipo}`,
      `${tipo} de R$ ${valor.toFixed(2)}. Motivo: ${motivo || 'N/A'}`,
      operadorId
    );

    return mov;
  }

  public fecharCaixa(caixaId: string, saldoFinal: number, operadorId: string): void {
    const caixa = this.operacaoRepo.obterCaixaAberto();
    if (!caixa || caixa.id !== caixaId) {
      throw new Error('Caixa não encontrado ou já está fechado');
    }

    this.operacaoRepo.fecharCaixa(caixaId, saldoFinal);
    this.operacaoRepo.registrarMovimentacao({
      id: crypto.randomUUID(),
      caixa_id: caixaId,
      operador_id: operadorId,
      tipo: 'FECHAMENTO',
      valor: saldoFinal,
      motivo: 'Fechamento de Caixa',
    });

    this.operacaoRepo.registrarLogAuditoria(
      'FECHAMENTO_CAIXA',
      `Caixa #${caixa.numero} fechado com saldo de R$ ${saldoFinal}`,
      operadorId
    );
  }
}
