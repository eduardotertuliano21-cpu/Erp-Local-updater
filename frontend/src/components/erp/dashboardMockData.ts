export const CORES_ABC = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const DADOS_VAZIOS_DASHBOARD = {
  kpisTopo: {
    faturamentoHoje: 0,
    ticketMedioHoje: 0,
    totalCuponsHoje: 0,
    descontoTotalHoje: 0,
    participacaoPixPct: 0,
    margemLucroBrutoPct: 0,
    comparativoOntemPct: 0,
  },
  eletrocardiograma7Dias: [] as Array<{ data: string; label: string; faturamento: number; cupons: number }>,
  mapaCalor: [] as Array<{ faixa: string; hora: number; vendas: number; faturamento: number }>,
  curvaAbc: [] as Array<{ nome: string; total: number; percentual: number; quantidade: number }>,
  movimentacoesCriticas: [] as Array<{ id: string; tipo: 'CANCELAMENTO' | 'SANGRIA' | 'SUPRIMENTO'; descricao: string; valor: number; operador_id: string; criado_em: string }>,
};

// Aliases para compatibilidade
export const DADOS_MOCK = DADOS_VAZIOS_DASHBOARD;
