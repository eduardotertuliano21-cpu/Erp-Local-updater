import { Router, Request, Response } from 'express';
import { masterAuthMiddleware } from './auth.middleware.js';
import { dbMock, salvarBancoMaster } from './db.mock.js';

export const releasesRouter = Router();

// Versão atual oficial gerenciada pelo Master Admin
let versaoAtualConfig = {
  versao: '1.0.0',
  dataLancamento: '2026-10-10',
  obrigatoria: false,
  downloadUrl: 'https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v1.0.0/ClickStorm_Setup_v1.0.0.exe',
  notasVersao: 'Versão de lançamento estável 1.0.0 com PDV Local-First, NFC-e e Sincronização Cloud.',
};

// Rota pública para os desktops consultarem se há atualização disponível
releasesRouter.get('/latest', (_req: Request, res: Response) => {
  res.json(versaoAtualConfig);
});

// Rota protegida do painel web para visualizar versão configurada
releasesRouter.get('/admin', masterAuthMiddleware, (_req: Request, res: Response) => {
  res.json(versaoAtualConfig);
});

// Rota protegida do painel web para lançar ou mudar a versão
releasesRouter.post('/admin/definir', masterAuthMiddleware, (req: Request, res: Response) => {
  const { versao, downloadUrl, notasVersao, obrigatoria } = req.body;

  if (!versao) {
    return res.status(400).json({ erro: 'O número da versão é obrigatório' });
  }

  versaoAtualConfig = {
    versao: versao.replace(/^v/i, '').trim(),
    dataLancamento: new Date().toISOString().split('T')[0],
    obrigatoria: Boolean(obrigatoria),
    downloadUrl: downloadUrl || `https://github.com/eduardotertuliano21-cpu/Erp-Local-updater/releases/download/v${versao.replace(/^v/i, '')}/ClickStorm_Setup_v${versao.replace(/^v/i, '')}.exe`,
    notasVersao: notasVersao || 'Atualização de melhorias e estabilidade do sistema.',
  };

  res.json({
    sucesso: true,
    mensagem: `Versão oficial atualizada para ${versaoAtualConfig.versao}`,
    config: versaoAtualConfig,
  });
});

// Forçar atualização do sistema em massa para todos os PDVs
releasesRouter.post('/admin/forcar-todos', masterAuthMiddleware, (_req: Request, res: Response) => {
  const agora = new Date().toISOString();
  for (const t of dbMock.tenants) {
    t.atualizacaoPendente = {
      solicitadoEm: agora,
      forcarMesmaVersao: true,
      versao: versaoAtualConfig.versao,
      downloadUrl: versaoAtualConfig.downloadUrl,
    };
  }
  salvarBancoMaster();
  res.json({
    sucesso: true,
    mensagem: `Atualização forçada enviada para todos os ${dbMock.tenants.length} clientes cadastrados!`,
  });
});
