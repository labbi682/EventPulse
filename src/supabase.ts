import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig | null => {
  // Try environment variables first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // Try local storage next
  const storedUrl = localStorage.getItem('eventpulse_supabase_url');
  const storedKey = localStorage.getItem('eventpulse_supabase_key');

  if (storedUrl && storedKey) {
    return { url: storedUrl, anonKey: storedKey };
  }

  return null;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('eventpulse_supabase_url', url);
  localStorage.setItem('eventpulse_supabase_key', key);
  localStorage.setItem('eventpulse_db_mode', 'supabase');
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('eventpulse_supabase_url');
  localStorage.removeItem('eventpulse_supabase_key');
  localStorage.setItem('eventpulse_db_mode', 'mock');
};

export const getDbMode = (): 'supabase' | 'mock' => {
  const storedMode = localStorage.getItem('eventpulse_db_mode');
  if (storedMode === 'supabase' && getSupabaseConfig() !== null) {
    return 'supabase';
  }
  return 'mock';
};

export const setDbMode = (mode: 'supabase' | 'mock') => {
  localStorage.setItem('eventpulse_db_mode', mode);
};

// Instantiate client (can be re-imported or checked)
const config = getSupabaseConfig();
export const supabase = config ? createClient(config.url, config.anonKey) : null;
