import { ConfigLojaRepository, ConfigLoja } from '../repositories/ConfigLojaRepository.js';
import { LogoStorageService } from './LogoStorageService.js';

export class SettingsService {
  constructor(private configRepo: ConfigLojaRepository) {}

  public obterSettings(): ConfigLoja {
    return this.configRepo.obter();
  }

  public salvarSettings(dados: Partial<ConfigLoja>): ConfigLoja {
    return this.configRepo.salvar(dados);
  }

  public exportarCargaMgv(): string {
    return this.configRepo.gerarCargaToledoMgv();
  }

  public salvarLogoEmDisco(imagemBase64: string, extensao?: string): { url: string; caminhoFisico: string } {
    const atual = this.configRepo.obter();
    if (atual.logo_url) {
      LogoStorageService.limparLogoAntiga(atual.logo_url);
    }
    const salvo = LogoStorageService.salvarLogo(imagemBase64, extensao);
    this.configRepo.salvar({ logo_url: salvo.url });
    return salvo;
  }
}
