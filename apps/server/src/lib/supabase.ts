import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('[SUPABASE] Warning: SUPABASE_URL is not defined in environment variables.');
}

if (!supabaseKey) {
  console.warn('[SUPABASE] Warning: SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY is not defined in environment variables.');
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null as any;
