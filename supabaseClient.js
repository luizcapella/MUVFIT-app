import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmizfiabviqcclfaivza.supabase.co';
const supabaseAnonKey = 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
