# Configuração do Banco de Dados (Supabase)

Para que o aplicativo Nexus Invest Engine funcione corretamente na nuvem, você precisa criar a tabela de transações no seu projeto Supabase.

## 1. Criar Tabela `transactions`

Execute o seguinte SQL no Editor SQL do seu painel Supabase:

```sql
-- 1. Criar Tabela `users` (Perfil Público)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS para users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 2. Criar Tabela `transactions`
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT CHECK (type IN ('BUY', 'SELL')) NOT NULL,
  asset_type TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  broker TEXT
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_ticker ON transactions(ticker);

-- 3. Tabela de eventos corporativos (Desdobramentos/Grupamentos)
CREATE TABLE corporate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  type TEXT CHECK (type IN ('SPLIT', 'INPLIT', 'DIVIDEND')) NOT NULL,
  factor DECIMAL,
  value DECIMAL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE corporate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read corporate events" ON corporate_events FOR SELECT USING (true);
```

## 2. Configurar Variáveis de Ambiente

No AI Studio, vá em **Settings** e adicione as seguintes variáveis:

- `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu projeto Supabase.

## 3. Autenticação

O aplicativo utiliza o Google Login por padrão. Certifique-se de que o provedor Google está habilitado no seu painel Supabase em **Authentication > Providers**.

## 4. Criar Tabela `dividends` (Proventos)

Execute o seguinte SQL no Editor SQL do seu painel Supabase para criar a nova tabela de Proventos:

```sql
-- Criar tabela de proventos (dividendos)
CREATE TABLE dividends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT DEFAULT 'ACAO' NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DECIMAL NOT NULL,
  is_future BOOLEAN DEFAULT false
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own dividends" ON dividends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dividends" ON dividends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dividends" ON dividends FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dividends" ON dividends FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_dividends_user_id ON dividends(user_id);
```