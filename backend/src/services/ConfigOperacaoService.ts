import { ConfigOperacaoRepository, ConfigOperacao } from '../repositories/ConfigOperacaoRepository.js';

export class ConfigOperacaoService {
  constructor(private repo: ConfigOperacaoRepository) {}

  public obter(): ConfigOperacao {
    return this.repo.obter();
  }

  public salvar(dados: Partial<ConfigOperacao>): ConfigOperacao {
    return this.repo.salvar(dados);
  }
}
