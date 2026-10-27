import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_GESTAO_SISTEMA: HelpTutorial[] = [
  {
    id: 'financeiro-contas-dre-whatsapp',
    titulo: 'Financeiro, Contas a Pagar/Receber, Cobrança WhatsApp e DRE Gerencial Automático',
    resumo: 'Controle títulos pendentes, dê baixa em contas, cobre clientes em atraso com 1 clique no WhatsApp e acompanhe o Lucro Líquido real no DRE.',
    categoria: 'FINANCEIRO_RELATORIOS',
    atalho: 'F4 (no ERP)',
    abaDestino: 'FINANCEIRO',
    labelBotaoDestino: 'Abrir Módulo Financeiro & DRE',
    palavrasChave: ['financeiro', 'contas a pagar', 'contas a receber', 'dre', 'lucro', 'prejuizo', 'despesa', 'receita', 'cmv', 'boleto', 'dar baixa', 'liquidar', 'whatsapp', 'cobranca'],
    perguntasFrequentes: [
      'Como lançar uma despesa (aluguel, energia, fornecedor) e dar baixa quando pagar?',
      'Onde vejo o lucro líquido real da minha loja descontando o custo dos produtos (DRE)?',
      'Como cobrar um cliente que comprou no fiado direto pelo WhatsApp?',
    ],
    passos: [
      {
        titulo: '1. Lançar e Dar Baixa em Contas a Pagar / Receber',
        descricao: 'Acesse "Financeiro" (atalho F4 na Retaguarda). Na aba "Contas a Pagar & Receber", filtre por Tipo ou Status, clique em "+ Novo Lançamento" para registrar despesas/receitas e clique em "Dar Baixa" para liquidar o título.',
      },
      {
        titulo: '2. Analisar o DRE Gerencial (Demonstrativo de Resultado)',
        descricao: 'Clique na sub-aba "DRE Gerencial" dentro do Financeiro. O sistema calcula automaticamente: Receita Bruta (-) Descontos (=) Receita Líquida (-) CMV (=) Lucro Bruto (-) Despesas Operacionais Pagas (=) Resultado Líquido do Período.',
      },
      {
        titulo: '3. Cobrança e Contato Rápido via WhatsApp',
        descricao: 'Em "Equipe & Clientes", veja a coluna "Limite Crédito / Devendo" de cada cliente e clique no botão de conversa "💬" ao lado do telefone para abrir o WhatsApp Web com mensagem direta.',
      },
    ],
    dicas: [
      'Ao importar um XML de NF-e de compra ou vender no Convênio/Fiado no PDV, os títulos financeiros são criados automaticamente no Financeiro.',
    ],
  },
  {
    id: 'relatorios-curva-abc-auditoria-spotlight',
    titulo: 'Painel Analítico (F1), Curva ABC de Faturamento (BI), Trilha de Auditoria e Busca Ctrl+K',
    resumo: 'Descubra quais produtos trazem 80% do seu faturamento (Classe A), reimprima DANFEs, audite cancelamentos com Snapshot JSON e use o Spotlight (Ctrl+K).',
    categoria: 'FINANCEIRO_RELATORIOS',
    atalho: 'F1 / Ctrl+K',
    abaDestino: 'RELATORIOS',
    labelBotaoDestino: 'Abrir Painel & Relatórios',
    palavrasChave: ['relatorios', 'dashboard', 'graficos', 'curva abc', 'pareto', 'bi', 'auditoria', 'logs', 'cancelamento', 'snapshot', 'json', 'spotlight', 'ctrl+k', 'danfe', 'segunda via'],
    perguntasFrequentes: [
      'Como ver a 2ª via do cupom DANFE de uma venda já finalizada?',
      'Como descobrir quem cancelou uma venda, alterou o preço de um produto ou fez sangria?',
      'O que é a Curva ABC e como saber quais são os produtos mais importantes da loja?',
    ],
    passos: [
      {
        titulo: '1. Painel & Relatórios Detalhados (Tecla F1 no ERP)',
        descricao: 'Em "Painel & Relatórios", navegue pelas 5 abas: "Painel & Gráficos" (KPIs, Eletrocardiograma 7 dias, Horários de Pico), "Vendas Detalhadas" (botão "Ver DANFE" em cada venda), "Fechamentos de Caixa", "Documentos Fiscais" e "Auditoria & Logs".',
      },
      {
        titulo: '2. Curva ABC de Faturamento (BI Enterprise)',
        descricao: 'Acesse "Curva ABC (BI)" no menu lateral e filtre por Hoje, 7 Dias, 30 Dias ou Tudo. O sistema classifica seus produtos em Classe A (80% da receita — nunca deixe faltar), Classe B (15%) e Classe C (5% — baixo giro).',
      },
      {
        titulo: '3. Trilha de Auditoria Imutável com Snapshot JSON',
        descricao: 'Em Gestão Avançada > "Trilha Auditoria", filtre por tipo de ação (Cancelamento, Alteração de Preço, Exclusão, Sangria) e clique no ícone de olho para inspecionar o Snapshot JSON completo (ex: preço antigo vs preço novo).',
      },
      {
        titulo: '4. Pesquisa Universal Estilo Spotlight (Atalho Ctrl + K)',
        descricao: 'Em qualquer tela da Retaguarda, pressione Ctrl + K para buscar simultaneamente telas do sistema, produtos do catálogo (com preço e estoque) e clientes/fornecedores.',
      },
    ],
    dicas: [
      'A Trilha de Auditoria é imutável no banco SQLite local, garantindo segurança total contra fraudes internas de caixa ou alterações indevidas de preço.',
    ],
  },
  {
    id: 'fiscal-nfce-certificado-a1-contingencia',
    titulo: 'Emissão Fiscal NFC-e (SEFAZ 4.00), Certificado Digital A1, PageUp/PageDown e Contingência',
    resumo: 'Como importar o Certificado A1 (.pfx/.p12), configurar CSC, cadastrar NCM/CSOSN, alternar entre modo Fiscal e Gerencial e operar em Contingência Offline.',
    categoria: 'FISCAL_NFCE',
    atalho: 'PageUp / PageDown',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Certificado A1 e Fiscal',
    palavrasChave: ['nfce', 'nota fiscal', 'cupom fiscal', 'sefaz', 'certificado a1', 'pfx', 'p12', 'csc', 'token', 'ncm', 'csosn', 'cfop', 'cest', 'pageup', 'pagedown', 'contingencia', 'ibge'],
    perguntasFrequentes: [
      'Como instalar o Certificado Digital A1 (.pfx ou .p12) no sistema?',
      'Como alternar rapidamente entre emitir NFC-e Fiscal e Recibo Simples no PDV (PageUp / PageDown)?',
      'O que acontece com a emissão da NFC-e se a internet cair na hora da venda?',
    ],
    passos: [
      {
        titulo: '1. Importar Certificado Digital A1 (.pfx / .p12)',
        descricao: 'Acesse Configurações > aba "Certificado A1 (NFC-e)". Selecione o arquivo .pfx ou .p12 do seu computador, digite a senha do certificado e clique em "Importar e Ativar Certificado". O sistema exibe um alerta no topo quando faltar 30 dias para vencer.',
      },
      {
        titulo: '2. Dados Fiscais da Empresa e Código IBGE Automático',
        descricao: 'Na aba "Dados da Empresa", informe CNPJ, Inscrição Estadual (IE), Regime Tributário (CRT 1 Simples Nacional, etc.) e digite o CEP para preencher automaticamente o Código IBGE do Município exigido pela SEFAZ.',
      },
      {
        titulo: '3. Alternar Modo Fiscal no PDV (PageUp / PageDown)',
        descricao: 'No PDV, pressione PageUp para ativar o Modo Fiscal NFC-e (a barra de total e o botão F10 ficam VERMELHOS com a tag [NFC-E ATIVA]). Pressione PageDown para voltar ao Modo Gerencial/Recibo. Em Configurações > Regras de Negócio, você pode fixar em "Sempre Emitir NFC-e".',
        destaque: 'No cadastro de cada produto, verifique a seção "Parâmetros Fiscais" (NCM 8 dígitos, CFOP 5102 e CSOSN 102/500).',
      },
      {
        titulo: '4. Contingência Offline Automática (tpEmis = 9)',
        descricao: 'Se a internet cair durante uma venda fiscal, o ClickStorm emite o cupom automaticamente em Contingência Offline sem travar a fila e permite retransmitir as notas pendentes em Painel & Relatórios > Documentos Fiscais.',
      },
    ],
    dicas: [
      'Configure também o modelo da sua Impressora Térmica (Epson, Bematech, Elgin, Daruma ou Genérica 80mm/58mm) em Configurações > aba "Impressão".',
    ],
  },
  {
    id: 'rede-lan-failover-backup-usb',
    titulo: 'Rede Multi-Terminal (LAN), Promoção Failover a Master e Backup Automático em Pendrive USB',
    resumo: 'Conecte vários caixas e celulares no mesmo servidor local sem internet, promova um caixa a Master se o principal pifar e salve cópias no Pendrive.',
    categoria: 'REDE_SISTEMA',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Abrir Contingência & Backup USB',
    palavrasChave: ['rede', 'lan', 'multi-terminal', 'dois caixas', 'outro computador', 'ip', 'servidor', 'master', 'terminal', 'failover', 'backup', 'pendrive', 'usb', 'copia de seguranca'],
    perguntasFrequentes: [
      'Como ligar um segundo computador (Caixa 02) na mesma rede para usar o mesmo banco de dados?',
      'Se o computador principal (Servidor Master) queimar, como continuar vendendo no outro caixa?',
      'Como fazer backup do banco de dados em um Pendrive USB?',
    ],
    passos: [
      {
        titulo: '1. Configurar Servidor Master vs Terminal Adicional (LAN)',
        descricao: 'Na tela de Login, clique no ícone de Wi-Fi no canto superior direito ("Topologia de Rede Multi-Terminal"). No computador principal, selecione "Servidor (Master)". Nos caixas secundários, escolha "Terminal Adicional", digite o IP do Master (ex: 192.168.1.50), porta 5000 e clique em "Testar Conexão LAN" -> "Salvar e Conectar".',
      },
      {
        titulo: '2. Failover: Elevar Terminal a Servidor Master em Caso de Pane',
        descricao: 'Se o computador principal sofrer pane física, vá no caixa secundário em Retaguarda > Configurações > aba "Contingência" e clique em "Elevar este Terminal a Servidor Master" para assumir a operação imediatamente.',
      },
      {
        titulo: '3. Cópia de Segurança em Pendrive (USB Dump)',
        descricao: 'Espete um pendrive no computador, acesse Configurações > aba "Contingência" e clique em "Fazer Backup Agora no Pendrive". O sistema também faz backup preventivo automático antes de cada atualização na pasta /backups_auto.',
      },
    ],
    dicas: [
      'O radar ZeroConf UDP na porta 41234 ajuda a localizar e testar a latência em milissegundos entre os terminais da rede local.',
    ],
  },
  {
    id: 'assinatura-stripe-autoupdate-identidade',
    titulo: 'Assinatura (Pix Instantâneo e Cartão), Auto-Update, Identidade Visual e Atalhos de Suporte',
    resumo: 'Renove sua licença com liberação automática em segundos via Pix ou Cartão, atualize o sistema pelo GitHub e personalize a cor da marca pelo logotipo.',
    categoria: 'REDE_SISTEMA',
    atalho: 'Ctrl+F3',
    abaDestino: 'ASSINATURA',
    labelBotaoDestino: 'Abrir Gestão de Assinatura',
    palavrasChave: ['assinatura', 'licenca', 'pix', 'qr code', 'cartao de credito', 'stripe', 'renovar', 'bloqueado', 'atualizacao', 'auto-update', 'versao', 'logo', 'cor', 'identidade visual', 'ctrl+f3', 'relogio'],
    perguntasFrequentes: [
      'Como pagar a mensalidade/anuidade por Pix ou Cartão e liberar o sistema na hora?',
      'Como o sistema extrai automaticamente a cor da minha marca ao enviar o logotipo?',
      'O que fazer se aparecer aviso de bloqueio de segurança por alteração no relógio do Windows?',
    ],
    passos: [
      {
        titulo: '1. Renovar Assinatura com Pix (Liberação Automática) ou Cartão In-App',
        descricao: 'Acesse "Assinatura" no menu lateral (ou clique em "Renovar Assinatura"). Escolha o Plano Mensal ou Anual (2 meses OFF). No Pix, escaneie o QR Code ou copie o código (também é possível imprimir fatura PDF): o sistema reconhece o pagamento em até 10 segundos e libera a licença sozinho! Ou pague direto na aba "Cartão de Crédito (In-App)".',
      },
      {
        titulo: '2. Identidade Visual com Extração Automática de Cor da Logo',
        descricao: 'Em Configurações > aba "Identidade Visual", envie a imagem do Logotipo da sua loja. O sistema analisa os pixels automaticamente via Canvas e aplica a cor predominante da sua marca em todo o PDV e ERP (com Live Preview ao vivo).',
      },
      {
        titulo: '3. Atualização Automática (Auto-Update GitHub Releases)',
        descricao: 'No topo da Retaguarda ou no rodapé do PDV, clique no botão da versão (ex: "v1.0.0 • Atualizado"). Se houver nova release, clique em "Baixar Atualização Agora" e depois em "Reiniciar Sistema e Aplicar Atualização".',
      },
      {
        titulo: '4. Proteção de Relógio (Time-Drift) e Suporte Técnico',
        descricao: 'Caso a bateria da placa-mãe atrase a data/hora do Windows, o sistema avisa para corrigir o relógio. Para suporte técnico avançado e diagnósticos de homologação, existem os modais técnicos Ctrl+F3 (Terminal Mestre) e Ctrl+Shift+F12 (Override de Emergência na tela de bloqueio).',
      },
    ],
    dicas: [
      'Na tela "Assinatura", você também pode consultar a tabela completa de Histórico de Pagamentos com comprovantes Stripe e gerenciar seus cartões salvos.',
    ],
  },
];
