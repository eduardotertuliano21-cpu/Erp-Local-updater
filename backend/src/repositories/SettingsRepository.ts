import { ConfigLojaRepository, ConfigLoja, NichoSegmento } from './ConfigLojaRepository.js';

export type { NichoSegmento };
export type StoreSettings = ConfigLoja;
export const SETTINGS_PADRAO: ConfigLoja = new ConfigLojaRepository().obter();
export class SettingsRepository extends ConfigLojaRepository {}
