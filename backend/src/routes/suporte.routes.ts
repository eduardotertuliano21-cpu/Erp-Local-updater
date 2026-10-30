import { Router, Request, Response } from 'express';
import { getOperacaoDb } from '../config/database.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { LicencaRepository } from '../repositories/LicencaRepository.js';

function garantirTabelaSuporteLocal() {
  const db = getOperacaoDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS chamados_suporte_local (
      id TEXT PRIMARY KEY,
      protocolo TEXT,
      tipo TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ABERTO',
      prioridade TEXT NOT NULL DEFAULT 'NORMAL',
      chave_licenca TEXT,
      nome_loja TEXT,
      cnpj_loja TEXT,
      ramo_loja TEXT,
      solicitante_nome TEXT,
      solicitante_contato TEXT,
      solicitante_cargo TEXT,
      assunto TEXT,
      descricao TEXT,
      mensagens_json TEXT,
      tem_resposta_nao_lida INTEGER DEFAULT 0,
      sincronizado_nuvem INTEGER DEFAULT 0,
      criado_em TEXT,
      atualizado_em TEXT
    );
  `);
}

function obterUrlsNuvem(): string[] {
  const urls: string[] = [];
  if (process.env.CLICKSTORM_MASTER_URL) {
    urls.push(process.env.CLICKSTORM_MASTER_URL.replace(/\/+$/, ''));
  }
  urls.push('https://clickstormsystems.com.br');
  urls.push('http://localhost:4000');
  return Array.from(new Set(urls));
}

async function fetchNuvemComFallback(
  caminho: string,
  options?: RequestInit
): Promise<any | null> {
  const urls = obterUrlsNuvem();
  for (const base of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${base}${caminho}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Tenta próxima URL (nuvem ou localhost dev)
    }
  }
  return null;
}

function salvarOuAtualizarNoCacheLocal(c: any, sincronizado = 1) {
  garantirTabelaSuporteLocal();
  const db = getOperacaoDb();
  db.prepare(`
    INSERT INTO chamados_suporte_local (
      id, protocolo, tipo, status, prioridade, chave_licenca, nome_loja, cnpj_loja, ramo_loja,
      solicitante_nome, solicitante_contato, solicitante_cargo, assunto, descricao,
      mensagens_json, tem_resposta_nao_lida, sincronizado_nuvem, criado_em, atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      protocolo = excluded.protocolo,
      status = excluded.status,
      prioridade = excluded.prioridade,
      mensagens_json = excluded.mensagens_json,
      tem_resposta_nao_lida = excluded.tem_resposta_nao_lida,
      sincronizado_nuvem = excluded.sincronizado_nuvem,
      atualizado_em = excluded.atualizado_em
  `).run(
    c.id,
    c.protocolo || '#LOCAL',
    c.tipo || 'SUPORTE',
    c.status || 'ABERTO',
    c.prioridade || 'NORMAL',
    c.chaveLicenca || '',
    c.nomeLoja || '',
    c.cnpjLoja || '',
    c.ramoLoja || 'mercado',
    c.solicitanteNome || '',
    c.solicitanteContato || '',
    c.solicitanteCargo || '',
    c.assunto || '',
    c.descricao || '',
    JSON.stringify(c.mensagens || []),
    c.temRespostaNaoLidaLoja ? 1 : 0,
    sincronizado,
    c.criadoEm || new Date().toISOString(),
    c.atualizadoEm || new Date().toISOString()
  );
}

function mapearLinhaParaObjeto(row: any) {
  let mensagens = [];
  try {
    mensagens = JSON.parse(row.mensagens_json || '[]');
  } catch {}
  return {
    id: row.id,
    protocolo: row.protocolo,
    tipo: row.tipo,
    status: row.status,
    prioridade: row.prioridade,
    chaveLicenca: row.chave_licenca,
    nomeLoja: row.nome_loja,
    cnpjLoja: row.cnpj_loja,
    ramoLoja: row.ramo_loja,
    solicitanteNome: row.solicitante_nome,
    solicitanteContato: row.solicitante_contato,
    solicitanteCargo: row.solicitante_cargo,
    assunto: row.assunto,
    descricao: row.descricao,
    mensagens,
    temRespostaNaoLidaLoja: Boolean(row.tem_resposta_nao_lida),
    sincronizadoNuvem: Boolean(row.sincronizado_nuvem),
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export function createSuporteRouter(): Router {
  const router = Router();
  const configRepo = new ConfigLojaRepository();
  const licencaRepo = new LicencaRepository();

  /**
   * GET /api/suporte/chamados
   * Sincroniza pendências locais com a nuvem e retorna todos os chamados e respostas do Admin
   */
  router.get('/suporte/chamados', async (_req: Request, res: Response) => {
    try {
      garantirTabelaSuporteLocal();
      const db = getOperacaoDb();
      const cfg = configRepo.obter();
      const lic = licencaRepo.obterLicenca();

      // 1. Envia eventuais chamados criados offline que ainda não subiram
      const pendentes: any[] = db
        .prepare('SELECT * FROM chamados_suporte_local WHERE sincronizado_nuvem = 0')
        .all();

      for (const pend of pendentes) {
        const obj = mapearLinhaParaObjeto(pend);
        const resp = await fetchNuvemComFallback('/api/suporte/loja/abrir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj),
        });
        if (resp && resp.success && resp.data) {
          salvarOuAtualizarNoCacheLocal(resp.data, 1);
        }
      }

      // 2. Busca chamados atualizados e respostas do Admin na nuvem
      const params = new URLSearchParams({
        chaveLicenca: lic.chave_licenca || '',
        cnpj: cfg.cnpj || lic.cnpj || '',
        nomeLoja: cfg.nome_loja || cfg.razao_social || '',
      });

      const remoto = await fetchNuvemComFallback(`/api/suporte/loja/listar?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-license-key': lic.chave_licenca || '',
          'x-tenant-cnpj': cfg.cnpj || lic.cnpj || '',
          'x-store-name': cfg.nome_loja || cfg.razao_social || '',
        },
      });

      if (remoto && remoto.success && Array.isArray(remoto.data)) {
        const idsRemotos = new Set<string>();
        for (const item of remoto.data) {
          idsRemotos.add(item.id);
          salvarOuAtualizarNoCacheLocal(item, 1);
        }
        // Se o Admin apagou algum chamado no painel central, remove também do cache sincronizado local
        const locaisSincronizados: any[] = db
          .prepare('SELECT id FROM chamados_suporte_local WHERE sincronizado_nuvem = 1')
          .all();
        for (const loc of locaisSincronizados) {
          if (!idsRemotos.has(loc.id)) {
            db.prepare('DELETE FROM chamados_suporte_local WHERE id = ?').run(loc.id);
          }
        }
      }

      const todos: any[] = db
        .prepare('SELECT * FROM chamados_suporte_local ORDER BY criado_em DESC')
        .all();

      const lista = todos.map(mapearLinhaParaObjeto);
      const naoLidos = lista.filter((c) => c.temRespostaNaoLidaLoja).length;

      return res.json({
        success: true,
        naoLidos,
        lojaInfo: {
          nomeLoja: cfg.nome_loja || cfg.razao_social || 'Minha Loja',
          cnpj: cfg.cnpj || lic.cnpj || '',
          telefone: cfg.telefone || '',
          ramo: cfg.ramo_atuacao || 'mercado',
        },
        data: lista,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao listar chamados de suporte',
      });
    }
  });

  /**
   * POST /api/suporte/chamados
   * Abre um novo chamado de Suporte (Incidente) ou envia uma Sugestão
   */
  router.post('/suporte/chamados', async (req: Request, res: Response) => {
    try {
      garantirTabelaSuporteLocal();
      const cfg = configRepo.obter();
      const lic = licencaRepo.obterLicenca();

      const {
        tipo = 'SUPORTE',
        prioridade = 'NORMAL',
        solicitanteNome,
        solicitanteContato,
        solicitanteCargo,
        assunto,
        descricao,
      } = req.body || {};

      const texto = String(descricao || '').trim();
      if (!texto) {
        return res.status(400).json({
          success: false,
          error: 'Por favor, escreva a descrição antes de enviar.',
        });
      }

      const idGerado = `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const agora = new Date().toISOString();
      const nomeLoja = cfg.nome_loja || cfg.razao_social || lic.razao_social || 'Loja ClickStorm';
      const cnpjLoja = cfg.cnpj || lic.cnpj || 'Não informado';
      const nomePessoa = String(solicitanteNome || '').trim() || 'Operador da Loja';
      const contatoPessoa = String(solicitanteContato || '').trim() || cfg.telefone || 'Não informado';
      const tipoFinal = String(tipo).toUpperCase() === 'SUGESTAO' ? 'SUGESTAO' : 'SUPORTE';

      const payload = {
        id: idGerado,
        protocolo: `#${String(Date.now()).slice(-4)}`,
        tipo: tipoFinal,
        status: 'ABERTO',
        prioridade: String(prioridade || 'NORMAL').toUpperCase(),
        chaveLicenca: lic.chave_licenca || 'CS-PRO-LOCAL-LICENSE',
        nomeLoja,
        cnpjLoja,
        ramoLoja: cfg.ramo_atuacao || 'mercado',
        versaoSistema: '1.0.0',
        solicitanteNome: nomePessoa,
        solicitanteContato: contatoPessoa,
        solicitanteCargo: String(solicitanteCargo || 'Operador'),
        assunto:
          tipoFinal === 'SUGESTAO'
            ? String(assunto || '').trim() || `Sugestão: ${texto.slice(0, 50)}`
            : String(assunto || '').trim() || `Incidente: ${texto.slice(0, 50)}`,
        descricao: texto,
        mensagens: [
          {
            id: `msg-${Date.now()}`,
            autor: 'LOJA',
            autorNome: nomePessoa,
            texto,
            criadoEm: agora,
            lidoPelaLoja: true,
          },
        ],
        temRespostaNaoLidaLoja: false,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      const remoto = await fetchNuvemComFallback('/api/suporte/loja/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (remoto && remoto.success && remoto.data) {
        salvarOuAtualizarNoCacheLocal(remoto.data, 1);
        return res.status(201).json({
          success: true,
          data: remoto.data,
        });
      }

      // Fallback Offline: salva localmente e sincroniza na próxima conexão
      salvarOuAtualizarNoCacheLocal(payload, 0);
      return res.status(201).json({
        success: true,
        data: payload,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao registrar chamado de suporte.',
      });
    }
  });

  /**
   * POST /api/suporte/chamados/:id/mensagem
   * Permite que o usuário envie uma nova mensagem no chamado
   */
  router.post('/suporte/chamados/:id/mensagem', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { texto, autorNome } = req.body || {};

      const remoto = await fetchNuvemComFallback(`/api/suporte/loja/${id}/mensagem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, autorNome }),
      });

      if (remoto && remoto.success && remoto.data) {
        salvarOuAtualizarNoCacheLocal(remoto.data, 1);
        return res.json({ success: true, data: remoto.data });
      }

      // Atualiza também localmente caso esteja sem conexão momentânea
      garantirTabelaSuporteLocal();
      const db = getOperacaoDb();
      const row: any = db.prepare('SELECT * FROM chamados_suporte_local WHERE id = ?').get(id);
      if (!row) {
        return res.status(404).json({ success: false, error: 'Chamado não encontrado.' });
      }
      const obj = mapearLinhaParaObjeto(row);
      obj.mensagens.push({
        id: `msg-${Date.now()}`,
        autor: 'LOJA',
        autorNome: autorNome || obj.solicitanteNome || 'Cliente',
        texto: String(texto || '').trim(),
        criadoEm: new Date().toISOString(),
        lidoPelaLoja: true,
      });
      obj.atualizadoEm = new Date().toISOString();
      salvarOuAtualizarNoCacheLocal(obj, 0);

      return res.json({ success: true, data: obj });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  /**
   * POST /api/suporte/chamados/:id/lido
   * Marca a resposta do Admin como lida pelo usuário na loja
   */
  router.post('/suporte/chamados/:id/lido', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      garantirTabelaSuporteLocal();
      const db = getOperacaoDb();
      db.prepare('UPDATE chamados_suporte_local SET tem_resposta_nao_lida = 0 WHERE id = ?').run(id);

      await fetchNuvemComFallback(`/api/suporte/loja/${id}/marcar-lido`, {
        method: 'POST',
      });

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  return router;
}
