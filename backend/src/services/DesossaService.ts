import { DesossaRepository, DesossaRecord, DesossaItem } from '../repositories/DesossaRepository.js';

export interface ExecutarDesossaInput {
  produto_origem_id: string;
  produto_origem_nome: string;
  peso_origem: number;
  custo_origem_total: number;
  operador_id?: string;
  observacoes?: string;
  cortes: Array<{
    produto_destino_id: string;
    descricao: string;
    peso: number;
    preco_venda_sugerido?: number;
  }>;
}

export class DesossaService {
  constructor(private repo: DesossaRepository) {}

  public listar(limite = 50): DesossaRecord[] {
    return this.repo.listar(limite);
  }

  public obterPorId(id: string): DesossaRecord | null {
    return this.repo.obterPorId(id);
  }

  public processarDesossa(dados: ExecutarDesossaInput): DesossaRecord {
    if (!dados.produto_origem_id || !dados.peso_origem || dados.peso_origem <= 0) {
      throw new Error('Produto de origem e peso válido são obrigatórios.');
    }
    if (!dados.cortes || dados.cortes.length === 0) {
      throw new Error('Informe ao menos um corte de destino resultante da desossa.');
    }

    const pesoCortesTotal = dados.cortes.reduce((acc, c) => acc + (Number(c.peso) || 0), 0);
    const pesoOrigem = Number(dados.peso_origem);
    const custoOrigemTotal = Number(dados.custo_origem_total) || 0;

    const pesoQuebra = Math.max(0, +(pesoOrigem - pesoCortesTotal).toFixed(3));
    const percentualQuebra = +( (pesoQuebra / pesoOrigem) * 100 ).toFixed(2);

    // Rateio ponderado por valor agregado dos cortes (se informado preco_venda_sugerido) ou por peso aproveitado
    const valorTotalEstimado = dados.cortes.reduce((acc, c) => {
      const preco = Number(c.preco_venda_sugerido) || 1;
      return acc + (c.peso * preco);
    }, 0);

    const itensProcessados: Array<Omit<DesossaItem, 'id' | 'desossa_id'>> = dados.cortes.map((c) => {
      const rendimentoPct = +( (c.peso / pesoOrigem) * 100 ).toFixed(2);
      let custoRateadoKg = 0;

      if (valorTotalEstimado > 0 && c.preco_venda_sugerido) {
        const proporcaoValor = (c.peso * c.preco_venda_sugerido) / valorTotalEstimado;
        const custoTotalItem = proporcaoValor * custoOrigemTotal;
        custoRateadoKg = +(custoTotalItem / c.peso).toFixed(2);
      } else {
        custoRateadoKg = pesoCortesTotal > 0 ? +(custoOrigemTotal / pesoCortesTotal).toFixed(2) : 0;
      }

      return {
        produto_destino_id: c.produto_destino_id,
        descricao: c.descricao,
        peso: Number(c.peso),
        percentual_rendimento: rendimentoPct,
        custo_unitario_rateado: custoRateadoKg,
        preco_venda_sugerido: c.preco_venda_sugerido,
      };
    });

    return this.repo.salvarDesossa(
      {
        produto_origem_id: dados.produto_origem_id,
        produto_origem_nome: dados.produto_origem_nome,
        peso_origem: pesoOrigem,
        custo_origem_total: custoOrigemTotal,
        peso_cortes_total: +(pesoCortesTotal).toFixed(3),
        peso_quebra: pesoQuebra,
        percentual_quebra: percentualQuebra,
        status: 'CONCLUIDA',
        operador_id: dados.operador_id,
        observacoes: dados.observacoes,
      },
      itensProcessados
    );
  }
}
