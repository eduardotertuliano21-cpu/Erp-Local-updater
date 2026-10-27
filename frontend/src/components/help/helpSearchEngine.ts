import type { HelpCategoryId, HelpTutorial } from './helpTypes.js';
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

const MAPA_SINONIMOS: Record<string, string[]> = {
  fiado: ['convenio', 'crediario', 'limite', 'receber', 'prazo', 'pendura', 'caderneta'],
  pendura: ['fiado', 'convenio', 'crediario'],
  caderneta: ['fiado', 'convenio', 'crediario'],
  maquininha: ['tef', 'pinpad', 'cartao', 'credito', 'debito', 'pagamento'],
  cartao: ['tef', 'pinpad', 'credito', 'debito', 'f10', 'stripe'],
  troco: ['dinheiro', 'suprimento', 'abertura', 'gaveta', 'f6', 'f10'],
  sangria: ['retirar', 'tirar dinheiro', 'cofre', 'gaveta', 'f5'],
  suprimento: ['colocar dinheiro', 'entrada', 'troco', 'f6'],
  senha: ['login', 'pin', 'porteira aberta', 'rbac', 'permissao', 'supervisor'],
  nota: ['nfce', 'xml', 'danfe', 'sefaz', 'fiscal', 'cupom', 'gem'],
  imposto: ['nfce', 'fiscal', 'ncm', 'csosn', 'cfop', 'certificado', 'sefaz'],
  balanca: ['peso', 'pesagem', 'kg', 'quilo', 'toledo', 'mgv', 'filizola', 'etiqueta', 'plu'],
  garcom: ['restaurante', 'mesa', 'comanda', 'mobile', 'celular', '10%', 'gorjeta', 'qr code'],
  cozinha: ['kds', 'restaurante', 'preparo', 'prato', 'comanda'],
  carne: ['acougue', 'desossa', 'carcaca', 'corte', 'quebra', 'osso', 'balanca'],
  roupa: ['vestuario', 'grade', 'tamanho', 'cor', 'calcado', 'sapato'],
  carro: ['autopecas', 'veiculo', 'placa', 'km', 'frota', 'oficina'],
  conserto: ['assistencia', 'ordem de servico', 'os', 'aparelho', 'imei', 'manutencao'],
  fardo: ['caixa', 'multiplos codigos', 'wms', 'fator', 'embalagem', 'atacado'],
  atacado: ['b2b', 'tabela de preco', 'multiplos codigos', 'fardo'],
  lucro: ['dre', 'financeiro', 'relatorios', 'curva abc', 'margem', 'cmv'],
  rede: ['lan', 'multi-terminal', 'dois caixas', 'ip', 'servidor', 'master', 'failover'],
  backup: ['pendrive', 'usb', 'copia', 'salvar', 'contingencia'],
  camera: ['coletor', 'inventario', 'celular', 'codigo de barras'],
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

export interface ResultadoBuscaTutorial {
  tutorial: HelpTutorial;
  score: number;
  perguntaCorrespondente?: string;
}

export function pesquisarTutoriaisInteligente(
  consulta: string,
  categoria: HelpCategoryId = 'TODOS'
): ResultadoBuscaTutorial[] {
  const base =
    categoria === 'TODOS'
      ? TODOS_OS_TUTORIAIS
      : TODOS_OS_TUTORIAIS.filter((t) => t.categoria === categoria);

  const qNorm = normalizarTexto(consulta);
  if (!qNorm) {
    return base.map((tutorial) => ({ tutorial, score: 1 }));
  }

  const tokensOriginais = qNorm.split(' ').filter((w) => w.length >= 2 || /\d/.test(w));
  const tokensExpandidos = new Set<string>(tokensOriginais);

  for (const tk of tokensOriginais) {
    for (const [chave, sinonimos] of Object.entries(MAPA_SINONIMOS)) {
      if (tk.includes(chave) || chave.includes(tk)) {
        sinonimos.forEach((s) => tokensExpandidos.add(normalizarTexto(s)));
      }
      if (sinonimos.some((s) => normalizarTexto(s).includes(tk))) {
        tokensExpandidos.add(chave);
        sinonimos.forEach((s) => tokensExpandidos.add(normalizarTexto(s)));
      }
    }
  }

  const resultados: ResultadoBuscaTutorial[] = [];

  for (const tut of base) {
    let score = 0;
    let perguntaCorrespondente: string | undefined;

    const tituloNorm = normalizarTexto(tut.titulo);
    const resumoNorm = normalizarTexto(tut.resumo);
    const atalhoNorm = normalizarTexto(tut.atalho || '');
    const chavesNorm = tut.palavrasChave.map(normalizarTexto).join(' ');
    const passosNorm = tut.passos.map((p) => normalizarTexto(`${p.titulo} ${p.descricao} ${p.destaque || ''}`)).join(' ');
    const dicasNorm = tut.dicas.map(normalizarTexto).join(' ');

    if (tituloNorm.includes(qNorm)) score += 80;
    if (chavesNorm.includes(qNorm)) score += 65;
    if (atalhoNorm && atalhoNorm.includes(qNorm)) score += 70;

    for (const perg of tut.perguntasFrequentes) {
      const pNorm = normalizarTexto(perg);
      if (pNorm.includes(qNorm)) {
        score += 75;
        if (!perguntaCorrespondente) perguntaCorrespondente = perg;
      }
    }

    for (const tk of tokensExpandidos) {
      const isOriginal = tokensOriginais.includes(tk);
      const pesoMult = isOriginal ? 1 : 0.6;

      if (tituloNorm.includes(tk)) score += 35 * pesoMult;
      if (atalhoNorm.includes(tk)) score += 40 * pesoMult;
      if (chavesNorm.includes(tk)) score += 28 * pesoMult;
      if (resumoNorm.includes(tk)) score += 18 * pesoMult;
      if (passosNorm.includes(tk)) score += 12 * pesoMult;
      if (dicasNorm.includes(tk)) score += 8 * pesoMult;

      for (const perg of tut.perguntasFrequentes) {
        if (normalizarTexto(perg).includes(tk)) {
          score += 22 * pesoMult;
          if (!perguntaCorrespondente && isOriginal) perguntaCorrespondente = perg;
        }
      }
    }

    if (score > 0) {
      resultados.push({ tutorial: tut, score, perguntaCorrespondente });
    }
  }

  return resultados.sort((a, b) => b.score - a.score);
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
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F1', funcao: 'Abre a Central de Ajuda, Tutoriais e Atalhos no PDV' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F2', funcao: 'Pesquisa produtos por nome, código, marca, tamanho ou cor' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F3', funcao: 'Políticas de Caixa (Segurança, Balança, Impressão, Pix e Visual)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F4 / Del', funcao: 'Cancela o item selecionado no cupom (com auditoria/supervisor)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F5', funcao: 'Sangria de Caixa (retirada de dinheiro da gaveta para cofre)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F6', funcao: 'Suprimento de Troco (Varejo) | Mapa de Mesas (Restaurante) | Painel OS (Assistência)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F7', funcao: 'Conferência e Status atual do saldo em gaveta' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F8', funcao: 'Fechamento de Turno do Caixa' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F9', funcao: 'Cancela a venda inteira atual' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F10', funcao: 'Abre a tela de Finalização e Pagamento da Venda' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F11', funcao: 'Alterna instantaneamente entre Caixa PDV e Retaguarda ERP' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'F12', funcao: 'Sair / Trocar Operador (Logout)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'PageUp / PageDown', funcao: 'PageUp ativa Modo Fiscal NFC-e (Vermelho) | PageDown volta ao Modo Recibo (Verde)' },
  { grupo: 'Frente de Caixa (PDV)', tecla: 'QTD*CÓDIGO', funcao: 'Multiplicador rápido no leitor (Ex: 6*7891000100103 ou 3*COCA)' },
  { grupo: 'Pagamento & Recibo (F10)', tecla: 'Ctrl+1 a Ctrl+5', funcao: '1: Dinheiro | 2: PIX | 3: Débito | 4: Crédito | 5: Convênio (Fiado)' },
  { grupo: 'Pagamento & Recibo (F10)', tecla: 'Tecla P / Enter', funcao: 'Tecla P imprime o recibo térmico direto | Enter confirma venda ou fecha recibo' },
  { grupo: 'Retaguarda ERP & Sistema', tecla: 'Ctrl + K', funcao: 'Busca Universal Spotlight (encontra telas, produtos e clientes em milissegundos)' },
  { grupo: 'Retaguarda ERP & Sistema', tecla: 'F1 / F2 / F4 / F5', funcao: 'No ERP: F1 Painel | F2 Produtos | F4 Financeiro | F5 Estoque & WMS' },
  { grupo: 'Retaguarda ERP & Sistema', tecla: 'Ctrl + F3', funcao: 'Terminal Mestre Confidencial (Testes, Licenças, Stripe Sandbox e Telemetria)' },
];
