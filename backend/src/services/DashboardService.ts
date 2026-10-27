import { DashboardRepository, DashboardOverviewDTO } from '../repositories/DashboardRepository.js';

export class DashboardService {
  constructor(private dashboardRepo: DashboardRepository) {}

  public obterDashboardOverview(inicio?: string, fim?: string): DashboardOverviewDTO {
    const kpisTopo = this.dashboardRepo.obterKpisTopo(inicio, fim);
    const eletrocardiograma7Dias = this.dashboardRepo.obterEletrocardiograma7Dias(inicio, fim);
    const mapaCalor = this.dashboardRepo.obterMapaCalorHorario(inicio, fim);
    const curvaAbc = this.dashboardRepo.obterCurvaAbc(5, inicio, fim);
    const fechamentoPagamentos = this.dashboardRepo.obterFechamentoPagamentos(inicio, fim);
    const movimentacoesCriticas = this.dashboardRepo.obterMovimentacoesCriticas(8, inicio, fim);

    return {
      kpisTopo,
      eletrocardiograma7Dias,
      mapaCalor,
      curvaAbc,
      fechamentoPagamentos,
      movimentacoesCriticas,
    };
  }
}
