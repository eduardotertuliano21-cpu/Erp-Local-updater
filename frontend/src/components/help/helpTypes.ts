import type { ErpTabType } from '../erp/ErpLayout.js';

export type HelpCategoryId =
  | 'TODOS'
  | 'PRIMEIROS_PASSOS'
  | 'PDV_CAIXA'
  | 'PRODUTOS_ESTOQUE'
  | 'BALANCA_PESAGEM'
  | 'NICHOS'
  | 'FINANCEIRO_RELATORIOS'
  | 'FISCAL_NFCE'
  | 'REDE_SISTEMA';

export interface HelpStep {
  titulo: string;
  descricao: string;
  destaque?: string;
}

export interface HelpTutorial {
  id: string;
  titulo: string;
  resumo: string;
  categoria: Exclude<HelpCategoryId, 'TODOS'>;
  atalho?: string;
  nichoEspecifico?: string;
  abaDestino?: ErpTabType | 'PDV';
  labelBotaoDestino?: string;
  palavrasChave: string[];
  perguntasFrequentes: string[];
  passos: HelpStep[];
  dicas: string[];
}

export interface HelpCategoryInfo {
  id: HelpCategoryId;
  nome: string;
  descricao: string;
  corBadge: string;
}

export const CATEGORIAS_AJUDA: HelpCategoryInfo[] = [
  {
    id: 'TODOS',
    nome: 'Todos os Tutoriais',
    descricao: 'Visão completa de todos os guias do sistema',
    corBadge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    id: 'PRIMEIROS_PASSOS',
    nome: 'Primeiros Passos & Login',
    descricao: 'Implantação inicial, senhas, Porteira Aberta e permissões RBAC',
    corBadge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
  {
    id: 'PDV_CAIXA',
    nome: 'Frente de Caixa (PDV)',
    descricao: 'Vendas rápidas, atalhos F1-F12, sangria, troco, fiado, TEF e B2B',
    corBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'PRODUTOS_ESTOQUE',
    nome: 'Produtos, Estoque & XML',
    descricao: 'Catálogo, fardos WMS, XML NF-e, Coletor Mobile, PCP, Promoções e Etiquetas',
    corBadge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    id: 'BALANCA_PESAGEM',
    nome: 'Balanças & Pesagem',
    descricao: 'Etiquetas prefixo 2, pesagem ao vivo no caixa e carga MGV Toledo/Filizola',
    corBadge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    id: 'NICHOS',
    nome: 'Módulos por Nicho',
    descricao: 'Restaurante (Mesas/KDS/Mobile), Açougue (Desossa), Roupas (Grade), Autopeças e OS',
    corBadge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  {
    id: 'FINANCEIRO_RELATORIOS',
    nome: 'Financeiro, DRE & BI',
    descricao: 'Contas a pagar/receber, DRE, Curva ABC, Dashboard e Auditoria',
    corBadge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  {
    id: 'FISCAL_NFCE',
    nome: 'Fiscal NFC-e & SEFAZ',
    descricao: 'Certificado A1, Token CSC, NCM/CSOSN, PageUp/PageDown e Contingência',
    corBadge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  {
    id: 'REDE_SISTEMA',
    nome: 'Rede LAN, Backup & Sistema',
    descricao: 'Multi-terminal em rede, Failover, Backup USB, Assinatura Stripe e Auto-Update',
    corBadge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
];
