export type TenantKey = 'mercado' | 'restaurante' | 'acougue' | 'autopecas' | 'assistencia' | 'roupas';

export const TENANT_DB_FILES: Record<TenantKey, string> = {
  mercado: 'db_mercado.sqlite',
  restaurante: 'db_restaurante.sqlite',
  acougue: 'db_acougue.sqlite',
  autopecas: 'db_autopecas.sqlite',
  assistencia: 'db_assistencia.sqlite',
  roupas: 'db_roupas.sqlite',
};

export function normalizeTenant(val?: string): TenantKey {
  if (!val) return 'mercado';
  const s = val.toLowerCase().replace(/[-_]/g, '');
  if (s.includes('rest') || s.includes('food') || s.includes('mesa') || s.includes('comanda')) return 'restaurante';
  if (s.includes('acougue') || s.includes('peso') || s.includes('horti') || s.includes('balanca')) return 'acougue';
  if (s.includes('auto') || s.includes('peca')) return 'autopecas';
  if (s.includes('assist') || s.includes('os') || s.includes('servico') || s.includes('conserto')) return 'assistencia';
  if (s.includes('roupa') || s.includes('calcado') || s.includes('vestuario') || s.includes('moda') || s.includes('grade')) return 'roupas';
  return 'mercado';
}
