import { ICatalogoSyncRepository } from '../repositories/ICatalogoRepository.js';
import { Produto } from '../types/api.js';

export interface DownsyncResultado {
  produtosSincronizados: number;
  cursorAnterior: string | null;
  novoCursor: string;
}

export class DownsyncService {
  constructor(private catalogoSyncRepo: ICatalogoSyncRepository) {}

  public async executarDownsync(produtosNuvem?: Produto[]): Promise<DownsyncResultado> {
    const cursorAnterior = this.catalogoSyncRepo.obterUltimoTimestampSincronizacao();
    const agora = new Date().toISOString();

    // Se produtosNuvem não for passado, simula busca delta da nuvem baseada no cursor
    const lote = produtosNuvem || [];

    if (lote.length > 0) {
      this.catalogoSyncRepo.aplicarLoteProdutos(lote);
    }

    this.catalogoSyncRepo.salvarUltimoTimestampSincronizacao(agora);

    return {
      produtosSincronizados: lote.length,
      cursorAnterior,
      novoCursor: agora,
    };
  }

  public obterUltimoCursor(): string | null {
    return this.catalogoSyncRepo.obterUltimoTimestampSincronizacao();
  }
}
