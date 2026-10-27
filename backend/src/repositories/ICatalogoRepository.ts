import { Produto } from '../types/api.js';

export interface ICatalogoRepository {
  buscarPorCodigoBarras(codigo: string, ramoAtuacao?: string): Produto | null;
  buscarPorId(id: string): Produto | null;
  buscarPorDescricao(termo: string, limite?: number, ramoAtuacao?: string): Produto[];
  listarTodos(limite?: number, offset?: number, ramoAtuacao?: string): Produto[];
}

export interface ICatalogoSyncRepository {
  aplicarLoteProdutos(produtos: Produto[]): { inseridosOuAtualizados: number };
  excluirProduto(id: string): boolean;
  obterUltimoTimestampSincronizacao(): string | null;
  salvarUltimoTimestampSincronizacao(timestamp: string): void;
}
