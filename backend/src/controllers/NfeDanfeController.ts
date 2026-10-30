import { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { NfeDanfeRepository } from '../repositories/NfeDanfeRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { NfeDanfeBuilderService, EmitirNfePayload } from '../services/NfeDanfeBuilderService.js';
import { DanfeHtmlRenderer } from '../services/DanfeHtmlRenderer.js';
import { NfeDanfeStorageService } from '../services/NfeDanfeStorageService.js';
import { XmlSignerService } from '../services/XmlSignerService.js';
import { EMITENTE_PADRAO } from '../services/FiscalService.js';
import { getOperacaoDb } from '../config/database.js';
import { ApiResponse } from '../types/api.js';

const UF_IBGE_MAP: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32', GO: '52',
  MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41', PE: '26', PI: '22',
  RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42', SP: '35', SE: '28', TO: '17',
};

export class NfeDanfeController {
  private repo = new NfeDanfeRepository();
  private configRepo = new ConfigLojaRepository();
  private signer = new XmlSignerService();

  private obterConfigEmitente() {
    try {
      const cfg = this.configRepo.obter();
      const uf = (cfg.estado || 'SP').toUpperCase();
      return {
        ...EMITENTE_PADRAO,
        cnpj: cfg.cnpj || EMITENTE_PADRAO.cnpj,
        razaoSocial: cfg.razao_social || cfg.nome_loja || EMITENTE_PADRAO.razaoSocial,
        nomeFantasia: cfg.nome_loja || EMITENTE_PADRAO.nomeFantasia,
        inscricaoEstadual: cfg.inscricao_estadual || EMITENTE_PADRAO.inscricaoEstadual,
        uf,
        codigoUf: UF_IBGE_MAP[uf] || '35',
        serieNfce: Number(cfg.serie_nfce || 1),
        crt: Number(cfg.crt || 1),
        codigoMunicipioIbge: cfg.codigo_municipio_ibge || '3550308',
        logradouro: cfg.logradouro || EMITENTE_PADRAO.logradouro,
        numero: cfg.numero || EMITENTE_PADRAO.numero,
        bairro: cfg.bairro || EMITENTE_PADRAO.bairro,
        cidade: cfg.cidade || EMITENTE_PADRAO.cidade,
        cep: cfg.cep || EMITENTE_PADRAO.cep,
        telefone: cfg.telefone || EMITENTE_PADRAO.telefone,
      };
    } catch {
      return EMITENTE_PADRAO;
    }
  }

  public emitir = (req: Request, res: Response): void => {
    try {
      const payload = req.body as EmitirNfePayload;
      if (!payload?.destinatario?.nome || !payload?.destinatario?.documento) {
        res.status(400).json({ success: false, error: 'Informe o Nome/Razão Social e o CPF/CNPJ do destinatário.' } as ApiResponse);
        return;
      }
      if (!payload?.itens || payload.itens.length === 0) {
        res.status(400).json({ success: false, error: 'Adicione pelo menos 1 item/produto para emitir a NF-e.' } as ApiResponse);
        return;
      }

      const emit = this.obterConfigEmitente();
      const serie = Number(payload.serie || emit.serieNfce || 1);
      const numero = this.repo.obterProximoNumero(serie);
      const dataEmissao = new Date();

      let vProd = 0;
      let vICMS = 0;
      let vIPI = 0;
      let vDescItens = 0;

      const itensProcessados = payload.itens.map((it) => {
        const qtd = Number(it.quantidade || 1);
        const unit = Number(it.valor_unitario || 0);
        const desc = Number(it.desconto || 0);
        const sub = Number(Math.max(0, qtd * unit - desc).toFixed(2));
        const aliqIcms = Number(it.aliquota_icms || 0);
        const aliqIpi = Number(it.aliquota_ipi || 0);
        const valIcms = Number(((sub * aliqIcms) / 100).toFixed(2));
        const valIpi = Number(((sub * aliqIpi) / 100).toFixed(2));

        vProd = Number((vProd + qtd * unit).toFixed(2));
        vDescItens = Number((vDescItens + desc).toFixed(2));
        vICMS = Number((vICMS + valIcms).toFixed(2));
        vIPI = Number((vIPI + valIpi).toFixed(2));

        return {
          ...it,
          quantidade: qtd,
          valor_unitario: unit,
          desconto: desc,
          subtotal: sub,
          aliquota_icms: aliqIcms,
          valor_icms: valIcms,
          aliquota_ipi: aliqIpi,
          valor_ipi: valIpi,
        };
      });

      const vFrete = Number((payload.valor_frete || 0).toFixed(2));
      const vSeg = Number((payload.valor_seguro || 0).toFixed(2));
      const vDesc = Number(((payload.valor_desconto || 0) + vDescItens).toFixed(2));
      const vOutro = Number((payload.valor_outras_despesas || 0).toFixed(2));
      const vNF = Number(Math.max(0, vProd - vDesc + vFrete + vSeg + vOutro + vIPI).toFixed(2));

      const totais = { vProd, vFrete, vSeg, vDesc, vOutro, vICMS, vIPI, vNF };
      const payloadFinal: EmitirNfePayload = { ...payload, itens: itensProcessados };
      const chave = NfeDanfeBuilderService.gerarChaveAcessoMod55(emit.codigoUf || '35', dataEmissao, emit.cnpj, serie, numero, '1');
      const protocolo = `1${emit.codigoUf || '35'}${String(dataEmissao.getFullYear()).slice(-2)}${String(Date.now()).slice(-10)}`;

      const xmlBruto = NfeDanfeBuilderService.montarXmlNfe55(payloadFinal, numero, serie, chave, dataEmissao, emit, totais);
      const xmlAssinado = this.signer.assinarNfceXml(xmlBruto, chave);
      const danfeHtml = DanfeHtmlRenderer.renderizarA4(payloadFinal, numero, serie, chave, protocolo, dataEmissao, emit, totais, 'AUTORIZADA');
      const arquivos = NfeDanfeStorageService.salvarArquivosNota(numero, payload.destinatario.nome, dataEmissao, xmlAssinado, danfeHtml);

      if (payload.baixar_estoque !== false && payload.tipo_operacao !== '0') {
        const db = getOperacaoDb();
        for (const it of itensProcessados) {
          if (it.produto_id) {
            try {
              db.prepare(`INSERT INTO estoque_movimentos (id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id) VALUES (?, ?, 'SAIDA_VENDA', 'LOJA', ?, ?, ?, 'Emissão NF-e Modelo 55', ?)`).run(
                crypto.randomUUID(), it.produto_id, it.quantidade, it.valor_unitario, `NF-e #${numero}`, payload.operador_id || 'OPERADOR'
              );
            } catch {}
          }
        }
      }

      const registro = this.repo.salvar({
        id: crypto.randomUUID(), numero, serie, chave_acesso: chave,
        natureza_operacao: (payload.natureza_operacao || 'VENDA DE MERCADORIA').toUpperCase(),
        tipo_operacao: payload.tipo_operacao || '1', finalidade: payload.finalidade || '1',
        destinatario_documento: payload.destinatario.documento, destinatario_nome: payload.destinatario.nome.toUpperCase(),
        destinatario_ie: payload.destinatario.ie || 'ISENTO', destinatario_email: payload.destinatario.email || '',
        destinatario_telefone: payload.destinatario.telefone || '', destinatario_endereco_json: JSON.stringify(payload.destinatario),
        itens_json: JSON.stringify(itensProcessados), transporte_json: JSON.stringify(payload.transporte || { modalidade_frete: '9' }),
        pagamento_json: JSON.stringify({ forma_pagamento: payload.forma_pagamento || 'À VISTA', meio_pagamento: payload.meio_pagamento || '01', parcelas: payload.parcelas || 1 }),
        valor_produtos: vProd, valor_frete: vFrete, valor_seguro: vSeg, valor_desconto: vDesc, valor_outras_despesas: vOutro,
        valor_icms: vICMS, valor_ipi: vIPI, valor_total: vNF, informacoes_complementares: payload.informacoes_complementares || '',
        status: 'AUTORIZADA', protocolo, caminho_pasta: arquivos.pastaDestino, caminho_xml: arquivos.caminhoXml,
        caminho_danfe_html: arquivos.caminhoDanfeHtml, nome_arquivo_base: arquivos.nomeBase,
        xml_conteudo: xmlAssinado, danfe_html: danfeHtml, operador_id: payload.operador_id || 'OPERADOR',
      });

      res.status(201).json({ success: true, data: registro } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Erro ao emitir NF-e e gerar DANFE.' } as ApiResponse);
    }
  };

  public listar = (req: Request, res: Response): void => {
    try {
      const resultado = this.repo.listar({
        inicio: req.query.inicio as string,
        fim: req.query.fim as string,
        status: req.query.status as string,
        q: req.query.q as string,
        limite: req.query.limite ? Number(req.query.limite) : 100,
      });
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao listar notas NF-e' } as ApiResponse);
    }
  };

  public obterDetalhes = (req: Request, res: Response): void => {
    try {
      const nota = this.repo.obterPorId(req.params.id);
      if (!nota) {
        res.status(404).json({ success: false, error: 'Nota Fiscal não encontrada.' } as ApiResponse);
        return;
      }
      res.json({ success: true, data: nota } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public cancelar = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      if (!motivo || String(motivo).trim().length < 5) {
        res.status(400).json({ success: false, error: 'Informe uma justificativa de pelo menos 5 caracteres.' } as ApiResponse);
        return;
      }

      const nota = this.repo.obterPorId(id);
      if (!nota) {
        res.status(404).json({ success: false, error: 'Nota não encontrada.' } as ApiResponse);
        return;
      }
      if (nota.status === 'CANCELADA') {
        res.status(400).json({ success: false, error: 'Esta NF-e já está cancelada.' } as ApiResponse);
        return;
      }

      const emit = this.obterConfigEmitente();
      const itens = JSON.parse(nota.itens_json || '[]');
      const dest = JSON.parse(nota.destinatario_endereco_json || '{}');
      const transp = JSON.parse(nota.transporte_json || '{"modalidade_frete":"9"}');
      const pag = JSON.parse(nota.pagamento_json || '{}');

      const danfeCancelado = DanfeHtmlRenderer.renderizarA4(
        {
          natureza_operacao: nota.natureza_operacao,
          tipo_operacao: nota.tipo_operacao as any,
          finalidade: nota.finalidade as any,
          destinatario: { ...dest, nome: nota.destinatario_nome, documento: nota.destinatario_documento },
          itens,
          transporte: transp,
          forma_pagamento: pag.forma_pagamento,
          informacoes_complementares: `${nota.informacoes_complementares || ''} | CANCELADA MOTIVO: ${motivo}`,
        },
        nota.numero,
        nota.serie,
        nota.chave_acesso,
        nota.protocolo,
        new Date(nota.emitido_em),
        emit,
        {
          vProd: nota.valor_produtos,
          vFrete: nota.valor_frete,
          vSeg: nota.valor_seguro,
          vDesc: nota.valor_desconto,
          vOutro: nota.valor_outras_despesas,
          vICMS: nota.valor_icms,
          vIPI: nota.valor_ipi,
          vNF: nota.valor_total,
        },
        'CANCELADA'
      );

      this.repo.cancelar(id, String(motivo).trim(), danfeCancelado);
      try {
        if (nota.caminho_danfe_html && fs.existsSync(nota.caminho_danfe_html)) {
          fs.writeFileSync(nota.caminho_danfe_html, danfeCancelado, 'utf-8');
        }
      } catch {}

      const db = getOperacaoDb();
      for (const it of itens) {
        if (it.produto_id) {
          try {
            db.prepare(`
              INSERT INTO estoque_movimentos (id, produto_id, tipo, almoxarifado, quantidade, custo_unitario, documento_referencia, motivo, operador_id)
              VALUES (?, ?, 'AJUSTE_INVENTARIO', 'LOJA', ?, ?, ?, ?, 'OPERADOR')
            `).run(crypto.randomUUID(), it.produto_id, it.quantidade, it.valor_unitario, `Estorno NF-e #${nota.numero}`, `Cancelamento NF-e: ${motivo}`);
          } catch {}
        }
      }

      res.json({ success: true, data: { id, cancelada: true } } as ApiResponse);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public listarPastas = (_req: Request, res: Response): void => {
    try {
      res.json({ success: true, data: NfeDanfeStorageService.listarEstruturaPastas() } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };

  public abrirPasta = (req: Request, res: Response): void => {
    try {
      const resultado = NfeDanfeStorageService.abrirPastaSistema(req.body?.caminho);
      res.json({ success: true, data: resultado } as ApiResponse);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message } as ApiResponse);
    }
  };
}
