import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// TODO: Replace these with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
