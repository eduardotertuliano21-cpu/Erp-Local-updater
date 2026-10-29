import type { HelpTutorial } from '../helpTypes.js';

export const TUTORIAIS_PDV_CAIXA: HelpTutorial[] = [
  {
    id: 'onboarding-primeiro-acesso',
    titulo: 'Como Configurar sua Loja pela Primeira Vez (Primeiro Acesso)',
    resumo: 'Passo a passo simples para ativar o sistema, preencher o endereço pelo CEP, escolher o ramo da loja e criar seu login.',
    explicacaoLeigo: 'Quando você abre o sistema pela primeira vez, um assistente de boas-vindas faz 4 perguntas simples para deixar o programa com o nome da sua loja e adaptado para o seu tipo de comércio.',
    ondeEncontrar: 'Abre automaticamente no 1º uso • Para alterar depois: Retaguarda (F11) ➔ Configurações ➔ Dados da Empresa',
    categoria: 'PRIMEIROS_PASSOS',
    ramo: 'GERAL',
    essencialIniciante: true,
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Abrir Configurações da Empresa',
    palavrasChave: ['primeiro acesso', 'onboarding', 'implantacao', 'wizard', 'termo', 'cep', 'ramo de atuacao', 'chave', 'nicho', 'configurar loja', 'comecar', 'iniciar'],
    perguntasFrequentes: [
      'Como configurar o sistema pela primeira vez?',
      'Como escolher o ramo da minha loja (Mercado, Restaurante, Açougue, Roupas, Autopeças ou Assistência)?',
      'Preciso ter Certificado Digital ou CNPJ agora para começar a usar?',
    ],
    passos: [
      {
        titulo: '1. Aceite do Termo de Uso',
        descricao: 'Na primeira tela, role até o final, marque a caixinha "Li e concordo com os termos" e clique no botão azul "Aceitar e Iniciar Configuração".',
      },
      {
        titulo: '2. Escolha Como Iniciar (Com Chave ou Modo Offline)',
        descricao: 'Se você recebeu uma Chave de Ativação, escolha a primeira opção. Se quiser configurar manualmente agora mesmo (mesmo sem internet), clique em "Continuar com Configuração Manual / Modo Offline".',
      },
      {
        titulo: '3. Nome da Loja, CEP e Ramo de Atuação',
        descricao: 'Digite o Nome da sua Loja e o CEP (o sistema preenche Rua, Bairro e Cidade sozinho). Em seguida, clique no cartão que representa o seu Ramo de Atuação (Mercado, Restaurante, Açougue, Roupas, Assistência Técnica ou Autopeças).',
        destaque: 'Essa escolha adapta automaticamente os botões do caixa e do menu para o seu tipo de negócio.',
      },
      {
        titulo: '4. Crie o Usuário Administrador e Finalize',
        descricao: 'Escolha um nome de usuário (ex: ADMIN) e uma senha curta de 4 números (PIN, ex: 1234). Na última etapa, se você ainda não tiver Certificado Digital para nota fiscal, basta marcar "Configurar NFC-e depois" e concluir!',
      },
    ],
    dicas: [
      'Não se preocupe se errar algum dado no começo: você pode mudar o nome da loja, telefone, endereço e logotipo a qualquer hora em Retaguarda (F11) > Configurações.',
    ],
    problemasComuns: [
      {
        problema: 'Digitei o CEP mas não preencheu a rua automaticamente.',
        solucao: 'Se o computador estiver sem internet no momento, basta digitar o nome da rua, bairro e cidade manualmente nos campos liberados.',
      },
    ],
  },
  {
    id: 'login-porteira-aberta-rbac',
    titulo: 'Como Tirar ou Colocar Senha no Sistema (Porteira Aberta e Funcionários)',
    resumo: 'Aprenda a deixar o sistema entrando direto sem pedir senha (Porteira Aberta) ou a criar senhas separadas para cada funcionário.',
    explicacaoLeigo: 'Se só você ou sua família usam o computador, você pode desligar a exigência de senha ("Modo Porteira Aberta") para o programa abrir direto. Já se você tem funcionários no caixa, pode criar um PIN de 4 números para cada um e escolher o que eles podem ou não fazer.',
    ondeEncontrar: 'Retaguarda (F11) ➔ Menu Lateral: Configurações ➔ Aba "Permissões RBAC" e Aba "Usuários & Acessos"',
    categoria: 'PRIMEIROS_PASSOS',
    ramo: 'GERAL',
    essencialIniciante: true,
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Configurar Senhas e Permissões',
    palavrasChave: ['login', 'senha', 'pin', 'porteira aberta', 'sem senha', 'entrar direto', 'rbac', 'permissoes', 'operador', 'gerente', 'admin', 'usuario', 'bloquear funcionario'],
    perguntasFrequentes: [
      'Como usar o sistema sem precisar digitar senha toda vez que abre?',
      'Como cadastrar um novo operador de caixa ou gerente?',
      'Como proibir o operador de caixa de ver o meu faturamento ou cancelar vendas sozinho?',
    ],
    passos: [
      {
        titulo: '1. Como Desligar a Senha (Modo Porteira Aberta)',
        descricao: 'Vá na Retaguarda (tecla F11) > clique em "Configurações" no menu esquerdo > clique na aba "Permissões RBAC". Desligue a chavinha "Exigir Senha / Login". Pronto: o sistema abrirá direto sem pedir senha!',
        destaque: 'Você pode ligar a chavinha novamente quando quiser voltar a exigir senha.',
      },
      {
        titulo: '2. Como Cadastrar um Funcionário com Senha Própria',
        descricao: 'Dentro de "Configurações", clique na aba "Usuários & Acessos" e depois no botão "+ Novo Usuário". Digite o Nome, o Login (ex: JOAO), uma senha de 4 números (ex: 2580) e escolha o cargo: OPERADOR (só vende no caixa), GERENTE ou ADMIN.',
      },
      {
        titulo: '3. Como Escolher o que cada Cargo Pode Fazer',
        descricao: 'Volte na aba "Permissões RBAC", ligue a chavinha "Controle Estrito" e marque ou desmarque na tabela o que o OPERADOR e o GERENTE podem fazer (ex: Cancelar Venda, Dar Desconto, Ver Relatórios, Mexer no Estoque). Clique em "Salvar Matriz de Permissões".',
      },
    ],
    dicas: [
      'No Frente de Caixa (PDV), para trocar rapidamente de funcionário sem fechar o programa, basta apertar a tecla F12 (Sair / Trocar Operador).',
    ],
    problemasComuns: [
      {
        problema: 'O funcionário esqueceu o PIN de 4 dígitos dele.',
        solucao: 'Entre com a conta ADMIN na Retaguarda > Configurações > Usuários & Acessos, clique em Editar no funcionário e defina um novo PIN de 4 números.',
      },
    ],
  },
  {
    id: 'personalizar-ramo-logo-cores',
    titulo: 'Como Trocar o Ramo da Loja, Colocar Logotipo e Mudar Tema Claro/Escuro',
    resumo: 'Personalize o sistema com a marca da sua empresa, alterne entre modo Claro (Sol) e Escuro (Lua) ou altere a Área de Atuação.',
    explicacaoLeigo: 'Você pode deixar o sistema com a cara da sua loja: basta enviar a imagem da sua logomarca e o programa descobre sozinho a cor principal dela para pintar os botões.',
    ondeEncontrar: 'Topo da Tela (Botão Área de Atuação / Ícone Sol e Lua) • Configurações ➔ Aba "Identidade Visual"',
    categoria: 'PRIMEIROS_PASSOS',
    ramo: 'GERAL',
    abaDestino: 'CONFIGURACOES',
    labelBotaoDestino: 'Personalizar Identidade Visual',
    palavrasChave: ['logo', 'logotipo', 'cor', 'tema', 'claro', 'escuro', 'sol', 'lua', 'ramo', 'area de atuacao', 'nicho', 'mudar ramo', 'aparencia'],
    perguntasFrequentes: [
      'Como trocar entre o Tema Escuro (preto) e o Tema Claro (branco)?',
      'Como colocar a logo da minha empresa para sair na tela do caixa?',
      'Como mudar o ramo de atuação da loja no topo da tela?',
    ],
    passos: [
      {
        titulo: '1. Alternar entre Tema Claro e Tema Escuro (1 Clique)',
        descricao: 'No topo direito da tela (tanto no Caixa PDV quanto na Retaguarda), clique no botão com desenho de Sol ☀️ (para deixar a tela clara) ou de Lua 🌙 (para deixar a tela escura).',
      },
      {
        titulo: '2. Colocar o Logotipo e Cor da Sua Loja',
        descricao: 'Na Retaguarda (F11), vá em Configurações > aba "Identidade Visual". Clique para escolher a imagem da sua logo no computador. O sistema aplica a imagem e já sugere a cor da sua marca automaticamente. Depois clique em "Salvar Alterações".',
      },
      {
        titulo: '3. Trocar a Área de Atuação (Seletor no Topo)',
        descricao: 'No cabeçalho superior ao lado do nome da loja, clique no botão "ÁREA DE ATUAÇÃO" para alternar entre os modos (Mercado, Restaurante, Açougue, Roupas, Assistência ou Autopeças) ou configure o ramo fixo em Configurações > Dados da Empresa.',
        destaque: 'Cada área de atuação mantém seu próprio catálogo organizado para você testar ou operar sem misturar dados.',
      },
    ],
    dicas: [
      'No PDV, você também pode apertar F3 e clicar em "Personalizar Loja" para ajustar o tamanho das letras e espaçamento da tabela de vendas.',
    ],
  },
  {
    id: 'pdv-venda-rapida-multiplicador',
    titulo: 'Como Fazer uma Venda no Caixa: Leitor de Código, Busca (F2) e Multiplicador (QTD*)',
    resumo: 'Como passar produtos com o leitor de código de barras, procurar produto pelo nome (F2) e lançar várias unidades de uma vez só.',
    explicacaoLeigo: 'A tela do Caixa (PDV) foi feita para você não precisar usar o mouse: basta passar o produto no leitor de código de barras (ou digitar o nome apertando F2) que ele cai na lista na hora.',
    ondeEncontrar: 'Frente de Caixa (PDV) • Tecla F11 alterna entre Retaguarda e Caixa PDV',
    categoria: 'PDV_CAIXA',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F2 / QTD*',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Frente de Caixa (PDV)',
    palavrasChave: ['vender', 'pdv', 'caixa', 'codigo de barras', 'bipar', 'multiplicador', 'quantidade', 'asterisco', 'buscar produto', 'f2', 'leitor', 'carrinho', 'passar compra'],
    perguntasFrequentes: [
      'O cliente comprou 10 unidades iguais: como passar tudo de uma vez sem bipar 10 vezes?',
      'O código de barras está rasgado ou o produto não tem etiqueta: como vender pelo nome?',
      'Como voltar para a tela de vendas se eu estiver na Retaguarda?',
    ],
    passos: [
      {
        titulo: '1. Passar Produto com o Leitor ou Código',
        descricao: 'Na tela do Caixa PDV, a barra de leitura já fica pronta esperando. Basta apontar o leitor de código de barras para o produto (ou digitar o código numérico e apertar Enter) que o item entra na venda.',
      },
      {
        titulo: '2. Lançar Várias Unidades de Uma Vez (Multiplicador com Asterisco *)',
        descricao: 'Se o cliente levou 6 caixas de leite iguais, digite no teclado "6*" (o número 6 e o asterisco) e em seguida passe o leitor no produto (ou digite o código e dê Enter). O sistema lança 6 unidades de uma só vez!',
        destaque: 'Você também pode usar o asterisco buscando pelo nome: digite "4*COCA" e dê Enter para buscar Coca-Cola já multiplicada por 4!',
      },
      {
        titulo: '3. Procurar Produto pelo Nome (Tecla F2)',
        descricao: 'Não sabe o código? Aperte a tecla F2 no teclado. Digite qualquer parte do nome do produto (ex: "ARROZ"), use as setinhas para cima/baixo (↑ ↓) para escolher na lista e aperte Enter para adicionar à venda.',
      },
    ],
    dicas: [
      'Se abrir qualquer janela por engano no caixa, basta apertar a tecla ESC (no canto superior esquerdo do teclado) para fechar a janela na hora.',
    ],
    problemasComuns: [
      {
        problema: 'Passei o leitor de código de barras e apareceu "Produto não encontrado".',
        solucao: 'Isso significa que esse código ainda não foi cadastrado. Vá na Retaguarda (F11) > Produtos > "+ Novo Produto" (ou importe o XML da nota de compra) para cadastrá-lo.',
      },
    ],
  },
  {
    id: 'pdv-pagamentos-troco-dividido',
    titulo: 'Como Receber o Pagamento (F10): Dinheiro com Troco, PIX, Cartão e Conta Dividida',
    resumo: 'Como finalizar a venda apertando F10, calcular o troco automaticamente, receber em PIX/Cartão ou dividir o pagamento em duas formas.',
    explicacaoLeigo: 'Depois de passar todos os produtos do cliente, você aperta a tecla F10 para dizer como o cliente vai pagar (Dinheiro, PIX, Débito, Crédito ou Fiado). O sistema calcula o troco sozinho e permite até pagar metade em dinheiro e metade no PIX/Cartão.',
    ondeEncontrar: 'Frente de Caixa (PDV) ➔ Botão Verde "[F10] FINALIZAR VENDA" no canto inferior direito',
    categoria: 'PDV_CAIXA',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F10',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['pagamento', 'finalizar venda', 'f10', 'troco', 'dinheiro', 'pix', 'cartao', 'credito', 'debito', 'tef', 'pinpad', 'maquininha', 'dividir pagamento', 'misto', 'cpf na nota'],
    perguntasFrequentes: [
      'Como o sistema calcula o troco quando o cliente paga em dinheiro?',
      'O cliente quer pagar R$ 20,00 em Dinheiro e o restante no Cartão ou PIX: como fazer?',
      'Como colocar o CPF do cliente na nota na hora de fechar a venda?',
    ],
    passos: [
      {
        titulo: '1. Aperte F10 para Abrir a Tela de Pagamento',
        descricao: 'Com os produtos lançados na tela, aperte F10 (ou clique no botão grande "[F10] FINALIZAR VENDA"). Se o cliente pedir CPF na nota, digite no campo "CPF / CNPJ do Consumidor" no topo.',
      },
      {
        titulo: '2. Escolha a Forma de Pagamento',
        descricao: 'Clique na forma desejada ou use os atalhos: Ctrl+1 (Dinheiro), Ctrl+2 (PIX), Ctrl+3 (Cartão de Débito), Ctrl+4 (Cartão de Crédito) ou Ctrl+5 (Convênio / Fiado).',
      },
      {
        titulo: '3. Calcular o Troco no Dinheiro',
        descricao: 'Ao escolher Dinheiro, digite quanto o cliente te entregou na mão (ex: 50) ou clique nos botões rápidos de notas (R$ 10, R$ 20, R$ 50, R$ 100). O sistema mostra em letras grandes exatamente quanto você deve devolver de TROCO.',
      },
      {
        titulo: '4. Como Dividir o Pagamento em 2 ou Mais Formas (Pagamento Misto)',
        descricao: 'Se a compra deu R$ 50,00 e o cliente quer dar R$ 20,00 em Dinheiro e R$ 30,00 no PIX: escolha Dinheiro, digite 20,00 e adicione; depois escolha PIX para o saldo restante de R$ 30,00 e confirme!',
        destaque: 'Ao finalizar, aperte a tecla "P" se quiser imprimir o comprovante na impressora térmica ou Enter para atender o próximo cliente.',
      },
    ],
    dicas: [
      'Se você usa maquininha PinPad ligada por cabo no computador (TEF), basta marcar a opção "Processar via PinPad (TEF Local)" ao escolher Débito ou Crédito.',
    ],
  },
  {
    id: 'pdv-venda-fiado-convenio',
    titulo: 'Como Vender no Fiado / Caderneta (Convênio) e Controlar Limite do Cliente',
    resumo: 'Aprenda a liberar a venda a prazo (fiado), definir limite máximo de crédito por cliente e receber quando ele vier pagar.',
    explicacaoLeigo: 'Sabe o antigo caderninho de fiado? No sistema ele se chama "Convênio". Você cadastra o cliente, define até quanto ele pode comprar fiado (ex: R$ 300,00) e, na hora da venda, lança na conta dele. Se ele passar do limite, o sistema avisa e bloqueia!',
    ondeEncontrar: 'Ativar em: F3 no PDV (ou Configurações > Regras) • Cadastrar Cliente: Equipe & Clientes • Vender: F10 > Convênio (Ctrl+5)',
    categoria: 'PDV_CAIXA',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'Ctrl+5 (no F10)',
    abaDestino: 'ENTIDADES',
    labelBotaoDestino: 'Cadastrar Cliente com Limite de Fiado',
    palavrasChave: ['fiado', 'convenio', 'crediario', 'caderneta', 'pendura', 'vender a prazo', 'limite de credito', 'devedor', 'cobrar cliente', 'ctrl+5'],
    perguntasFrequentes: [
      'Como ativar a opção de vender no Fiado (Convênio) no meu caixa?',
      'Onde eu cadastro o cliente e coloco o limite de crédito dele?',
      'Quando o cliente vem pagar o fiado no fim do mês, onde eu dou baixa?',
    ],
    passos: [
      {
        titulo: '1. Ativar a Função de Fiado / Convênio',
        descricao: 'Na Retaguarda (F11) > Configurações > aba "Regras de Negócio", marque a opção "Controle de Fiado / Convênio" e clique em "Salvar Alterações" (você também pode ativar apertando F3 direto no PDV).',
      },
      {
        titulo: '2. Cadastrar o Cliente e Definir o Limite de Crédito',
        descricao: 'No menu lateral da Retaguarda, clique em "Equipe & Clientes" (ou "Garçons & Equipe") > botão "+ Novo Cliente/Fornecedor". Preencha o Nome, Telefone/WhatsApp e, no campo "Limite de Crédito (R$)", digite o valor máximo que ele pode dever (ex: 500.00).',
      },
      {
        titulo: '3. Fazer a Venda no Fiado no Caixa (F10 -> Convênio)',
        descricao: 'Passe os produtos normalmente no caixa e aperte F10. Clique na opção "Convênio (Ctrl+5)", procure o nome do cliente na lista e confirme. O sistema mostra quanto ele já deve e quanto ainda tem de limite disponível.',
        destaque: 'Toda venda no Convênio gera automaticamente uma conta a receber em nome daquele cliente.',
      },
      {
        titulo: '4. Como Receber / Dar Baixa Quando o Cliente Pagar',
        descricao: 'Quando o cliente vier pagar a conta, vá na Retaguarda (F11) > menu "Financeiro" (F4). Filtre por "A RECEBER" e clique no botão verde "Dar Baixa" na linha do cliente. O limite dele é liberado na mesma hora!',
      },
    ],
    dicas: [
      'Na tela "Equipe & Clientes", você pode clicar no ícone de balãozinho "💬" ao lado do telefone do cliente para mandar uma mensagem de cobrança amigável direto no WhatsApp dele!',
    ],
  },
  {
    id: 'pdv-abertura-sangria-fechamento',
    titulo: 'Como Abrir o Caixa, Tirar Dinheiro (Sangria F5), Colocar Troco (F6) e Fechar o Dia (F8)',
    resumo: 'Como controlar o dinheiro da gaveta do início ao fim do expediente sem faltar nem sobrar um centavo.',
    explicacaoLeigo: 'Para a conta do dinheiro bater certinho no fim do dia, tudo que entra ou sai da gaveta precisa ser avisado ao sistema: ao começar o dia você informa quanto tem de troco; se tirar dinheiro para o cofre usa a "Sangria (F5)"; se colocar mais moedas usa o "Suprimento (F6)"; e no fim do dia faz o "Fechamento (F8)".',
    ondeEncontrar: 'Frente de Caixa (PDV) ➔ Barra inferior de atalhos: F5 (Sangria), F6 (Suprimento), F7 (Conferir), F8 (Fechar Caixa)',
    categoria: 'PDV_CAIXA',
    ramo: 'GERAL',
    essencialIniciante: true,
    atalho: 'F5 / F6 / F7 / F8',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['abrir caixa', 'fechar caixa', 'sangria', 'suprimento', 'fundo de troco', 'gaveta', 'f5', 'f6', 'f7', 'f8', 'turno', 'conferencia', 'tirar dinheiro', 'colocar troco', 'cofre'],
    perguntasFrequentes: [
      'Preciso tirar dinheiro da gaveta para pagar um fornecedor ou guardar no cofre: como lançar (Sangria)?',
      'Como colocar mais moedas de troco na gaveta no meio do expediente (Suprimento)?',
      'Como conferir quanto de dinheiro tem que ter na gaveta agora (F7) e fechar o caixa (F8)?',
    ],
    passos: [
      {
        titulo: '1. Abrir o Caixa no Início do Dia',
        descricao: 'Ao entrar no PDV com o caixa fechado, uma janela pergunta o "Fundo de Troco / Saldo Inicial (R$)". Conte quanto dinheiro de troco está na gaveta (ex: 100,00), digite o valor e clique em "Abrir Caixa e Operar".',
      },
      {
        titulo: '2. Sangria (Tecla F5) — Retirar Dinheiro da Gaveta',
        descricao: 'Sempre que tirar notas da gaveta (para guardar no cofre ou pagar uma despesa urgente), aperte F5 no teclado, digite o valor retirado (ex: 200,00) e escreva o motivo (ex: "Retirada para o cofre").',
        destaque: 'Registrar a Sangria evita que o caixa dê "falta de dinheiro" na hora de fechar o turno!',
      },
      {
        titulo: '3. Suprimento (Tecla F6) — Colocar Mais Troco na Gaveta',
        descricao: 'Se você trouxer mais moedas ou notas pequenas do banco para reforçar o troco da gaveta, aperte F6 (nos modos de varejo), digite o valor adicionado e confirme.',
      },
      {
        titulo: '4. Conferir Gaveta (F7) e Fechar o Caixa no Fim do Dia (F8)',
        descricao: 'Aperte F7 a qualquer hora para ver um resumo de quanto deve haver na gaveta. Ao encerrar o expediente, aperte F8 (Fechar Caixa), conte as notas e moedas da gaveta, digite o valor contado e confirme o fechamento.',
      },
    ],
    dicas: [
      'Todos os fechamentos de caixa anteriores ficam salvos para conferência do dono em Retaguarda (F11) > Painel & Relatórios > aba "Fechamentos de Caixa".',
    ],
    problemasComuns: [
      {
        problema: 'Apareceu um aviso dizendo que o caixa do dia anterior ficou aberto.',
        solucao: 'Isso acontece quando esqueceram de apertar F8 ontem. Basta clicar no botão da própria janela de aviso para fechar o caixa de ontem e abrir o de hoje em seguida.',
      },
    ],
  },
  {
    id: 'pdv-cancelar-item-venda-regras',
    titulo: 'Como Cancelar um Item Errado (F4), Cancelar Venda (F9), Atacado (B2B) e Regras (F3)',
    resumo: 'O que fazer quando passar um produto errado no caixa, como exigir senha do gerente para cancelar e como vender no preço de atacado.',
    explicacaoLeigo: 'Errou ao passar um produto ou o cliente desistiu de levar? Basta clicar no item (ou selecionar com as setas) e apertar F4 para tirar só aquele item, ou F9 para cancelar a compra inteira.',
    ondeEncontrar: 'Frente de Caixa (PDV) ➔ Teclas F4 (Cancelar Item), F9 (Cancelar Venda) e F3 (Configurações do Caixa)',
    categoria: 'PDV_CAIXA',
    ramo: 'GERAL',
    atalho: 'F3 / F4 / F9',
    abaDestino: 'PDV',
    labelBotaoDestino: 'Ir para o Caixa PDV',
    palavrasChave: ['cancelar item', 'apagar item', 'excluir produto', 'errei', 'f4', 'delete', 'cancelar venda', 'f9', 'f3', 'senha supervisor', 'atacado', 'b2b'],
    perguntasFrequentes: [
      'Passei um produto errado no leitor: como remover só esse item da lista?',
      'O cliente desistiu da compra toda: como limpar o carrinho (F9)?',
      'Como fazer o caixa pedir senha do gerente antes de deixar o operador cancelar um item?',
    ],
    passos: [
      {
        titulo: '1. Remover Apenas 1 Item Errado da Lista (Tecla F4 ou Delete)',
        descricao: 'Clique em cima do item que deseja tirar da lista (ou use as setinhas ↑ e ↓ do teclado até ele ficar selecionado) e aperte a tecla F4 (ou Delete).',
      },
      {
        titulo: '2. Cancelar a Venda Inteira (Tecla F9)',
        descricao: 'Se o cliente desistir de toda a compra antes de pagar, aperte a tecla F9 ("Canc. Venda") e confirme.',
      },
      {
        titulo: '3. Exigir ou Tirar Senha de Gerente ao Cancelar (Tecla F3)',
        descricao: 'No PDV, aperte F3 (ou vá em Retaguarda > Configurações > Regras de Negócio) e marque ou desmarque a opção "Exigir Senha para Cancelamento de Venda/Item".',
        destaque: 'Todo item ou venda cancelada fica gravado na "Trilha Auditoria" para o dono saber exatamente quem cancelou e o horário.',
      },
      {
        titulo: '4. Vender com Preço de Atacado para Cliente Especial (+ Cliente B2B)',
        descricao: 'No painel direito do PDV, clique em "+ Cliente (B2B)" e selecione o cliente cadastrado como atacadista. Os preços dos produtos mudam automaticamente para a tabela de atacado.',
      },
    ],
    dicas: [
      'No menu F3 do caixa você também pode ativar "Permitir Venda com Estoque Negativo" para que o caixa nunca bloqueie uma venda mesmo que você ainda não tenha atualizado a quantidade no estoque.',
    ],
  },
];
