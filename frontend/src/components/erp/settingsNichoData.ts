import { Scale, ShoppingBag, Wrench, Utensils } from 'lucide-react';
import type { NichoSegmento } from '../../context/ConfigProvider.js';

export interface NichoInfo {
  id: NichoSegmento;
  nome: string;
  desc: string;
  icon: any;
  tag: string;
}

export const LISTA_NICHOS: NichoInfo[] = [
  {
    id: 'peso',
    nome: 'Açougue e Hortifrúti',
    desc: 'Foco automático no peso, leitor de código de balança (EAN-13 iniciado em 2) e exportação Toledo MGV.',
    icon: Scale,
    tag: 'Balança Integrada',
  },
  {
    id: 'varejo_rapido',
    nome: 'Mercados e Mercearias',
    desc: 'Fast Checkout com Omnibox 100% focada, agrupamento inteligente e velocidade extrema no balcão.',
    icon: ShoppingBag,
    tag: 'Fast Checkout',
  },
  {
    id: 'auto_pecas',
    nome: 'Autopeças e Motopeças',
    desc: 'Busca inteligente com Código Original (OEM), Referência Cruzada, Aplicação veicular e resgate de pré-venda.',
    icon: Wrench,
    tag: 'OEM & Aplicação',
  },
  {
    id: 'food',
    nome: 'Restaurantes e Lanchonetes',
    desc: 'Grid de Mesas/Comandas, divisão de contas, taxa de serviço de 10% e ordem de preparo para cozinha.',
    icon: Utensils,
    tag: 'Mesas & Comandas',
  },
];
