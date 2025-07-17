import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exfljeezwtnidjsiynei.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmxqZWV6d3RuaWRqc2l5bmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MzQzMzEsImV4cCI6MjA2ODExMDMzMX0.4UmeCgcoK05M8fid2h0BqfplVRLdGUgJfMEMA1qRIAI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
}); 