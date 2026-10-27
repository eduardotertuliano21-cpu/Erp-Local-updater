import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_BALANCA_NICHOS: HelpTutorial[] = [
  {
    id: 'balanca-3-modos-operacao',
    titulo: 'Balanças e Pesagem: Etiquetas EAN-13 (Prefixo 2), Checkout Serial/USB e Carga MGV',
    resumo: 'Configure e utilize os 3 modos de balança: leitura de etiquetas de balcão (Padrão 20/21), pesagem ao vivo no caixa e geração de carga TXT (Toledo, Filizola, Elgin, Urano).',
    categoria: 'BALANCA_PESAGEM',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Balanças & MGV',
    palavrasChave: ['balanca', 'pesagem', 'peso', 'quilo', 'kg', 'etiqueta', 'toledo', 'mgv', 'mgv6', 'filizola', 'elgin', 'urano', 'plu', 'prefixo 2', 'serial', 'usb', 'hortifruti'],
    perguntasFrequentes: [
      'Como ler etiquetas de código de barras impressas na balança do açougue ou padaria (iniciadas em 2)?',
      'Como ligar a balança direto no computador do caixa via cabo USB/Serial para pesar na hora?',
      'Como gerar o arquivo ITENSMGV.TXT (Toledo MGV) ou CADTXT.TXT (Filizola) para atualizar os preços na balança?',
    ],
    passos: [
      {
        titulo: '1. Modo Etiqueta de Balcão (EAN-13 Iniciado em 2)',
        descricao: 'No cadastro do produto (Retaguarda > Produtos), marque "Pesagem por Etiqueta (MGV / Carga)" e informe o "Código PLU na Balança" (ex: 101). No F3 do PDV, mantenha ativa a opção "Ler Código de Balança". Ao bipar a etiqueta iniciada em 2, o sistema extrai o PLU e calcula o peso exato em KG.',
      },
      {
        titulo: '2. Modo Pesagem ao Vivo no Checkout (Cabo Serial / USB)',
        descricao: 'Em Configurações > aba "Balança Checkout & MGV", ative "Balança Ativa no Caixa", escolha o fabricante (Toledo, Filizola, Elgin ou Urano) e a porta ("AUTO Plug and Play" ou COM1-COM9). Clique em "⚖️ Testar Leitura" para ver o visor digital ao vivo.',
        destaque: 'No cadastro do produto, marque "Pesagem ao Vivo no Checkout". Se o item já estiver no prato da balança ao bipar, o peso entra direto sem abrir janela!',
      },
      {
        titulo: '3. Exportar Carga de Produtos para Balanças de Etiqueta (MGV)',
        descricao: 'Em Configurações > "Balança Checkout & MGV" (ou no botão "Carga Balança" em Produtos), escolha o software (Toledo ITENSMGV.TXT, Filizola CADTXT.TXT, Elgin ou Urano), informe a pasta (ex: C:\\MGV6) e clique em "Gravar Carga na Pasta Local" ou "Baixar Arquivo TXT".',
      },
    ],
    dicas: [
      'Se a balança de checkout estiver desligada no momento da venda, o modal de Pesagem ao Vivo permite digitar o peso manualmente (ex: 0,750) e pressionar Enter.',
    ],
  },
  {
    id: 'nicho-restaurante-mesas-kds-mobile',
    titulo: 'Restaurantes & Bares: Mapa de Mesas (F6), Taxa 10%, Comanda Mobile do Garçom e KDS',
    resumo: 'Controle o salão em tempo real, lance pedidos pelo celular do garçom com PIN, acompanhe o preparo na tela KDS da cozinha e exporte o Cardápio em PDF.',
    categoria: 'NICHOS',
    atalho: 'F6 (no PDV)',
    nichoEspecifico: 'RESTAURANTE',
    abaDestino: 'MESAS',
    labelBotaoDestino: 'Abrir Gestão de Mesas / Salão',
    palavrasChave: ['restaurante', 'bar', 'lanchonete', 'mesa', 'mesas', 'comanda', 'garcom', 'gorjeta', '10%', 'taxa de servico', 'pre-conta', 'kds', 'cozinha', 'qr code', 'cardapio pdf', 'mobile'],
    perguntasFrequentes: [
      'Como o garçom faz pedidos pelo próprio celular nas mesas?',
      'Como colocar uma TV ou tablet na cozinha para ver os pedidos chegando (Monitor KDS)?',
      'Como imprimir a pré-conta de conferência da mesa e cobrar os 10% do garçom?',
    ],
    passos: [
      {
        titulo: '1. Mapa de Mesas no Caixa PDV (Tecla F6) e Pré-Conta',
        descricao: 'No PDV (modo Restaurante), pressione F6 para expandir o Mapa de Mesas (Verde = Livre, Âmbar = Ocupada, Vermelho = Fechamento). Selecione uma mesa, bipe os pratos e clique em "Enviar p/ Mesa". Passe o mouse na mesa ocupada e clique na impressora para emitir a Pré-Conta.',
      },
      {
        titulo: '2. Receber Conta da Mesa com Taxa de Serviço (10%)',
        descricao: 'Clique na mesa ocupada (ou em "Receber Conta") para carregar todos os itens no PDV com cálculo automático dos 10% de serviço. Pressione F10 e finalize o pagamento: a mesa volta para LIVRE automaticamente.',
      },
      {
        titulo: '3. Comanda Mobile do Garçom e Cardápio Digital (QR Code)',
        descricao: 'Cadastre garçons com PIN de 4 dígitos em "Garçons & Equipe" > "+ Novo Garçom". No Mapa de Mesas (F6), clique em "📱 QR Code Garçom & Cozinha" e escaneie com o celular (/?mobile=1) para lançar pedidos com observações (ex: "Sem cebola") direto da mesa.',
        destaque: 'Na tela Produtos ("Cardápio & Pratos"), você também pode clicar em "Exportar Cardápio (PDF)" para gerar um cardápio pronto para impressão.',
      },
      {
        titulo: '4. Monitor de Cozinha KDS em Tempo Real (/?kds=1)',
        descricao: 'Acesse "Monitor KDS" no menu lateral do ERP ou abra http://IP_DO_SERVIDOR:5000/?kds=1 no tablet/TV da cozinha. Os pedidos tocam alerta sonoro, mostram cronômetro colorido de atraso e botões "Iniciar Preparo" -> "Pronto!" -> "Entregue".',
      },
    ],
    dicas: [
      'A sincronização entre celulares dos garçons, monitor KDS da cozinha e caixa PDV ocorre em milissegundos via WebSocket na rede local, sem depender de internet.',
    ],
  },
  {
    id: 'nicho-acougue-desossa-cmv',
    titulo: 'Casa de Carnes & Açougue: Rendimento de Desossa, Quebra (Osso/Sebo) e Rateio de CMV',
    resumo: 'Transforme carcaças ou peças inteiras em cortes limpos, calcule automaticamente a perda de osso/sebo e atualize o estoque e custo por KG de cada corte.',
    categoria: 'NICHOS',
    nichoEspecifico: 'ACOUGUE',
    abaDestino: 'DESOSSA',
    labelBotaoDestino: 'Abrir Rendimento de Desossa',
    palavrasChave: ['acougue', 'carne', 'desossa', 'carcaca', 'boi', 'traseiro', 'dianteiro', 'corte', 'picanha', 'quebra', 'osso', 'sebo', 'rendimento', 'cmv'],
    perguntasFrequentes: [
      'Como dar entrada numa peça inteira/carcaça e transformar em vários cortes no estoque?',
      'Como o sistema calcula a porcentagem de quebra (osso/limpeza) e o custo real de cada corte?',
    ],
    passos: [
      {
        titulo: '1. Selecionar a Peça Matriz de Origem',
        descricao: 'Na Retaguarda (modo Açougue), acesse "Rendimento Desossa" no menu lateral. No painel esquerdo, selecione o "Produto Matriz" (ex: Traseiro Bovino), informe o "Peso Bruto (KG)" e o "Custo Médio / KG (R$)".',
      },
      {
        titulo: '2. Lançar os Cortes Derivados Obtidos',
        descricao: 'No painel direito ("Cortes Derivados & Rateio de CMV"), clique em "Adicionar Corte", escolha os cortes limpos obtidos (Picanha, Alcatra, Patinho, etc.) e digite o peso em KG de cada um.',
      },
      {
        titulo: '3. Conferir Quebra e Efetivar Desossa no Estoque',
        descricao: 'O sistema exibe em tempo real o Peso Total Desossado, a Quebra/Desperdício (KG e %) e o Custo Rateado por KG. Clique em "Efetivar Rendimento de Desossa" para baixar a peça matriz e somar automaticamente cada corte no estoque.',
      },
    ],
    dicas: [
      'Combine o módulo de Desossa com a exportação de Carga MGV Toledo para manter as balanças do balcão sempre sincronizadas.',
    ],
  },
  {
    id: 'nicho-roupas-grade-variacoes',
    titulo: 'Roupas & Calçados: Marca, Cor, Tamanho e Gerador Automático de Grade em Lote',
    resumo: 'Crie dezenas de combinações de Tamanho (PP ao XG / 34 ao 46) por Cor com 1 clique, gerando códigos de barras e SKUs individuais automaticamente.',
    categoria: 'NICHOS',
    nichoEspecifico: 'ROUPAS',
    abaDestino: 'PRODUTOS',
    labelBotaoDestino: 'Abrir Roupas & Grade',
    palavrasChave: ['roupas', 'vestuario', 'calcados', 'sapato', 'camisa', 'grade', 'tamanho', 'cor', 'marca', 'modelo', 'variacoes', 'pp', 'gg'],
    perguntasFrequentes: [
      'Como cadastrar uma peça de roupa ou calçado que tem várias cores e vários tamanhos sem digitar um por um?',
      'Como localizar o tamanho e a cor certa na hora de vender no PDV?',
    ],
    passos: [
      {
        titulo: '1. Campos de Vestuário no Cadastro de Produto',
        descricao: 'Em "Roupas & Grade" > "+ Novo Produto", preencha a Descrição Base, Preço, Marca e Modelo. Você pode clicar nos botões rápidos de tamanho (P, M, G, GG, 36..44) para um item único ou abrir o Gerador de Grade.',
      },
      {
        titulo: '2. Usar o Gerador de Grade de Variações (Tamanho x Cor)',
        descricao: 'Clique no botão "⚡ Gerar Grade (P, M, G...)". Escolha um preset ("P / M / G / GG", "Calçados 37 a 42" ou "Infantil 2 a 12"), digite as cores separadas por vírgula (ex: "Preto, Branco, Azul") e clique em "Gerar Grade".',
        destaque: 'O sistema cria automaticamente um produto independente no estoque para cada combinação de Tamanho x Cor!',
      },
      {
        titulo: '3. Identificação Visual de Grade no PDV (F2)',
        descricao: 'Na busca do PDV (F2) e na lista do cupom, o sistema exibe etiquetas coloridas destacando a Marca, o Tamanho (TAM) e a Cor de cada peça.',
      },
    ],
    dicas: [
      'Use o módulo de Etiquetas Térmicas (ZPL/EPL) para imprimir as etiquetas de código de barras de todas as peças geradas na grade.',
    ],
  },
  {
    id: 'nicho-autopecas-assistencia-os',
    titulo: 'Autopeças (Memória de Placa/Frota) e Assistência Técnica (Ordens de Serviço e WhatsApp)',
    resumo: 'Vincule placa e quilometragem do veículo ao cupom na Autopeças ou controle o ciclo completo de Ordens de Serviço (OS) com aviso no WhatsApp e faturamento no PDV.',
    categoria: 'NICHOS',
    atalho: 'F6 (OS no PDV)',
    abaDestino: 'ORDENS_SERVICO',
    labelBotaoDestino: 'Abrir Ordens de Serviço / Catálogo',
    palavrasChave: ['autopecas', 'oficina', 'veiculo', 'carro', 'placa', 'mercosul', 'km', 'quilometragem', 'frota', 'assistencia tecnica', 'ordem de servico', 'os', 'conserto', 'imei', 'laudo', 'whatsapp'],
    perguntasFrequentes: [
      'Como vincular a placa, modelo do carro e KM atual na venda da Autopeças?',
      'Como abrir uma Ordem de Serviço (OS), avisar o cliente pelo WhatsApp e receber o pagamento no caixa?',
    ],
    passos: [
      {
        titulo: '1. Autopeças: Vincular Placa, Veículo e Quilometragem (KM)',
        descricao: 'No PDV (modo Autopeças) ou na abertura de OS, clique em "🚗 Identificar Veículo / Placa". Digite a Placa (antiga ou Mercosul): se já esteve na loja, o sistema puxa Marca, Modelo e Ano da memória local. Atualize o KM Atual e vincule ao cupom.',
      },
      {
        titulo: '2. Assistência Técnica: Abrir e Avançar Ordem de Serviço (OS)',
        descricao: 'No PDV (barra superior ou tecla F6) ou na Retaguarda ("Ordens de Serviço"), clique em "+ Nova OS". Informe Cliente, WhatsApp, Equipamento/Modelo, Série/IMEI, Valor e Defeito. Avance o status com 1 clique: ABERTA -> ORÇAMENTO -> APROVADA -> CONCLUÍDA.',
      },
      {
        titulo: '3. Imprimir Via Técnica e Notificar Cliente no WhatsApp',
        descricao: 'Em cada card de OS, clique em "Imprimir OS" para emitir o comprovante de entrada com termo de garantia, ou clique em "WhatsApp" para abrir conversa já preenchida com número da OS, aparelho, status atual e valor.',
      },
      {
        titulo: '4. Faturar a OS Direto no Caixa PDV',
        descricao: 'Clique em "Faturar no PDV" no card da OS (ou selecione a OS na barra do topo do PDV). O serviço entra no carrinho, permitindo adicionar películas/acessórios extras e finalizar no F10 (dando baixa automática na OS).',
      },
    ],
    dicas: [
      'A memória de frota veicular funciona 100% offline no banco SQLite sem custo de consulta por placa.',
    ],
  },
];
