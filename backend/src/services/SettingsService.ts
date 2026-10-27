import { SettingsRepository, StoreSettings } from '../repositories/SettingsRepository.js';
import { LogoStorageService } from './LogoStorageService.js';

export class SettingsService {
  constructor(private settingsRepo: SettingsRepository) {}

  public obterSettings(): StoreSettings {
    return this.settingsRepo.obter();
  }

  public salvarSettings(dados: Partial<StoreSettings>): StoreSettings {
    return this.settingsRepo.salvar(dados);
  }

  public exportarCargaMgv(): string {
    return this.settingsRepo.gerarCargaToledoMgv();
  }

  public salvarLogoEmDisco(imagemBase64: string, extensao?: string): { url: string; caminhoFisico: string } {
    const atual = this.settingsRepo.obter();
    if (atual.logo_url) {
      LogoStorageService.limparLogoAntiga(atual.logo_url);
    }
    const salvo = LogoStorageService.salvarLogo(imagemBase64, extensao);
    this.settingsRepo.salvar({ logo_url: salvo.url });
    return salvo;
  }
}
