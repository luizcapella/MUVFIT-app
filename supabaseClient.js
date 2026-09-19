import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wmizfiabviqcclfaivza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXpmaWFidmlxY2NsZmFpdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3MTAyNjMsImV4cCI6MjA0MjI4NjI2M30.4s8_J9P26J33f0_0y4s8_J9P26J33f0_0y4s8_J9P26J';

let storageOption;

if (Platform.OS !== 'web') {
  try {
    storageOption = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    storageOption = undefined;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageOption,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
