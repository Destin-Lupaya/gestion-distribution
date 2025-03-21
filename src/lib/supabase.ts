import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the Supabase client with retry configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Export typed client
export const typedSupabase = supabase as unknown as ReturnType<typeof createClient<Database>>;

// Add health check function with retry mechanism
export const checkSupabaseConnection = async (retries = 3, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await typedSupabase.from('sites_distribution').select('id').limit(1);
      
      if (error) {
        console.warn(`Connection attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn(`Connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return false;
    }
  }
  return false;
};

// Add reconnection handler
export const handleReconnection = async (): Promise<void> => {
  try {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      // Attempt to refresh the session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        await supabase.auth.refreshSession();
      }
    }
  } catch (error) {
    console.error('Reconnection failed:', error);
    throw new Error('Unable to establish database connection');
  }
};