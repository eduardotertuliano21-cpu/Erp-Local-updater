import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_GESTAO_SISTEMA: HelpTutorial[] = [
  {
    id: 'financeiro-contas-dre-whatsapp',
    titulo: 'Como Controlar Contas a Pagar, Contas a Receber, Cobrar no WhatsApp e Ver seu Lucro (DRE)',
    resumo: 'Anote despesas da loja (aluguel, energia, boletos), dê baixa quando pagar e veja se a loja deu Lucro ou Prejuízo real no mês.',
    explicacaoLeigo: 'Muitos comerciantes vendem bastante mas no fim do mês não sabem para onde o dinheiro foi. No menu "Financeiro (F4)" você anota as despesas da loja (aluguel, luz, internet, fornecedor) e o sistema soma tudo que você vendeu, desconta o custo da mercadoria e as despesas, e te mostra o Lucro Limpo que sobrou no bolso (DRE)!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Financeiro [Atalho F4]',
    categoria: 'FINANCEIRO_RELATORIOS',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F4 (no ERP)',
    abaDestino: 'FINANCEIRO',
    labelBotaoDestino: 'Abrir Financeiro & Lucro (DRE)',
    palavrasChave: ['financeiro', 'contas a pagar', 'contas a receber', 'dre', 'lucro', 'prejuizo', 'despesa', 'aluguel', 'luz', 'boleto', 'dar baixa', 'liquidar', 'whatsapp', 'cobranca'],
    perguntasFrequentes: [
      'Como anotar uma conta para pagar (aluguel, energia, boleto de fornecedor) e dar baixa quando pagar?',
      'Onde eu vejo quanto sobrou de lucro limpo no mês descontando mercadoria e despesas (DRE)?',
      'Como cobrar um cliente que está devendo direto pelo WhatsApp?',
    ],
    passos: [
      {
        titulo: '1. Cadastrar uma Conta a Pagar ou a Receber',
        descricao: 'Na Retaguarda (F11), clique em "Financeiro" (ou aperte F4) e clique no botão azul "+ Novo Lançamento". Escolha se é "A PAGAR" (despesa sua) ou "A RECEBER" (dinheiro que vão te pagar), informe a Descrição, Categoria (ex: Aluguel, Fornecedor), Valor e Data de Vencimento.',
      },
      {
        titulo: '2. Dar Baixa Quando a Conta for Paga',
        descricao: 'Pagou o boleto ou recebeu do cliente? Basta clicar no botão verde "Dar Baixa" na linha daquela conta. Os cartões no topo da tela mostram na hora quanto ainda falta pagar ou receber no mês!',
      },
      {
        titulo: '3. Ver o Lucro Real da Loja na Aba "DRE Gerencial"',
        descricao: 'Dentro do Financeiro, clique no botão "DRE Gerencial". O sistema mostra uma folha simples e clara: (+) Tudo que você vendeu (-) Descontos (-) Custo das mercadorias vendidas (-) Despesas pagas (=) Resultado Líquido (Lucro ou Prejuízo)!',
        destaque: 'Para o cálculo do lucro ficar perfeito, lembre-se de preencher o "Preço de Custo" no cadastro dos produtos (ou importar via XML).',
      },
    ],
    dicas: [
      'Quando você importa um XML de nota de compra ou vende no Convênio/Fiado no caixa, o sistema já cria a conta no Financeiro sozinho para você não ter trabalho!',
    ],
  },
  {
    id: 'relatorios-curva-abc-auditoria-spotlight',
    titulo: 'Como Ver Relatórios de Vendas (F1), Reimprimir 2ª Via de Cupom, Curva ABC e Auditoria',
    resumo: 'Veja quanto vendeu hoje ou no mês, reimprima qualquer cupom já finalizado, descubra seus produtos campeões e audite cancelamentos.',
    explicacaoLeigo: 'Quer saber quanto entrou em PIX, Cartão e Dinheiro hoje? Ou um cliente voltou pedindo a 2ª via do comprovante da compra de ontem? Tudo isso fica guardado em "Painel & Relatórios (F1)".',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menus: "Painel & Relatórios (F1)", "Curva ABC (BI)" e "Trilha Auditoria"',
    categoria: 'FINANCEIRO_RELATORIOS',
    ramo: 'GERAL',
    atalho: 'F1 / Ctrl+K',
    abaDestino: 'RELATORIOS',
    labelBotaoDestino: 'Abrir Painel & Relatórios',
    palavrasChave: ['relatorios', 'dashboard', 'graficos', 'vendas do dia', 'faturamento', 'segunda via', 'reimprimir cupom', 'danfe', 'curva abc', 'auditoria', 'cancelamento', 'ctrl+k'],
    perguntasFrequentes: [
      'Como tirar a 2ª via de um cupom ou ver os itens de uma venda que já passou?',
      'Como saber quais são os produtos que mais dão dinheiro na minha loja (Curva ABC)?',
      'Como descobrir qual funcionário cancelou uma venda ou mudou o preço de um produto?',
    ],
    passos: [
      {
        titulo: '1. Ver Faturamento e Gráficos no "Painel & Relatórios" (F1)',
        descricao: 'Ao abrir a Retaguarda, clique em "Painel & Relatórios" (F1). Na aba "Painel & Gráficos", escolha a data de início e fim para ver o Faturamento, Ticket Médio, porcentagem recebida em PIX e os horários de maior movimento.',
      },
      {
        titulo: '2. Consultar Vendas e Reimprimir 2ª Via de Cupom',
        descricao: 'Clique na aba "Vendas Detalhadas" (no topo direito de Painel & Relatórios). Você verá cada venda feita e poderá clicar em "Ver DANFE / Recibo" para visualizar ou reimprimir a 2ª via na impressora!',
      },
      {
        titulo: '3. Descobrir os Produtos Campeões na "Curva ABC (BI)"',
        descricao: 'No menu lateral, clique em "Curva ABC (BI)". O sistema classifica seus produtos em: Classe A (os produtos estrela que trazem 80% do seu faturamento — nunca deixe faltar!), Classe B (intermediários) e Classe C (produtos parados).',
        destaque: 'Use também a tecla Ctrl + K em qualquer tela para abrir a Busca Rápida e achar qualquer tela, produto ou cliente em 1 segundo!',
      },
      {
        titulo: '4. Conferir Cancelamentos na "Trilha Auditoria"',
        descricao: 'Em Gestão Avançada > "Trilha Auditoria", você vê um registro que ninguém pode apagar mostrando quem cancelou vendas, quem fez sangria e quem alterou preços (clique no ícone de olho 👁️ para ver o valor antes e depois).',
      },
    ],
    dicas: [
      'Na aba "Vendas Detalhadas", você também pode exportar os dados ou filtrar apenas vendas fiscais (NFC-e) ou vendas canceladas.',
    ],
  },
  {
    id: 'fiscal-nfce-certificado-a1-contingencia',
    titulo: 'Como Configurar Nota Fiscal (NFC-e), Certificado Digital A1 e Alternar no Caixa (PageUp)',
    resumo: 'Passo a passo para instalar o Certificado A1 (.pfx), preencher os dados da contabilidade e escolher quando emitir nota fiscal ou recibo simples.',
    explicacaoLeigo: 'Para emitir o Cupom Fiscal oficial da SEFAZ (NFC-e), você precisa do arquivo do Certificado Digital A1 (aquele arquivo .pfx com senha que o contador faz) e do código CSC. Depois de configurado, você mesmo escolhe no caixa: aperta PageUp para sair Nota Fiscal (tela fica vermelha) ou PageDown para sair Recibo Simples (tela fica verde)!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Configurações ➔ Abas "Dados da Empresa", "Certificado A1" e "Regras de Negócio"',
    categoria: 'FISCAL_NFCE',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'PageUp / PageDown',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Certificado A1 e Fiscal',
    palavrasChave: ['nfce', 'nota fiscal', 'cupom fiscal', 'sefaz', 'certificado a1', 'pfx', 'p12', 'csc', 'token', 'ncm', 'csosn', 'cfop', 'pageup', 'pagedown', 'contingencia', 'contador'],
    perguntasFrequentes: [
      'Como instalar o arquivo do Certificado Digital A1 (.pfx) no sistema?',
      'Como alternar no caixa entre emitir Nota Fiscal NFC-e e emitir apenas Recibo Simples?',
      'E se a internet cair na hora de emitir a nota fiscal?',
    ],
    passos: [
      {
        titulo: '1. Preencher CNPJ, Inscrição Estadual e CEP em "Dados da Empresa"',
        descricao: 'Em Configurações > aba "Dados da Empresa", preencha o CNPJ, a Inscrição Estadual (IE), escolha o Regime Tributário (geralmente Simples Nacional) e digite o CEP (que preenche o código IBGE da cidade automaticamente). Marque a opção para habilitar o Módulo Fiscal NFC-e e salve.',
      },
      {
        titulo: '2. Instalar o Certificado Digital A1 (.pfx) e Token CSC',
        descricao: 'Abra a aba "Certificado A1 (NFC-e)". Informe a Série, o Número da próxima nota e o Código CSC (fornecido pelo seu contador). Depois, selecione o arquivo .pfx do seu certificado no computador, digite a senha dele e clique em "Importar e Ativar Certificado".',
      },
      {
        titulo: '3. Alternar no Caixa PDV com as Teclas PageUp e PageDown',
        descricao: 'Lá na tela de vendas do Caixa PDV: aperte a tecla PageUp para ATIVAR a Nota Fiscal (o bloco do Total fica VERMELHO escrito "NFC-E ATIVA"). Para voltar ao recibo simples não-fiscal, aperte a tecla PageDown (volta a ficar verde).',
        destaque: 'Se você quiser que o caixa emita NFC-e em 100% das vendas sem poder desligar, vá em Configurações > Regras de Negócio e mude para "Sempre Emitir NFC-e".',
      },
      {
        titulo: '4. Venda sem Internet (Contingência Offline Automática)',
        descricao: 'Se a internet cair durante uma venda fiscal, o sistema não trava a fila: ele emite a nota em Contingência Offline automaticamente e guarda para transmitir à SEFAZ assim que a internet voltar (em Painel & Relatórios > Documentos Fiscais).',
      },
    ],
    dicas: [
      'O sistema avisa automaticamente no topo da tela quando faltar menos de 30 dias para o seu Certificado Digital A1 vencer.',
    ],
    problemasComuns: [
      {
        problema: 'Deu rejeição de NCM ou CSOSN ao emitir a nota de um produto novo.',
        solucao: 'Abra o cadastro daquele produto em "Produtos (F2)" > Editar, role até "Parâmetros Fiscais" e confira se o NCM tem 8 números (ex: 22021000 para refrigerante) e o CSOSN está preenchido (102 para tributado normal ou 500 para substituição tributária).',
      },
    ],
  },
  {
    id: 'impressora-termica-cupom-gaveta',
    titulo: 'Como Configurar a Impressora de Cupom Térmico (80mm / 58mm) e Impressão Automática',
    resumo: 'Escolha a largura da bobina (80mm ou 58mm), a marca da impressora (Bematech, Epson, Elgin, Daruma) e se quer imprimir sozinho ao finalizar.',
    explicacaoLeigo: 'Para o cupom sair do tamanho certinho na sua maquininha de bobina térmica, basta informar em Configurações > Impressão se o rolo de papel dela é do largo (80mm) ou do estreito (58mm).',
    ondeEncontrar: 'Retaguarda (F11) ➔ Configurações ➔ Aba "Impressão" • No PDV: Tecla F3',
    categoria: 'FISCAL_NFCE',
    ramo: 'GERAL',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Impressora Térmica',
    palavrasChave: ['impressora', 'imprimir', 'cupom', 'bobina', 'termica', '80mm', '58mm', 'epson', 'bematech', 'elgin', 'daruma', 'recibo', 'automatico'],
    perguntasFrequentes: [
      'Como ajustar o tamanho do cupom para bobina de 80mm ou 58mm?',
      'Como fazer o cupom imprimir sozinho assim que eu aperto F10, ou só imprimir quando eu quiser?',
    ],
    passos: [
      {
        titulo: '1. Escolha o Modelo e Largura do Papel em Configurações',
        descricao: 'Na Retaguarda (F11), vá em Configurações > aba "Impressão". Escolha a marca da sua impressora térmica (ou "Genérica USB/Spooler") e selecione a largura da bobina (80mm padrão ou 58mm compacta).',
      },
      {
        titulo: '2. Ativar ou Desativar Impressão Automática no Fim da Venda',
        descricao: 'Se você quer que toda venda já imprima o cupom direto na hora, ative "Imprimir Cupom Automaticamente" (também disponível apertando F3 no PDV). Se preferir economizar papel e só imprimir quando o cliente pedir, deixe desmarcado e aperte a tecla "P" na tela final da venda quando quiser imprimir!',
      },
    ],
    dicas: [
      'Você pode colocar uma mensagem personalizada no rodapé do cupom (ex: "Obrigado pela preferência! Siga @minhaloja") na aba Dados da Empresa / Impressão.',
    ],
  },
  {
    id: 'rede-lan-failover-backup-usb',
    titulo: 'Como Ligar 2 ou Mais Computadores em Rede (LAN) e Fazer Backup no Pendrive USB',
    resumo: 'Use vários caixas compartilhando o mesmo estoque sem depender de internet e salve cópias de segurança no Pendrive com 1 clique.',
    explicacaoLeigo: 'Tem 2 ou 3 caixas na loja? Um computador fica como "Principal (Servidor Master)" e os outros conectam nele pelo cabo de rede ou Wi-Fi. Se o computador principal der defeito um dia, você aperta 1 botão no outro caixa para ele virar o principal na hora! E para nunca perder nada, basta espetar um Pendrive e clicar em "Fazer Backup".',
    ondeEncontrar: 'Configurar Rede: Ícone Wi-Fi na tela de Login ou Configurações ➔ Aba "Contingência" (Backup USB e Failover)',
    categoria: 'REDE_SISTEMA',
    ramo: 'GERAL',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Abrir Contingência & Backup USB',
    palavrasChave: ['rede', 'lan', 'multi-terminal', 'dois caixas', 'outro computador', 'ip', 'servidor', 'master', 'terminal', 'failover', 'backup', 'pendrive', 'usb', 'copia de seguranca'],
    perguntasFrequentes: [
      'Como ligar um segundo computador (Caixa 02) para usar o mesmo banco de dados do Caixa 01?',
      'Como salvar uma cópia de segurança (Backup) de todos os meus dados em um Pendrive USB?',
      'Se o computador principal pifar no meio do movimento, como continuar vendendo no Caixa 02?',
    ],
    passos: [
      {
        titulo: '1. Fazer Backup no Pendrive USB (1 Clique)',
        descricao: 'Coloque um pendrive na entrada USB do computador. Vá em Retaguarda (F11) > Configurações > aba "Contingência" e clique em "Fazer Backup Agora no Pendrive". O sistema grava uma cópia completa e segura do seu banco de dados!',
        destaque: 'Além do pendrive, o sistema já faz cópias automáticas sozinho no computador sempre que você abre ou atualiza o programa.',
      },
      {
        titulo: '2. Conectar um Segundo Computador na Mesma Rede (Caixa 02)',
        descricao: 'Com os dois computadores no mesmo Wi-Fi ou cabo de rede: no computador secundário, clique no ícone de Rede/Wi-Fi na tela de Login, escolha "Terminal Adicional", digite o número de IP do computador principal (ex: 192.168.1.50) e clique em "Testar Conexão LAN" > "Salvar".',
      },
      {
        titulo: '3. Emergência (Failover): Transformar o Caixa 02 em Principal',
        descricao: 'Se o computador principal queimar, vá no Caixa 02 em Configurações > aba "Contingência" e clique em "Elevar este Terminal a Servidor Master". Ele assume o comando da loja imediatamente!',
      },
    ],
    dicas: [
      'Recomendamos espetar um pendrive uma vez por semana e clicar em "Fazer Backup Agora" para ter sempre uma cópia física guardada fora do computador.',
    ],
  },
  {
    id: 'assinatura-stripe-autoupdate-identidade',
    titulo: 'Como Pagar/Renovar a Assinatura por PIX (Liberação em 10 Segundos) e Atualizar o Sistema',
    resumo: 'Renove seu plano mensal ou anual via PIX QR Code com liberação instantânea ou Cartão de Crédito, e busque melhorias gratuitas de versão.',
    explicacaoLeigo: 'Para renovar a sua licença não precisa mandar comprovante para ninguém nem esperar horas: você gera o QR Code do PIX direto na tela do sistema, paga pelo aplicativo do seu banco e em menos de 10 segundos o sistema reconhece o pagamento sozinho e já libera mais 30 dias (ou 1 ano)!',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Assinatura • Atualizações: Botão "v1.0.0 • Atualizado" no topo da tela',
    categoria: 'REDE_SISTEMA',
    ramo: 'GERAL',
    abaDestino: 'ASSINATURA',
    labelBotaoDestino: 'Abrir Gestão de Assinatura',
    palavrasChave: ['assinatura', 'licenca', 'mensalidade', 'plano', 'pix', 'qr code', 'cartao de credito', 'stripe', 'renovar', 'bloqueado', 'atualizacao', 'auto-update', 'versao', 'relogio'],
    perguntasFrequentes: [
      'Como pagar a mensalidade por PIX e liberar o sistema na mesma hora?',
      'Como atualizar o meu sistema quando sair uma melhoria nova?',
      'Apareceu um aviso dizendo que a data/hora do meu computador está atrasada: o que fazer?',
    ],
    passos: [
      {
        titulo: '1. Renovar Assinatura com PIX Instantâneo ou Cartão',
        descricao: 'Clique em "Assinatura" no menu lateral da Retaguarda (ou no botão de renovação se a licença tiver vencido). Escolha o Plano Mensal ou Plano Anual (com 2 meses grátis). Na aba PIX, aponte a câmera do aplicativo do seu banco para o QR Code na tela: assim que pagar, a licença renova sozinha em segundos!',
        destaque: 'Se preferir, você também pode clicar na aba "Cartão de Crédito" para pagar ou deixar a renovação automática ativa.',
      },
      {
        titulo: '2. Como Atualizar o Sistema (Auto-Update)',
        descricao: 'No topo direito da Retaguarda (ou no cantinho inferior direito do Caixa PDV), clique no botão da versão ("v1.0.0 • Atualizado"). O sistema verifica na internet se há melhorias novas e instala automaticamente sem apagar nenhum dado seu!',
      },
      {
        titulo: '3. Dica sobre Data e Hora do Windows',
        descricao: 'Se a pilha interna do seu computador acabar e o relógio do Windows voltar para anos antigos, o sistema mostrará um aviso pedindo para você acertar a hora do Windows na barra inferior direita do computador.',
      },
    ],
    dicas: [
      'Na parte de baixo da tela "Assinatura", você tem o Histórico Completo de todos os pagamentos já realizados com data, valor e status.',
    ],
  },
];
