import type { ErpTabType } from '../erp/ErpLayout.js';

export type HelpCategoryId =
  | 'INICIO'
  | 'TODOS'
  | 'PRIMEIROS_PASSOS'
  | 'PDV_CAIXA'
  | 'PRODUTOS_ESTOQUE'
  | 'BALANCA_PESAGEM'
  | 'NICHOS'
  | 'FINANCEIRO_RELATORIOS'
  | 'FISCAL_NFCE'
  | 'REDE_SISTEMA';

export type HelpNichoId =
  | 'MEU_RAMO'
  | 'TODOS_RAMOS'
  | 'GERAL'
  | 'MERCADO'
  | 'RESTAURANTE'
  | 'ACOUGUE'
  | 'ROUPAS'
  | 'ASSISTENCIA'
  | 'AUTOPECAS';

export interface HelpStep {
  titulo: string;
  descricao: string;
  destaque?: string;
}

export interface HelpTroubleshooting {
  problema: string;
  solucao: string;
}

export interface HelpTutorial {
  id: string;
  titulo: string;
  resumo: string;
  explicacaoLeigo?: string;
  ondeEncontrar?: string;
  categoria: Exclude<HelpCategoryId, 'TODOS' | 'INICIO'>;
  ramo: Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS'>;
  essencialIniciante?: boolean;
  atalho?: string;
  nichoEspecifico?: string;
  abaDestino?: ErpTabType | 'PDV';
  labelBotaoDestino?: string;
  palavrasChave: string[];
  perguntasFrequentes: string[];
  passos: HelpStep[];
  dicas: string[];
  problemasComuns?: HelpTroubleshooting[];
}

export interface HelpCategoryInfo {
  id: HelpCategoryId;
  nome: string;
  nomeCurto: string;
  descricao: string;
  corBadge: string;
  icone: string;
}

export interface HelpNichoInfo {
  id: Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS'>;
  nome: string;
  nomeCurto: string;
  emoji: string;
  descricao: string;
  corBadge: string;
  recursosExclusivos: string[];
}

export const RAMOS_AJUDA: HelpNichoInfo[] = [
  {
    id: 'GERAL',
    nome: 'Todos os Ramos (Funções Gerais)',
    nomeCurto: 'Geral (Todos)',
    emoji: '🏪',
    descricao: 'Vendas no caixa, estoque, financeiro, notas fiscais e configurações usadas por qualquer loja.',
    corBadge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    recursosExclusivos: ['Caixa PDV (F1 a F12)', 'Controle de Estoque & XML', 'Financeiro, Fiado & DRE', 'Nota Fiscal NFC-e'],
  },
  {
    id: 'MERCADO',
    nome: 'Mercado, Mercearia & Hortifruti',
    nomeCurto: 'Mercado & Hortifruti',
    emoji: '🛒',
    descricao: 'Venda rápida por leitor de código de barras, fardos/caixas (WMS), balanças e promoções em massa.',
    corBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    recursosExclusivos: ['Múltiplos Códigos (Unidade + Fardo/Caixa)', 'Pesagem Rápida no Checkout', 'Carga de Balança MGV Toledo/Filizola', 'Atacado B2B no Caixa'],
  },
  {
    id: 'RESTAURANTE',
    nome: 'Restaurante, Bar & Lanchonete',
    nomeCurto: 'Restaurante & Bar',
    emoji: '🍔',
    descricao: 'Controle de mesas e comandas, pedidos pelo celular do garçom, tela na cozinha (KDS) e ficha técnica.',
    corBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    recursosExclusivos: ['Mapa de Mesas (F6) & Pré-Conta', 'Taxa de Serviço 10% do Garçom', 'App Comanda Mobile no Celular (QR Code)', 'Monitor de Cozinha KDS & Cardápio PDF'],
  },
  {
    id: 'ACOUGUE',
    nome: 'Casa de Carnes & Açougue',
    nomeCurto: 'Açougue & Carnes',
    emoji: '🥩',
    descricao: 'Rendimento de desossa (carcaça para cortes), cálculo de quebra (osso/sebo) e integração com balanças.',
    corBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    recursosExclusivos: ['Módulo Rendimento de Desossa', 'Cálculo Automático de Quebra (Osso/Sebo)', 'Rateio de Custo (CMV) por Corte', 'Etiquetas de Balança Prefixo 2'],
  },
  {
    id: 'ROUPAS',
    nome: 'Roupas, Calçados & Vestuário',
    nomeCurto: 'Roupas & Calçados',
    emoji: '👕',
    descricao: 'Controle por tamanho, cor e marca, gerador automático de grade em lote e etiquetas de peças.',
    corBadge: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
    recursosExclusivos: ['Campos de Marca, Modelo, Tamanho e Cor', 'Gerador Automático de Grade (P ao GG / 34 ao 44)', 'Busca Visual por Tamanho e Cor no PDV', 'Etiquetas Duplas para Roupas/Acessórios'],
  },
  {
    id: 'ASSISTENCIA',
    nome: 'Assistência Técnica & Consertos',
    nomeCurto: 'Assistência Técnica',
    emoji: '🔧',
    descricao: 'Abertura e acompanhamento de Ordens de Serviço (OS), aviso no WhatsApp, termo de garantia e baixa no caixa.',
    corBadge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    recursosExclusivos: ['Painel de Ordens de Serviço (F6)', 'Controle de IMEI / Nº de Série e Defeito', 'Aviso de Orçamento/Pronto via WhatsApp', 'Faturamento de OS + Acessórios no PDV'],
  },
  {
    id: 'AUTOPECAS',
    nome: 'Autopeças & Oficina Mecânica',
    nomeCurto: 'Autopeças & Oficina',
    emoji: '🚗',
    descricao: 'Identificação de veículo por placa (antiga ou Mercosul), memória offline de frota e registro de KM no cupom.',
    corBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    recursosExclusivos: ['Seletor de Veículo e Placa no PDV', 'Memória Automática de Frota do Cliente', 'Registro de Quilometragem (KM) na Venda'],
  },
];

export const CATEGORIAS_AJUDA: HelpCategoryInfo[] = [
  {
    id: 'INICIO',
    nome: 'Início Rápido & Guias Essenciais',
    nomeCurto: 'Início Rápido',
    descricao: 'Por onde começar: os passos mais importantes explicados de forma simples para quem está começando.',
    corBadge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    icone: 'Sparkles',
  },
  {
    id: 'TODOS',
    nome: 'Todos os Tutoriais',
    nomeCurto: 'Ver Todos',
    descricao: 'Lista completa de todos os tutoriais passo a passo disponíveis.',
    corBadge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    icone: 'BookOpen',
  },
  {
    id: 'PRIMEIROS_PASSOS',
    nome: 'Primeiros Passos, Senhas & Loja',
    nomeCurto: '1. Primeiros Passos',
    descricao: 'Configuração inicial da loja, como tirar ou colocar senha de login, cadastrar funcionários e mudar cores/logo.',
    corBadge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    icone: 'KeyRound',
  },
  {
    id: 'PDV_CAIXA',
    nome: 'Frente de Caixa (Vendas no PDV)',
    nomeCurto: '2. Vendas no Caixa',
    descricao: 'Como passar compras, dar troco, vender no fiado, usar maquininha de cartão, abrir/fechar caixa e fazer sangria.',
    corBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icone: 'ShoppingCart',
  },
  {
    id: 'PRODUTOS_ESTOQUE',
    nome: 'Produtos, Estoque, XML & Etiquetas',
    nomeCurto: '3. Produtos & Estoque',
    descricao: 'Como cadastrar produtos, importar nota fiscal XML do fornecedor, contar estoque pelo celular e criar promoções.',
    corBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icone: 'Package',
  },
  {
    id: 'BALANCA_PESAGEM',
    nome: 'Balanças & Venda por Quilo (KG)',
    nomeCurto: '4. Balanças & Peso',
    descricao: 'Como pesar produtos direto no caixa (cabo USB/Serial), ler etiquetas de balcão (código 2) e exportar carga Toledo/Filizola.',
    corBadge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icone: 'Scale',
  },
  {
    id: 'NICHOS',
    nome: 'Funções Exclusivas por Ramo',
    nomeCurto: '5. Funções por Ramo',
    descricao: 'Guias específicos para Restaurante (Mesas/Garçom/Cozinha), Açougue (Desossa), Roupas (Grade), Assistência (OS) e Autopeças.',
    corBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    icone: 'Store',
  },
  {
    id: 'FINANCEIRO_RELATORIOS',
    nome: 'Financeiro, Contas & Lucro (DRE)',
    nomeCurto: '6. Financeiro & Lucro',
    descricao: 'Como anotar despesas, receber contas de clientes, cobrar no WhatsApp, ver o lucro real e reimprimir cupons.',
    corBadge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    icone: 'Wallet',
  },
  {
    id: 'FISCAL_NFCE',
    nome: 'Nota Fiscal NFC-e & Impressora',
    nomeCurto: '7. Nota Fiscal & Impressão',
    descricao: 'Como instalar o Certificado Digital A1, configurar dados do contador, alternar entre recibo e nota fiscal e configurar impressora.',
    corBadge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    icone: 'FileText',
  },
  {
    id: 'REDE_SISTEMA',
    nome: 'Rede (2+ Caixas), Backup & Assinatura',
    nomeCurto: '8. Rede, Backup & Plano',
    descricao: 'Como usar o sistema em mais de um computador, salvar backup no pendrive USB e renovar sua assinatura por PIX ou Cartão.',
    corBadge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    icone: 'HardDrive',
  },
];

export interface GlossaryItem {
  termo: string;
  significadoSimples: string;
  exemploPratico: string;
}

export const GLOSSARIO_LEIGO: GlossaryItem[] = [
  {
    termo: 'PDV (Frente de Caixa)',
    significadoSimples: 'É a tela principal de vendas onde o operador passa os produtos do cliente e recebe o pagamento.',
    exemploPratico: 'Pressione a tecla F11 a qualquer momento para ir para o PDV ou voltar para a Retaguarda.',
  },
  {
    termo: 'Retaguarda (ERP)',
    significadoSimples: 'É a parte administrativa do sistema onde você cadastra produtos, vê o estoque, controla o financeiro e tira relatórios.',
    exemploPratico: 'Clique em "Retaguarda (F11)" no topo do caixa para abrir o menu administrativo.',
  },
  {
    termo: 'Sangria de Caixa (F5)',
    significadoSimples: 'É quando você retira dinheiro em espécie de dentro da gaveta do caixa (para guardar no cofre ou pagar uma despesa).',
    exemploPratico: 'Se a gaveta acumulou R$ 800,00 em notas, você aperta F5 e faz uma sangria de R$ 500,00 para segurança.',
  },
  {
    termo: 'Suprimento de Caixa (F6)',
    significadoSimples: 'É o contrário da sangria: quando você coloca mais moedas ou notas pequenas na gaveta para ter troco.',
    exemploPratico: 'Acabaram as moedas de R$ 1,00 no meio da tarde? Aperte F6 e lance um suprimento de R$ 50,00 em moedas.',
  },
  {
    termo: 'Convênio / Fiado',
    significadoSimples: 'É a famosa "caderneta" ou venda a prazo: o cliente leva a mercadoria hoje e o valor fica anotado na ficha dele para pagar depois.',
    exemploPratico: 'No pagamento (F10), escolha "Convênio (Ctrl+5)" e selecione o nome do cliente.',
  },
  {
    termo: 'Modo Porteira Aberta',
    significadoSimples: 'Opção que desliga a tela de login e senha, fazendo o sistema abrir direto para agilizar comércios familiares.',
    exemploPratico: 'Ative ou desative em Configurações > Permissões RBAC > chave "Exigir Senha / Login".',
  },
  {
    termo: 'Arquivo XML da Nota Fiscal',
    significadoSimples: 'É o arquivo digital que o seu fornecedor envia por e-mail quando você compra mercadorias. Ele cadastra os produtos e soma o estoque sozinho.',
    exemploPratico: 'Importe o arquivo .xml em Estoque & WMS > aba "Importar XML NF-e".',
  },
  {
    termo: 'NFC-e (Nota Fiscal de Consumidor)',
    significadoSimples: 'É o cupom fiscal eletrônico oficial enviado para a SEFAZ (governo estadual) quando você vende para o cliente.',
    exemploPratico: 'No caixa, aperte PageUp para ativar a emissão fiscal (a tela fica vermelha) ou PageDown para emitir apenas recibo simples.',
  },
  {
    termo: 'Certificado Digital A1 (.pfx)',
    significadoSimples: 'É a "identidade digital" da sua empresa (um arquivo .pfx com senha fornecido pela contabilidade) obrigatório apenas para quem emite NFC-e fiscal.',
    exemploPratico: 'Instale em Configurações > aba "Certificado A1 (NFC-e)".',
  },
  {
    termo: 'NCM, CFOP e CSOSN',
    significadoSimples: 'São códigos fiscais de cada produto definidos pelo governo (seu contador informa quais usar, geralmente CSOSN 102 para mercadoria normal ou 500 com substituição tributária).',
    exemploPratico: 'Ao importar um XML de compra, o sistema já preenche o NCM dos produtos automaticamente.',
  },
  {
    termo: 'PLU e Carga MGV (Balança)',
    significadoSimples: 'PLU é o código curto do produto na balança (ex: 101 para Pão Francês). Carga MGV é o arquivo de texto que atualiza os preços do computador para a balança.',
    exemploPratico: 'As etiquetas impressas pela balança começam com o dígito "2" e trazem o código PLU e o peso embutidos.',
  },
  {
    termo: 'DRE Gerencial',
    significadoSimples: 'É um resumo automático que mostra se a sua loja deu Lucro ou Prejuízo no mês (Vendas menos o custo dos produtos e menos as despesas pagas).',
    exemploPratico: 'Veja seu lucro limpo em Financeiro (F4) > aba "DRE Gerencial".',
  },
  {
    termo: 'Curva ABC',
    significadoSimples: 'Relatório que separa seus produtos em 3 grupos: Classe A (os campeões que trazem 80% do seu dinheiro), Classe B (intermediários) e Classe C (produtos que quase não saem).',
    exemploPratico: 'Consulte no menu "Curva ABC (BI)" para nunca deixar faltar os produtos da Classe A.',
  },
  {
    termo: 'KDS (Monitor de Cozinha)',
    significadoSimples: 'É a tela que fica na cozinha do restaurante mostrando os pedidos que os garçons acabaram de lançar nas mesas.',
    exemploPratico: 'Quando o cozinheiro clica em "Pronto!" no KDS, o celular do garçom toca um aviso na mesma hora para buscar o prato.',
  },
];
