-- ====================================================================================
-- ESPECIFICAÇÃO TÉCNICA AVANÇADA - SCHEMA DO BANCO DE DADOS (POSTGRESQL / SUPABASE)
-- ====================================================================================

-- 1. Tabela de Usuários (Extensão da auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dicionário Mestre de Ativos (Atualizado via Motor de Ingestão)
CREATE TABLE IF NOT EXISTS public.assets (
    ticker VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    asset_type VARCHAR(10) NOT NULL, -- 'ACAO', 'FII', 'BDR', 'ETF'
    sector TEXT,
    current_price DECIMAL(15, 4),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Histórico Imutável de Transações (Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    asset_type VARCHAR(10) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    broker TEXT,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela Materializada de Posições (Consolidado Atual)
-- Atualizada via Triggers/Hooks sempre que há uma transação ou evento corporativo
CREATE TABLE IF NOT EXISTS public.user_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,
    total_quantity DECIMAL(15, 4) DEFAULT 0,
    average_price DECIMAL(15, 4) DEFAULT 0,
    total_invested DECIMAL(15, 4) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ticker)
);

-- 5. Eventos Corporativos (Desdobramentos, Grupamentos, Dividendos)
CREATE TABLE IF NOT EXISTS public.corporate_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(10) NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- 'SPLIT', 'INPLIT', 'DIVIDEND'
    factor DECIMAL(15, 6), -- Ex: 4.0 para split 1:4, 0.1 para inplit 10:1
    value_per_share DECIMAL(15, 6), -- Para dividendos
    ex_date DATE NOT NULL,
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ledger Fiscal e Compensação de Prejuízos (Loss Carryforward)
CREATE TABLE IF NOT EXISTS public.tax_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
    asset_category VARCHAR(20) NOT NULL, -- 'ACOES_COMUNS', 'FII', 'DAY_TRADE'
    total_sales DECIMAL(15, 4) DEFAULT 0,
    net_profit DECIMAL(15, 4) DEFAULT 0,
    loss_carryforward_used DECIMAL(15, 4) DEFAULT 0,
    taxable_base DECIMAL(15, 4) DEFAULT 0,
    tax_due DECIMAL(15, 4) DEFAULT 0,
    is_exempt BOOLEAN DEFAULT FALSE,
    darf_generated BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month, asset_category)
);

-- 7. Saldo de Prejuízos Acumulados (Atualizado mensalmente)
CREATE TABLE IF NOT EXISTS public.user_tax_credits (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    asset_category VARCHAR(20) NOT NULL, -- 'ACOES_COMUNS', 'FII', 'DAY_TRADE'
    accumulated_loss DECIMAL(15, 4) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, asset_category)
);

-- ====================================================================================
-- RLS (Row Level Security) Policies
-- ====================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tax_credits ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions') THEN
        CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own transactions') THEN
        CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own positions') THEN
        CREATE POLICY "Users can view their own positions" ON public.user_positions FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own tax ledger') THEN
        CREATE POLICY "Users can view their own tax ledger" ON public.tax_ledger FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own tax credits') THEN
        CREATE POLICY "Users can view their own tax credits" ON public.user_tax_credits FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
