import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_PDV_CAIXA: HelpTutorial[] = [
  {
    id: 'onboarding-primeiro-acesso',
    titulo: 'Primeiro Acesso, Termo Legal e Implantação Inicial (Onboarding)',
    resumo: 'Como ativar sua licença ou iniciar offline, preencher os dados da loja com busca automática de CEP, criar o Administrador e configurar o ramo de atuação.',
    categoria: 'PRIMEIROS_PASSOS',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Abrir Configurações da Empresa',
    palavrasChave: ['primeiro acesso', 'onboarding', 'implantacao', 'wizard', 'termo', 'cep', 'ramo de atuacao', 'chave', 'nicho', 'configurar loja'],
    perguntasFrequentes: [
      'Como configurar o sistema pela primeira vez?',
      'Como escolher o ramo da minha loja (Mercado, Restaurante, Açougue, Roupas, Autopeças ou Assistência)?',
      'Posso pular a configuração fiscal NFC-e no início?',
    ],
    passos: [
      {
        titulo: '1. Aceite do Termo de Responsabilidade',
        descricao: 'Ao abrir o sistema pela primeira vez, leia as 8 cláusulas de licenciamento e arquitetura Local-First, marque a caixa de confirmação e clique em "Aceitar e Iniciar Configuração".',
      },
      {
        titulo: '2. Escolha o Modo de Início (Nuvem ou Offline)',
        descricao: 'Você pode escolher "Já tenho uma Chave de Ativação" (preenche dados automaticamente da nuvem), "Criar Nova Conta / Assinar" ou clicar em "Continuar com Configuração Manual / Modo Offline".',
      },
      {
        titulo: '3. Dados do Estabelecimento e Ramo de Atuação',
        descricao: 'Informe o Nome Fantasia, WhatsApp e o CEP de 8 dígitos (o sistema preenche Rua, Bairro, Cidade e UF automaticamente). Selecione o Ramo de Atuação Principal da sua empresa.',
        destaque: 'O Ramo de Atuação define o banco de dados isolado e adapta todas as telas do PDV e ERP.',
      },
      {
        titulo: '4. Cadastro do Administrador e Opção Fiscal',
        descricao: 'Crie o Login (em MAIÚSCULAS) e o PIN numérico de exatamente 4 dígitos do Administrador. Na etapa final, você pode marcar "Configurar NFC-e depois" para operar imediatamente em modo recibo/gerencial.',
      },
    ],
    dicas: [
      'Você pode alterar os dados cadastrais, logotipo e parâmetros fiscais a qualquer momento em Retaguarda (F11) > Configurações.',
    ],
  },
  {
    id: 'login-porteira-aberta-rbac',
    titulo: 'Login Inteligente, Modo Sem Senha (Porteira Aberta) e Permissões RBAC',
    resumo: 'Como tirar ou ativar a exigência de senha ao abrir o programa, cadastrar operadores e controlar o que cada cargo pode fazer.',
    categoria: 'PRIMEIROS_PASSOS',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Senhas e Permissões RBAC',
    palavrasChave: ['login', 'senha', 'pin', 'porteira aberta', 'sem senha', 'entrar direto', 'rbac', 'permissoes', 'operador', 'gerente', 'admin', 'usuario'],
    perguntasFrequentes: [
      'Como usar o sistema sem precisar digitar senha toda vez (Porteira Aberta)?',
      'Como cadastrar um novo operador de caixa ou gerente?',
      'Como bloquear um operador de cancelar vendas ou ver o financeiro?',
    ],
    passos: [
      {
        titulo: '1. Ativar ou Desativar Senha no Início (Modo Porteira Aberta)',
        descricao: 'Acesse Retaguarda (F11) > Configurações > aba "Permissões RBAC". Desative o switch "Exigir Senha / Login" para ativar o modo Porteira Aberta (o sistema entra direto sem tela de login).',
        destaque: 'No modo Porteira Aberta, o F11 (Retaguarda) fica livre e o caixa opera sem bloqueios de usuário.',
      },
      {
        titulo: '2. Como Funciona o Login Inteligente com Senha Ativa',
        descricao: 'Quando o login está ativo, digite o Usuário (convertido automaticamente para MAIÚSCULAS) e o PIN de 4 dígitos numéricos. Se for ADMIN ou GERENTE, o sistema abre a Retaguarda ERP; se for OPERADOR, abre direto o Caixa PDV.',
      },
      {
        titulo: '3. Cadastrar Novos Usuários e Operadores',
        descricao: 'Em Configurações > aba "Usuários & Acessos" (ou em Equipe & Clientes > + Novo Colaborador), clique em "Novo Usuário", defina Nome, Login, PIN de 4 dígitos e a Hierarquia (OPERADOR, GERENTE ou ADMIN).',
      },
      {
        titulo: '4. Configurar a Matriz de Permissões (Controle Estrito)',
        descricao: 'Na aba "Permissões RBAC", ative a chave "Controle Estrito" para validar as 7 permissões individuais (Cancelar Venda, Aplicar Desconto, Abrir Gaveta, Ver Relatórios, Acessar Estoque, Financeiro e Configurações) e clique em "Salvar Matriz de Permissões".',
      },
    ],
    dicas: [
      'Para trocar de operador rapidamente no Caixa PDV, pressione a tecla F12 (Logout).',
    ],
  },
  {
    id: 'pdv-venda-rapida-multiplicador',
    titulo: 'Como Realizar Vendas no Caixa PDV, Buscar Item (F2) e Multiplicador (QTD*)',
    resumo: 'Domine a operação 100% por teclado no Frente de Caixa: leitura de código de barras, pesquisa por nome e lançamento de múltiplas unidades.',
    categoria: 'PDV_CAIXA',
    atalho: 'F2 / F10',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Frente de Caixa (PDV)',
    palavrasChave: ['vender', 'pdv', 'caixa', 'codigo de barras', 'bipar', 'multiplicador', 'quantidade', 'asterisco', 'buscar produto', 'f2', 'leitor', 'carrinho'],
    perguntasFrequentes: [
      'Como passar vários produtos iguais de uma vez só (multiplicar quantidade)?',
      'Como procurar um produto pelo nome quando o código de barras está rasgado?',
      'Como apagar um item errado do carrinho ou cancelar a venda inteira?',
    ],
    passos: [
      {
        titulo: '1. Leitura Direta no Campo Sempre Focado',
        descricao: 'O cursor do PDV permanece travado automaticamente no campo principal de leitura. Basta bipar o produto com o leitor ótico ou digitar o código interno/EAN e pressionar Enter.',
      },
      {
        titulo: '2. Multiplicador Rápido de Quantidade (QTD*CÓDIGO ou QTD*NOME)',
        descricao: 'Antes de bipar ou digitar o produto, digite a quantidade seguida de asterisco (*). Exemplo: digite "6*7891000100103" e dê Enter para lançar 6 unidades, ou "3*COCA" para buscar Coca-Cola já multiplicada por 3x.',
        destaque: 'Também aceita decimais com vírgula para produtos vendidos a granel (ex: 1,5*200 lança 1,500 KG).',
      },
      {
        titulo: '3. Pesquisa de Produtos no Catálogo (Tecla F2)',
        descricao: 'Pressione F2 (ou digite parte do nome direto na barra de leitura) para abrir a consulta de produtos. Use as setas ↑ e ↓ para navegar e pressione Enter para adicionar ao cupom.',
      },
      {
        titulo: '4. Cancelar Item (F4 / Delete) ou Venda Completa (F9)',
        descricao: 'Use as setas ↑ e ↓ para destacar um item já lançado no carrinho e pressione F4 (ou Delete) para removê-lo. Para cancelar o cupom inteiro, pressione F9 (solicita PIN do supervisor se configurado).',
      },
    ],
    dicas: [
      'Pressionar ESC em qualquer janela fecha o modal imediatamente e devolve o foco para o leitor de código de barras.',
    ],
  },
  {
    id: 'pdv-pagamentos-fiado-tef',
    titulo: 'Finalizar Venda (F10), Pagamento Misto, Troco, Fiado/Convênio e PinPad TEF',
    resumo: 'Como receber em Dinheiro (com cálculo de troco), PIX, Cartão via PinPad TEF, dividir a conta em várias formas ou vender no Fiado/Convênio.',
    categoria: 'PDV_CAIXA',
    atalho: 'F10',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['pagamento', 'finalizar venda', 'f10', 'troco', 'dinheiro', 'pix', 'cartao', 'credito', 'debito', 'tef', 'pinpad', 'maquininha', 'fiado', 'convenio', 'crediario', 'cpf na nota'],
    perguntasFrequentes: [
      'Como vender no fiado (convênio) e controlar o limite do cliente?',
      'Como calcular o troco automaticamente no pagamento em dinheiro?',
      'Como passar cartão integrado no PinPad (TEF Local)?',
    ],
    passos: [
      {
        titulo: '1. Abrir a Tela de Fechamento (Tecla F10)',
        descricao: 'Com itens no carrinho, pressione F10. Se o cliente desejar CPF/CNPJ na nota, preencha o campo "CPF / CNPJ do Consumidor" no topo da janela.',
      },
      {
        titulo: '2. Selecionar a Forma de Pagamento por Atalho',
        descricao: 'Use os atalhos rápidos: Ctrl+1 (Dinheiro), Ctrl+2 (PIX), Ctrl+3 (Cartão de Débito), Ctrl+4 (Cartão de Crédito) ou Ctrl+5 (Convênio / Fiado).',
      },
      {
        titulo: '3. Cálculo de Troco em Espécie (Dinheiro)',
        descricao: 'Ao selecionar Dinheiro (Ctrl+1), informe o "Valor Recebido em Espécie" ou clique nas cédulas rápidas (Exato, R$ 10, R$ 20, R$ 50, R$ 100). O sistema exibe o Troco a devolver em destaque.',
      },
      {
        titulo: '4. Venda no Convênio / Fiado (Ctrl+5)',
        descricao: 'Selecione Convênio (habilitado no F3) e pesquise o cliente cadastrado. O sistema mostra o Limite Total, Saldo Devedor e Limite Disponível, bloqueando se ultrapassar o teto autorizado.',
        destaque: 'Os títulos de fiado vão automaticamente para o Contas a Receber no módulo Financeiro e podem ser cobrados via WhatsApp.',
      },
      {
        titulo: '5. Integração PinPad TEF Local (Cartão Débito/Crédito)',
        descricao: 'Ao escolher Débito ou Crédito, marque "Processar via PinPad (TEF Local)". O sistema aciona o PinPad via C:\\TEF_DIAL, aguarda a senha na maquininha e grava NSU, Bandeira e Autorização.',
      },
    ],
    dicas: [
      'No modal do recibo finalizado, pressione a tecla "P" para disparar a impressão térmica direta ou Enter/ESC para atender o próximo cliente.',
    ],
  },
  {
    id: 'pdv-abertura-sangria-fechamento',
    titulo: 'Abertura de Caixa, Sangria (F5), Suprimento (F6), Conferência (F7) e Fechamento (F8)',
    resumo: 'Controle completo da gaveta de dinheiro: fundo de troco inicial, retiradas para o cofre, entrada de troco e encerramento de turno.',
    categoria: 'PDV_CAIXA',
    atalho: 'F5 / F6 / F7 / F8',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['abrir caixa', 'fechar caixa', 'sangria', 'suprimento', 'fundo de troco', 'gaveta', 'f5', 'f6', 'f7', 'f8', 'turno', 'conferencia', 'tirar dinheiro'],
    perguntasFrequentes: [
      'Como tirar dinheiro da gaveta para o cofre ou pagar uma despesa (Sangria)?',
      'Como colocar mais moedas/troco na gaveta durante o dia (Suprimento)?',
      'O sistema bloqueou pedindo fechamento do dia anterior, como resolver?',
    ],
    passos: [
      {
        titulo: '1. Abertura de Caixa com Fundo de Troco',
        descricao: 'Ao acessar o PDV com o caixa fechado, o sistema exibe o modal de abertura. Informe o "Fundo de Troco / Saldo Inicial (R$)" (ex: R$ 100,00) e clique em "Abrir Caixa e Operar".',
      },
      {
        titulo: '2. Sangria — Retirada de Dinheiro da Gaveta (Tecla F5)',
        descricao: 'Pressione F5 no PDV, autorize com a senha do supervisor (se exigido), digite o valor retirado em R$ e o motivo obrigatório (ex: "Depósito cofre").',
      },
      {
        titulo: '3. Suprimento — Entrada de Troco na Gaveta (Tecla F6)',
        descricao: 'Nos modos de varejo (Mercado, Açougue, Roupas, Autopeças), pressione F6 para registrar a entrada de dinheiro extra para troco na gaveta.',
      },
      {
        titulo: '4. Conferência (F7) e Fechamento de Turno (F8)',
        descricao: 'Pressione F7 para ver o saldo calculado em gaveta (Abertura + Vendas Dinheiro + Suprimentos - Sangrias). No fim do expediente, pressione F8, informe o valor contado na gaveta e encerre o turno.',
        destaque: 'Se um caixa ficar aberto do dia anterior e a regra de fechamento diário estiver ativa, o sistema pedirá o fechamento pendente antes de iniciar o novo dia.',
      },
    ],
    dicas: [
      'Todas as sangrias, suprimentos e fechamentos ficam auditados em Painel & Relatórios > Fechamentos de Caixa e na Trilha de Auditoria.',
    ],
  },
  {
    id: 'pdv-regras-f3-b2b-personalizacao',
    titulo: 'Regras Rápidas do Caixa (F3), Cliente Atacado (B2B) e Personalização Visual',
    resumo: 'Configure alertas de sangria, som de bip, estoque negativo, chave Pix, tabela de atacado B2B e cores/logo direto do PDV.',
    categoria: 'PDV_CAIXA',
    atalho: 'F3',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['f3', 'regras operacao', 'b2b', 'atacado', 'cliente especial', 'tabela de preco', 'som de bip', 'tema escuro', 'personalizar', 'estoque negativo'],
    perguntasFrequentes: [
      'Como aplicar preço de atacado automaticamente para um cliente B2B no caixa?',
      'Como desligar o som de bip ou ativar impressão automática no PDV?',
      'Como mudar o tema Claro/Escuro e a cor do sistema?',
    ],
    passos: [
      {
        titulo: '1. Painel de Políticas de Operação (Tecla F3)',
        descricao: 'No PDV, pressione F3 para configurar rapidamente: senha de gerente para cancelar, limite de desconto livre (%), alerta de sangria, bloqueio de venda sem estoque, leitura de balança e impressão automática.',
      },
      {
        titulo: '2. Identificar Cliente B2B / Tabela de Atacado',
        descricao: 'Clique no botão "+ Cliente (B2B)" no topo esquerdo do PDV e selecione o cliente. Se ele tiver tabela especial vinculada, todos os itens do carrinho são recalculados imediatamente para o preço de atacado.',
      },
      {
        titulo: '3. Personalizar Aparência (Logo, Cores e Tema)',
        descricao: 'Dentro do menu F3 (ou em Retaguarda > Configurações > Identidade Visual), clique em "Personalizar Loja" para trocar entre tema Dark/Light, ajustar densidade da tela ou extrair a cor automática da sua logo.',
      },
    ],
    dicas: [
      'Você também pode alternar entre Tema Claro (Sol) e Escuro (Lua) com 1 clique no ícone do cabeçalho tanto no PDV quanto na Retaguarda.',
    ],
  },
];
