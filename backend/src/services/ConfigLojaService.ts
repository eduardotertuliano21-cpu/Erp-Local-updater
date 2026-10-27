import { ConfigLojaRepository, ConfigLoja } from '../repositories/ConfigLojaRepository.js';

export class ConfigLojaService {
  constructor(private configRepo: ConfigLojaRepository) {}

  public obterConfig(): ConfigLoja {
    return this.configRepo.obter();
  }

  public salvarConfig(dados: Partial<ConfigLoja>): ConfigLoja {
    if (dados.cor_primaria && !dados.cor_primaria.startsWith('#')) {
      dados.cor_primaria = `#${dados.cor_primaria}`;
    }
    return this.configRepo.salvar(dados);
  }
}
