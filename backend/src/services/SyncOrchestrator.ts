import { DownsyncService } from './DownsyncService.js';
import { UpsyncService } from './UpsyncService.js';
import { ContingencyTransmissionService } from './ContingencyTransmissionService.js';
import { ResumoPendenciasSync } from '../repositories/IOperacaoRepository.js';

export interface SyncStatus {
  status: 'IDLE' | 'SYNCING' | 'OFFLINE';
  ultimoCicloEm: string | null;
  ultimoErro?: string;
  pendencias: ResumoPendenciasSync;
  contingenciasPendentes: number;
}

export class SyncOrchestrator {
  private status: 'IDLE' | 'SYNCING' | 'OFFLINE' = 'IDLE';
  private ultimoCicloEm: string | null = null;
  private ultimoErro: string | undefined = undefined;
  private intervaloTimer: NodeJS.Timeout | null = null;

  constructor(
    private downsyncService: DownsyncService,
    private upsyncService: UpsyncService,
    private contingencyService?: ContingencyTransmissionService
  ) {}

  public async rodarCicloSincronizacao(): Promise<SyncStatus> {
    if (this.status === 'SYNCING') {
      return this.obterStatus();
    }

    this.status = 'SYNCING';
    this.ultimoErro = undefined;

    try {
      // 1. Sincroniza Nuvem -> Local (Catálogo e Regras Fiscais)
      await this.downsyncService.executarDownsync();

      // 2. Sincroniza Local -> Nuvem (Vendas e Movimentações Operacionais)
      await this.upsyncService.executarUpsync();

      // 3. Desova Fila de Contingência NFC-e (SEFAZ)
      if (this.contingencyService) {
        await this.contingencyService.transmitirFilaContingencia();
      }

      this.status = 'IDLE';
      this.ultimoCicloEm = new Date().toISOString();
    } catch (err: any) {
      this.status = 'OFFLINE';
      this.ultimoErro = err.message || 'Falha de comunicação no ciclo de sincronização';
    }

    return this.obterStatus();
  }

  public iniciarAgendamentoAutomatico(intervaloMs = 30000): void {
    if (this.intervaloTimer) return;
    this.intervaloTimer = setInterval(() => {
      this.rodarCicloSincronizacao().catch((e) => console.error('[Sync Worker Error]:', e));
    }, intervaloMs);
  }

  public pararAgendamentoAutomatico(): void {
    if (this.intervaloTimer) {
      clearInterval(this.intervaloTimer);
      this.intervaloTimer = null;
    }
  }

  public obterStatus(): SyncStatus {
    const contingencias = this.contingencyService ? this.contingencyService.obterQuantidadePendentes() : 0;
    return {
      status: this.status,
      ultimoCicloEm: this.ultimoCicloEm,
      ultimoErro: this.ultimoErro,
      pendencias: this.upsyncService.obterResumoPendencias(),
      contingenciasPendentes: contingencias,
    };
  }
}
