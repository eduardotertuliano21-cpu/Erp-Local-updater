import type { HelpCategoryId, HelpNichoId, HelpTutorial } from './helpTypes.js';
import { TUTORIAIS_PDV_CAIXA } from './data/tutorialsPdvCaixa.js';
import { TUTORIAIS_ESTOQUE_CATALOGO } from './data/tutorialsEstoqueCatalogo.js';
import { TUTORIAIS_BALANCA_NICHOS } from './data/tutorialsBalancaNichos.js';
import { TUTORIAIS_GESTAO_SISTEMA } from './data/tutorialsGestaoSistema.js';

export const TODOS_OS_TUTORIAIS: HelpTutorial[] = [
  ...TUTORIAIS_PDV_CAIXA,
  ...TUTORIAIS_ESTOQUE_CATALOGO,
  ...TUTORIAIS_BALANCA_NICHOS,
  ...TUTORIAIS_GESTAO_SISTEMA,
];

/**
 * Palavras muito comuns em perguntas ("como faço para...") que não devem
 * gerar falso-positivo em todos os tutoriais durante a pesquisa.
 */
const STOPWORDS_PT = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'pra', 'pro', 'com', 'sem', 'sob', 'sobre',
  'que', 'qual', 'quais', 'onde', 'quando', 'como', 'porque', 'porquê',
  'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas',
  'este', 'esta', 'isso', 'aquilo', 'esse', 'essa',
  'faco', 'fazer', 'faz', 'feito', 'posso', 'pode', 'podem',
  'quero', 'quer', 'preciso', 'precisa', 'consigo', 'consegue',
  'sistema', 'programa', 'aplicativo', 'app', 'clickstorm',
  'tela', 'aba', 'menu', 'botao', 'clicar', 'abrir', 'ver', 'usar',
  'funciona', 'serve', 'esta', 'estao', 'tem', 'ter', 'foi', 'ser',
  'mais', 'menos', 'muito', 'todos', 'todas', 'tudo', 'nada', 'ou', 'e',
]);

/**
 * Mapa de sinônimos pensado para a linguagem do dia a dia de usuários leigos.
 */
const MAPA_SINONIMOS: Record<string, string[]> = {
  fiado: ['convenio', 'crediario', 'limite', 'receber', 'prazo', 'pendura', 'caderneta', 'anotar', 'devedor'],
  pendura: ['fiado', 'convenio', 'crediario', 'caderneta', 'prazo'],
  caderneta: ['fiado', 'convenio', 'crediario', 'pendura'],
  maquininha: ['tef', 'pinpad', 'cartao', 'credito', 'debito', 'pagamento', 'stone', 'cielo', 'rede', 'pagseguro'],
  cartao: ['tef', 'pinpad', 'credito', 'debito', 'f10', 'maquininha', 'parcelado'],
  pix: ['qrcode', 'chave pix', 'pagamento', 'f10', 'instantaneo'],
  troco: ['dinheiro', 'suprimento', 'abertura', 'gaveta', 'f6', 'f10', 'cedula', 'moeda'],
  sangria: ['retirar', 'tirar dinheiro', 'cofre', 'gaveta', 'f5', 'alivio'],
  suprimento: ['colocar dinheiro', 'entrada', 'troco', 'f6', 'abastecer gaveta'],
  fechar: ['fechamento', 'turno', 'f8', 'conferencia', 'cega', 'encerrar caixa'],
  cancelar: ['estornar', 'apagar', 'excluir', 'item errado', 'f4', 'f9', 'devolucao'],
  senha: ['login', 'pin', 'porteira aberta', 'rbac', 'permissao', 'supervisor', 'operador', 'bloqueio'],
  nota: ['nfce', 'xml', 'danfe', 'sefaz', 'fiscal', 'cupom', 'gem', 'imposto', 'tributo'],
  imposto: ['nfce', 'fiscal', 'ncm', 'csosn', 'cfop', 'certificado', 'sefaz', 'contador', 'xml'],
  certificado: ['a1', 'pfx', 'sefaz', 'nfce', 'csc', 'token', 'nota fiscal'],
  balanca: ['peso', 'pesagem', 'kg', 'quilo', 'grama', 'toledo', 'mgv', 'filizola', 'etiqueta', 'plu', 'serial'],
  peso: ['balanca', 'kg', 'quilo', 'toledo', 'filizola', 'etiqueta', 'pesavel'],
  garcom: ['restaurante', 'mesa', 'comanda', 'mobile', 'celular', '10%', 'gorjeta', 'qr code', 'pedido'],
  mesa: ['restaurante', 'comanda', 'garcom', 'f6', 'pre-conta', 'dividir conta', '10%'],
  cozinha: ['kds', 'restaurante', 'preparo', 'prato', 'comanda', 'monitor', 'tv'],
  receita: ['ficha tecnica', 'ingrediente', 'insumo', 'producao', 'pcp', 'hamburguer', 'prato'],
  carne: ['acougue', 'desossa', 'carcaca', 'corte', 'quebra', 'osso', 'sebo', 'balanca', 'boi'],
  desossa: ['acougue', 'carne', 'carcaca', 'rendimento', 'quebra', 'osso', 'sebo', 'cmv'],
  roupa: ['vestuario', 'grade', 'tamanho', 'cor', 'calcado', 'sapato', 'camisa', 'calca', 'moda'],
  grade: ['roupa', 'vestuario', 'tamanho', 'cor', 'variacao', 'numeracao'],
  carro: ['autopecas', 'veiculo', 'placa', 'km', 'quilometragem', 'frota', 'oficina', 'peca', 'oleo'],
  placa: ['autopecas', 'carro', 'veiculo', 'km', 'frota', 'oficina'],
  conserto: ['assistencia', 'ordem de servico', 'os', 'aparelho', 'imei', 'manutencao', 'celular', 'orcamento', 'tecnico'],
  whatsapp: ['assistencia', 'ordem de servico', 'os', 'avisar cliente', 'orcamento'],
  fardo: ['caixa fechada', 'multiplos codigos', 'wms', 'fator', 'embalagem', 'atacado', 'duzia', 'pack'],
  atacado: ['b2b', 'tabela de preco', 'multiplos codigos', 'fardo', 'revenda', 'cnpj'],
  lucro: ['dre', 'financeiro', 'relatorios', 'curva abc', 'margem', 'cmv', 'despesa', 'faturamento'],
  boleto: ['contas a pagar', 'fornecedor', 'despesa', 'vencimento', 'financeiro'],
  rede: ['lan', 'multi-terminal', 'dois caixas', 'dois computadores', 'ip', 'servidor', 'master', 'failover', 'wifi'],
  backup: ['pendrive', 'usb', 'copia', 'salvar', 'contingencia', 'formatar', 'seguranca'],
  camera: ['coletor', 'inventario', 'celular', 'codigo de barras', 'contagem'],
  etiqueta: ['gondola', 'preco', 'zebra', 'argox', 'elgin', 'codigo de barras', 'prateleira'],
  promocao: ['desconto', 'oferta', 'campanha', 'queima de estoque', 'baixar preco'],
  impressora: ['termica', 'bobina', '80mm', '58mm', 'cortar papel', 'cupom', 'recibo', 'usb'],
};

export function normalizarTexto(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s*+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalização fonética simplificada para tolerar erros de digitação comuns em português
 * (ex: "balansa" -> "balansa", "açouge" -> "asouje", "impresora" -> "impresora").
 */
function normalizarFonema(palavra: string): string {
  return normalizarTexto(palavra)
    .replace(/ss/g, 's')
    .replace(/sc/g, 's')
    .replace(/c([ei])/g, 's$1')
    .replace(/z/g, 's')
    .replace(/ch/g, 'x')
    .replace(/g([ei])/g, 'j$1')
    .replace(/ph/g, 'f')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Distância de edição (Levenshtein) rápida e limitada a 1 erro para palavras >= 4 letras.
 */
function palavrasSemelhantes(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (normalizarFonema(a) === normalizarFonema(b)) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let erros = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      erros++;
      if (erros > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else {
        i++;
        j++;
      }
    }
  }
  if (i < a.length || j < b.length) erros++;
  return erros <= 1;
}

export interface ResultadoBuscaTutorial {
  tutorial: HelpTutorial;
  score: number;
  perguntaCorrespondente?: string;
}

/**
 * Filtra a lista de tutoriais pelo Ramo de Atuação selecionado.
 */
export function filtrarTutoriaisPorRamo(
  tutoriais: HelpTutorial[],
  filtroRamo: HelpNichoId = 'TODOS_RAMOS',
  ramoAtualLoja: Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS' | 'GERAL'> = 'MERCADO',
  apenasExclusivosQuandoRamoEspecifico = false
): HelpTutorial[] {
  if (filtroRamo === 'TODOS_RAMOS') {
    return tutoriais;
  }
  if (filtroRamo === 'MEU_RAMO') {
    return tutoriais.filter((t) => t.ramo === 'GERAL' || t.ramo === ramoAtualLoja);
  }
  if (filtroRamo === 'GERAL') {
    return tutoriais.filter((t) => t.ramo === 'GERAL');
  }
  // Quando o usuário escolhe um ramo específico (ex: RESTAURANTE, ACOUGUE, ROUPAS, ASSISTENCIA, AUTOPECAS, MERCADO)
  if (apenasExclusivosQuandoRamoEspecifico) {
    return tutoriais.filter((t) => t.ramo === filtroRamo);
  }
  // Ordena colocando os exclusivos daquele ramo no topo, seguidos pelos gerais
  const exclusivos = tutoriais.filter((t) => t.ramo === filtroRamo);
  const gerais = tutoriais.filter((t) => t.ramo === 'GERAL');
  return [...exclusivos, ...gerais];
}

export function pesquisarTutoriaisInteligente(
  consulta: string,
  categoria: HelpCategoryId = 'TODOS',
  filtroRamo: HelpNichoId = 'TODOS_RAMOS',
  ramoAtualLoja: Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS' | 'GERAL'> = 'MERCADO',
  apenasExclusivosDoRamo = false
): ResultadoBuscaTutorial[] {
  const filtradosRamo = filtrarTutoriaisPorRamo(
    TODOS_OS_TUTORIAIS,
    filtroRamo,
    ramoAtualLoja,
    apenasExclusivosDoRamo
  );

  const base =
    categoria === 'TODOS'
      ? filtradosRamo
      : categoria === 'INICIO'
      ? filtradosRamo.filter((t) => t.essencialIniciante || t.ramo === ramoAtualLoja)
      : filtradosRamo.filter((t) => t.categoria === categoria);

  const qNorm = normalizarTexto(consulta);
  if (!qNorm) {
    // Sem texto de busca: prioriza os tutoriais específicos do ramo ativo e essenciais para iniciantes
    return base
      .map((tutorial, idx) => {
        let boost = 100 - idx;
        if (filtroRamo !== 'TODOS_RAMOS' && filtroRamo !== 'GERAL') {
          const ramoAlvo = filtroRamo === 'MEU_RAMO' ? ramoAtualLoja : filtroRamo;
          if (tutorial.ramo === ramoAlvo) boost += 50;
        }
        if (categoria === 'INICIO' && tutorial.essencialIniciante) {
          boost += 30;
        }
        return { tutorial, score: boost };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Separa tokens e remove stopwords (mantendo números, teclas F1..F12 e símbolos como *)
  const todosTokens = qNorm.split(' ').filter((w) => w.length >= 2 || /\d|\*/.test(w));
  const tokensRelevantes = todosTokens.filter((w) => !STOPWORDS_PT.has(w) || /^f\d+$/.test(w));
  const tokensOriginais = tokensRelevantes.length > 0 ? tokensRelevantes : todosTokens;

  const tokensExpandidos = new Set<string>(tokensOriginais);

  for (const tk of tokensOriginais) {
    for (const [chave, sinonimos] of Object.entries(MAPA_SINONIMOS)) {
      const chaveNorm = normalizarTexto(chave);
      if (
        tk === chaveNorm ||
        (tk.length >= 4 && (chaveNorm.includes(tk) || tk.includes(chaveNorm))) ||
        palavrasSemelhantes(tk, chaveNorm)
      ) {
        tokensExpandidos.add(chaveNorm);
        sinonimos.forEach((s) => tokensExpandidos.add(normalizarTexto(s)));
      } else if (
        sinonimos.some((s) => {
          const sNorm = normalizarTexto(s);
          return sNorm === tk || (tk.length >= 4 && sNorm.includes(tk)) || palavrasSemelhantes(tk, sNorm);
        })
      ) {
        tokensExpandidos.add(chaveNorm);
        sinonimos.forEach((s) => tokensExpandidos.add(normalizarTexto(s)));
      }
    }
  }

  const resultados: ResultadoBuscaTutorial[] = [];

  for (const tut of base) {
    let score = 0;
    let tokensOriginaisEncontrados = 0;
    let perguntaCorrespondente: string | undefined;

    const tituloNorm = normalizarTexto(tut.titulo);
    const resumoNorm = normalizarTexto(tut.resumo);
    const leigoNorm = normalizarTexto(tut.explicacaoLeigo || '');
    const ondeNorm = normalizarTexto(tut.ondeEncontrar || '');
    const atalhoNorm = normalizarTexto(tut.atalho || '');
    const chavesNorm = tut.palavrasChave.map(normalizarTexto).join(' ');
    const passosNorm = tut.passos
      .map((p) => normalizarTexto(`${p.titulo} ${p.descricao} ${p.destaque || ''}`))
      .join(' ');
    const problemasNorm = (tut.problemasComuns || [])
      .map((p) => normalizarTexto(`${p.problema} ${p.solucao}`))
      .join(' ');

    const palavrasTituloEChaves = `${tituloNorm} ${chavesNorm} ${resumoNorm}`
      .split(' ')
      .filter((w) => w.length >= 4);

    // Correspondência de frase exata (quando a frase tem pelo menos uma palavra relevante)
    if (tokensRelevantes.length > 0 && qNorm.length >= 3) {
      const fraseLimpa = tokensRelevantes.join(' ');
      if (tituloNorm.includes(qNorm) || (fraseLimpa.length >= 4 && tituloNorm.includes(fraseLimpa))) {
        score += 95;
      }
      if (chavesNorm.includes(qNorm) || (fraseLimpa.length >= 4 && chavesNorm.includes(fraseLimpa))) {
        score += 80;
      }
      if (atalhoNorm && atalhoNorm.includes(qNorm)) {
        score += 90;
      }
      for (const perg of tut.perguntasFrequentes) {
        const pNorm = normalizarTexto(perg);
        if (pNorm.includes(qNorm) || (fraseLimpa.length >= 5 && pNorm.includes(fraseLimpa))) {
          score += 85;
          if (!perguntaCorrespondente) perguntaCorrespondente = perg;
        }
      }
    }

    // Pontuação por token (original + sinônimos + tolerância a erro de digitação)
    for (const tk of tokensExpandidos) {
      const isOriginal = tokensOriginais.includes(tk);
      const pesoMult = isOriginal ? 1 : 0.55;
      let matchNesteToken = false;

      if (tituloNorm.includes(tk)) {
        score += 38 * pesoMult;
        matchNesteToken = true;
      }
      if (atalhoNorm && atalhoNorm.includes(tk)) {
        score += 45 * pesoMult;
        matchNesteToken = true;
      }
      if (chavesNorm.includes(tk)) {
        score += 32 * pesoMult;
        matchNesteToken = true;
      }
      if (ondeNorm.includes(tk)) {
        score += 20 * pesoMult;
        matchNesteToken = true;
      }
      if (resumoNorm.includes(tk) || leigoNorm.includes(tk)) {
        score += 22 * pesoMult;
        matchNesteToken = true;
      }
      if (problemasNorm.includes(tk)) {
        score += 18 * pesoMult;
        matchNesteToken = true;
      }
      if (passosNorm.includes(tk)) {
        score += 12 * pesoMult;
        matchNesteToken = true;
      }

      for (const perg of tut.perguntasFrequentes) {
        if (normalizarTexto(perg).includes(tk)) {
          score += 26 * pesoMult;
          matchNesteToken = true;
          if (!perguntaCorrespondente && isOriginal) perguntaCorrespondente = perg;
        }
      }

      // Tolerância a erro de digitação (fuzzy match) caso o token original não tenha dado match exato
      if (!matchNesteToken && isOriginal && tk.length >= 4) {
        const achouSemelhante = palavrasTituloEChaves.some((pal) => palavrasSemelhantes(tk, pal));
        if (achouSemelhante) {
          score += 25;
          matchNesteToken = true;
        }
      }

      if (matchNesteToken && isOriginal) {
        tokensOriginaisEncontrados++;
      }
    }

    // Bônus quando o tutorial responde a múltiplos termos pesquisados pelo usuário
    if (tokensOriginais.length > 1 && tokensOriginaisEncontrados >= tokensOriginais.length) {
      score += 45;
    }

    // Pequeno bônus para tutoriais do ramo atual da loja em caso de empate
    if (tut.ramo === ramoAtualLoja) {
      score += 5;
    }

    if (score >= 15) {
      resultados.push({ tutorial: tut, score, perguntaCorrespondente });
    }
  }

  const ordenados = resultados.sort((a, b) => b.score - a.score);

  // Filtra ruído: se o melhor resultado tem score muito alto, remove resultados com menos de 18% do topo
  if (ordenados.length > 1 && ordenados[0].score >= 60) {
    const corte = Math.max(18, ordenados[0].score * 0.2);
    return ordenados.filter((r) => r.score >= corte);
  }

  return ordenados;
}

/**
 * Sugestões de dúvidas rápidas contextualizadas para cada Ramo de Atuação,
 * evitando mostrar perguntas de Açougue para uma Loja de Roupas e vice-versa.
 */
export function obterSugestoesPorRamo(
  ramo: Exclude<HelpNichoId, 'MEU_RAMO' | 'TODOS_RAMOS' | 'GERAL'>
): string[] {
  const baseGeral = [
    'Como vender no fiado / caderneta?',
    'Como importar XML da nota fiscal?',
    'Como tirar a senha de login (Porteira Aberta)?',
    'Como emitir nota fiscal NFC-e (Certificado A1)?',
  ];

  switch (ramo) {
    case 'RESTAURANTE':
      return [
        'Como abrir mesa e cobrar taxa de 10% (F6)?',
        'Como usar comanda no celular do garçom?',
        'Como ligar o monitor da cozinha (KDS)?',
        'Como criar Ficha Técnica de pratos e lanches?',
        ...baseGeral,
      ];
    case 'ACOUGUE':
      return [
        'Como fazer desossa e calcular perda de osso/sebo?',
        'Como configurar balança Toledo Prix / MGV?',
        'Como ler etiqueta de peso (código começando com 2)?',
        'Como imprimir etiquetas de preço?',
        ...baseGeral,
      ];
    case 'ROUPAS':
      return [
        'Como criar grade de Tamanho (P, M, G) e Cor?',
        'Como imprimir etiquetas para roupas e gôndolas?',
        'Como fazer promoção e queima de estoque?',
        'Como vender no fiado / caderneta?',
        ...baseGeral.slice(1),
      ];
    case 'ASSISTENCIA':
      return [
        'Como abrir Ordem de Serviço (OS) de conserto?',
        'Como mandar orçamento e aviso no WhatsApp?',
        'Como receber OS pronta direto no caixa (F6)?',
        'Como cadastrar peças pelo XML da nota?',
        ...baseGeral.slice(2),
      ];
    case 'AUTOPECAS':
      return [
        'Como informar Placa e KM do veículo na venda?',
        'Como puxar histórico de frota pela placa?',
        'Como vender no preço de Atacado para oficinas (F3)?',
        'Como importar XML de fornecedor com lucro automático?',
        ...baseGeral.slice(2),
      ];
    case 'MERCADO':
    default:
      return [
        'Como multiplicar quantidade no caixa (Ex: 6*código)?',
        'Como cadastrar fardo/caixa que baixa unidade (WMS)?',
        'Como configurar balança e etiqueta de peso?',
        'Como contar estoque usando a câmera do celular?',
        ...baseGeral,
      ];
  }
}

export const SUGESTOES_DUVIDAS_RAPIDAS: string[] = [
  'Como vender no fiado / convênio?',
  'Como importar XML de nota fiscal?',
  'Como configurar balança Toledo MGV?',
  'Como tirar a senha de login (Porteira Aberta)?',
  'Como usar comanda no celular do garçom?',
  'Como instalar Certificado A1 e emitir NFC-e?',
  'Como multiplicar quantidade no caixa (QTD*)?',
  'Como cadastrar fardo ou caixa fechada (WMS)?',
  'Como ligar 2 computadores em rede LAN?',
  'Como fazer desossa no açougue?',
  'Como gerar grade de roupas (Tamanho x Cor)?',
  'Como abrir Ordem de Serviço e avisar no WhatsApp?',
];

export const MAPA_ATALHOS_COMPLETO = [
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F1', funcao: 'Abre esta Central de Ajuda, Tutoriais e Atalhos dentro do Caixa' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F2', funcao: 'Pesquisa produtos por nome, código, marca, tamanho ou cor' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F3', funcao: 'Políticas de Caixa (Segurança, Balança, Impressão, Pix e Tabela Atacado)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F4 / Del', funcao: 'Cancela o item selecionado no cupom (com auditoria/supervisor)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F5', funcao: 'Sangria de Caixa (retirada de dinheiro da gaveta para o cofre)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F6', funcao: 'Suprimento de Troco (Mercado) | Mapa de Mesas (Restaurante) | Painel OS (Assistência)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F7', funcao: 'Conferência rápida e status atual do saldo em gaveta' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F8', funcao: 'Fechamento de Turno do Caixa (com conferência cega)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F9', funcao: 'Cancela a venda inteira atual antes de finalizar' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F10', funcao: 'Abre a tela de Finalização e Pagamento da Venda' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F11', funcao: 'Alterna instantaneamente entre o Caixa PDV e a Retaguarda ERP' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F12', funcao: 'Sair / Trocar Operador (Logout rápido)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'PageUp / PageDown', funcao: 'PageUp ativa Modo Fiscal NFC-e (Vermelho) | PageDown volta ao Modo Recibo (Verde)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'QTD*CÓDIGO', funcao: 'Multiplicador rápido no leitor (Ex: 6*7891000100103 ou 3*COCA)' },
  { grupo: 'Pagamento & Recibo (F10)', tecla: 'Ctrl+1 a Ctrl+5', funcao: '1: Dinheiro | 2: PIX | 3: Débito | 4: Crédito | 5: Convênio (Fiado)' },
  { grupo: 'Pagamento & Recibo (F10)', tecla: 'Tecla P / Enter', funcao: 'Tecla P imprime o recibo térmico direto | Enter confirma venda ou fecha recibo' },
  { grupo: 'Retaguarda ERP & Sistema', tecla: 'Ctrl + K', funcao: 'Busca Universal Spotlight (encontra telas, tutoriais, produtos e clientes na hora)' },
  { grupo: 'Retaguarda ERP & Sistema', tecla: 'F1 / F2 / F4 / F5', funcao: 'No ERP: F1 Painel | F2 Produtos | F4 Financeiro | F5 Estoque & WMS' },
];
