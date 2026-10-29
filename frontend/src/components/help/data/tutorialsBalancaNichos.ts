import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_BALANCA_NICHOS: HelpTutorial[] = [
  {
    id: 'balanca-3-modos-operacao',
    titulo: 'Como Vender Produtos por Quilo (KG): Balança no Caixa (Cabo) e Etiqueta de Balcão',
    resumo: 'Entenda de forma fácil como pesar frutas/carnes na hora no caixa (cabo USB/Serial) ou como ler etiquetas impressas na balança do balcão.',
    explicacaoLeigo: 'Existem 2 jeitos de vender produtos por peso (KG): 1) A balança fica ligada por cabo no computador do caixa e você coloca a sacola em cima na hora de passar; ou 2) A balança fica lá no fundo da loja (no açougue ou padaria), imprime uma etiqueta colante que começa com o número "2", e o caixa só passa o leitor nessa etiqueta!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Configurações ➔ Aba "Balança Checkout & MGV" • Cadastro do Produto: seção "Balança & Pesagem"',
    categoria: 'BALANCA_PESAGEM',
    ramo: 'GERAL',
    essencialIniciante: true,
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Balanças & MGV',
    palavrasChave: ['balanca', 'pesagem', 'peso', 'quilo', 'kg', 'grama', 'etiqueta', 'toledo', 'mgv', 'mgv6', 'filizola', 'elgin', 'urano', 'plu', 'prefixo 2', 'serial', 'usb', 'hortifruti', 'padaria'],
    perguntasFrequentes: [
      'Como ler aquelas etiquetas de código de barras impressas na balança do açougue ou padaria (que começam com 2)?',
      'Como ligar a balança direto no computador do caixa por cabo USB/Serial para pesar na hora?',
      'Como atualizar os preços dos produtos na memória da balança (arquivo ITENSMGV.TXT / CADTXT.TXT)?',
    ],
    passos: [
      {
        titulo: '1. Para Balança Ligada por Cabo no Caixa (Pesagem na Hora)',
        descricao: 'Vá em Configurações > aba "Balança Checkout & MGV". Ligue a opção "Balança Ativa no Caixa", escolha a marca (Toledo, Filizola, Elgin ou Urano) e deixe a porta em "AUTO (Plug and Play)". Clique em "⚖️ Testar Leitura" para ver o peso na tela! No cadastro do produto (ex: Tomate), marque "Pesagem ao Vivo no Checkout".',
        destaque: 'Na hora de vender, coloque o produto na balança e digite o código dele no caixa: o sistema lê o peso sozinho na mesma hora!',
      },
      {
        titulo: '2. Para Balança que Imprime Etiqueta no Balcão (Etiqueta Iniciada em 2)',
        descricao: 'No cadastro do produto (Retaguarda > Produtos), marque "Pesagem por Etiqueta (MGV / Carga)" e digite o "Código PLU na Balança" (ex: 101 para Pão Francês). Quando o cliente trouxer a sacola com a etiqueta colada, basta bipar no caixa que o sistema reconhece o produto e o peso exato!',
      },
      {
        titulo: '3. Como Enviar a Lista de Produtos e Preços para a Balança (Carga MGV)',
        descricao: 'Mudou o preço do quilo no sistema? Vá em Configurações > "Balança Checkout & MGV" (ou clique no botão verde "Carga Balança" na tela de Produtos), escolha o programa da sua balança (ex: Toledo MGV6) e clique em "Gravar Carga na Pasta Local" (ex: C:\\MGV6\\ITENSMGV.TXT).',
      },
    ],
    dicas: [
      'Se a balança do caixa estiver desligada ou sem cabo, você ainda pode vender por quilo digitando o peso manualmente na janelinha que abre (ex: digite 0,650 para 650 gramas).',
    ],
    problemasComuns: [
      {
        problema: 'Bipei a etiqueta da balança e apareceu "Produto PLU não encontrado".',
        solucao: 'Verifique no cadastro desse produto se o campo "Código PLU na Balança" tem exatamente o mesmo número cadastrado dentro da balança (ex: 101).',
      },
    ],
  },
  {
    id: 'nicho-restaurante-mesas-kds-mobile',
    titulo: 'Restaurante & Bar: Como Controlar Mesas (F6), Pré-Conta e Taxa de 10% do Garçom',
    resumo: 'Veja quais mesas estão livres ou ocupadas, lance pedidos na mesa, imprima a conferência (pré-conta) e feche a conta no caixa.',
    explicacaoLeigo: 'No modo Restaurante, você não precisa cobrar o cliente na hora em que ele pede: você abre a Mesa dele (ex: Mesa 05), vai lançando os pratos e bebidas durante a noite, imprime a "Pré-Conta" para levar à mesa e, quando ele vier pagar no caixa, recebe tudo de uma vez com cálculo opcional dos 10% do garçom.',
    ondeEncontrar: 'No Caixa PDV: Barra superior de Mesas ou Tecla F6 ("Ver Todas") • Na Retaguarda: Menu "Mesas & Comandas"',
    categoria: 'NICHOS',
    ramo: 'RESTAURANTE',
    essencialIniciante: true,
    atalho: 'F6 (no PDV)',
    nichoEspecifico: 'RESTAURANTE & BAR',
    abaDestino: 'MESAS',
    labelBotaoDestino: 'Abrir Mapa de Mesas',
    palavrasChave: ['restaurante', 'bar', 'lanchonete', 'mesa', 'mesas', 'comanda', 'garcom', 'gorjeta', '10%', 'taxa de servico', 'pre-conta', 'fechar mesa', 'f6'],
    perguntasFrequentes: [
      'Como lançar produtos para uma mesa específica no restaurante?',
      'Como imprimir a Pré-Conta (conferência da mesa) antes de fechar a venda?',
      'Como cobrar (ou retirar) a taxa de 10% do garçom no fechamento da mesa?',
    ],
    passos: [
      {
        titulo: '1. Abrir o Mapa de Mesas (Tecla F6 no Caixa)',
        descricao: 'No Caixa PDV, clique na mesa desejada na barra superior ou aperte a tecla F6 ("Ver Todas") para ver o salão inteiro: mesas Verdes estão Livres e mesas Amarelas estão Ocupadas com o valor parcial.',
      },
      {
        titulo: '2. Lançar Pedidos na Mesa e Imprimir a Pré-Conta',
        descricao: 'No Mapa de Mesas (F6), clique em uma mesa para abrir os detalhes ou adicionar itens. Para imprimir o extrato de conferência para o cliente revisar na mesa, clique no ícone de Impressora ("Pré-Conta") no cartão da mesa.',
      },
      {
        titulo: '3. Receber e Fechar a Conta da Mesa no Caixa (F10)',
        descricao: 'Quando o cliente vier pagar, selecione a mesa ocupada no caixa: todos os itens consumidos entram automaticamente na lista de venda. Aperte F10, escolha a forma de pagamento e finalize: a mesa volta a ficar LIVRE (verde) sozinha!',
        destaque: 'Você também pode fazer "Venda Balcão" a qualquer momento clicando no primeiro botão ("Venda Balcão") da barra de mesas.',
      },
    ],
    dicas: [
      'Na tela "Cardápio & Pratos" (F2 na Retaguarda), clique no botão "Exportar Cardápio (PDF)" para gerar um arquivo PDF bonito com todos os seus pratos e preços na Área de Trabalho!',
    ],
  },
  {
    id: 'nicho-restaurante-comanda-celular-kds',
    titulo: 'Restaurante: Comanda no Celular do Garçom (QR Code) e Monitor na Cozinha (KDS)',
    resumo: 'Como conectar o celular dos garçons no Wi-Fi para anotar pedidos nas mesas e mostrar na tela da cozinha com aviso sonoro de prato pronto.',
    explicacaoLeigo: 'O garçom não precisa usar bloquinho de papel! Ele aponta a câmera do próprio celular para o QR Code na tela do caixa, digita a senha curta dele (4 números) e faz o pedido na mesa. O pedido aparece na hora na tela da cozinha (KDS) e, quando o cozinheiro marca "Pronto!", o celular do garçom apita avisando para buscar o prato!',
    ondeEncontrar: 'No Caixa PDV: Botões "QR Garçom" e "QR Cozinha" na barra de mesas • Na Retaguarda: Menus "Garçons & Equipe" e "Monitor KDS"',
    categoria: 'NICHOS',
    ramo: 'RESTAURANTE',
    nichoEspecifico: 'RESTAURANTE & BAR',
    abaDestino: 'ENTIDADES',
    labelBotaoDestino: 'Cadastrar Garçons e PIN',
    palavrasChave: ['garcom', 'celular', 'comanda mobile', 'qr code', 'kds', 'cozinha', 'monitor cozinha', 'prato pronto', 'observacao', 'sem cebola', 'tablet', 'wifi'],
    perguntasFrequentes: [
      'Como o garçom conecta o celular dele para tirar pedidos nas mesas?',
      'Como cadastrar o nome e a senha (PIN) de cada garçom?',
      'Como funciona a tela da cozinha (KDS) e o aviso de prato pronto no celular do garçom?',
    ],
    passos: [
      {
        titulo: '1. Cadastrar o Garçom e o PIN de 4 Números',
        descricao: 'Na Retaguarda (F11), clique em "Garçons & Equipe" no menu lateral e depois no botão amarelo "+ Novo Garçom". Digite o nome dele e escolha um PIN de 4 números (ex: 1020).',
      },
      {
        titulo: '2. Conectar o Celular do Garçom pelo QR Code',
        descricao: 'No Caixa PDV, clique no botão "QR Garçom" na barra de mesas. Com o celular conectado no mesmo Wi-Fi da loja, basta ler o QR Code com a câmera do celular: a Comanda Digital abre na hora sem precisar instalar nada!',
      },
      {
        titulo: '3. Anotar Pedido na Mesa com Observações',
        descricao: 'No celular, o garçom digita o PIN dele, escolhe a Mesa, toca nos pratos/bebidas, escreve observações se precisar (ex: "Sem cebola, bem passado") e toca em "Enviar Pedido para Cozinha".',
      },
      {
        titulo: '4. Usar o Monitor da Cozinha (KDS) e Avisar "Pronto!"',
        descricao: 'No computador ou em um tablet/TV na cozinha, clique em "QR Cozinha" (ou no menu "Monitor KDS"). Quando o pedido chega, toca uma campainha. O cozinheiro clica em "Iniciar Preparo" e depois em "Pronto!": na mesma hora o celular do garçom toca um alerta mostrando qual mesa buscar!',
        destaque: 'Tudo funciona pela sua rede Wi-Fi local: mesmo se a internet da rua cair, os celulares dos garçons e a cozinha continuam funcionando 100%!',
      },
    ],
    dicas: [
      'No topo do celular do garçom fica um botão "🔔 Prontos" que pisca em verde sempre que a cozinha termina um prato.',
    ],
  },
  {
    id: 'nicho-restaurante-ficha-tecnica-pcp',
    titulo: 'Restaurante, Padaria & Produção: Como Criar Ficha Técnica (Receita) para Baixar Ingredientes',
    resumo: 'Monte a receita dos seus pratos, lanches ou pães para que o sistema desconte automaticamente os ingredientes (pão, carne, queijo, farinha) do estoque.',
    explicacaoLeigo: 'Quando você vende um "X-Bacon" ou produz uma fornada de pão, você não quer dar baixa só no sanduíche: você quer saber quanto gastou de pão, hambúrguer, queijo e bacon! A Ficha Técnica é a "receita" onde você diz quais ingredientes vão dentro de cada produto.',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral (Gestão Avançada): Ficha Técnica / Produção PCP',
    categoria: 'NICHOS',
    ramo: 'RESTAURANTE',
    nichoEspecifico: 'RESTAURANTE & PADARIA',
    abaDestino: 'PCP',
    labelBotaoDestino: 'Abrir Ficha Técnica / PCP',
    palavrasChave: ['ficha tecnica', 'receita', 'ingredientes', 'insumos', 'materia prima', 'pcp', 'ordem de producao', 'op', 'padaria', 'hamburgueria', 'composicao', 'kit'],
    perguntasFrequentes: [
      'Como montar a receita (ficha técnica) de um prato ou lanche?',
      'Como dar baixa nos ingredientes quando fabrico um lote na padaria ou cozinha (Ordem de Produção)?',
    ],
    passos: [
      {
        titulo: '1. Cadastre os Ingredientes (Insumos) e o Produto Final',
        descricao: 'Em "Produtos (F2)", tenha cadastrados tanto o produto pronto que você vende (ex: X-Burguer) quanto os ingredientes comprados (ex: Pão de Hambúrguer, Carne 150g, Queijo Prato).',
      },
      {
        titulo: '2. Monte a Receita na Aba "Fichas Técnicas"',
        descricao: 'No menu lateral, clique em "Ficha Técnica" (ou "Produção PCP") e abra a aba "Fichas Técnicas (Receitas)". Escolha o produto pronto e vá adicionando cada ingrediente e a quantidade usada para fazer 1 unidade.',
      },
      {
        titulo: '3. Produzir Lotes na Aba "Ordens de Produção (OP)"',
        descricao: 'Se você fabrica lotes (como padaria, confeitaria ou cestas), clique na aba "Ordens de Produção (OP)" > "+ Nova Ordem". Informe quantos itens vai produzir e clique em "Finalizar & Baixar Insumos": o sistema desconta os ingredientes e soma o produto pronto no estoque!',
      },
    ],
    dicas: [
      'Você também pode usar a Ficha Técnica em mercados para montar "Cestas Básicas" ou "Kits de Churrasco" que baixam os itens individuais do estoque.',
    ],
  },
  {
    id: 'nicho-acougue-desossa-cmv',
    titulo: 'Casa de Carnes & Açougue: Como Fazer Rendimento de Desossa e Calcular Quebra (Osso/Sebo)',
    resumo: 'Transforme uma carcaça ou peça inteira comprada em vários cortes limpos (Picanha, Alcatra, Moída) no estoque e descubra a perda de osso/sebo.',
    explicacaoLeigo: 'No açougue, você compra a peça bruta (ex: Traseiro Bovino de 50 kg na nota fiscal), mas vende no balcão em cortes separados (Picanha, Alcatra, Patinho, Carne Moída). Na tela de Desossa você informa o peso da peça que entrou e quantos quilos rendeu de cada corte: o sistema calcula sozinho quanto virou osso/sebo e soma os cortes limpos no estoque!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Rendimento Desossa (visível quando o ramo é Açougue)',
    categoria: 'NICHOS',
    ramo: 'ACOUGUE',
    essencialIniciante: true,
    nichoEspecifico: 'AÇOUGUE & CASA DE CARNES',
    abaDestino: 'DESOSSA',
    labelBotaoDestino: 'Abrir Rendimento de Desossa',
    palavrasChave: ['acougue', 'carne', 'desossa', 'carcaca', 'boi', 'traseiro', 'dianteiro', 'corte', 'picanha', 'alcatra', 'quebra', 'osso', 'sebo', 'limpeza', 'rendimento', 'cmv'],
    perguntasFrequentes: [
      'Como transformar uma carcaça ou peça matriz em vários cortes separados no estoque?',
      'Como saber quantos quilos e qual a porcentagem (%) que perdi em osso, sebo e limpeza?',
    ],
    passos: [
      {
        titulo: '1. Escolha a Peça Matriz (Carcaça) e o Peso Inicial',
        descricao: 'Na Retaguarda (no ramo Açougue), clique em "Rendimento Desossa" no menu lateral. Escolha o "Produto Matriz de Origem" (ex: Traseiro Bovino), digite o Peso Bruto em KG (ex: 50 kg) e o Custo por KG que você pagou ao frigorífico.',
      },
      {
        titulo: '2. Informe o Peso Obtido de Cada Corte Limpo',
        descricao: 'Na lista de cortes derivados, selecione o produto de cada corte no seu catálogo (Picanha, Alcatra, Contra-filé, Carne Moída, etc.) e digite quantos quilos limpos renderam na bancada.',
      },
      {
        titulo: '3. Confira a Quebra (Osso/Sebo) e Efetive no Estoque',
        descricao: 'O painel mostra na hora o Peso Aproveitado, a Quebra/Perda em KG e % e o custo real por quilo. Clique em "Efetivar Rendimento de Desossa" para descontar a peça bruta e adicionar automaticamente os quilos de cada corte no estoque da loja!',
        destaque: 'Todos os registros de desossa ficam salvos no histórico lateral para você comparar o rendimento de diferentes frigoríficos.',
      },
    ],
    dicas: [
      'Não vê o menu "Rendimento Desossa"? Verifique no seletor "ÁREA DE ATUAÇÃO" no topo da tela se a sua loja está selecionada no ramo "AÇOUGUE / CARNES".',
    ],
  },
  {
    id: 'nicho-roupas-grade-variacoes',
    titulo: 'Roupas & Calçados: Como Criar Grade de Tamanhos (P ao GG / 34 ao 44) e Cores Automaticamente',
    resumo: 'Cadastre um modelo de roupa ou calçado uma única vez e deixe o sistema criar todas as combinações de Tamanho e Cor com códigos individuais.',
    explicacaoLeigo: 'Em loja de roupas ou calçados, uma mesma camiseta chega em 4 tamanhos (P, M, G, GG) e 3 cores (Preta, Branca, Azul). Em vez de você ter o trabalho de cadastrar 12 produtos um por um, o "Gerador de Grade" cria todas as 12 variações de uma vez só com 1 clique!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Roupas & Grade (F2) ➔ "+ Novo Produto" ➔ Botão "⚡ Gerar Grade"',
    categoria: 'NICHOS',
    ramo: 'ROUPAS',
    essencialIniciante: true,
    nichoEspecifico: 'ROUPAS & CALÇADOS',
    abaDestino: 'PRODUTOS',
    labelBotaoDestino: 'Abrir Roupas & Grade',
    palavrasChave: ['roupas', 'vestuario', 'calcados', 'sapato', 'tenis', 'camisa', 'calca', 'vestido', 'grade', 'tamanho', 'cor', 'marca', 'modelo', 'variacoes', 'pp', 'gg', 'numeracao'],
    perguntasFrequentes: [
      'Como cadastrar uma roupa ou calçado que tem vários tamanhos e cores sem digitar um por um?',
      'Como saber na hora da venda no caixa qual é o tamanho e a cor da peça?',
    ],
    passos: [
      {
        titulo: '1. Abra "+ Novo Produto" em Roupas & Grade',
        descricao: 'Com o sistema no ramo Roupas/Vestuário, vá na Retaguarda > clique em "Roupas & Grade" (F2) > clique em "+ Novo Produto". Digite o nome base da peça (ex: "Camiseta Básica Algodão"), a Marca e o Preço.',
      },
      {
        titulo: '2. Clique no Botão "⚡ Gerar Grade (P, M, G...)"',
        descricao: 'Dentro da seção de Vestuário, clique em "⚡ Gerar Grade". Escolha o grupo de tamanhos pronto ("Roupas P / M / G / GG", "Calçados 37 a 42" ou "Infantil 2 a 12") e digite as cores separadas por vírgula (ex: Preto, Branco, Azul).',
        destaque: 'Clique em "Gerar Grade": o sistema cria todas as peças (ex: Camiseta P Preta, Camiseta M Preta...) com código de barras próprio para cada uma!',
      },
      {
        titulo: '3. Venda Fácil por Tamanho e Cor no Caixa (F2)',
        descricao: 'No Caixa PDV, ao apertar F2 para buscar a peça, você vê selos coloridos mostrando claramente a Marca, o Tamanho (TAM) e a Cor de cada item disponível.',
      },
    ],
    dicas: [
      'Depois de gerar a grade, você pode ir no menu "Etiquetas Térmicas" e escolher o modelo "Dupla (Jóias / Acessórios)" para imprimir as etiquetas de todas as peças!',
    ],
  },
  {
    id: 'nicho-assistencia-os-whatsapp',
    titulo: 'Assistência Técnica: Como Abrir Ordem de Serviço (OS), Avisar no WhatsApp e Receber no Caixa',
    resumo: 'Registre aparelhos deixados para conserto (celular, computador, eletrodoméstico), imprima o comprovante com garantia, mande mensagem no WhatsApp e receba no PDV.',
    explicacaoLeigo: 'Quando um cliente deixa um celular ou aparelho para consertar, você abre uma "Ordem de Serviço (OS)" anotando o nome dele, WhatsApp, modelo do aparelho e o defeito. Conforme o técnico avalia e conserta, você muda o status com 1 clique, avisa o cliente direto no WhatsApp que ficou pronto e cobra no caixa!',
    ondeEncontrar: 'No Caixa PDV: Barra superior de OS ("+ Nova OS" ou Tecla F6) • Na Retaguarda: Menu "Ordens de Serviço"',
    categoria: 'NICHOS',
    ramo: 'ASSISTENCIA',
    essencialIniciante: true,
    atalho: 'F6 (no PDV)',
    nichoEspecifico: 'ASSISTÊNCIA TÉCNICA',
    abaDestino: 'ORDENS_SERVICO',
    labelBotaoDestino: 'Abrir Painel de Ordens de Serviço',
    palavrasChave: ['assistencia tecnica', 'ordem de servico', 'os', 'conserto', 'manutencao', 'aparelho', 'celular', 'imei', 'serie', 'defeito', 'laudo', 'orcamento', 'garantia', 'whatsapp'],
    perguntasFrequentes: [
      'Como abrir uma Ordem de Serviço (OS) quando o cliente deixa um aparelho para consertar?',
      'Como avisar o cliente pelo WhatsApp que o orçamento ou o conserto ficou pronto?',
      'Como dar baixa e receber o pagamento da OS junto com uma capinha ou película no caixa?',
    ],
    passos: [
      {
        titulo: '1. Abrir uma Nova Ordem de Serviço (+ Nova OS)',
        descricao: 'No Caixa PDV (ou no menu "Ordens de Serviço" da Retaguarda), clique no botão "+ Nova OS". Preencha o Nome do Cliente, WhatsApp, Descrição do Aparelho (ex: iPhone 13), Número de Série/IMEI, o Defeito relatado e o Valor.',
      },
      {
        titulo: '2. Imprimir o Comprovante de Entrada e Mudar o Status',
        descricao: 'No cartão da OS criada, clique em "Imprimir OS" para entregar a via do cliente. Conforme o serviço anda na bancada, clique para avançar o status: Aguardando Avaliação ➔ Aguardando Peça ➔ Pronto para Retirada.',
      },
      {
        titulo: '3. Avisar o Cliente em 1 Clique pelo WhatsApp',
        descricao: 'Clique no botão verde de WhatsApp dentro do cartão da OS: o sistema já abre a conversa com o cliente trazendo a mensagem pronta com o número da OS, aparelho, status atual e valor!',
        destaque: 'Quando o status muda para "PRONTO", a OS aparece destacada em verde na barra superior do Caixa PDV como "Aguardando Retirada".',
      },
      {
        titulo: '4. Receber a OS no Caixa PDV (Com ou Sem Produtos Extras)',
        descricao: 'Quando o cliente vier buscar o aparelho, clique na OS dele na barra superior do PDV (ou em "Faturar no PDV"). O valor do conserto entra no carrinho — se ele quiser levar também uma película ou cabo, basta bipar junto e apertar F10 para receber tudo!',
      },
    ],
    dicas: [
      'Ao finalizar o pagamento da OS no F10, o sistema muda o status dela para "ENTREGUE" automaticamente.',
    ],
  },
  {
    id: 'nicho-autopecas-placa-frota',
    titulo: 'Autopeças & Oficina: Como Identificar Placa do Veículo, Memória de Frota e Quilometragem (KM)',
    resumo: 'Associe a placa, modelo do carro e KM atual na venda para manter o histórico completo de manutenção dos veículos de cada cliente.',
    explicacaoLeigo: 'Em autopeças, troca de óleo e oficinas, é muito importante anotar no cupom a Placa do carro e a Quilometragem (KM) daquela revisão. Na primeira vez que o carro vem, você digita a placa e o modelo; nas próximas vezes, basta digitar a placa que o sistema lembra o carro e o dono sozinho!',
    ondeEncontrar: 'Frente de Caixa (PDV no modo Autopeças) ➔ Botão "🚗 Identificar Veículo / Placa"',
    categoria: 'NICHOS',
    ramo: 'AUTOPECAS',
    essencialIniciante: true,
    nichoEspecifico: 'AUTOPEÇAS & OFICINA',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa Autopeças',
    palavrasChave: ['autopecas', 'oficina', 'mecanica', 'troca de oleo', 'veiculo', 'carro', 'moto', 'placa', 'mercosul', 'km', 'quilometragem', 'frota'],
    perguntasFrequentes: [
      'Como colocar a Placa do carro e o KM atual no cupom da venda?',
      'O sistema guarda a placa e o modelo do veículo para quando o cliente voltar?',
    ],
    passos: [
      {
        titulo: '1. Clique em "Identificar Veículo / Placa" no PDV',
        descricao: 'Com a loja no ramo Autopeças, acesse o Caixa PDV e localize o seletor de veículo na área da venda.',
      },
      {
        titulo: '2. Digite a Placa (Padrão Antigo ou Mercosul)',
        descricao: 'Digite os 7 caracteres da placa (ex: ABC1D23). Se esse veículo já tiver sido atendido antes na loja, o sistema preenche a Marca, Modelo, Ano e Cliente automaticamente da memória local!',
        destaque: 'Não precisa de internet nem paga taxa por consulta: a base de veículos da sua clientela fica salva no seu próprio computador.',
      },
      {
        titulo: '3. Informe a Quilometragem Atual (KM) e Finalize a Venda',
        descricao: 'Atualize o campo "KM Atual" (ex: 85.400 km) e confirme. Os dados do veículo saem vinculados na venda para controle de garantia e próximas trocas de óleo ou peças.',
      },
    ],
    dicas: [
      'Na tela de Produtos (F2 no ramo Autopeças), você pode cadastrar o código original da peça ou referência cruzada na descrição para achar rapidamente na busca.',
    ],
  },
];
