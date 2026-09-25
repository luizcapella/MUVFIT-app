import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const customStorage = Platform.OS === 'web' ? {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
} : AsyncStorage;

const supabaseUrl = 'https://wmizfiabviqcclfaivza.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXpmaWFidmlxY2NsZmFpdnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjAwODIsImV4cCI6MjEwNDgzNjA4Mn0.gW52vsp_23-hgX7vGxQDueuPyiLR1hXL45fsk2hZ7WI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
