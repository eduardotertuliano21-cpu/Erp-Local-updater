// =====================================================================
// CLICKSTORM SYSTEMS - INTERAÇÕES DE ALTA CONVERSÃO (MAIN.JS)
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppCta();
  initNichesTabs();
  initFaqAccordion();
  initMobileMenu();
  initSpeedSimulator();
});

// 1. Configuração do CTA Comercial no WhatsApp
function initWhatsAppCta() {
  const WHATSAPP_NUMERO = '5511999999999'; // Número comercial do ClickStorm
  const MENSAGEM_PADRAO = encodeURIComponent(
    'Olá! Quero conhecer o ClickStorm Systems para o meu negócio e acelerar as minhas vendas sem depender de internet.'
  );

  const ctaButtons = document.querySelectorAll('.js-cta-whatsapp');
  ctaButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const niche = btn.getAttribute('data-niche');
      let mensagem = MENSAGEM_PADRAO;
      if (niche) {
        mensagem = encodeURIComponent(
          `Olá! Tenho um negócio no nicho de ${niche} e quero testar o ClickStorm Systems sem travar no balcão.`
        );
      }
      window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${mensagem}`, '_blank');
    });
  });
}

// 2. Alternância de Nichos Dinâmicos
const NICHOS_DATA = {
  mercados: {
    titulo: 'Mercados, Padarias & Mercearias',
    badge: 'Checkout Ultra Veloz',
    descricao: 'Acabe com as filas gigantes. Leitura instantânea de códigos de barras, integração nativa com balanças de checkout e emissão de cupom fiscal em milissegundos.',
    itens: [
      'Leitura de balança Toledo e Filizola sem delay',
      'Cadastro com múltiplos códigos de barras por produto',
      'Controle rigoroso de fiado e limite de crédito por cliente',
      'Curva ABC e estoque que avisa antes de faltar mercadoria'
    ],
    imagemMock: '🛒 Venda de 15 itens bipada em 4 segundos'
  },
  restaurantes: {
    titulo: 'Restaurantes, Bares & Lanchonetes',
    badge: 'Comanda Móvel & Monitor Cozinha',
    descricao: 'O garçom anota o pedido no smartphone na mesa e ele cai instantaneamente na tela da cozinha (KDS), tudo conectado pelo Wi-Fi local sem usar internet.',
    itens: [
      'Mapa interativo de mesas com fechamento automático',
      'Divisão de conta por pessoa com 1 clique',
      'Monitor de Cozinha (KDS) em tempo real',
      'Sem taxa por garçom ou limite de aparelhos'
    ],
    imagemMock: '🍽️ Pedido da Mesa 04 enviado para a cozinha'
  },
  assistencias: {
    titulo: 'Assistências Técnicas & Oficinas',
    badge: 'OS Direto no WhatsApp',
    descricao: 'Receba o equipamento, registre laudos com fotos, imprima etiqueta e envie o orçamento aprovado com aviso de retirada direto no WhatsApp do cliente.',
    itens: [
      'Controle completo de status (Entrada, Laudo, Pronto, Entregue)',
      'Checklist de entrada com peças e defeito reclamado',
      'Histórico detalhado por cliente e placa/número de série',
      'Cobrança mista: Mão de obra + Peças aplicadas'
    ],
    imagemMock: '📱 Ordem de Serviço #1042 enviada ao cliente'
  },
  acougues: {
    titulo: 'Açougue & Frigoríficos',
    badge: 'Rendimento de Desossa & CMV Real',
    descricao: 'Controle o peso de entrada do boi ou porco, registre os cortes derivados e calcule automaticamente o rendimento de quebra e o custo por quilo.',
    itens: [
      'Cálculo automático de porcentagem de perda/desperdício',
      'Etiquetas de gôndola e pesagem pré-embalada',
      'Venda fracionada por gramas com precisão cirúrgica',
      'Baixa automática do estoque de carne limpa e osso'
    ],
    imagemMock: '🥩 Desossa de Peça Traseira: 89,4% de Rendimento'
  }
};

function initNichesTabs() {
  const tabs = document.querySelectorAll('.niche-tab');
  const painelTitulo = document.getElementById('niche-title');
  const painelBadge = document.getElementById('niche-badge');
  const painelDesc = document.getElementById('niche-desc');
  const painelLista = document.getElementById('niche-list');
  const painelMock = document.getElementById('niche-mock');
  const ctaNiche = document.getElementById('niche-cta-btn');

  if (!tabs.length || !painelTitulo) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const chave = tab.getAttribute('data-niche');
      const dados = NICHOS_DATA[chave];
      if (!dados) return;

      painelTitulo.textContent = dados.titulo;
      painelBadge.textContent = dados.badge;
      painelDesc.textContent = dados.descricao;
      painelMock.textContent = dados.imagemMock;
      if (ctaNiche) ctaNiche.setAttribute('data-niche', dados.titulo);

      painelLista.innerHTML = '';
      dados.itens.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-3 text-slate-300 text-sm';
        li.innerHTML = `
          <span class="feature-check"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
          <span>${item}</span>
        `;
        painelLista.appendChild(li);
      });
    });
  });
}

// 3. Acordeão de Dúvidas Frequentes (FAQ)
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = !content.classList.contains('hidden');
      document.querySelectorAll('.faq-content').forEach((c) => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach((i) => (i.style.transform = 'rotate(0deg)'));

      if (!isOpen) {
        content.classList.remove('hidden');
        const icon = trigger.querySelector('.faq-icon');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// 4. Menu Mobile Responsivo
function initMobileMenu() {
  const btnToggle = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btnToggle || !menu) return;

  btnToggle.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => menu.classList.add('hidden'));
  });
}

// 5. Mini Simulador de Latência Zero (Demonstração Visual)
function initSpeedSimulator() {
  const timerElement = document.getElementById('speed-counter');
  if (!timerElement) return;

  let tempo = 0.04;
  setInterval(() => {
    tempo = (0.03 + Math.random() * 0.03).toFixed(2);
    timerElement.textContent = `${tempo}s`;
  }, 2500);
}
