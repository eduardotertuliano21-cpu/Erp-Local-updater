import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_ESTOQUE_CATALOGO: HelpTutorial[] = [
  {
    id: 'catalogo-cadastro-produtos-wms',
    titulo: 'Cadastro de Produtos, Fotos e Múltiplos Códigos de Embalagem (Fardos / Caixas WMS)',
    resumo: 'Como cadastrar produtos com foto, gerar código interno automático e vincular códigos de barras de caixas fechadas ou fardos com fator de conversão.',
    categoria: 'PRODUTOS_ESTOQUE',
    atalho: 'F2 (no ERP)',
    abaDestino: 'PRODUTOS',
    labelBotaoDestino: 'Abrir Catálogo de Produtos',
    palavrasChave: ['cadastrar produto', 'novo produto', 'foto', 'imagem', 'codigo de barras', 'ean', 'sku', 'fardo', 'caixa fechada', 'multiplos codigos', 'fator de conversao', 'wms', 'embalagem'],
    perguntasFrequentes: [
      'Como cadastrar um produto que ainda não tem código de barras?',
      'Como vender tanto a unidade solta quanto o fardo/caixa fechada (ex: fardo com 12 latas) baixando do mesmo estoque?',
      'Como colocar foto nos produtos ou pratos do cardápio?',
    ],
    passos: [
      {
        titulo: '1. Cadastrar Novo Produto ou Item',
        descricao: 'Na Retaguarda ERP, acesse "Produtos" (atalho F2) e clique em "+ Novo Produto". Informe a Descrição, Categoria, Unidade (UN, KG, CX, L) e Preço de Venda (R$).',
      },
      {
        titulo: '2. Gerador de Código Rápido e Upload de Foto',
        descricao: 'Se o item não tiver código EAN, clique no botão "Gerar Código" ao lado do campo Código de Barras. Para adicionar imagem, clique em "Selecionar Imagem" no topo do modal.',
      },
      {
        titulo: '3. Vincular Códigos de Fardos e Caixas (WMS)',
        descricao: 'Na tabela de produtos, clique no ícone de Código de Barras ("Códigos & Embalagens WMS") na linha do item. Informe o código de barras da caixa/fardo, a Unidade (ex: FD ou CX) e o Fator de Conversão (ex: 12) e clique em "Vincular Código".',
        destaque: 'Ao bipar o código do fardo no PDV, o sistema multiplica o valor por 12 e baixa 12 unidades do estoque automaticamente!',
      },
    ],
    dicas: [
      'O fator de conversão WMS também funciona na importação de XML NF-e: ao comprar 5 caixas de 12 unidades na nota, o sistema dá entrada de 60 unidades no estoque da loja.',
    ],
  },
  {
    id: 'estoque-multi-almoxarifado-xml-gem',
    titulo: 'Estoque Multi-Almoxarifado, Ajuste Manual e Importação de XML NF-e (Direta e G.E.M.)',
    resumo: 'Gerencie saldos separados entre Loja, Depósito e Defeito/Avaria, faça ajustes de inventário e dê entrada automática em notas fiscais XML.',
    categoria: 'PRODUTOS_ESTOQUE',
    atalho: 'F5 (no ERP)',
    abaDestino: 'ESTOQUE',
    labelBotaoDestino: 'Abrir Estoque & WMS',
    palavrasChave: ['estoque', 'almoxarifado', 'deposito', 'avaria', 'defeito', 'ajuste manual', 'xml', 'nfe', 'nota de compra', 'entrada de mercadoria', 'gem', 'fornecedor', 'rascunho'],
    perguntasFrequentes: [
      'Como importar o arquivo XML da nota fiscal do fornecedor para cadastrar produtos e somar no estoque?',
      'Qual a diferença entre a Importação Direta de XML e a Entrada G.E.M. em 2 Etapas?',
      'Como registrar uma perda/avaria ou ajustar a quantidade de um produto manualmente?',
    ],
    passos: [
      {
        titulo: '1. Posição Multi-Almoxarifado e Ajuste Manual',
        descricao: 'Em "Estoque & WMS" (F5), veja o saldo dividido em Estoque Loja, Depósito e Avarias/Defeito. Clique em "+ Ajuste Manual" para lançar Entrada Manual, Saída, Perda/Avaria ou Ajuste de Inventário com justificativa.',
      },
      {
        titulo: '2. Importação Rápida de XML NF-e (1 Etapa)',
        descricao: 'Dentro de Estoque & WMS, clique na sub-aba "📥 Importar XML NF-e", selecione o arquivo .xml do computador e clique em "Processar e Dar Entrada". O sistema cadastra o fornecedor, cria/atualiza produtos, soma o estoque e gera o Contas a Pagar.',
      },
      {
        titulo: '3. Entrada Auditada G.E.M. em 2 Etapas (Menu "Entradas NF")',
        descricao: 'Para conferir a mercadoria antes de alterar o saldo, acesse "Entradas NF (G.E.M.)" no menu lateral. A nota entra primeiro como "RASCUNHO (PENDENTE)". Após conferir, clique em "Efetivar Entrada" (ou "Desatualizar" caso precise estornar e corrigir).',
        destaque: 'O botão "Desatualizar" na tela G.E.M. reverte automaticamente a entrada do estoque e remove o título financeiro pendente.',
      },
    ],
    dicas: [
      'Na aba "Extrato de Movimentos" dentro de Estoque & WMS, você audita cada entrada, venda ou ajuste com data, hora, operador e documento de referência.',
    ],
  },
  {
    id: 'coletor-dados-mobile-inventario',
    titulo: 'Coletor de Dados Mobile: Contagem de Estoque pelo Celular com Câmera',
    resumo: 'Transforme qualquer smartphone no Wi-Fi em um coletor de códigos de barras para contar prateleiras da Loja ou Depósito sem parar o caixa.',
    categoria: 'PRODUTOS_ESTOQUE',
    abaDestino: 'ESTOQUE',
    labelBotaoDestino: 'Ver Posição de Estoque',
    palavrasChave: ['coletor', 'mobile', 'celular', 'camera', 'inventario', 'balanco', 'contagem', 'escanear', 'scanner'],
    perguntasFrequentes: [
      'Como usar a câmera do celular para ler códigos de barras e contar o estoque?',
      'Qual link devo abrir no navegador do celular para acessar o Coletor de Dados?',
    ],
    passos: [
      {
        titulo: '1. Acessar o App Coletor no Celular',
        descricao: 'Conecte o celular no mesmo Wi-Fi do computador principal e acesse no navegador: http://IP_DO_SERVIDOR:5000/?coletor=1 (ou /coletor).',
      },
      {
        titulo: '2. Escanear Código com a Câmera ou Digitar',
        descricao: 'Toque em "Escanear com Câmera" para ler códigos EAN-13, EAN-8, Code 128 ou QR Code diretamente pela câmera traseira do celular, ou digite o código no campo de busca.',
      },
      {
        titulo: '3. Escolher Almoxarifado e Confirmar Contagem',
        descricao: 'Selecione o local ("Loja (Gôndola)" ou "Depósito"), informe a "Qtd Contada" e toque em "Confirmar e Ajustar Estoque". O ajuste fica registrado no histórico da sessão.',
      },
    ],
    dicas: [
      'Cada contagem feita pelo Coletor Mobile grava um registro auditado com o motivo CONTAGEM_COLETOR_MOBILE no extrato de estoque.',
    ],
  },
  {
    id: 'campanhas-promocionais-massa',
    titulo: 'Motor de Campanhas Promocionais e Ofertas em Massa',
    resumo: 'Crie promoções por porcentagem (%) ou valor fixo (R$) com data de início/término e vincule dezenas de produtos de uma só vez.',
    categoria: 'PRODUTOS_ESTOQUE',
    abaDestino: 'PROMOCOES',
    labelBotaoDestino: 'Abrir Motor de Promoções',
    palavrasChave: ['promocao', 'promocoes', 'oferta', 'campanha', 'desconto', 'quarta verde', 'black friday', 'precos', 'porcentagem'],
    perguntasFrequentes: [
      'Como colocar vários produtos em promoção com data para começar e terminar automaticamente?',
      'Como o operador vê que o produto está em promoção na hora de passar no PDV?',
    ],
    passos: [
      {
        titulo: '1. Criar a Campanha Promocional',
        descricao: 'Na Retaguarda, acesse "Promoções" no menu lateral e clique em "Nova Campanha". Defina o Nome, Tipo de Desconto (% Porcent ou R$ Fixo), Valor do Desconto, Data Início e Data Término.',
      },
      {
        titulo: '2. Vincular Produtos em Massa',
        descricao: 'Selecione a campanha criada na coluna da esquerda. Na coluna da direita ("Vincular Produtos em Massa"), pesquise e marque os produtos desejados (já visualizando a prévia do novo preço) e clique em "Vincular (X)".',
      },
      {
        titulo: '3. Aplicação Automática no PDV',
        descricao: 'Enquanto a campanha estiver ATIVA e dentro da data de vigência, o PDV aplica o desconto automaticamente ao bipar o produto, exibindo o preço antigo riscado e o selo da campanha.',
      },
    ],
    dicas: [
      'Para encerrar uma promoção antes do prazo ou retirar itens específicos, basta clicar em "Remover Promoção" ou alterar o status da campanha para INATIVA.',
    ],
  },
  {
    id: 'pcp-producao-ficha-tecnica-etiquetas',
    titulo: 'Produção PCP, Fichas Técnicas (Receitas BOM) e Etiquetas Térmicas (Zebra / Argox)',
    resumo: 'Monte receitas/composições que baixam matéria-prima automaticamente ao produzir e emita etiquetas de gôndola ou preço em ZPL/EPL2.',
    categoria: 'PRODUTOS_ESTOQUE',
    abaDestino: 'PCP',
    labelBotaoDestino: 'Abrir Produção PCP & Fichas',
    palavrasChave: ['pcp', 'ficha tecnica', 'receita', 'insumos', 'materia prima', 'ordem de producao', 'op', 'padaria', 'etiquetas', 'zebra', 'argox', 'zpl', 'epl', 'gondola'],
    perguntasFrequentes: [
      'Como criar uma Ficha Técnica (receita) para dar baixa nos ingredientes e entrada no produto pronto?',
      'Como gerar etiquetas de código de barras ou preço para impressoras Zebra e Argox?',
    ],
    passos: [
      {
        titulo: '1. Cadastrar a Ficha Técnica (Receita / BOM)',
        descricao: 'Acesse Gestão Avançada > "Produção PCP" (ou "Ficha Técnica") e abra a aba "Fichas Técnicas (Receitas)". Selecione o produto final e insira cada Insumo/Matéria-Prima com a quantidade gasta para produzir 1 unidade.',
      },
      {
        titulo: '2. Emitir e Finalizar Ordem de Produção (OP)',
        descricao: 'Na aba "Ordens de Produção (OP)", clique em "+ Nova Ordem (OP)". Ao concluir a fabricação, clique em "Finalizar & Baixar Insumos": o sistema desconta os insumos proporcionalmente e soma o produto acabado no estoque.',
      },
      {
        titulo: '3. Emitir Etiquetas Térmicas (Menu "Etiquetas Térmicas")',
        descricao: 'Acesse Gestão Avançada > "Etiquetas Térmicas". Escolha o Modelo (Gôndola, Preço Simples ou Jóia Dupla), a linguagem (Zebra ZPL II ou Argox EPL2), informe o produto e cópias e clique em "Gerar Comandos de Impressão".',
        destaque: 'Você pode copiar os comandos RAW ou baixar o arquivo .TXT para enviar direto ao spooler da impressora térmica.',
      },
    ],
    dicas: [
      'Fichas Técnicas são ideais para padarias, restaurantes, kits promocionais, cestas básicas e pequenas indústrias.',
    ],
  },
];
