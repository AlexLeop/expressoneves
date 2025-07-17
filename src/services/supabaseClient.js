import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exfljeezwtnidjsiynei.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmxqZWV6d3RuaWRqc2l5bmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjA3NzUsImV4cCI6MjA1MzIzNjc3NX0.c8xn6l6o0PBKgJ-lO8cgG8TsItzM3Qf9pHGhZSWJQWs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
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