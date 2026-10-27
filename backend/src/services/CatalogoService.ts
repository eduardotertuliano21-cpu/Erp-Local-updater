import { ICatalogoRepository } from '../repositories/ICatalogoRepository.js';
import { Produto } from '../types/api.js';

export class CatalogoService {
  constructor(private catalogoRepo: ICatalogoRepository) {}

  public buscarPorCodigoBarras(codigo: string, ramoAtuacao?: string): Produto | null {
    if (!codigo || codigo.trim() === '') {
      throw new Error('Código de barras não informado');
    }
    return this.catalogoRepo.buscarPorCodigoBarras(codigo.trim(), ramoAtuacao);
  }

  public pesquisarProdutos(termo: string, ramoAtuacao?: string, limite = 50, offset = 0): Produto[] {
    if (!termo || termo.trim().length < 2) {
      return this.catalogoRepo.listarTodos(limite, offset, ramoAtuacao);
    }
    return this.catalogoRepo.buscarPorDescricao(termo.trim(), limite, ramoAtuacao);
  }
}
