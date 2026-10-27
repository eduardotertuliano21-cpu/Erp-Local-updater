-- ==============================================================================
-- CLICKSTORM MASTER ADMIN - SCHEMA SQL CENTRAL (PostgreSQL / Supabase / Neon)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PLANOS DE ASSINATURA (Sincronizada com Stripe Products/Prices)
CREATE TABLE IF NOT EXISTS planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,             -- ex: 'varejo', 'restaurante', 'premium'
    nome VARCHAR(100) NOT NULL,                    -- ex: 'Plano Varejo Plus'
    descricao TEXT,
    valor_mensal NUMERIC(10, 2) NOT NULL,          -- ex: 149.90
    intervalo VARCHAR(20) DEFAULT 'month',        -- 'month' ou 'year'
    recursos JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array de features: ["PDV", "NFC-e", "TEF"]
    limite_caixas INT DEFAULT 1,
    stripe_product_id VARCHAR(100),                -- prod_xxx
    stripe_price_id VARCHAR(100),                  -- price_xxx
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE CLIENTES (TENANTS / LOJAS CADASTRADAS)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30),
    endereco_rua VARCHAR(255),
    endereco_numero VARCHAR(50),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_estado VARCHAR(2),
    endereco_cep VARCHAR(10),
    administrador_nome VARCHAR(150),
    administrador_email VARCHAR(255),
    chave_licenca VARCHAR(100) UNIQUE NOT NULL,
    plano_id UUID REFERENCES planos(id),
    status_licenca VARCHAR(20) DEFAULT 'ATIVA',   -- 'ATIVA', 'INADIMPLENTE', 'BLOQUEADA', 'TESTE'
    data_expiracao DATE NOT NULL,
    dias_carencia INT DEFAULT 0,
    stripe_customer_id VARCHAR(100),              -- cus_xxx
    stripe_subscription_id VARCHAR(100),          -- sub_xxx
    ultimo_sync_em TIMESTAMP WITH TIME ZONE,
    versao_desktop VARCHAR(50) DEFAULT '1.2.3',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE FATURAS E PAGAMENTOS (STRIPE)
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(100) UNIQUE,
    stripe_payment_intent_id VARCHAR(100),
    valor NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,                  -- 'paid', 'open', 'failed', 'refunded'
    metodo_pagamento VARCHAR(50),                 -- 'cartao', 'pix', 'boleto'
    url_fatura TEXT,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÍNDICES DE PERFORMANCE E BUSCA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_tenants_cnpj ON tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status_licenca);
CREATE INDEX IF NOT EXISTS idx_tenants_chave ON tenants(chave_licenca);
CREATE INDEX IF NOT EXISTS idx_pagamentos_tenant ON pagamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
