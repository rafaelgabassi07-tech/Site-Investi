# Configuração do Banco de Dados (Supabase)

Para que o aplicativo Nexus Invest Engine funcione corretamente na nuvem, você precisa criar a tabela de transações no seu projeto Supabase.

## 1. Criar Tabela `transactions`

Execute o seguinte SQL no Editor SQL do seu painel Supabase:

```sql
-- Criar tabela de transações
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

-- Criar política para que usuários vejam apenas suas próprias transações
CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Criar política para que usuários insiram suas próprias transações
CREATE POLICY "Users can insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar política para que usuários atualizem suas próprias transações
CREATE POLICY "Users can update their own transactions" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id);

-- Criar política para que usuários deletem suas próprias transações
CREATE POLICY "Users can delete their own transactions" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_ticker ON transactions(ticker);
```

## 2. Configurar Variáveis de Ambiente

No AI Studio, vá em **Settings** e adicione as seguintes variáveis:

- `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave anônima (anon key) do seu projeto Supabase.

## 3. Autenticação

O aplicativo utiliza o Google Login por padrão. Certifique-se de que o provedor Google está habilitado no seu painel Supabase em **Authentication > Providers**.
