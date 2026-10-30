// Simulação de banco em memória / camada de abstração para PostgreSQL / Supabase
export interface Tenant {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  administradorNome: string;
  administradorLogin?: string;
  administradorEmail: string;
  endereco?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  logoUrl?: string;
  chaveLicenca: string;
  planoId: string;
  statusLicenca: 'ATIVA' | 'INADIMPLENTE' | 'BLOQUEADA' | 'TESTE';
  dataExpiracao: string;
  dataVencimento?: string;
  diasCarencia: number;
  recorrenciaAtiva?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  ultimoSyncEm?: string;
  versaoDesktop?: string;
  ramo_atuacao?: 'mercado' | 'restaurante' | 'acougue' | 'autopecas' | 'assistencia' | 'roupas';
  maquinasContratadas?: number;
  maquinasExtras?: number;
  valorExtraRecorrente?: number;
  proximaCobrancaExtra?: { valor: number; motivo: string; ativa: boolean };
  resetSenhaPendente?: {
    novaSenhaHash: string;
    loginAdmin?: string;
    solicitadoEm: string;
  };
  atualizacaoPendente?: {
    solicitadoEm: string;
    forcarMesmaVersao: boolean;
    downloadUrl?: string;
    versao?: string;
  };
  moduloNfe?: boolean;
  metodoPagamentoPreferencia?: 'PIX' | 'CARTAO';
}

export interface Plano {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  valorMensal: number;
  periodicidade?: 'MENSAL' | 'ANUAL';
  mesesRenovacao?: number;
  recursos: string[];
  limiteCaixas: number;
  valorMaquinaExtra?: number;
  stripeProductId?: string;
  stripePriceId?: string;
  ativo: boolean;
  moduloNfe?: boolean;
}

export interface Pagamento {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  valor: number;
  status: 'paid' | 'open' | 'failed';
  metodoPagamento: string;
  dataPagamento: string;
  tipo?: 'ASSINATURA' | 'SERVICO_EXTRA';
  descricao?: string;
  stripeCheckoutUrl?: string;
  linkPagamento?: string;
}

export interface AdminUser {
  id: string;
  login: string;
  password: string;
  nome: string;
  role: 'MASTER_ADMIN' | 'SUPORTE' | 'FINANCEIRO';
  ativo: boolean;
  criadoEm: string;
}

export const PLANOS_PADRAO: Plano[] = [
  {
    id: 'plano-mensal',
    slug: 'mensal',
    nome: 'Plano Mensal',
    descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)',
    valorMensal: 130.00,
    periodicidade: 'MENSAL',
    mesesRenovacao: 1,
    recursos: [
      'Até 3 Máquinas Inclusas',
      'PDV Offline-First',
      'NFC-e'
    ],
    limiteCaixas: 3,
    valorMaquinaExtra: 25.00,
    stripeProductId: 'prod_mensal_99',
    stripePriceId: 'price_local_130_5069',
    ativo: true,
    moduloNfe: true,
  },
  {
    id: 'plano-anual',
    slug: 'anual',
    nome: 'Plano Anual',
    descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)',
    valorMensal: 1300.00,
    periodicidade: 'ANUAL',
    mesesRenovacao: 12,
    recursos: [
      'Até 3 Máquinas Inclusas',
      '2 Meses Grátis',
      'Backup Nuvem',
      'NFC-e & DANFE'
    ],
    limiteCaixas: 3,
    valorMaquinaExtra: 25.00,
    stripeProductId: 'prod_anual_990',
    stripePriceId: 'price_local_1300_1072',
    ativo: true,
    moduloNfe: true,
  },
];

export interface ConfigGlobal {
  stripeSecretKey: string;
  stripePublicKey: string;
  diasTrialNovosClientes?: number;
}

// Seed inicial para o painel Master Admin
export const dbMock = {
  usuarios: [
    {
      id: 'usr-1',
      login: 'eduardo.tertuliano21',
      password: '2111993@Edu',
      nome: 'Eduardo Tertuliano',
      role: 'MASTER_ADMIN',
      ativo: true,
      criadoEm: new Date().toISOString(),
    },
  ] as AdminUser[],
  planos: [...PLANOS_PADRAO] as Plano[],

  tenants: [] as Tenant[],

  pagamentos: [] as Pagamento[],

  configGlobal: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || Buffer.from('c2tfbGl2ZV81MVRhUTh3QkNiZ2MyUXZ0RFBMc1RLajFkMG9OTjQzT3gxaVFlSzM3bm9oT0hhdmhlWkJFdGF1aWdMYlZnWW9LMldxbFNHUE9wa25BakFScExGTkdMaWZjRTAwVm1PMXBlUnY=', 'base64').toString('utf-8'),
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || Buffer.from('cGtfbGl2ZV81MVRhUTh3QkNiZ2MyUXZ0RHBPTHhES0NkR2lkdTZ1WDRKVnhqMTlqdWFxNksyelZiZU1nS096eGhKbkZHTHkyUHhKVGVsOUhERjRUTnVYTmlobVdSbnVROTAwS0lWTWprdGg=', 'base64').toString('utf-8'),
    diasTrialNovosClientes: 7,
  } as ConfigGlobal,
};

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'master_db.json');

export function salvarBancoMaster(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMock, null, 2), 'utf-8');
  } catch (_e) {
    // Ignora erro pontual de escrita
  }
}

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.usuarios)) dbMock.usuarios = saved.usuarios;
    if (Array.isArray(saved.planos)) {
      const temLegados = saved.planos.some((p: any) => p.id === 'plano-1' || p.id === 'plano-2' || p.id === 'plano-3');
      if (temLegados || saved.planos.length === 0) {
        dbMock.planos = [...PLANOS_PADRAO];
      } else {
        dbMock.planos = saved.planos;
      }
    }
    if (Array.isArray(saved.tenants)) {
      dbMock.tenants = saved.tenants.filter(
        (t: any) =>
          t.id !== 'tenant-101' &&
          t.id !== 'tenant-102' &&
          !String(t.nomeFantasia || t.razaoSocial || '').toLowerCase().includes('minha loja') &&
          String(t.cnpj || '').replace(/\D/g, '') !== '99888777000166' &&
          String(t.chaveLicenca || '') !== 'CS-2026-99888777' &&
          String(t.administradorLogin || '').toLowerCase() !== 'novolouco'
      );
    }
    if (Array.isArray(saved.pagamentos)) {
      dbMock.pagamentos = saved.pagamentos.filter(
        (p: any) => p.id !== 'pag-1' && p.id !== 'pag-2'
      );
    }
    if (saved.configGlobal && typeof saved.configGlobal === 'object') {
      dbMock.configGlobal = {
        stripeSecretKey: saved.configGlobal.stripeSecretKey || dbMock.configGlobal.stripeSecretKey,
        stripePublicKey: saved.configGlobal.stripePublicKey || dbMock.configGlobal.stripePublicKey,
      };
    }
    salvarBancoMaster();
  } else {
    salvarBancoMaster();
  }
} catch (err) {
  console.error('Erro ao inicializar persistência do Master Admin:', err);
}

let lastSnapshot = JSON.stringify(dbMock);
setInterval(() => {
  try {
    const current = JSON.stringify(dbMock);
    if (current !== lastSnapshot) {
      fs.writeFileSync(DB_FILE, current, 'utf-8');
      lastSnapshot = current;
    }
  } catch (_e) {
    // Ignora erro pontual de escrita
  }
}, 1000);


