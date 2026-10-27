export interface RegraFiscalRecord {
  id: string;
  ncm: string;
  cfop_padrao: string;
  cst_csosn: string;
  aliquota_icms: number;
  aliquota_pis: number;
  aliquota_cofins: number;
}

export interface DocumentoFiscalRecord {
  id: string;
  venda_id: string;
  numero: number;
  serie: number;
  modelo: string;
  chave_acesso: string;
  tp_emis: string;
  status: 'EMITIDA_CONTINGENCIA' | 'AUTORIZADA' | 'REJEITADA' | 'CANCELADA';
  xml_conteudo: string;
  protocolo_autorizacao: string | null;
  motivo_contingencia: string | null;
  emitido_em: string;
  sincronizado: number;
}

export interface IFiscalRepository {
  obterRegraFiscalPorNcm(ncm: string): RegraFiscalRecord | null;
  obterUltimoNumeroNfce(serie: number): number;
  salvarDocumentoFiscal(doc: Omit<DocumentoFiscalRecord, 'sincronizado' | 'emitido_em'>): DocumentoFiscalRecord;
  obterDocumentoFiscalPorVenda(vendaId: string): DocumentoFiscalRecord | null;
  listarDocumentosContingenciaPendentes(limite?: number): DocumentoFiscalRecord[];
  marcarDocumentoAutorizado(id: string, protocolo: string): void;
  cancelarDocumentoFiscal(vendaId: string, motivo: string): void;
}
