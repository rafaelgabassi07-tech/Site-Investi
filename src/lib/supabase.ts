import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide placeholders to prevent "supabaseUrl is required" crash on startup
// The app will still require real credentials to function properly.
const url = supabaseUrl || 'https://placeholder-project.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Settings menu.');
}

export const supabase = createClient(url, key);
