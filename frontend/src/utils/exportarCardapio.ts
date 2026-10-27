import type { Produto } from '../types/pdv.js';

export async function exportarCardapioParaPdf(
  produtos: Produto[],
  nomeLoja: string = 'ClickStorm Restaurante'
): Promise<{ sucesso: boolean; mensagem?: string; erro?: string }> {
  try {
    const itensCardapio = produtos.filter((p) => p.ativo !== 0 && (p.tipo_pdv === 'RESTAURANTE' || !p.tipo_pdv));
    if (itensCardapio.length === 0) {
      return { sucesso: false, erro: 'Nenhum prato ou produto ativo encontrado para o cardápio.' };
    }

    const categoriasMap = new Map<string, Produto[]>();
    for (const p of itensCardapio) {
      const cat = (p.categoria || 'DIVERSOS').toUpperCase();
      if (!categoriasMap.has(cat)) categoriasMap.set(cat, []);
      categoriasMap.get(cat)!.push(p);
    }

    let categoriasHtml = '';
    for (const [cat, itens] of categoriasMap.entries()) {
      categoriasHtml += `
        <div style="margin-bottom: 28px; break-inside: avoid;">
          <h2 style="font-size: 16px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.05em;">
            ${cat}
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            ${itens.map((item) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9; background: #fafafa; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                  ${item.foto ? `<img src="http://localhost:5000/imagens/${item.foto}" style="width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1px solid #e2e8f0;" />` : ''}
                  <div style="min-width: 0;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${item.descricao}
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-family: monospace;">
                      Cód: ${item.codigo_barras}
                    </div>
                  </div>
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #059669; font-family: monospace; flex-shrink: 0;">
                  R$ ${item.preco_venda.toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Cardápio - ${nomeLoja}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #0f172a; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 3px double #cbd5e1;">
          <h1 style="font-size: 26px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
            ${nomeLoja}
          </h1>
          <p style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
            CARDÁPIO OFICIAL • IMPRESSO LOCALMENTE
          </p>
        </div>
        ${categoriasHtml}
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          ClickStorm PDV • Gerado em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}
        </div>
      </body>
      </html>
    `;

    const desktopBridge = (window as any).desktopBridge;
    if (desktopBridge?.exportarCardapioPdf) {
      const res = await desktopBridge.exportarCardapioPdf({ html: htmlCompleto, titulo: `Cardapio_${nomeLoja}` });
      if (res?.sucesso) {
        return { sucesso: true, mensagem: res.mensagem || 'Cardápio em PDF salvo na sua Área de Trabalho com sucesso!' };
      }
      return { sucesso: false, erro: res?.erro || 'Erro ao gerar PDF pelo Electron' };
    }

    // Fallback para navegador web
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlCompleto);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      return { sucesso: true, mensagem: 'Janela de impressão do cardápio aberta!' };
    }

    return { sucesso: false, erro: 'Não foi possível abrir o diálogo de impressão.' };
  } catch (err: any) {
    return { sucesso: false, erro: err.message || 'Falha ao exportar cardápio' };
  }
}
