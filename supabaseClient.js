import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wmizfiabviqcclfaivza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXpmaWFidmlxY2NsZmFpdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MTAyNjMsImV4cCI6MjA0MjI4NjI2M30.4s8_J9P26J33f0_0yI92u6d3p2u9q31_y3q8p0p7w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
