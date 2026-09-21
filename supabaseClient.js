import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmizfiabviqcclfaivza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXpmaWFidmlxY2NsZmFpdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjAwODIsImV4cCI6MjEwNDgzNjA4Mn0.gW52vsp_23-hgX7vGxQDueuPyiLR1hXL45fsk2hZ7WI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
