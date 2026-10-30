import express from 'express';
import cors from 'cors';
import { tenantsRouter } from './tenants.routes.js';
import { planosRouter } from './planos.routes.js';
import { financeiroRouter } from './financeiro.routes.js';
import { webhooksRouter } from './webhooks.routes.js';
import { syncRouter } from './sync.routes.js';
import { provisionRouter } from './provision.routes.js';
import { authRouter } from './auth.routes.js';
import { releasesRouter } from './releases.routes.js';
import { assinaturasRouter } from './assinaturas.routes.js';
import { configRouter } from './config.routes.js';
import { suporteRouter } from './suporte.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Parser JSON que preserva req.rawBody para verificação criptográfica de assinatura do Stripe
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Endpoints de Webhook do Stripe (suporta singular /api/webhook e plural /api/webhooks)
app.use('/api/webhook', webhooksRouter);
app.use('/api/webhooks', webhooksRouter);

// Rota de Autenticação do Admin
app.use('/api/auth', authRouter);

// Rotas do Master Admin Web
app.use('/api/tenants', tenantsRouter);
app.use('/api/planos', planosRouter);
app.use('/api/financeiro', financeiroRouter);
app.use('/api/releases', releasesRouter);
app.use('/api/assinaturas', assinaturasRouter);
app.use('/api/admin/config', configRouter);
app.use('/api/config', configRouter);
app.use('/api/suporte', suporteRouter);

// Rota de Sincronização consumida pelo ERP Desktop
app.use('/api/sync', syncRouter);
app.use('/api/sync', provisionRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ClickStorm Master Admin Cloud API',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ ClickStorm Master Admin API rodando na porta ${PORT}`);
  });
}

export default app;
