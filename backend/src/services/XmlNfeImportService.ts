import crypto from 'node:crypto';
import { getCatalogoWriterDb, getOperacaoDb } from '../config/database.js';

export interface ItemNfeImportado {
  cProd: string;
  cEAN: string;
  xProd: string;
  ncm: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  fatorEntrada?: number;
  precoVendaSugerido?: number;
  produtoIdVinculado?: string;
}

export interface CompraEntradaRecord {
  id: string;
  chave_nfe: string;
  numero_nfe: number;
  serie: number;
  fornecedor_nome: string;
  cnpj_fornecedor: string;
  valor_total: number;
  itens_contagem: number;
  status: number; // 0 = Rascunho / Pendente, 1 = Efetivado
  itens_json?: string;
  importado_em?: string;
  efetivado_em?: string;
}

export class XmlNfeImportService {
  private catalogoWriter = getCatalogoWriterDb();
  private operacaoDb = getOperacaoDb();

  private extrairTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }

  public importarXml(xmlConteudo: string): CompraEntradaRecord {
    if (!xmlConteudo || (!xmlConteudo.includes('<nfeProc') && !xmlConteudo.includes('<NFe'))) {
      throw new Error('Conteúdo fornecido não é um XML válido de NF-e.');
    }

    let chave = this.extrairTag(xmlConteudo, 'chNFe');
    if (!chave) {
      const matchId = xmlConteudo.match(/Id="NFe(\d{44})"/i);
      if (matchId) chave = matchId[1];
    }
    const numeroNfe = parseInt(this.extrairTag(xmlConteudo, 'nNF'), 10) || 0;
    const serieNfe = parseInt(this.extrairTag(xmlConteudo, 'serie'), 10) || 1;
    const valorTotal = parseFloat(this.extrairTag(xmlConteudo, 'vNF')) || 0;

    const emitenteXml = this.extrairTag(xmlConteudo, 'emit');
    const cnpjFornecedor = this.extrairTag(emitenteXml, 'CNPJ') || this.extrairTag(emitenteXml, 'CPF');
    const nomeFornecedor = (this.extrairTag(emitenteXml, 'xNome') || 'FORNECEDOR DIVERSOS').toUpperCase();

    // Salva ou atualiza Fornecedor em entidades
    const fornecedorId = crypto.randomUUID();
    this.catalogoWriter.prepare(`
      INSERT INTO entidades (id, tipo, razao_social, cpf_cnpj, atualizado_em)
      VALUES (?, 'FORNECEDOR', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET razao_social = excluded.razao_social
    `).run(fornecedorId, nomeFornecedor, cnpjFornecedor);

    // Extrai Itens da NF-e
    const detRegex = /<det[\s\S]*?<\/det>/gi;
    const itensMatches = xmlConteudo.match(detRegex) || [];
    const itensExtraidos: ItemNfeImportado[] = [];

    for (const det of itensMatches) {
      const prodXml = this.extrairTag(det, 'prod');
      const cProd = this.extrairTag(prodXml, 'cProd');
      let cEAN = this.extrairTag(prodXml, 'cEAN');
      const xProd = (this.extrairTag(prodXml, 'xProd') || '').toUpperCase();
      const ncm = this.extrairTag(prodXml, 'NCM') || '00000000';
      const uCom = (this.extrairTag(prodXml, 'uCom') || 'UN').toUpperCase();
      const qCom = parseFloat(this.extrairTag(prodXml, 'qCom')) || 1;
      const vUnCom = parseFloat(this.extrairTag(prodXml, 'vUnCom')) || 0;

      if (!cEAN || cEAN.toUpperCase().includes('SEM GTIN') || cEAN.length < 6) {
        cEAN = `FORN-${cProd}`;
      }

      itensExtraidos.push({
        cProd,
        cEAN,
        xProd,
        ncm,
        uCom,
        qCom,
        vUnCom,
        fatorEntrada: 1,
        precoVendaSugerido: +(vUnCom * 1.5).toFixed(2),
      });
    }

    const compraId = crypto.randomUUID();
    const itensJsonStr = JSON.stringify(itensExtraidos);

    // Salva como Rascunho (status = 0) SEM afetar estoque ou financeiro
    this.operacaoDb.prepare(`
      INSERT INTO compras_entradas (
        id, chave_nfe, numero_nfe, serie, fornecedor_nome, cnpj_fornecedor,
        valor_total, itens_contagem, status, itens_json, xml_completo, importado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(chave_nfe) DO UPDATE SET
        valor_total = excluded.valor_total,
        itens_json = excluded.itens_json,
        status = 0
    `).run(compraId, chave, numeroNfe, serieNfe, nomeFornecedor, cnpjFornecedor, valorTotal, itensExtraidos.length, itensJsonStr, xmlConteudo);

    return {
      id: compraId,
      chave_nfe: chave,
      numero_nfe: numeroNfe,
      serie: serieNfe,
      fornecedor_nome: nomeFornecedor,
      cnpj_fornecedor: cnpjFornecedor,
      valor_total: valorTotal,
      itens_contagem: itensExtraidos.length,
      status: 0,
      itens_json: itensJsonStr,
    };
  }

  public listarEntradas(): CompraEntradaRecord[] {
    return this.operacaoDb.prepare(`
      SELECT id, chave_nfe, numero_nfe, serie, fornecedor_nome, cnpj_fornecedor,
             valor_total, itens_contagem, status, itens_json, importado_em, efetivado_em
      FROM compras_entradas
      ORDER BY importado_em DESC
      LIMIT 50
    `).all() as unknown as CompraEntradaRecord[];
  }

  public efetivarEntrada(compraId: string, itensAjustados?: ItemNfeImportado[]): { sucesso: boolean; mensagem: string } {
    const compra = this.operacaoDb.prepare('SELECT * FROM compras_entradas WHERE id = ?').get(compraId) as any;
    if (!compra) throw new Error('Documento de entrada não encontrado.');
    if (compra.status === 1) throw new Error('Esta nota fiscal já foi efetivada.');

    const itens: ItemNfeImportado[] = itensAjustados && itensAjustados.length > 0
      ? itensAjustados
      : (compra.itens_json ? JSON.parse(compra.itens_json) : []);

    for (const item of itens) {
      const fatorEntrada = Number(item.fatorEntrada) || 1;
      const precoVenda = Number(item.precoVendaSugerido) || +(item.vUnCom * 1.5).toFixed(2);
      const prodId = item.produtoIdVinculado || crypto.randomUUID();

      this.catalogoWriter.prepare(`
        INSERT INTO produtos (id, codigo_barras, sku, descricao, preco_venda, unidade_medida, ncm, cfop, aliquota_icms, ativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, '5102', 18, 1)
        ON CONFLICT(codigo_barras) DO UPDATE SET
          preco_venda = CASE WHEN excluded.preco_venda > 0 THEN excluded.preco_venda ELSE produtos.preco_venda END,
          atualizado_em = CURRENT_TIMESTAMP
      `).run(prodId, item.cEAN, item.cProd, item.xProd, precoVenda, item.uCom, item.ncm);

      const rowProd = this.catalogoWriter.prepare('SELECT id FROM produtos WHERE codigo_barras = ?').get(item.cEAN) as { id: string };

      // Se houver fator de conversão de entrada > 1, registra também em produto_codigos_barras
      if (fatorEntrada > 1) {
        try {
          this.catalogoWriter.prepare(`
            INSERT INTO produto_codigos_barras (id, produto_id, codigo_barras, unidade_medida, fator_entrada, fator_saida)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(codigo_barras) DO UPDATE SET fator_entrada = excluded.fator_entrada
          `).run(crypto.randomUUID(), rowProd.id, item.cEAN, item.uCom, fatorEntrada, fatorEntrada);
        } catch {}
      }

      // Alimenta o estoque multiplicando pela quantidade e fator de conversão WMS
      const quantidadeTotal = item.qCom * fatorEntrada;
      this.operacaoDb.prepare(`
        INSERT INTO estoque_movimentos (id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo)
        VALUES (?, ?, 'ENTRADA_COMPRA', 'LOJA', ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        rowProd.id,
        quantidadeTotal,
        item.vUnCom,
        `NF-e #${compra.numero_nfe}`,
        `Entrada NF-e Fornecedor: ${compra.fornecedor_nome}`
      );
    }

    // Gera Título no Contas a Pagar
    this.operacaoDb.prepare(`
      INSERT INTO financeiro_titulos (id, tipo, entidade_nome, descricao, valor, valor_pago, vencimento, status, categoria)
      VALUES (?, 'PAGAR', ?, ?, ?, 0, date('now', '+30 days'), 'PENDENTE', 'FORNECEDOR')
    `).run(
      crypto.randomUUID(),
      compra.fornecedor_nome,
      `NF-e Compra #${compra.numero_nfe} - ${compra.fornecedor_nome}`,
      compra.valor_total
    );

    // Atualiza status para 1 (Efetivado)
    this.operacaoDb.prepare(`
      UPDATE compras_entradas SET status = 1, efetivado_em = CURRENT_TIMESTAMP WHERE id = ?
    `).run(compraId);

    return { sucesso: true, mensagem: `Nota #${compra.numero_nfe} efetivada com sucesso. Estoque e financeiro gerados.` };
  }

  public desatualizarEntrada(compraId: string): { sucesso: boolean; mensagem: string } {
    const compra = this.operacaoDb.prepare('SELECT * FROM compras_entradas WHERE id = ?').get(compraId) as any;
    if (!compra) throw new Error('Documento de entrada não encontrado.');
    if (compra.status !== 1) throw new Error('Esta nota fiscal não está efetivada.');

    const docRef = `NF-e #${compra.numero_nfe}`;

    // Estorna / remove movimentos de estoque desta nota
    this.operacaoDb.prepare(`
      DELETE FROM estoque_movimentos WHERE documento_referencia = ? AND tipo = 'ENTRADA_COMPRA'
    `).run(docRef);

    // Remove título a pagar gerado
    this.operacaoDb.prepare(`
      DELETE FROM financeiro_titulos WHERE descricao LIKE ? AND tipo = 'PAGAR' AND status = 'PENDENTE'
    `).run(`%${docRef}%`);

    // Retorna status para 0 (Rascunho)
    this.operacaoDb.prepare(`
      UPDATE compras_entradas SET status = 0, efetivado_em = NULL WHERE id = ?
    `).run(compraId);

    return { sucesso: true, mensagem: `Nota #${compra.numero_nfe} revertida para rascunho com sucesso.` };
  }
}
