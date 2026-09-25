import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wstjlsoixtlclflkzzs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXpmaWFidmlxY2NsZmFpdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjAwODIsImV4cCI6MjEwNDgzNjA4Mn0.gW52vsp_23-hgX7vGxQDueuPyiLR1hXL45fsk2hZ7WI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
