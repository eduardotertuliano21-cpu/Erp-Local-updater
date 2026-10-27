import { IFiscalRepository, DocumentoFiscalRecord } from '../repositories/IFiscalRepository.js';
import { IOperacaoRepository } from '../repositories/IOperacaoRepository.js';

export interface TransmissaoContingenciaResultado {
  transmitidas: number;
  autorizadas: number;
  falhas: number;
  documentosAtualizados: Array<{ chave: string; protocolo: string; status: string }>;
  pendenciasRestantes: number;
}

export class ContingencyTransmissionService {
  constructor(
    private fiscalRepo: IFiscalRepository,
    private operacaoRepo: IOperacaoRepository
  ) {}

  public async transmitirFilaContingencia(
    mockEnvioNuvemSefaz?: (lote: DocumentoFiscalRecord[]) => Promise<Record<string, { autorizado: boolean; protocolo?: string; motivo?: string }>>
  ): Promise<TransmissaoContingenciaResultado> {
    const pendentes = this.fiscalRepo.listarDocumentosContingenciaPendentes(50);

    if (pendentes.length === 0) {
      return {
        transmitidas: 0,
        autorizadas: 0,
        falhas: 0,
        documentosAtualizados: [],
        pendenciasRestantes: 0,
      };
    }

    const resultadoDocs: Array<{ chave: string; protocolo: string; status: string }> = [];
    let autorizadas = 0;
    let falhas = 0;

    // Simulação do WebService de Recepção de Lote SEFAZ ou Cloud Gateway
    for (const doc of pendentes) {
      try {
        let protocolo = `13526${Date.now()}`;
        let aprovado = true;

        if (mockEnvioNuvemSefaz) {
          const res = await mockEnvioNuvemSefaz([doc]);
          const docRes = res[doc.chave_acesso];
          if (docRes && !docRes.autorizado) {
            aprovado = false;
          } else if (docRes && docRes.protocolo) {
            protocolo = docRes.protocolo;
          }
        }

        if (aprovado) {
          this.fiscalRepo.marcarDocumentoAutorizado(doc.id, protocolo);
          this.operacaoRepo.registrarLogAuditoria(
            'CONCILIACAO_CONTINGENCIA_SEFAZ',
            `NFC-e #${doc.numero} (Chave ${doc.chave_acesso}) autorizada com sucesso na SEFAZ. Protocolo: ${protocolo}`
          );

          resultadoDocs.push({
            chave: doc.chave_acesso,
            protocolo,
            status: 'AUTORIZADA',
          });
          autorizadas++;
        } else {
          falhas++;
        }
      } catch (err) {
        falhas++;
      }
    }

    const restantes = this.fiscalRepo.listarDocumentosContingenciaPendentes(1).length;

    return {
      transmitidas: pendentes.length,
      autorizadas,
      falhas,
      documentosAtualizados: resultadoDocs,
      pendenciasRestantes: restantes,
    };
  }

  public obterQuantidadePendentes(): number {
    return this.fiscalRepo.listarDocumentosContingenciaPendentes(100).length;
  }
}
