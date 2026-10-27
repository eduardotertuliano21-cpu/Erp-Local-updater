import { IOperacaoRepository, ResumoPendenciasSync } from '../repositories/IOperacaoRepository.js';

export interface UpsyncResultado {
  vendasSincronizadas: number;
  movimentacoesSincronizadas: number;
  pendenciasRestantes: ResumoPendenciasSync;
}

export class UpsyncService {
  constructor(private operacaoRepo: IOperacaoRepository) {}

  public async executarUpsync(mockEnvioNuvem?: (payload: any) => Promise<boolean>): Promise<UpsyncResultado> {
    const vendasPendentes = this.operacaoRepo.obterVendasPendentes(100);
    const movsPendentes = this.operacaoRepo.obterMovimentacoesPendentes(100);

    let vendasSucessoIds: string[] = [];
    let movsSucessoIds: string[] = [];

    if (vendasPendentes.length > 0 || movsPendentes.length > 0) {
      const payloadSync = {
        timestamp: new Date().toISOString(),
        vendas: vendasPendentes,
        movimentacoes: movsPendentes,
      };

      let enviou = false;
      if (mockEnvioNuvem) {
        enviou = await mockEnvioNuvem(payloadSync);
      } else {
        const cloudUrl = process.env.CLICKSTORM_MASTER_URL;
        if (cloudUrl) {
          try {
            const res = await fetch(`${cloudUrl.replace(/\/+$/, '')}/api/sync/telemetry`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadSync),
            });
            enviou = res.ok;
          } catch {
            enviou = false;
          }
        }
      }

      if (enviou) {
        vendasSucessoIds = vendasPendentes.map((v) => v.id);
        movsSucessoIds = movsPendentes.map((m) => m.id);

        this.operacaoRepo.marcarVendasSincronizadas(vendasSucessoIds);
        this.operacaoRepo.marcarMovimentacoesSincronizadas(movsSucessoIds);

        this.operacaoRepo.registrarLogAuditoria(
          'SYNC_UPSYNC_SUCESSO',
          `Sincronizados ${vendasSucessoIds.length} vendas e ${movsSucessoIds.length} movimentações com a nuvem`
        );
      }
    }

    return {
      vendasSincronizadas: vendasSucessoIds.length,
      movimentacoesSincronizadas: movsSucessoIds.length,
      pendenciasRestantes: this.operacaoRepo.obterResumoPendencias(),
    };
  }

  public obterResumoPendencias(): ResumoPendenciasSync {
    return this.operacaoRepo.obterResumoPendencias();
  }
}
