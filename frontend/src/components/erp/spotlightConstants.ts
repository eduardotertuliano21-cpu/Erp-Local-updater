import React from 'react';
import {
  Package,
  Users,
  FileBarChart,
  WalletCards,
  Warehouse,
  Flame,
  Layers,
  BarChart3,
  ShieldAlert,
  Cpu,
  Sliders,
  CreditCard,
  ShoppingCart,
  HelpCircle,
  Tag,
  UtensilsCrossed,
  Wrench,
  Beef,
  ChefHat,
  FileCheck2,
} from 'lucide-react';
import type { ErpTabType } from './ErpLayout.js';

export interface FuncaoAtalho {
  id: ErpTabType | 'PDV';
  titulo: string;
  subtitulo: string;
  atalho?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const FUNCOES_SISTEMA: FuncaoAtalho[] = [
  { id: 'AJUDA', titulo: 'Central de Ajuda & Tutoriais', subtitulo: 'Pesquisa inteligente passo a passo de como usar o sistema', atalho: '?', icon: HelpCircle },
  { id: 'RELATORIOS', titulo: 'Painel & Relatórios', subtitulo: 'Gráficos, vendas detalhadas, caixas e fiscal', atalho: 'F1', icon: FileBarChart },
  { id: 'PRODUTOS', titulo: 'Produtos & Catálogo', subtitulo: 'Cadastro de itens, preços, códigos, balança e NCM', atalho: 'F2', icon: Package },
  { id: 'NFE_DANFE', titulo: 'Emissão NF-e & DANFE (Modelo 55)', subtitulo: 'Emitir NF-e A4, relatórios de DANFE e pastas Ano/Mês/Data', atalho: 'F3', icon: FileCheck2 },
  { id: 'FINANCEIRO', titulo: 'Financeiro & Contas', subtitulo: 'Contas a pagar/receber, fluxo de caixa e DRE', atalho: 'F4', icon: WalletCards },
  { id: 'ESTOQUE', titulo: 'Estoque & WMS', subtitulo: 'Posição de saldo, ajustes, XML NF-e e movimentações', atalho: 'F5', icon: Warehouse },
  { id: 'PDV', titulo: 'Abrir Frente de Caixa (PDV)', subtitulo: 'Ir imediatamente para a tela de vendas', atalho: 'F11', icon: ShoppingCart },
  { id: 'PROMOCOES', titulo: 'Promoções & Ofertas', subtitulo: 'Campanhas promocionais em massa e descontos', icon: Flame },
  { id: 'ENTIDADES', titulo: 'Equipe & Clientes', subtitulo: 'Clientes, fornecedores, fiado, garçons e funcionários', icon: Users },
  { id: 'COMPRAS_ENTRADA', titulo: 'Entradas NF (G.E.M.)', subtitulo: 'Importação de XML NF-e em 2 etapas (Rascunho e Efetivação)', icon: Layers },
  { id: 'CURVA_ABC', titulo: 'Curva ABC (BI)', subtitulo: 'Análise de rentabilidade (Classes A 80%, B 15%, C 5%)', icon: BarChart3 },
  { id: 'AUDITORIA', titulo: 'Trilha de Auditoria', subtitulo: 'Logs imutáveis de segurança e snapshots JSON', icon: ShieldAlert },
  { id: 'PCP', titulo: 'Produção PCP / Ficha Técnica', subtitulo: 'Ordens de produção e composição de insumos (BOM)', icon: Cpu },
  { id: 'ETIQUETAS', titulo: 'Etiquetas Térmicas (Zebra / Argox)', subtitulo: 'Emissão de etiquetas de gôndola e preço em ZPL/EPL2', icon: Tag },
  { id: 'MESAS', titulo: 'Mesas & Comandas (Restaurante)', subtitulo: 'Mapa de salão, pré-conta, taxa 10% e comanda mobile', icon: UtensilsCrossed },
  { id: 'ORDENS_SERVICO', titulo: 'Ordens de Serviço (Assistência)', subtitulo: 'Abertura de OS, status, impressão e aviso via WhatsApp', icon: Wrench },
  { id: 'DESOSSA', titulo: 'Rendimento de Desossa (Açougue)', subtitulo: 'Transformação de carcaça em cortes, quebra e rateio CMV', icon: Beef },
  { id: 'KDS', titulo: 'Monitor de Cozinha KDS', subtitulo: 'Fila de preparo em tempo real com cronômetro de atraso', icon: ChefHat },
  { id: 'CONFIGURACOES', titulo: 'Configurações da Empresa', subtitulo: 'Dados fiscais, certificado A1, balanças, impressoras e RBAC', icon: Sliders },
  { id: 'ASSINATURA', titulo: 'Assinatura & Licença', subtitulo: 'Pagamento Pix/Cartão Stripe, planos e histórico', icon: CreditCard },
];
