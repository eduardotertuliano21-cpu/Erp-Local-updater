import { Sparkles, Wine, Beef, Pizza, Coffee, Tag } from 'lucide-react';

export interface ItemPedidoMobile {
  produto_id?: string;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
  observacao?: string;
}

export const CATEGORIAS_PADRAO = [
  { id: 'TODOS', label: 'Tudo', icon: Sparkles },
  { id: 'BEBIDAS', label: 'Bebidas', icon: Wine },
  { id: 'PRATOS', label: 'Pratos', icon: Beef },
  { id: 'PIZZAS', label: 'Pizzas', icon: Pizza },
  { id: 'SOBREMESAS', label: 'Sobremesas', icon: Coffee },
  { id: 'GERAL', label: 'Geral', icon: Tag },
];
