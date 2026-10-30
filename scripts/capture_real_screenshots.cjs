const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'Site', 'public', 'images');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Iniciando Chrome Headless para capturar telas reais do sistema...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // 2x Retina para nitidez cristalina
    },
  });

  const page = await browser.newPage();

  // Garante que o sistema entre logado e configurado como dark mode
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('clickstorm_termo_aceito', 'true');
    localStorage.setItem('clickstorm_onboarded', 'true');
    localStorage.setItem('clickstorm_exigir_autenticacao', 'false');
    localStorage.setItem('clickstorm_dark_theme', 'true');
    document.documentElement.classList.add('dark');
  });

  try {
    // 1. CAPTURA DO DASHBOARD (Retaguarda)
    console.log('📸 1/5 Capturando Painel & Relatórios (Dashboard)...');
    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('cs_view_mode', 'RETAGUARDA');
      sessionStorage.setItem('cs_boot_done', 'true');
    });
    await page.goto('http://127.0.0.1:5000/', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screen-dashboard.png') });
    console.log('  ✓ Salvo: screen-dashboard.png');

    // 2. CAPTURA DO CATÁLOGO DE PRODUTOS
    console.log('📸 2/5 Capturando Catálogo de Produtos...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Cardápio') || b.textContent.includes('Produtos')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screen-produtos.png') });
    console.log('  ✓ Salvo: screen-produtos.png');

    // 3. CAPTURA DO FINANCEIRO & DRE
    console.log('📸 3/5 Capturando Módulo Financeiro & DRE...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Financeiro'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screen-financeiro.png') });
    console.log('  ✓ Salvo: screen-financeiro.png');

    // 4. CAPTURA DA CENTRAL DE AJUDA
    console.log('📸 4/5 Capturando Central de Ajuda & Tutoriais...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Ajuda'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screen-ajuda.png') });
    console.log('  ✓ Salvo: screen-ajuda.png');

    // 5. CAPTURA DO FRENTE DE CAIXA (PDV)
    console.log('📸 5/5 Capturando Frente de Caixa (PDV)...');
    await page.evaluate(() => {
      const btnPdv = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('CAIXA PDV'));
      if (btnPdv) btnPdv.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Se houver modal de abertura de caixa, clica para abrir
    await page.evaluate(async () => {
      const inputSaldo = document.querySelector('input[type="number"]');
      if (inputSaldo) {
        inputSaldo.value = '150.00';
        inputSaldo.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btnAbrir = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Abrir Caixa'));
      if (btnAbrir) btnAbrir.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Simula leitura de código de barras no input do PDV
    await page.evaluate(() => {
      const barcodeInput = document.querySelector('input[placeholder*="Código de Barras"]') || document.querySelector('input');
      if (barcodeInput) {
        barcodeInput.value = '789000100013';
        barcodeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screen-pdv.png') });
    console.log('  ✓ Salvo: screen-pdv.png');

    console.log('🎉 Todas as 5 telas REAIS foram capturadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro na captura:', err);
  } finally {
    await browser.close();
  }
}

capture();
