import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_ESTOQUE_CATALOGO: HelpTutorial[] = [
  {
    id: 'catalogo-cadastro-produtos-wms',
    titulo: 'Como Cadastrar Produtos Novos, Colocar Foto, Preço e Gerar Código de Barras',
    resumo: 'Passo a passo simples para cadastrar mercadorias com leitor de código de barras ou gerar um código interno para produtos sem etiqueta.',
    explicacaoLeigo: 'Para vender um produto no caixa, primeiro você precisa dizer ao sistema o nome dele e quanto ele custa. Se o produto já tiver código de barras na embalagem, basta bipar; se não tiver (como pão, salgado ou serviço), o próprio sistema cria um código curto para você!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Produtos (ou Cardápio / Roupas / Cortes) [Atalho F2] ➔ Botão "+ Novo Produto"',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F2 (no ERP)',
    abaDestino: 'PRODUTOS',
    labelBotaoDestino: 'Abrir Cadastro de Produtos',
    palavrasChave: ['cadastrar produto', 'novo produto', 'foto', 'imagem', 'codigo de barras', 'ean', 'sku', 'preco', 'custo', 'estoque inicial', 'item'],
    perguntasFrequentes: [
      'Como cadastrar um produto novo passo a passo?',
      'Como cadastrar um produto caseiro ou avulso que não tem código de barras na embalagem?',
      'Como colocar foto no produto ou alterar o preço de venda?',
    ],
    passos: [
      {
        titulo: '1. Abra a Tela de Produtos e Clique em "+ Novo Produto"',
        descricao: 'Na Retaguarda (F11), clique em "Produtos" no menu da esquerda (ou aperte F2) e clique no botão "+ Novo Produto" no canto superior direito.',
      },
      {
        titulo: '2. Informe o Código de Barras (ou Clique em "Gerar Código")',
        descricao: 'Passe o leitor no código de barras da embalagem do produto. Se o produto não tiver código de barras, clique no botão "Gerar Código" ao lado do campo que o sistema inventa um número exclusivo na hora!',
        destaque: 'Você também pode digitar um código curto fácil de lembrar (ex: 10, 20, 50) para produtos muito vendidos.',
      },
      {
        titulo: '3. Preencha Nome, Preço de Venda e Estoque Atual',
        descricao: 'Digite a Descrição (ex: "Arroz Tipo 1 5kg"), escolha a Unidade (UN para unidade, KG para quilo), digite o Preço de Custo (opcional) e o Preço de Venda (R$). Informe também a quantidade que você tem hoje na prateleira.',
      },
      {
        titulo: '4. Adicione uma Foto (Opcional) e Salve',
        descricao: 'Se quiser exibir a foto do item no caixa ou no cardápio digital, clique em "Selecionar Imagem". Para terminar, clique no botão azul "Salvar Produto".',
      },
    ],
    dicas: [
      'Para mudar o preço de um produto já cadastrado, basta procurá-lo na lista de Produtos e clicar no botão "Editar" (lápis) na linha dele.',
    ],
    problemasComuns: [
      {
        problema: 'Tenho centenas de produtos na nota fiscal do fornecedor, preciso cadastrar um por um?',
        solucao: 'Não! Veja o tutorial "Como Importar Arquivo XML da Nota Fiscal": o sistema cadastra todos os produtos da nota de compra de uma vez só em segundos!',
      },
    ],
  },
  {
    id: 'mercado-fardos-caixas-wms',
    titulo: 'Mercado & Atacarejo: Como Vender Unidade Solta e Fardo/Caixa Fechada (WMS)',
    resumo: 'Configure múltiplos códigos de barras no mesmo produto para vender tanto a lata avulsa quanto o fardo com 12 ou 24 unidades baixando do mesmo estoque.',
    explicacaoLeigo: 'Em mercados e depósitos de bebidas, o mesmo refrigerante ou cerveja tem um código de barras na lata solta e outro código diferente no plástico do fardo com 12 latas. Aqui você ensina ao sistema que quando passar o código do fardo, ele deve cobrar o fardo e descontar 12 latas do estoque automaticamente!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Produtos (F2) ➔ Ícone de Código de Barras "Códigos & Embalagens WMS" na linha do produto',
    categoria: 'NICHOS',
    ramo: 'MERCADO',
    nichoEspecifico: 'MERCADO & BEBIDAS',
    abaDestino: 'PRODUTOS',
    labelBotaoDestino: 'Abrir Produtos & Embalagens WMS',
    palavrasChave: ['mercado', 'bebidas', 'fardo', 'caixa fechada', 'multiplos codigos', 'fator de conversao', 'wms', 'embalagem', 'atacarejo', 'pack', 'duzia'],
    perguntasFrequentes: [
      'Como vender tanto a unidade solta quanto o fardo com 12 unidades descontando do mesmo estoque?',
      'Como cadastrar 2 códigos de barras diferentes para o mesmo produto?',
    ],
    passos: [
      {
        titulo: '1. Cadastre Primeiro o Produto na Unidade Solta (UN)',
        descricao: 'Cadastre normalmente o produto principal com o código de barras da unidade avulsa (ex: Lata 350ml - UN - R$ 4,00) e salve.',
      },
      {
        titulo: '2. Abra o Botão "Códigos & Embalagens WMS"',
        descricao: 'Na lista de produtos, localize o item e clique no botão com desenho de código de barras (ao lado do botão Editar).',
      },
      {
        titulo: '3. Bipe o Código do Fardo/Caixa e Informe Quantas Unidades Vêm Dentro',
        descricao: 'No campo "Código de Barras da Embalagem", bipe a etiqueta externa do fardo ou caixa. Em "Unidade", escolha FD (Fardo) ou CX (Caixa), digite o "Fator de Conversão" (ex: 12 se vierem 12 latas no fardo) e clique em "Vincular Código".',
        destaque: 'Pronto! Quando o caixa bipar o fardo, o sistema lançará 12 unidades automaticamente de uma só vez!',
      },
    ],
    dicas: [
      'Isso também ajuda na entrada de notas fiscais XML: quando você compra 10 fardos de 12 unidades na nota do fornecedor, o sistema soma automaticamente 120 unidades no estoque da loja.',
    ],
  },
  {
    id: 'estoque-multi-almoxarifado-xml-gem',
    titulo: 'Como Dar Entrada em Nota Fiscal de Compra (Importar Arquivo XML do Fornecedor)',
    resumo: 'Importe o arquivo .XML que o fornecedor envia por e-mail para cadastrar produtos, somar o estoque e lançar as duplicatas no financeiro sozinho.',
    explicacaoLeigo: 'Toda vez que você compra mercadoria com nota fiscal, a distribuidora manda um arquivo terminado em ".xml" no seu e-mail. Em vez de digitar produto por produto na mão, você seleciona esse arquivo no sistema e ele cadastra tudo e soma as quantidades no estoque automaticamente!',
    ondeEncontrar: 'Importação Rápida: Estoque & WMS (F5) ➔ Aba "📥 Importar XML NF-e" • Conferência em 2 Etapas: Menu "Entradas NF (G.E.M.)"',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F5 (no ERP)',
    abaDestino: 'ESTOQUE',
    labelBotaoDestino: 'Abrir Importador de XML no Estoque',
    palavrasChave: ['xml', 'nfe', 'nota de compra', 'fornecedor', 'entrada de mercadoria', 'gem', 'importar nota', 'estoque', 'duplicata', 'rascunho'],
    perguntasFrequentes: [
      'Como importar o arquivo XML da nota fiscal de compra do fornecedor?',
      'Qual a diferença entre "Importar XML NF-e" no Estoque e o menu "Entradas NF (G.E.M.)"?',
      'Se eu importar uma nota errada no G.E.M., consigo desfazer a entrada?',
    ],
    passos: [
      {
        titulo: '1. Baixe o Arquivo .XML da Nota no Computador',
        descricao: 'Salve no seu computador o arquivo .xml enviado pelo fornecedor ou contador (não é o PDF da nota, é o arquivo XML).',
      },
      {
        titulo: '2. Importação Direta em 1 Clique (Estoque & WMS)',
        descricao: 'Na Retaguarda, clique em "Estoque & WMS" (F5) > clique na aba "📥 Importar XML NF-e" > clique no botão "📁 Selecionar Arquivo XML do Computador", escolha o arquivo e clique em "Processar e Dar Entrada".',
        destaque: 'Em 2 segundos o sistema cadastra o fornecedor, cria os produtos novos, soma as quantidades no estoque e lança o boleto no Contas a Pagar!',
      },
      {
        titulo: '3. Opção Avançada: Conferência em 2 Etapas (Menu "Entradas NF G.E.M.")',
        descricao: 'Se você prefere conferir a nota como "Rascunho" antes de somar no estoque, acesse "Entradas NF (G.E.M.)" no menu lateral. Lá você revisa a nota e clica em "Efetivar Entrada" (e se precisar cancelar depois, basta clicar em "Desatualizar" que ele estorna o estoque e o financeiro!).',
      },
    ],
    dicas: [
      'Depois de importar o XML de produtos novos, dê uma olhada na tela "Produtos (F2)" para conferir ou ajustar o Preço de Venda final para os seus clientes.',
    ],
  },
  {
    id: 'estoque-posicao-ajuste-manual',
    titulo: 'Como Ver o Saldo do Estoque (Loja, Depósito e Perdas) e Fazer Ajuste Manual',
    resumo: 'Consulte quantos itens existem na prateleira ou no depósito e corrija quantidades manualmente em caso de perda, vencimento ou acerto.',
    explicacaoLeigo: 'Quebrou um produto, venceu na prateleira ou chegou mercadoria sem nota fiscal? Na tela de Estoque você vê exatamente quanto tem na loja e pode clicar em "+ Ajuste Manual" para somar ou diminuir a quantidade na hora.',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Estoque & WMS [Atalho F5]',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    atalho: 'F5 (no ERP)',
    abaDestino: 'ESTOQUE',
    labelBotaoDestino: 'Abrir Posição de Estoque',
    palavrasChave: ['estoque', 'saldo', 'quantidade', 'almoxarifado', 'deposito', 'avaria', 'defeito', 'perda', 'quebra', 'vencido', 'ajuste manual', 'extrato'],
    perguntasFrequentes: [
      'Como mudar a quantidade de um produto no estoque manualmente?',
      'Como registrar que um produto quebrou, estragou ou deu defeito (Avaria)?',
      'Onde vejo o histórico de tudo que entrou e saiu do estoque?',
    ],
    passos: [
      {
        titulo: '1. Consultar Saldo na Loja, Depósito e Avarias',
        descricao: 'Na Retaguarda, clique em "Estoque & WMS" (F5). A tabela mostra cada produto separado em: Estoque Loja (prateleira), Depósito (estoque guardado), Avarias/Defeito e o Saldo Consolidado total.',
      },
      {
        titulo: '2. Fazer um Ajuste Manual de Quantidade',
        descricao: 'Clique no botão verde "+ Ajuste Manual" no topo direito. Escolha o Produto, selecione onde ele está (Loja, Depósito ou Defeito), escolha o Tipo de Movimento (Entrada, Saída ou Ajuste) e digite a quantidade e o motivo.',
      },
      {
        titulo: '3. Consultar o Extrato de Movimentos',
        descricao: 'Clique na aba "Extrato de Movimentos" (ao lado de Posição de Estoque) para ver o histórico completo com data, hora e motivo de cada entrada ou saída.',
      },
    ],
    dicas: [
      'Você também pode alterar o estoque inicial direto dentro do cadastro do produto em "Produtos (F2)" > "Editar".',
    ],
  },
  {
    id: 'coletor-dados-mobile-inventario',
    titulo: 'Como Contar o Estoque Usando a Câmera do Celular (App Coletor de Dados)',
    resumo: 'Use o seu próprio celular no Wi-Fi para ler códigos de barras nas prateleiras e atualizar a contagem do estoque sem tirar os produtos do lugar.',
    explicacaoLeigo: 'Em vez de anotar no papel quantos produtos tem na prateleira e depois digitar no computador, você abre um link no navegador do seu celular, aponta a câmera para o código de barras do produto na prateleira e digita quantos contou!',
    ondeEncontrar: 'No navegador do celular conectado ao Wi-Fi: http://IP_DO_SERVIDOR:5000/?coletor=1',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    abaDestino: 'ESTOQUE',
    labelBotaoDestino: 'Ver Posição de Estoque',
    palavrasChave: ['coletor', 'mobile', 'celular', 'camera', 'inventario', 'balanco', 'contagem', 'prateleira', 'gondola', 'escanear'],
    perguntasFrequentes: [
      'Como usar a câmera do meu celular para contar o estoque nas prateleiras?',
      'Preciso instalar algum aplicativo na loja de aplicativos do celular?',
    ],
    passos: [
      {
        titulo: '1. Conecte o Celular no Mesmo Wi-Fi do Computador',
        descricao: 'Não precisa baixar nada na Play Store ou App Store. Basta estar no mesmo Wi-Fi da loja e abrir o navegador do celular no endereço do servidor com /?coletor=1 no final.',
      },
      {
        titulo: '2. Aponte a Câmera para o Código de Barras',
        descricao: 'Toque no botão "Escanear com Câmera" para ler o código de barras da embalagem usando a câmera do celular (ou digite o nome/código no campo de busca).',
      },
      {
        titulo: '3. Digite a Quantidade Contada e Confirme',
        descricao: 'Escolha se está contando a "Loja (Gôndola)" ou o "Depósito", digite a quantidade que você contou na prateleira e toque em "Confirmar e Ajustar Estoque". O saldo no computador atualiza na mesma hora!',
      },
    ],
    dicas: [
      'Você pode usar vários celulares ao mesmo tempo para fazer o balanço da loja inteira rapidamente em equipe.',
    ],
  },
  {
    id: 'campanhas-promocionais-massa',
    titulo: 'Como Criar Promoções e Ofertas com Data para Começar e Terminar Sozinhas',
    resumo: 'Programe descontos em porcentagem (%) ou valor fixo (R$) para vários produtos de uma vez (ex: Quarta Verde, Oferta de Fim de Semana).',
    explicacaoLeigo: 'Quer fazer a "Terça da Carne" ou "Oferta de Fim de Semana"? Você cria a promoção, escolhe os produtos e coloca a data de início e fim. O caixa aplica o preço promocional sozinho durante esses dias e volta ao preço normal quando a data acaba!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Promoções',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    abaDestino: 'PROMOCOES',
    labelBotaoDestino: 'Abrir Motor de Promoções',
    palavrasChave: ['promocao', 'promocoes', 'oferta', 'campanha', 'desconto', 'quarta verde', 'black friday', 'precos', 'porcentagem', 'baixar preco'],
    perguntasFrequentes: [
      'Como colocar vários produtos em promoção de uma vez só?',
      'A promoção desliga sozinha quando passa da data final?',
    ],
    passos: [
      {
        titulo: '1. Clique em "Promoções" > "Nova Campanha"',
        descricao: 'No menu lateral da Retaguarda, clique em "Promoções" e depois no botão laranja "Nova Campanha".',
      },
      {
        titulo: '2. Defina o Desconto e as Datas',
        descricao: 'Dê um nome (ex: "Oferta Fim de Semana"), escolha se o desconto será em Porcentagem (ex: 10% OFF) ou Valor em Reais (ex: R$ 2,00 de desconto), e escolha a Data de Início e Data de Término.',
      },
      {
        titulo: '3. Marque os Produtos que Entrarão na Oferta',
        descricao: 'Clique na campanha criada à esquerda. Na tabela da direita, marque a caixinha dos produtos que vão entrar em promoção e clique no botão "Vincular Selecionados".',
        destaque: 'No Caixa PDV, ao passar o produto, o sistema mostra automaticamente o selo da promoção e o desconto aplicado!',
      },
    ],
    dicas: [
      'Você pode tirar um produto da promoção a qualquer momento selecionando-o e clicando em "Remover Promoção".',
    ],
  },
  {
    id: 'etiquetas-termicas-gondola',
    titulo: 'Como Imprimir Etiquetas de Preço e Código de Barras (Gôndola, Zebra e Argox)',
    resumo: 'Gere etiquetas de prateleira (gôndola), etiquetas de preço simples ou etiquetas duplas para roupas/jóias em impressoras térmicas Zebra e Argox.',
    explicacaoLeigo: 'Precisa colar etiqueta de código de barras na mercadoria ou colocar a plaquinha de preço na prateleira (gôndola)? Este módulo gera as etiquetas prontas para impressoras térmicas de etiquetas (como Zebra e Argox).',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral (Gestão Avançada): Etiquetas Térmicas',
    categoria: 'PRODUTOS_ESTOQUE',
    ramo: 'GERAL',
    abaDestino: 'ETIQUETAS',
    labelBotaoDestino: 'Abrir Gerador de Etiquetas',
    palavrasChave: ['etiquetas', 'etiqueta de preco', 'gondola', 'prateleira', 'codigo de barras', 'zebra', 'argox', 'elgin', 'zpl', 'epl', 'joia'],
    perguntasFrequentes: [
      'Como imprimir etiquetas de código de barras ou de preço para a prateleira?',
      'Quais impressoras de etiquetas são compatíveis (ZPL e EPL)?',
    ],
    passos: [
      {
        titulo: '1. Escolha o Modelo de Etiqueta e a Impressora',
        descricao: 'No menu lateral, clique em "Etiquetas Térmicas". Escolha o Modelo ("Gôndola c/ Código de Barras", "Preço Simples em Destaque" ou "Dupla para Roupas/Jóias") e a Linguagem (ZPL para Zebra/Elgin ou EPL para Argox).',
      },
      {
        titulo: '2. Informe o Produto, Preço e Quantidade de Etiquetas',
        descricao: 'Digite a Descrição do produto, o Código de Barras, o Preço (R$) e quantas etiquetas iguais deseja imprimir.',
      },
      {
        titulo: '3. Gere e Envie para Impressão',
        descricao: 'Clique em "Gerar Comandos de Impressão". Você verá a prévia da etiqueta na tela e poderá clicar em "Baixar Arquivo .TXT" ou "Copiar Comandos" para enviar à impressora.',
      },
    ],
    dicas: [
      'Use o modelo "Dupla (Jóias / Acessórios)" para imprimir duas etiquetas lado a lado na mesma bobina, economizando papel em lojas de roupas e acessórios.',
    ],
  },
];
